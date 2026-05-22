import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getApprovedSuppliers, getSupplierProducts, getActiveOffers, getSupplierRatings, addRating } from "../services/supplierService";

function StarRating({ value, onChange, size = "sm" }) {
  const s = size === "sm" ? "text-sm" : "text-lg";
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const half = !filled && star - 0.5 <= value;
        return (
          <button key={star} type="button" onClick={() => onChange?.(star)}
            className={`${s} ${onChange ? "cursor-pointer hover:scale-110 transition" : "cursor-default"} ${filled ? "text-amber-400" : half ? "text-amber-300/50" : "text-gray-300"}`}>
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}

function RatingModal({ sup, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSaving(true);
    try {
      await addRating(sup.uid, { rating, comment, userName: "مستخدم" });
      setDone(true);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface border border-line rounded-3xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-star text-amber-500 text-2xl"></i>
            </div>
            <h3 className="font-black text-ink mb-1">شكراً على تقييمك!</h3>
            <p className="text-xs text-ink-muted mb-4">تقييمك يساعد الآخرين في اختيار أفضل الموردين</p>
            <button onClick={onClose} className="bg-brand-600 hover:bg-brand-700 text-white py-2 px-5 rounded-xl text-sm font-bold transition">تم</button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-ink mb-1">تقييم {sup.businessName}</h3>
            <p className="text-xs text-ink-muted mb-4">شارك تجربتك مع هذا المورد</p>
            <div className="flex justify-center mb-4">
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-bold text-ink-muted">تعليق (اختياري)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="اكتب رأيك..."
                className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-amber-500 transition resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={rating === 0 || saving}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-bold transition">
                {saving ? "جاري..." : "إرسال التقييم"}
              </button>
              <button onClick={onClose} className="bg-surface-subtle hover:bg-surface-input text-ink py-2 px-4 rounded-xl text-sm font-bold transition">إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ACTIVITIES = ["الكل", "قرميد", "حديد", "خشب", "عزل", "مواد إضافية", "دهانات", "سباكة", "كهرباء", "أخرى"];

const ICONS = {
  "قرميد": "fa-house-chimney-tile",
  "حديد": "fa-weight-hanging",
  "خشب": "fa-tree",
  "عزل": "fa-shield",
  "مواد إضافية": "fa-cubes",
  "دهانات": "fa-palette",
  "سباكة": "fa-faucet-drip",
  "كهرباء": "fa-bolt",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("الكل");
  const [expanded, setExpanded] = useState(null);
  const [offers, setOffers] = useState([]);
  const [areaFilter, setAreaFilter] = useState("");
  const [ratingsMap, setRatingsMap] = useState({});
  const [ratingModal, setRatingModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadRatingsFor = async (uid) => {
    try {
      const ratings = await getSupplierRatings(uid);
      const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length : 0;
      setRatingsMap((prev) => ({ ...prev, [uid]: { ratings, avg, count: ratings.length } }));
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, activeOffers] = await Promise.all([getApprovedSuppliers(), getActiveOffers()]);
      const sorted = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      setSuppliers(sorted);
      setOffers(activeOffers);
      const pmap = {};
      for (const s of sorted) {
        pmap[s.uid] = await getSupplierProducts(s.uid);
        loadRatingsFor(s.uid);
      }
      setProductsMap(pmap);
    } catch {}
    setLoading(false);
  };

  const allAreas = useMemo(() => {
    const set = new Set();
    suppliers.forEach((s) => (s.deliveryAreas || []).forEach((a) => set.add(a)));
    return [...set].sort();
  }, [suppliers]);

  const filtered = suppliers.filter((s) => {
    if (filter !== "الكل" && s.activity !== filter) return false;
    if (areaFilter && !(s.deliveryAreas || []).includes(areaFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2">
            <i className="fa-solid fa-truck text-emerald-500"></i> دليل الموردين
          </h1>
          <p className="text-sm text-ink-muted">تصفح موردي مواد البناء والقرميد</p>
        </div>
        <Link to="/supplier/register"
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
          <i className="fa-solid fa-store"></i> تسجيل كمورد
        </Link>
      </div>

      {offers.length > 0 && (
        <div className="bg-gradient-to-l from-red-50 to-amber-50 border border-red-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-fire text-red-500"></i>
            <h2 className="font-black text-ink text-sm">عروض الموردين</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offers.map((o) => {
              const expDate = o.endDate?.toDate ? o.endDate.toDate() : o.endDate ? new Date(o.endDate) : null;
              return (
                <div key={o.id} className="bg-white border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <i className="fa-solid fa-tag text-red-500 mt-1"></i>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-ink">{o.title}</strong>
                        {o.discount && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5">{o.discount}</span>}
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">عرض من <span className="font-bold text-ink">{o.supplierName}</span></p>
                    </div>
                  </div>
                  {o.description && <p className="text-xs text-ink-muted mb-2">{o.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    {expDate && <span className="text-[9px] text-ink-muted">ينتهي: {expDate.toLocaleDateString("ar-JO")}</span>}
                    {o.supplierPhone && (
                      <a href={`https://wa.me/${o.supplierPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`أهلاً، بخصوص عرض ${o.title}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                        <i className="fa-brands fa-whatsapp"></i> تواصل
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {ACTIVITIES.map((a) => (
          <button key={a} onClick={() => setFilter(a)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filter === a ? "bg-emerald-600 text-white" : "bg-surface-subtle text-ink-muted hover:text-ink"}`}>
            {a}
          </button>
        ))}
      </div>

      {allAreas.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setAreaFilter("")}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${!areaFilter ? "bg-brand-600 text-white" : "bg-surface-subtle text-ink-muted hover:text-ink"}`}>
            <i className="fa-solid fa-location-dot ml-1"></i> الكل
          </button>
          {allAreas.map((a) => (
            <button key={a} onClick={() => setAreaFilter(a)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${areaFilter === a ? "bg-brand-600 text-white" : "bg-surface-subtle text-ink-muted hover:text-ink"}`}>
              {a}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-ink-muted">
          <i className="fa-solid fa-spinner fa-spin text-xl mb-2"></i>
          <p className="text-sm">جاري التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-3xl p-12 text-center shadow-sm">
          <i className="fa-solid fa-store text-5xl text-ink-light mb-4"></i>
          <h2 className="text-lg font-bold text-ink">لا يوجد موردين</h2>
          <p className="text-ink-muted text-sm mt-1">لا يوجد موردين في هذا التصنيف حالياً</p>
          <Link to="/supplier/register"
            className="inline-flex items-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-5 rounded-xl font-bold text-sm transition">
            <i className="fa-solid fa-plus"></i> أضف متجرك الآن
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sup) => {
            const products = productsMap[sup.uid] || [];
            const isOpen = expanded === sup.uid;
            return (
              <div key={sup.uid} className={`bg-surface border rounded-2xl p-5 shadow-sm transition hover:shadow-md ${sup.featured ? "border-amber-300 ring-1 ring-amber-200" : "border-line"}`}>
                {sup.featured && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mb-3 w-fit">
                    <i className="fa-solid fa-crown text-amber-500"></i> مميز
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${sup.featured ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" : "bg-emerald-50 text-emerald-600"}`}>
                    <i className={`fa-solid ${ICONS[sup.activity] || "fa-store"}`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-ink">{sup.businessName}</h3>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                      {sup.activity && <span>{sup.activity}</span>}
                      {sup.area && <><span>·</span><span>{sup.area}</span></>}
                    </div>
                  </div>
                </div>
                {sup.description && (
                  <p className="text-xs text-ink-muted mb-3 leading-relaxed">{sup.description}</p>
                )}
                {ratingsMap[sup.uid] && ratingsMap[sup.uid].count > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating value={ratingsMap[sup.uid].avg} />
                    <span className="text-[10px] font-bold text-ink">{ratingsMap[sup.uid].avg.toFixed(1)}</span>
                    <span className="text-[9px] text-ink-muted">({ratingsMap[sup.uid].count} تقييم)</span>
                  </div>
                )}
                {sup.prices && Object.values(sup.prices).some((v) => v > 0) && (
                  <div className="mb-3 bg-surface-input rounded-xl p-3 text-[10px]">
                    <p className="font-bold text-ink mb-1.5 flex items-center gap-1">
                      <i className="fa-solid fa-money-bill-wave text-emerald-500"></i> أسعاري الحالية
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {sup.prices.iron4x8 > 0 && <span className="text-ink-muted">حديد 4×8: <b className="text-ink">{sup.prices.iron4x8}</b></span>}
                      {sup.prices.iron10x10 > 0 && <span className="text-ink-muted">حديد 10×10: <b className="text-ink">{sup.prices.iron10x10}</b></span>}
                      {sup.prices.tile > 0 && <span className="text-ink-muted">قرميد: <b className="text-ink">{sup.prices.tile}</b></span>}
                      {sup.prices.decor > 0 && <span className="text-ink-muted">ديكور: <b className="text-ink">{sup.prices.decor}</b></span>}
                      {sup.prices.besh > 0 && <span className="text-ink-muted">بيش: <b className="text-ink">{sup.prices.besh}</b></span>}
                      {sup.prices.sharshef > 0 && <span className="text-ink-muted">شرشف: <b className="text-ink">{sup.prices.sharshef}</b></span>}
                    </div>
                    {sup.priceUpdatedAt && (
                      <p className="text-[9px] text-ink-muted mt-1">آخر تحديث: {sup.priceUpdatedAt.toDate ? sup.priceUpdatedAt.toDate().toLocaleDateString("ar-JO") : ""}</p>
                    )}
                  </div>
                )}
                {(sup.deliveryAreas || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sup.deliveryAreas.map((a) => (
                      <span key={a} className="text-[9px] font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-lg px-2 py-0.5 flex items-center gap-1">
                        <i className="fa-solid fa-truck"></i> {a}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {sup.phone && (
                    <a href={`https://wa.me/${sup.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                      <i className="fa-brands fa-whatsapp"></i> واتساب
                    </a>
                  )}
                  <button onClick={() => setRatingModal(sup)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-star"></i> قيّم
                  </button>
                  {products.length > 0 && (
                    <button onClick={() => setExpanded(isOpen ? null : sup.uid)}
                      className="text-xs text-ink-muted hover:text-ink font-bold flex items-center gap-1">
                      <i className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                      {products.length} منتج
                    </button>
                  )}
                </div>
                {isOpen && products.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-line overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-ink-muted border-b border-line">
                          <th className="text-right py-1.5 px-2">المنتج</th>
                          <th className="text-center py-1.5 px-2">السعر</th>
                          <th className="text-center py-1.5 px-2">الوحدة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-surface-subtle">
                            <td className="py-1.5 px-2 font-bold text-ink">{p.name}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-emerald-700">{p.price}</td>
                            <td className="py-1.5 px-2 text-center text-ink-muted">{p.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ratingModal && <RatingModal sup={ratingModal} onClose={() => { setRatingModal(null); loadRatingsFor(ratingModal.uid); }} />}
    </div>
  );
}
