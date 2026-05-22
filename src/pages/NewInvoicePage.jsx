import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchProjects } from "../services/projectService";
import { createInvoice } from "../services/invoiceService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { TILES_CATALOG } from "../utils/constants";
import { calcAll, calcCosts } from "../utils/calculations";
import { getProgramConfig } from "../services/adminService";

export default function NewInvoicePage() {
  const { user, companyName } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState("select");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [prices, setPrices] = useState({ iron4x8: 12, iron10x10: 22, tile: 0.95, decor: 5, besh: 1.5, sharshef: 4, nathrayat: 150, tileStarts: 0, tarpaulin: 0, zafta: 0, latiSheets: 0, woodBases: 0, tarabeesh: 0 });
  const [items, setItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchProjects(user.uid).then(setProjects);
    getProgramConfig().then((pg) => {
      const adminExtras = pg?.extraItems || [];
      getDoc(doc(db, "users", user.uid, "profile", "main")).then((snap) => {
        if (snap.exists() && snap.data().prices) setPrices(snap.data().prices);
        const userExtras = snap.exists() ? snap.data().extraItems : null;
        setExtraItems(userExtras && userExtras.length > 0 ? userExtras : adminExtras);
      });
    });
  }, [user]);

  const tile = TILES_CATALOG[0];
  const calcResult = useMemo(() => {
    if (!selectedProject) return null;
    const p = selectedProject;
    const roof = p.roof || {};
    const seg = roof.segments?.[0] || {};
    const settings = p.settings || {};
    return calcAll({
      length: seg.length || 5, width: seg.width || 4, slopePercent: roof.slope || 20,
      numFacades: settings.numFacades ?? 2, numLegs: settings.numLegs ?? 6, legHeight: settings.legHeight ?? 2.7,
      withDecor: settings.withDecor ?? true, enableInsulation: settings.enableInsulation ?? false, tile,
    });
  }, [selectedProject]);
  const costResult = useMemo(() => calcResult ? calcCosts(calcResult, prices) : null, [calcResult, prices]);

  const buildItems = () => {
    if (!calcResult || !costResult) return [];
    const r = calcResult;
    const c = costResult;
    const list = [];
    if (r.iron4x8) list.push({ name: "حديد 4×8", unit: "تيوب", qty: r.iron4x8, unitPrice: prices.iron4x8 || 0 });
    if (r.iron10x10?.total) list.push({ name: "حديد 10×10", unit: "تيوب", qty: r.iron10x10.total, unitPrice: prices.iron10x10 || 0 });
    if (r.totalTiles) list.push({ name: "القرميد", unit: "حبة", qty: r.totalTiles, unitPrice: prices.tile || 0 });
    if (r.tileStarts) list.push({ name: "بداية قرميد", unit: "حبة", qty: r.tileStarts, unitPrice: prices.tileStarts || 0 });
    if (r.decor?.bundles) list.push({ name: "الديكور", unit: "ربطة", qty: r.decor.bundles, unitPrice: prices.decor || 0 });
    if (r.beshQty) list.push({ name: "البيش", unit: "وحدة", qty: Number(r.beshQty.toFixed(1)), unitPrice: prices.besh || 0 });
    if (r.borders?.lengths) {
      Object.entries(r.borders.lengths).forEach(([len, count]) => {
        const platePrice = +(parseFloat(len) * (prices.sharshef || 0)).toFixed(3);
        list.push({ name: `شراشف ${len}م`, unit: "شريحة", qty: count, unitPrice: platePrice });
      });
    }
    if (r.tarpaulin?.text && r.tarpaulin.text !== "0") list.push({ name: "مشمع", unit: "رول", qty: parseFloat(r.tarpaulin.text) || 0, unitPrice: prices.tarpaulin || 0 });
    if (r.insulation?.zaftaRolls) list.push({ name: "زفتة", unit: "رول", qty: r.insulation.zaftaRolls, unitPrice: prices.zafta || 0 });
    if (r.insulation?.latiSheets) list.push({ name: "الواح لاتي", unit: "لوح", qty: r.insulation.latiSheets, unitPrice: prices.latiSheets || 0 });
    if (r.woodBases) list.push({ name: "أسس خشب", unit: "قطعة", qty: r.woodBases, unitPrice: prices.woodBases || 0 });
    if (r.tarabeesh) list.push({ name: "طرابيش", unit: "حبة", qty: r.tarabeesh, unitPrice: prices.tarabeesh || 0 });
    if (prices.nathrayat > 0) list.push({ name: "نثريات", unit: "", qty: 1, unitPrice: prices.nathrayat || 0 });
    extraItems.forEach((ei) => {
      list.push({ name: ei.name, unit: ei.unit || "", qty: 1, unitPrice: 0 });
    });
    return list.map((item) => ({ ...item, total: item.qty * item.unitPrice }));
  };

  useEffect(() => {
    if (selectedProject) setItems(buildItems());
  }, [selectedProject, calcResult]);

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const handleCreate = async () => {
    if (!selectedProject) return;
    if (items.length === 0) return setError("لا توجد بنود في الفاتورة");
    if (!date) return setError("يرجى تحديد تاريخ الفاتورة");
    setSaving(true);
    setError("");
    try {
      const invId = await createInvoice(user.uid, {
        projectId: selectedProject.id,
        companyName: companyName || "",
        client: {
          name: selectedProject.client?.name || "",
          phone: selectedProject.client?.phone || "",
          address: selectedProject.client?.address || "",
        },
        date: new Date(date).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        items: items.map((i) => ({ ...i, total: i.qty * i.unitPrice })),
        subtotal,
        total: subtotal,
        notes,
      });
      navigate(`/invoices/${invId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProject = (proj) => {
    setSelectedProject(proj);
    setStep("review");
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) => {
      const c = [...prev];
      c[idx] = { ...c[idx], [field]: val };
      c[idx].total = c[idx].qty * c[idx].unitPrice;
      return c;
    });
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  if (step === "select") {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/invoices" className="text-sm text-ink-muted hover:text-ink transition flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-right"></i> العودة للفواتير
          </Link>
          <h1 className="text-2xl font-black text-ink flex items-center gap-3">
            <i className="fa-solid fa-file-invoice text-brand-600"></i> فاتورة جديدة
          </h1>
          <p className="text-sm text-ink-muted">اختر المشروع لإنشاء الفاتورة</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-12 text-center shadow-sm">
            <i className="fa-solid fa-folder-open text-4xl text-ink-muted mb-3"></i>
            <p className="text-ink-muted font-bold">لا توجد مشاريع</p>
            <Link to="/projects/new" className="mt-3 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition">
              إنشاء مشروع أولاً
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((proj) => (
              <div key={proj.id} onClick={() => handleSelectProject(proj)}
                className="bg-surface border border-line rounded-2xl p-4 hover:border-brand-300 hover:shadow-md transition cursor-pointer flex items-center justify-between">
                <div>
                  <p className="font-bold text-ink">{proj.client?.name || "بدون اسم"}</p>
                  <p className="text-xs text-ink-muted">{proj.client?.phone || ""} | {proj.client?.address || ""}</p>
                </div>
                <div className="text-left text-xs text-ink-muted">
                  <p>{new Date(proj.createdAt).toLocaleDateString("ar-JO")}</p>
                  <span className="text-brand-600 font-bold text-sm"><i className="fa-solid fa-chevron-left"></i></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => setStep("select")} className="text-sm text-ink-muted hover:text-ink transition flex items-center gap-1 mb-2">
          <i className="fa-solid fa-arrow-right"></i> تغيير المشروع
        </button>
        <h1 className="text-2xl font-black text-ink flex items-center gap-3">
          <i className="fa-solid fa-file-invoice text-brand-600"></i> فاتورة جديدة
        </h1>
        <p className="text-sm text-ink-muted">{selectedProject?.client?.name || ""}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2"><i className="fa-solid fa-building text-brand-600"></i> معلومات العميل</h3>
          <div className="space-y-2 text-sm">
            <p className="text-ink-muted">الاسم: <span className="text-ink font-bold">{selectedProject?.client?.name || "-"}</span></p>
            <p className="text-ink-muted">الهاتف: <span className="text-ink">{selectedProject?.client?.phone || "-"}</span></p>
            <p className="text-ink-muted">العنوان: <span className="text-ink">{selectedProject?.client?.address || "-"}</span></p>
          </div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2"><i className="fa-solid fa-calendar text-amber-600"></i> التاريخ</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-ink-muted">تاريخ الفاتورة</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-ink outline-none text-sm focus:border-brand-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-ink-muted">تاريخ الاستحقاق</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-ink outline-none text-sm focus:border-brand-500 transition" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm mb-6">
        <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-2"><i className="fa-solid fa-list text-emerald-600"></i> بنود الفاتورة</h3>
        <p className="text-xs text-ink-muted mb-3">تم تعبئتها تلقائياً من حسابات المشروع — يمكنك تعديل الكميات والأسعار أو حذف البنود</p>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-line text-ink-muted text-[10px]">
                <th className="p-2 font-bold">#</th>
                <th className="p-2 font-bold">الصنف</th>
                <th className="p-2 font-bold">الوحدة</th>
                <th className="p-2 font-bold">الكمية</th>
                <th className="p-2 font-bold">سعر الوحدة</th>
                <th className="p-2 font-bold">الإجمالي</th>
                <th className="p-2 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-line hover:bg-surface-subtle">
                  <td className="p-2 text-ink-muted text-[10px]">{idx + 1}</td>
                  <td className="p-2 font-bold text-ink">{item.name}</td>
                  <td className="p-2 text-ink-muted text-xs">{item.unit}</td>
                  <td className="p-2">
                    <input type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", Number(e.target.value))} min="0" step="1"
                      className="w-16 bg-surface-input border border-line rounded-lg py-1 px-2 text-ink text-xs outline-none focus:border-brand-500 transition text-center" />
                  </td>
                  <td className="p-2">
                    <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))} min="0" step="0.5"
                      className="w-20 bg-surface-input border border-line rounded-lg py-1 px-2 text-ink text-xs outline-none focus:border-brand-500 transition text-center" />
                  </td>
                  <td className="p-2 font-bold text-ink">{(item.qty * item.unitPrice).toFixed(1)}</td>
                  <td className="p-2">
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-ink-muted">ملاحظات (اختياري)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full bg-surface-input border border-line rounded-xl py-2 px-3 text-ink outline-none text-sm focus:border-brand-500 transition resize-none" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-amber-500 rounded-2xl p-5 flex items-center justify-between shadow-lg mb-6">
        <div>
          <p className="text-white/80 text-xs font-bold">إجمالي الفاتورة</p>
          <p className="text-white text-2xl font-black">{subtotal.toFixed(1)} د.أ</p>
        </div>
        <button onClick={handleCreate} disabled={saving}
          className="bg-white text-brand-700 font-black py-3 px-8 rounded-xl transition shadow-md hover:shadow-xl disabled:opacity-60 text-sm">
          {saving ? <><i className="fa-solid fa-circle-notch fa-spin ml-1"></i> جاري...</> : <>إنشاء الفاتورة <i className="fa-solid fa-check mr-1"></i></>}
        </button>
      </div>
    </div>
  );
}
