import { useState, useMemo, useEffect } from "react";
import { TILES_CATALOG } from "../utils/constants";
import { calcAll, calcCosts } from "../utils/calculations";
import { downloadMaterialList, downloadQuotation } from "../services/pdfService";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getSuppliersWithPrices } from "../services/supplierService";
import { getProgramConfig } from "../services/adminService";
import RoofVisual from "../components/roof/RoofVisual";
import RoofPresets from "../components/roof/RoofPresets";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-ink-muted font-bold block">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input {...props}
      className={`w-full bg-surface-input border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-amber-500 transition ${props.className || ""}`} />
  );
}

function ResultBox({ children, className = "" }) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1 ${className}`}>
      {children}
    </div>
  );
}

const FACADE_LABELS = { 2: "وجهين", 3: "ثلاث أوجه", 4: "أربع أوجه" };

export default function CalculatorPage() {
  const { user, companyName } = useAuthStore();
  const [input, setInput] = useState({
    length: 5, width: 4, slope: 20,
    numFacades: 2, numLegs: 6, legHeight: 2.7,
    withDecor: true, enableInsulation: false,
    tileIndex: 0,
  });
  const [customFields, setCustomFields] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [extraTileStarts, setExtraTileStarts] = useState(0);
  const [extraTarabeesh, setExtraTarabeesh] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProgramConfig().then((pg) => {
      const defaultExtra = pg?.extraItems?.length
        ? pg.extraItems.map((ei) => ({ name: ei.name, value: "1", unit: ei.unit }))
        : null;
      getDoc(doc(db, "users", user.uid, "profile", "main")).then((snap) => {
        if (!snap.exists()) {
          if (defaultExtra) setCustomFields(defaultExtra);
          return;
        }
        const d = snap.data();
        if (d.prices) setPrices((prev) => ({ ...prev, ...d.prices }));
        const userItems = d.extraItems || [];
        if (userItems.length > 0) {
          setCustomFields(userItems.map((ei) => ({ name: ei.name, value: "1", unit: ei.unit })));
        } else if (defaultExtra) {
          setCustomFields(defaultExtra);
        } else {
          setCustomFields([
            { name: "زيت حار", value: "1", unit: "جلن" },
            { name: "فرنيش", value: "1", unit: "جلن" },
            { name: "رول دهان", value: "1", unit: "حبة" },
            { name: "فرش", value: "3", unit: "حبة" },
            { name: "مسامير فرد", value: "1", unit: "كغم" },
            { name: "مسامير فرد بولاد", value: "1", unit: "كغم" },
            { name: "مسامير 4سم", value: "1", unit: "كغم" },
            { name: "مسامير بولاد", value: "7", unit: "كغم" },
            { name: "مبروم حديد", value: "1", unit: "ربطة" },
            { name: "فيبر قص حديد", value: "1", unit: "حبة" },
            { name: "اسلاك لحام", value: "1", unit: "كغم" },
            { name: "اسمنت", value: "1", unit: "كيس" },
            { name: "بودرة", value: "1", unit: "كيس" },
            { name: "روف جارد", value: "1", unit: "5ك" },
          ]);
        }
      });
    });
  }, [user]);

  const [prices, setPrices] = useState({
    iron4x8: 12, iron10x10: 22, tile: 0.95,
    decor: 5, besh: 1.5, sharshef: 4, nathrayat: 150,
    tileStarts: 0, tarpaulin: 0, zafta: 0,
    latiSheets: 0, woodBases: 0, tarabeesh: 0,
  });
  const [showPrices, setShowPrices] = useState(false);
  const [supplierPrices, setSupplierPrices] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  useEffect(() => {
    setExtraTileStarts(input.numFacades || 0);
    setExtraTarabeesh((input.numFacades || 0) * 2);
  }, [input.numFacades]);

  const h = (name) => (e) => {
    const { value, type, checked } = e.target;
    setInput((f) => ({ ...f, [name]: type === "checkbox" ? checked : Number(value) }));
  };
  const hSel = (name) => (e) => setInput((f) => ({ ...f, [name]: Number(e.target.value) }));

  const applyPreset = (p) => setInput((f) => ({ ...f, ...p, tileIndex: f.tileIndex }));

  const handleNumFacades = (n) => setInput((f) => ({ ...f, numFacades: n }));
  const handleDecor = () => setInput((f) => ({ ...f, withDecor: !f.withDecor }));
  const handleInsulation = () => setInput((f) => ({ ...f, enableInsulation: !f.enableInsulation }));
  const handleLength = (v) => setInput((f) => ({ ...f, length: v }));
  const handleWidth = (v) => setInput((f) => ({ ...f, width: v }));
  const cycleTile = () => setInput((f) => ({ ...f, tileIndex: (f.tileIndex + 1) % TILES_CATALOG.length }));

  const tile = TILES_CATALOG[input.tileIndex] || TILES_CATALOG[0];

  const result = useMemo(() => calcAll({
    length: input.length, width: input.width,
    slopePercent: input.slope, spacingCm: 55,
    numFacades: input.numFacades, numLegs: input.numLegs, legHeight: input.legHeight,
    withDecor: input.withDecor, enableInsulation: input.enableInsulation, tile,
  }), [input, tile]);

  const costResult = useMemo(() => {
    if (!showPrices) return null;
    return calcCosts(result, prices, prices.nathrayat);
  }, [result, prices, showPrices]);

  useEffect(() => {
    if (showPrices) {
      setLoadingSuppliers(true);
      getSuppliersWithPrices().then((list) => {
        const enriched = list.map((s) => {
          const p = s.prices || {};
          const qtyTotal =
            (p.iron4x8 || 0) * result.iron4x8 +
            (p.iron10x10 || 0) * result.iron10x10.total +
            (p.tile || 0) * result.totalTiles +
            (p.decor || 0) * (result.decor?.bundles || 0) * (result.decor?.optimalLen || 0) +
            (p.besh || 0) * result.beshQty +
            (p.sharshef || 0) * (result.borders?.total || 0);
          return { ...s, estimatedTotal: qtyTotal };
        }).filter((s) => s.estimatedTotal > 0)
          .sort((a, b) => a.estimatedTotal - b.estimatedTotal);
        setSupplierPrices(enriched);
        setLoadingSuppliers(false);
      }).catch(() => setLoadingSuppliers(false));
    }
  }, [showPrices, result]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <i className="fa-solid fa-calculator text-white text-xl"></i>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black">حساب البضاعة</h1>
          <p className="text-sm text-ink-muted">مصمم بصري لكميات الورشة — النتيجة فورية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Visual + Controls */}
        <div className="lg:col-span-3 space-y-4">
          {/* Roof Visual */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3 sm:p-4">
              <RoofVisual
                length={input.length} width={input.width} slope={input.slope}
                numFacades={input.numFacades} withDecor={input.withDecor}
                enableInsulation={input.enableInsulation} tileIndex={input.tileIndex}
                onLengthChange={handleLength} onWidthChange={handleWidth}
                onNumFacadesChange={handleNumFacades}
                onDecorToggle={handleDecor} onInsulationToggle={handleInsulation}
                onTileChange={cycleTile}
              />
            </div>
          </div>

          {/* Presets */}
          <div className="bg-surface border border-line rounded-2xl p-3 sm:p-4 shadow-sm">
            <RoofPresets onSelect={applyPreset} current={input} />
          </div>

          {/* Quick controls */}
          <div className="bg-surface border border-line rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="عدد الأرجل">
                <Input type="number" value={input.numLegs} onChange={h("numLegs")} min="2" max="20" />
              </Field>
              <Field label="طول الرجل (م)">
                <Input type="number" value={input.legHeight} onChange={h("legHeight")} step="0.1" min="1" max="5" />
              </Field>
              <Field label="نوع القرميد">
                <select value={input.tileIndex} onChange={hSel("tileIndex")}
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-amber-500 transition text-sm">
                  {TILES_CATALOG.map((t, i) => (
                    <option key={i} value={i}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="نسبة الميل (%)">
                <Input type="number" value={input.slope} onChange={h("slope")} min="0" max="100" />
              </Field>
            </div>
            <div className="flex gap-2 mt-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer select-none ${
                input.withDecor
                  ? "bg-purple-100 border-purple-300 text-purple-700"
                  : "bg-surface border-line text-ink-muted"
              }`} onClick={handleDecor}>
                {input.withDecor ? "✅ ديكور" : "❌ ديكور"}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer select-none ${
                input.enableInsulation
                  ? "bg-cyan-100 border-cyan-300 text-cyan-700"
                  : "bg-surface border-line text-ink-muted"
              }`} onClick={handleInsulation}>
                {input.enableInsulation ? "✅ عزل مائي" : "❌ عزل مائي"}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-surface border-line text-ink-muted select-none">
                {FACADE_LABELS[input.numFacades] || `${input.numFacades} أوجه`}
              </span>
            </div>
          </div>

          {/* Pricing & Extra Items (collapsible) */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 sm:p-4 flex items-center justify-between text-sm font-bold text-ink hover:bg-surface-subtle transition">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-sliders text-amber-500"></i>
                خيارات متقدمة — التسعير والمواد الإضافية
              </span>
              <i className={`fa-solid fa-chevron-${showAdvanced ? "up" : "down"} text-ink-muted transition`}></i>
            </button>
            {showAdvanced && (
              <div className="px-3 sm:px-4 pb-4 space-y-4">
                <label className="flex items-center justify-between p-3 bg-surface-subtle border border-line rounded-2xl cursor-pointer">
                  <div>
                    <div className="font-bold text-sm">التسعير</div>
                    <div className="text-[10px] text-ink-muted">فعّل لحساب التكاليف والمقارنة مع الموردين</div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" checked={showPrices} onChange={() => setShowPrices(!showPrices)} className="sr-only peer" />
                    <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-amber-500 transition"></div>
                    <div className="absolute w-5 h-5 bg-surface rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
                  </div>
                </label>
                {showPrices && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "iron4x8", label: "حديد 4×8 (تيوب)" },
                      { key: "iron10x10", label: "حديد 10×10 (تيوب)" },
                      { key: "tile", label: "القرميد (حبة)" },
                      { key: "decor", label: "الديكور (م²)" },
                      { key: "besh", label: "البيش (وحدة)" },
                      { key: "sharshef", label: "الشراشف (م)" },
                      { key: "tileStarts", label: "بداية قرميد (حبة)" },
                      { key: "tarpaulin", label: "مشمع (رول)" },
                      { key: "zafta", label: "زفتة (رول)" },
                      { key: "latiSheets", label: "الواح لاتي (لوح)" },
                      { key: "woodBases", label: "أسس خشب (قطعة)" },
                      { key: "tarabeesh", label: "طرابيش (حبة)" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] text-ink-muted font-bold">{label}</label>
                        <Input type="number" value={prices[key]} onChange={(e) => setPrices((f) => ({ ...f, [key]: Number(e.target.value) }))} step="0.5" />
                      </div>
                    ))}
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-ink-muted font-bold">نثريات ومصاريف إضافية (د.أ)</label>
                      <Input type="number" value={prices.nathrayat} onChange={(e) => setPrices((f) => ({ ...f, nathrayat: Number(e.target.value) }))} step="10" />
                    </div>
                  </div>
                )}

                <hr className="border-line" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-ink-muted font-bold">بداية قرميد (حبة)</label>
                    <Input type="number" value={extraTileStarts} onChange={(e) => setExtraTileStarts(Number(e.target.value))} min="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-ink-muted font-bold">طرابيش (حبة)</label>
                    <Input type="number" value={extraTarabeesh} onChange={(e) => setExtraTarabeesh(Number(e.target.value))} min="0" />
                  </div>
                </div>

                <div>
                  <button onClick={() => setShowExtra(!showExtra)}
                    className="flex items-center gap-1 text-[10px] font-bold text-ink-muted hover:text-ink transition">
                    <i className={`fa-solid fa-chevron-${showExtra ? "up" : "down"}`}></i>
                    مواد إضافية ({customFields.length})
                  </button>
                  {showExtra && (
                    <div className="mt-2 space-y-1">
                      {customFields.map((cf, i) => (
                        <div key={i} draggable
                          onDragStart={() => setDragIdx(i)}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={() => {
                            if (dragIdx === null || dragIdx === i) return;
                            const c = [...customFields];
                            const [moved] = c.splice(dragIdx, 1);
                            c.splice(i, 0, moved);
                            setCustomFields(c);
                            setDragIdx(null);
                          }}
                          onDragEnd={() => setDragIdx(null)}
                          className={`flex items-center gap-2 p-1 rounded-xl transition ${dragIdx === i ? "opacity-40" : ""}`}>
                          <span className="text-ink-muted cursor-grab text-xs"><i className="fa-solid fa-grip-lines"></i></span>
                          <input placeholder="اسم المادة" value={cf.name} onChange={(e) => {
                            const c = [...customFields];
                            c[i] = { ...c[i], name: e.target.value };
                            setCustomFields(c);
                          }} className="flex-1 bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-amber-500 transition" />
                          <input placeholder="كمية" inputMode="decimal" value={cf.value} onChange={(e) => {
                            const c = [...customFields];
                            c[i] = { ...c[i], value: e.target.value };
                            setCustomFields(c);
                          }} className="w-16 bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-amber-500 transition text-center" />
                          <input placeholder="وحدة" value={cf.unit || ""} onChange={(e) => {
                            const c = [...customFields];
                            c[i] = { ...c[i], unit: e.target.value };
                            setCustomFields(c);
                          }} className="w-16 bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-amber-500 transition text-center" />
                          <button onClick={() => setCustomFields(customFields.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-600 text-xs p-1.5">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setCustomFields([...customFields, { name: "", value: "0", unit: "" }])}
                        className="w-full border border-dashed border-line rounded-xl py-3 text-xs text-ink-muted hover:text-ink hover:border-slate-300 transition flex items-center justify-center gap-1 mt-2">
                        <i className="fa-solid fa-plus"></i> إضافة مادة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Result Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface rounded-2xl p-3 sm:p-5 text-ink shadow-xl border-2 border-line" dir="rtl">
            <div className="text-center pb-3 border-b-2 border-line">
              <h2 className="text-base sm:text-lg font-black">تقدير كميات الورشة</h2>
              <p className="text-[9px] sm:text-[10px] text-ink-muted font-bold">كشف المواد حسب المقاسات المدخلة</p>
            </div>

            <div className="py-3">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-surface-subtle rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-ink-muted font-bold">المساحة الأرضية</p>
                  <p className="text-lg font-black">{result.flatArea.toFixed(2)} م²</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-200">
                  <p className="text-[9px] text-amber-700 font-bold">بعد الميل ({input.slope}%)</p>
                  <p className="text-lg font-black text-amber-800">{result.actualArea.toFixed(2)} م²</p>
                </div>
              </div>

              <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="border border-line rounded-xl overflow-hidden text-xs sm:text-sm min-w-[300px] sm:min-w-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-l from-amber-600 to-amber-700 text-white text-[10px]">
                      <th className="py-2.5 px-2 font-bold text-center w-8">#</th>
                      <th className="py-2.5 px-2 font-bold text-right">المادة</th>
                      <th className="py-2.5 px-2 font-bold text-center">الكمية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(() => {
                      const rows = [];
                      rows.push({ type: "group", label: "🧱 القرميد" });
                      rows.push({ n: tile.name, v: `${result.totalTiles} حبة` });
                      rows.push({ type: "group", label: "🔩 الحديد" });
                      rows.push({ n: "حديد 4×8", v: `${result.iron4x8} تيوب` });
                      rows.push({ n: "حديد 10×10 فريم", v: `${result.iron10x10.frame} تيوب` });
                      rows.push({ n: "حديد 10×10 أرجل", v: `${result.iron10x10.legs} تيوب` });
                      rows.push({ n: "إجمالي 10×10", v: `${result.iron10x10.total} تيوب`, bold: true });
                      rows.push({ type: "group", label: "🪵 الخشب" });
                      if (input.withDecor) rows.push({ n: "ديكور", v: `${result.decor.bundles} ربطة (${result.decor.optimalLen}م)` });
                      rows.push({ n: "البيش", v: `${result.beshQty} وحدة` });
                      rows.push({ n: "أسس خشب", v: `${result.woodBases} قطعة` });
                      Object.entries(result.borders.lengths || {}).forEach(([len, count]) => {
                        rows.push({ n: `شراشف ${len}م`, v: `${count} شريحة` });
                      });
                      if ((result.borders.waste || 0) > 0) rows.push({ n: "هدر شراشف", v: `${result.borders.waste}م (${result.borders.wastePercent}%)` });
                      rows.push({ type: "group", label: "💧 عزل" });
                      rows.push({ n: "مشمع", v: result.tarpaulin.text });
                      if (result.insulation) {
                        rows.push({ n: "زفتة", v: `${result.insulation.zaftaRolls} رول` });
                        rows.push({ n: "لاتي", v: `${result.insulation.latiSheets} لوح` });
                        rows.push({ n: "مساطر زفتة", v: `${result.insulation.zaftaRulers} م` });
                      }
                      const extras = [];
                      if (extraTileStarts > 0) extras.push({ n: "بداية قرميد", v: `${extraTileStarts} حبة` });
                      if (extraTarabeesh > 0) extras.push({ n: "طرابيش", v: `${extraTarabeesh} حبة` });
                      customFields.forEach((cf) => extras.push({ n: cf.name, v: `${cf.value} ${cf.unit || ""}` }));
                      if (extras.length > 0) {
                        rows.push({ type: "group", label: "📦 مواد إضافية" });
                        extras.forEach((ei) => rows.push({ n: ei.n, v: ei.v }));
                      }
                      let dataIdx = 0;
                      return rows.map((r, i) => {
                        if (r.type === "group") {
                          return (
                            <tr key={`g${i}`} className="bg-amber-50">
                              <td colSpan={3} className="py-1.5 px-2 text-[10px] font-bold text-amber-800">{r.label}</td>
                            </tr>
                          );
                        }
                        dataIdx++;
                        return (
                          <tr key={i} className={dataIdx % 2 === 0 ? "" : "bg-surface-subtle"}>
                            <td className="py-2 px-2 text-center text-ink-muted text-[10px]">{dataIdx}</td>
                            <td className={`py-2 px-2 text-xs sm:text-sm ${r.bold ? "font-black text-amber-700" : "font-semibold"}`}>{r.n}</td>
                            <td className="py-2 px-2 text-center font-bold text-xs sm:text-sm">{r.v}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              </div>
            </div>

            {costResult && (
              <div className="border-t border-line pt-3 mt-2">
                <h4 className="text-[10px] font-black text-amber-800 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-coins text-amber-600"></i> التقرير المالي
                </h4>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                <div className="border border-line rounded-xl overflow-hidden text-xs min-w-[250px] sm:min-w-0">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-amber-100 text-amber-900 text-[9px]">
                        <th className="py-1.5 px-2 font-bold text-right">البند</th>
                        <th className="py-1.5 px-2 font-bold text-center">التكلفة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {costResult.items.filter((i) => i.cost > 0).map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-surface-subtle" : "bg-surface"}>
                          <td className="py-1.5 px-2">{item.label}</td>
                          <td className="py-1.5 px-2 text-center font-bold">{item.cost.toFixed(1)} د.أ</td>
                        </tr>
                      ))}
                      <tr className="bg-amber-50">
                        <td className="py-1.5 px-2 text-amber-800">نثريات</td>
                        <td className="py-1.5 px-2 text-center font-bold text-amber-800">{prices.nathrayat.toFixed(1)} د.أ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                </div>
                <div className="flex justify-between font-black text-xs sm:text-sm bg-gradient-to-l from-amber-600 to-amber-700 text-white rounded-xl p-3 mt-2 shadow-lg">
                  <span>المجموع التقديري:</span>
                  <span className="text-amber-300">{costResult.totalWithNathrayat.toFixed(1)} د.أ</span>
                </div>
              </div>
            )}

            {showPrices && (
              <div className="border-t border-line pt-3 mt-3">
                <h4 className="text-[10px] font-black text-ink mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-truck text-emerald-600"></i> مقارنة أسعار الموردين
                </h4>
                {loadingSuppliers ? (
                  <p className="text-[10px] text-ink-muted text-center py-3"><i className="fa-solid fa-spinner fa-spin ml-1"></i> جاري تحميل أسعار الموردين...</p>
                ) : supplierPrices.length === 0 ? (
                  <p className="text-[10px] text-ink-muted text-center py-3">لا يوجد موردون بأسعار حالياً</p>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <div className="border border-emerald-200 rounded-xl overflow-hidden text-[10px] min-w-[280px] sm:min-w-0">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-emerald-600 text-white text-[9px]">
                          <th className="py-1.5 px-2 font-bold text-right">المورد</th>
                          <th className="py-1.5 px-2 font-bold text-center">تقدير التكلفة</th>
                          <th className="py-1.5 px-2 font-bold text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {supplierPrices.map((s, i) => (
                          <tr key={s.uid} className={i === 0 ? "bg-emerald-50" : i % 2 === 0 ? "bg-surface-subtle" : "bg-surface"}>
                            <td className="py-1.5 px-2">
                              <span className={`font-bold ${i === 0 ? "text-emerald-700" : "text-ink"}`}>
                                {i === 0 && <i className="fa-solid fa-crown text-amber-500 ml-1"></i>}
                                {s.businessName}
                              </span>
                              {(s.deliveryAreas || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {s.deliveryAreas.map((a) => (
                                    <span key={a} className="text-[7px] font-bold text-ink-muted border border-line rounded px-1">{a}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center font-bold">{s.estimatedTotal.toFixed(1)} د.أ</td>
                            <td className="py-1.5 px-2 text-center">
                              {s.phone ? (
                                <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`أهلاً، وجدت أسعارك في شموخ ERP وأحتاج ${result.iron4x8} تيوب 4×8 و ${result.iron10x10.total} تيوب 10×10 و ${result.totalTiles} حبة قرميد`)}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700">
                                  <i className="fa-brands fa-whatsapp text-sm"></i>
                                </a>
                              ) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4 border-t border-line mt-3">
              <button onClick={() => downloadMaterialList(result, tile, { client: { name: "ورشة حالية" } }, customFields, companyName)}
                className="w-full bg-surface-subtle hover:bg-surface-input text-ink font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm border border-line">
                <i className="fa-solid fa-file-pdf text-red-500"></i> كشف مواد PDF
              </button>
              <button onClick={() => costResult && downloadQuotation(result, costResult, tile, prices, { client: { name: "ورشة حالية" } }, companyName)}
                className="w-full bg-surface-subtle hover:bg-surface-input text-ink font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm border border-line disabled:opacity-50"
                disabled={!costResult}>
                <i className="fa-solid fa-file-invoice text-amber-600"></i> عرض سعر PDF
              </button>
              <button onClick={() => {
                const lines = [];
                lines.push("*🧱 القرميد*");
                lines.push(`${tile?.name || ""}: ${result.totalTiles} حبة`);
                lines.push("*🔩 الحديد*");
                lines.push(`حديد 4×8: ${result.iron4x8} تيوب`);
                lines.push(`حديد 10×10 فريم: ${result.iron10x10.frame} تيوب`);
                lines.push(`حديد 10×10 أرجل: ${result.iron10x10.legs} تيوب`);
                lines.push(`إجمالي 10×10: ${result.iron10x10.total} تيوب`);
                lines.push("*🪵 الخشب*");
                if (input.withDecor) lines.push(`ديكور: ${result.decor.bundles} ربطة (${result.decor.optimalLen}م)`);
                lines.push(`البيش: ${result.beshQty} وحدة`);
                lines.push(`أسس خشب: ${result.woodBases} قطعة`);
                Object.entries(result.borders.lengths || {}).forEach(([len, count]) => {
                  lines.push(`شراشف ${len}م: ${count} شريحة`);
                });
                if ((result.borders.waste || 0) > 0) lines.push(`هدر شراشف: ${result.borders.waste}م (${result.borders.wastePercent}%)`);
                lines.push("*💧 عزل*");
                lines.push(`مشمع: ${result.tarpaulin.text}`);
                if (result.insulation) {
                  lines.push(`زفتة: ${result.insulation.zaftaRolls} رول`);
                  lines.push(`لاتي: ${result.insulation.latiSheets} لوح`);
                  lines.push(`مساطر زفتة: ${result.insulation.zaftaRulers} م`);
                }
                const extras = [];
                if (extraTileStarts > 0) extras.push(`بداية قرميد: ${extraTileStarts} حبة`);
                if (extraTarabeesh > 0) extras.push(`طرابيش: ${extraTarabeesh} حبة`);
                customFields.forEach((cf) => extras.push(`${cf.name}: ${cf.value} ${cf.unit || ""}`));
                if (extras.length > 0) {
                  lines.push("*📦 مواد إضافية*");
                  extras.forEach((e) => lines.push(e));
                }
                const msg = `📋 *كشف المواد حسب المقاسات المدخلة*\n\n${lines.join("\n")}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
              }}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold py-3 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm">
                <i className="fa-brands fa-whatsapp text-lg"></i> إرسال واتساب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}