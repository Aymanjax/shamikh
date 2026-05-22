import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { getSupplier, updateSupplier, getSupplierProducts, addSupplierProduct, updateSupplierProduct, deleteSupplierProduct, addSupplierOffer, getSupplierOffers, deleteSupplierOffer, getSupplierRatings } from "../services/supplierService";

const MAX_FREE_PRODUCTS = 15;

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5 text-sm" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "text-amber-400" : "text-gray-300"}>
          {star <= value ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [editForm, setEditForm] = useState({});
  const [newProduct, setNewProduct] = useState({ name: "", price: "", unit: "حبة", category: "" });
  const [editProduct, setEditProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [newOffer, setNewOffer] = useState({ title: "", description: "", discount: "", endDate: "" });
  const [prices, setPrices] = useState({
    iron4x8: "", iron10x10: "", tile: "", decor: "", besh: "", sharshef: "", insulation: "", tarpaulin: "",
  });
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [areaInput, setAreaInput] = useState("");
  const [ratings, setRatings] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!uid) { navigate("/supplier/login"); return; }
    loadData();
  }, [uid]);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await getSupplier(uid);
      if (!s || s.banned) { navigate("/supplier/login"); return; }
      setSupplier(s);
      setEditForm({ businessName: s.businessName || "", phone: s.phone || "", area: s.area || "", description: s.description || "" });
      if (s.prices) setPrices((prev) => ({ ...prev, ...s.prices }));
      if (s.deliveryAreas) setDeliveryAreas(s.deliveryAreas);
      const r = await getSupplierRatings(uid);
      setRatings(r);
      const p = await getSupplierProducts(uid);
      setProducts(p);
      const o = await getSupplierOffers(uid);
      setOffers(o);
    } catch {}
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateSupplier(uid, editForm);
      setSupplier((prev) => ({ ...prev, ...editForm }));
      showToast("تم حفظ الملف الشخصي");
    } catch { showToast("خطأ في الحفظ", "error"); }
    setSaving(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    if (supplier.subscription?.plan === "free" && products.length >= MAX_FREE_PRODUCTS) {
      showToast(`الحد الأقصى للمنتجات المجانية ${MAX_FREE_PRODUCTS} صنف`, "error");
      return;
    }
    setSaving(true);
    try {
      const added = await addSupplierProduct(uid, { ...newProduct, price: Number(newProduct.price) });
      setProducts((prev) => [...prev, added]);
      setNewProduct({ name: "", price: "", unit: "حبة", category: "" });
      showToast("تم إضافة المنتج");
    } catch { showToast("خطأ في الإضافة", "error"); }
    setSaving(false);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    setSaving(true);
    try {
      await updateSupplierProduct(uid, editProduct.id, { name: editProduct.name, price: Number(editProduct.price), unit: editProduct.unit, category: editProduct.category });
      setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, ...editProduct } : p)));
      setEditProduct(null);
      showToast("تم تحديث المنتج");
    } catch { showToast("خطأ في التحديث", "error"); }
    setSaving(false);
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!newOffer.title) return;
    setSaving(true);
    try {
      const added = await addSupplierOffer(uid, supplier.businessName, supplier.phone, newOffer);
      setOffers((prev) => [added, ...prev]);
      setNewOffer({ title: "", description: "", discount: "", endDate: "" });
      showToast("تم إضافة العرض");
    } catch { showToast("خطأ في إضافة العرض", "error"); }
    setSaving(false);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!confirm("حذف العرض؟")) return;
    try {
      await deleteSupplierOffer(offerId);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      showToast("تم حذف العرض");
    } catch { showToast("خطأ في الحذف", "error"); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("حذف المنتج؟")) return;
    try {
      await deleteSupplierProduct(uid, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast("تم حذف المنتج");
    } catch { showToast("خطأ في الحذف", "error"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isFree = supplier?.subscription?.plan === "free";

  return (
    <div className="min-h-screen bg-surface-alt" dir="rtl">
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2`}>
          <i className={`fa-solid ${toast.type === "success" ? "fa-check-circle" : "fa-circle-exclamation"}`}></i>
          {toast.msg}
        </div>
      )}

      <header className="bg-surface border-b border-line px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center">
            <i className="fa-solid fa-store text-white"></i>
          </div>
          <div>
            <h1 className="text-sm font-black text-ink">{supplier?.businessName || "لوحة المورد"}</h1>
            <p className="text-[10px] text-ink-muted">
              {isFree ? "حساب مجاني" : "حساب مميز"} · {products.length}/{isFree ? MAX_FREE_PRODUCTS : "∞"} منتج
            </p>
          </div>
        </div>
        <button onClick={() => { import("../services/supplierService").then((s) => s.logoutSupplier()); }}
          className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center gap-1">
          <i className="fa-solid fa-right-from-bracket"></i> خروج
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex gap-2 border-b border-line pb-2 overflow-x-auto">
          {[
            { key: "profile", icon: "fa-user-edit", label: "الملف الشخصي" },
            { key: "products", icon: "fa-box", label: "المنتجات" },
            { key: "offers", icon: "fa-tag", label: "العروض" },
            { key: "ratings", icon: "fa-star", label: "التقييمات" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${tab === t.key ? "bg-emerald-600 text-white shadow-lg" : "text-ink-muted hover:text-ink hover:bg-surface-subtle"}`}>
              <i className={`fa-solid ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <i className="fa-solid fa-user-edit text-emerald-500"></i> تعديل الملف الشخصي
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">اسم المتجر</label>
                <input value={editForm.businessName} onChange={(e) => setEditForm((p) => ({ ...p, businessName: e.target.value }))}
                  className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-emerald-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">رقم الجوال</label>
                <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} dir="ltr"
                  className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-emerald-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">المنطقة</label>
                <input value={editForm.area} onChange={(e) => setEditForm((p) => ({ ...p, area: e.target.value }))}
                  className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-emerald-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">النشاط</label>
                <input value={supplier?.activity || ""} disabled
                  className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink-muted outline-none cursor-not-allowed" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">الوصف</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-emerald-500 transition resize-none" />
            </div>

            <hr className="border-line" />
            <h4 className="font-bold text-ink text-sm flex items-center gap-2">
              <i className="fa-solid fa-money-bill-wave text-emerald-500"></i> أسعاري الحالية
            </h4>
            <p className="text-[10px] text-ink-muted">حدد أسعارك للمواد التالية — ستظهر للمستخدمين في حاسبة المواد</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: "iron4x8", label: "حديد 4×8 (تيوب)" },
                { key: "iron10x10", label: "حديد 10×10 (تيوب)" },
                { key: "tile", label: "قرميد (حبة)" },
                { key: "decor", label: "ديكور (م)" },
                { key: "besh", label: "بيش (وحدة)" },
                { key: "sharshef", label: "شرشف (م)" },
                { key: "insulation", label: "عزل (م²)" },
                { key: "tarpaulin", label: "مشمع (رول)" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-0.5">
                  <label className="text-[9px] font-bold text-ink-muted">{label}</label>
                  <input type="number" value={prices[key]} onChange={(e) => setPrices((p) => ({ ...p, [key]: Number(e.target.value) }))} step="0.1"
                    className="w-full bg-surface-input border border-line rounded-xl py-1.5 px-2 text-xs text-ink outline-none focus:border-emerald-500 transition text-center" />
                </div>
              ))}
            </div>

            <hr className="border-line" />
            <h4 className="font-bold text-ink text-sm flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-emerald-500"></i> مناطق التوصيل
            </h4>
            <p className="text-[10px] text-ink-muted">اختر المناطق التي توصل إليها</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {deliveryAreas.map((a, i) => (
                <span key={i}
                  className="bg-surface-input border border-line rounded-lg px-3 py-1 text-xs font-bold text-ink flex items-center gap-1.5">
                  {a}
                  <button onClick={() => setDeliveryAreas((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark"></i></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={areaInput} onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (areaInput.trim() && !deliveryAreas.includes(areaInput.trim())) { setDeliveryAreas((prev) => [...prev, areaInput.trim()]); setAreaInput(""); } } }}
                placeholder="أضف منطقة..."
                className="flex-1 bg-surface-input border border-line rounded-xl py-1.5 px-3 text-xs text-ink outline-none focus:border-emerald-500 transition" />
              <button onClick={() => { if (areaInput.trim() && !deliveryAreas.includes(areaInput.trim())) { setDeliveryAreas((prev) => [...prev, areaInput.trim()]); setAreaInput(""); } }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-xl text-xs font-bold transition">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>

            <button onClick={async () => {
              setSaving(true);
              try {
                await Promise.all([
                  updateSupplier(uid, editForm),
                  updateSupplier(uid, { prices, deliveryAreas, priceUpdatedAt: new Date() }),
                ]);
                setSupplier((prev) => ({ ...prev, ...editForm, prices, deliveryAreas }));
                showToast("تم حفظ الملف الشخصي والأسعار");
              } catch { showToast("خطأ في الحفظ", "error"); }
              setSaving(false);
            }} disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 px-5 rounded-xl text-sm font-bold transition flex items-center gap-2">
              <i className="fa-solid fa-floppy-disk"></i> حفظ التعديلات
            </button>
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-4">
            <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
                <i className="fa-solid fa-box text-emerald-500"></i> منتجاتي ({products.length})
              </h3>
              {products.length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-4">لا توجد منتجات مضافة بعد</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-ink-muted border-b border-line text-[10px]">
                        <th className="text-right py-2 px-2">#</th>
                        <th className="text-right py-2 px-2">الاسم</th>
                        <th className="text-center py-2 px-2">السعر</th>
                        <th className="text-center py-2 px-2">الوحدة</th>
                        <th className="text-center py-2 px-2">القسم</th>
                        <th className="text-left py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {products.map((p, i) => (
                        <tr key={p.id} className="hover:bg-surface-subtle transition">
                          <td className="py-2 px-2 text-xs text-ink-muted">{i + 1}</td>
                          <td className="py-2 px-2 text-xs font-bold text-ink">{p.name}</td>
                          <td className="py-2 px-2 text-xs text-center font-bold">{p.price}</td>
                          <td className="py-2 px-2 text-xs text-center text-ink-muted">{p.unit}</td>
                          <td className="py-2 px-2 text-xs text-center text-ink-muted">{p.category || "-"}</td>
                          <td className="py-2 px-2 text-left">
                            <button onClick={() => setEditProduct(p)}
                              className="text-blue-500 hover:text-blue-600 text-xs p-1 ml-1">
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)}
                              className="text-red-400 hover:text-red-600 text-xs p-1">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {isFree && products.length >= MAX_FREE_PRODUCTS && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-4 rounded-2xl flex items-start gap-2">
                <i className="fa-solid fa-crown mt-0.5"></i>
                <span>وصلت للحد الأقصى ({MAX_FREE_PRODUCTS} منتجات). ارتقِ إلى الحساب المميز لإضافة منتجات غير محدودة.</span>
              </div>
            )}

            {(!isFree || products.length < MAX_FREE_PRODUCTS) && (
              <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
                <h4 className="font-bold text-ink text-sm flex items-center gap-2 mb-4">
                  <i className="fa-solid fa-plus text-emerald-500"></i> إضافة منتج جديد
                </h4>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-ink-muted">الاسم</label>
                    <input value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} required
                      className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-emerald-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-muted">السعر</label>
                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} required
                      className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-emerald-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-muted">الوحدة</label>
                    <select value={newProduct.unit} onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))}
                      className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-emerald-500 transition">
                      <option value="حبة">حبة</option>
                      <option value="م²">م²</option>
                      <option value="تيوب">تيوب</option>
                      <option value="لتر">لتر</option>
                      <option value="كجم">كجم</option>
                      <option value="متر">متر</option>
                      <option value="طرد">طرد</option>
                      <option value="كرتون">كرتون</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-muted">القسم</label>
                    <select value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                      className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-emerald-500 transition">
                      <option value="">عام</option>
                      <option value="قرميد">قرميد</option>
                      <option value="حديد">حديد</option>
                      <option value="خشب">خشب</option>
                      <option value="عزل">عزل</option>
                      <option value="مواد إضافية">مواد إضافية</option>
                    </select>
                  </div>
                  <div className="md:col-span-5">
                    <button type="submit" disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 px-5 rounded-xl text-xs font-bold transition">
                      <i className="fa-solid fa-plus ml-1"></i> إضافة
                    </button>
                  </div>
                </form>
              </div>
            )}

        {tab === "ratings" && (
          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <i className="fa-solid fa-star text-amber-500"></i> التقييمات ({ratings.length})
            </h3>
            {ratings.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">لا توجد تقييمات بعد</p>
            ) : (
              <div className="space-y-3">
                {ratings.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)).map((r) => (
                  <div key={r.id} className="bg-surface-input border border-line rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={r.rating} />
                      <span className="text-xs font-bold text-ink">{r.rating}/5</span>
                      <span className="text-[9px] text-ink-muted">- {r.userName}</span>
                    </div>
                    {r.comment && <p className="text-xs text-ink-muted">{r.comment}</p>}
                    {r.createdAt?.toDate && (
                      <p className="text-[9px] text-ink-muted mt-1">{r.createdAt.toDate().toLocaleDateString("ar-JO")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "offers" && (
          <div className="space-y-4">
            <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
                <i className="fa-solid fa-tag text-red-500"></i> عروضي ({offers.length})
              </h3>
              {offers.length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-4">لا توجد عروض مضافة بعد</p>
              ) : (
                <div className="space-y-3">
                  {offers.map((o) => {
                    const expDate = o.endDate?.toDate ? o.endDate.toDate() : o.endDate ? new Date(o.endDate) : null;
                    const expired = expDate && expDate < new Date();
                    return (
                      <div key={o.id} className={`bg-surface-input border rounded-2xl p-4 ${expired ? "border-red-200 opacity-60" : "border-amber-200"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-black text-ink">{o.title}</strong>
                              {o.discount && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5">{o.discount}</span>}
                              {expired && <span className="text-[10px] font-bold text-red-500">(منتهي)</span>}
                            </div>
                            {o.description && <p className="text-xs text-ink-muted mt-1">{o.description}</p>}
                            {expDate && <p className="text-[10px] text-ink-muted mt-1">ينتهي: {expDate.toLocaleDateString("ar-JO")}</p>}
                          </div>
                          <button onClick={() => handleDeleteOffer(o.id)}
                            className="text-red-400 hover:text-red-600 text-xs p-1 shrink-0"><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
              <h4 className="font-bold text-ink text-sm flex items-center gap-2 mb-4">
                <i className="fa-solid fa-plus text-red-500"></i> إضافة عرض جديد
              </h4>
              <form onSubmit={handleAddOffer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink-muted">عنوان العرض <span className="text-red-500">*</span></label>
                    <input value={newOffer.title} onChange={(e) => setNewOffer((p) => ({ ...p, title: e.target.value }))} required
                      className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-red-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink-muted">الخصم (مثلاً: 20% أو خصم خاص)</label>
                    <input value={newOffer.discount} onChange={(e) => setNewOffer((p) => ({ ...p, discount: e.target.value }))}
                      className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-red-500 transition" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-muted">تفاصيل العرض</label>
                  <textarea value={newOffer.description} onChange={(e) => setNewOffer((p) => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-red-500 transition resize-none" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <label className="text-xs font-bold text-ink-muted">تاريخ الانتهاء (اختياري)</label>
                  <input type="date" value={newOffer.endDate} onChange={(e) => setNewOffer((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-red-500 transition" />
                </div>
                <button type="submit" disabled={saving}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 px-5 rounded-xl text-sm font-bold transition flex items-center gap-2">
                  <i className="fa-solid fa-tag"></i> إضافة العرض
                </button>
              </form>
            </div>
          </div>
        )}

            {editProduct && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setEditProduct(null)}>
                <div className="bg-surface border border-line rounded-3xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h4 className="font-bold text-ink mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-pen-to-square text-blue-500"></i> تعديل المنتج
                  </h4>
                  <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-muted">الاسم</label>
                      <input value={editProduct.name} onChange={(e) => setEditProduct((p) => ({ ...p, name: e.target.value }))} required
                        className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-blue-500 transition" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-muted">السعر</label>
                        <input type="number" value={editProduct.price} onChange={(e) => setEditProduct((p) => ({ ...p, price: e.target.value }))} required
                          className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-blue-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-muted">الوحدة</label>
                        <select value={editProduct.unit} onChange={(e) => setEditProduct((p) => ({ ...p, unit: e.target.value }))}
                          className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-blue-500 transition">
                          <option value="حبة">حبة</option>
                          <option value="م²">م²</option>
                          <option value="تيوب">تيوب</option>
                          <option value="لتر">لتر</option>
                          <option value="كجم">كجم</option>
                          <option value="متر">متر</option>
                          <option value="طرد">طرد</option>
                          <option value="كرتون">كرتون</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-muted">القسم</label>
                        <select value={editProduct.category} onChange={(e) => setEditProduct((p) => ({ ...p, category: e.target.value }))}
                          className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-sm text-ink outline-none focus:border-blue-500 transition">
                          <option value="">عام</option>
                          <option value="قرميد">قرميد</option>
                          <option value="حديد">حديد</option>
                          <option value="خشب">خشب</option>
                          <option value="عزل">عزل</option>
                          <option value="مواد إضافية">مواد إضافية</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-bold transition">
                        حفظ
                      </button>
                      <button type="button" onClick={() => setEditProduct(null)}
                        className="bg-surface-subtle hover:bg-surface-input text-ink py-2 px-4 rounded-xl text-sm font-bold transition">
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
