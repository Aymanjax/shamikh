import { useState, useMemo } from "react";
import { TILES_CATALOG, MARKET_LENGTHS } from "../utils/constants";
import { calcAll, calcCosts } from "../utils/calculations";
import { downloadMaterialList, downloadQuotation } from "../services/pdfService";

const STEPS = [
  { key: "basic", icon: "fa-ruler-combined", label: "أساسيات الورشة", color: "from-sky-500 to-cyan-500" },
  { key: "iron", icon: "fa-border-all", label: "هيكل الحديد", color: "from-violet-500 to-purple-500" },
  { key: "decor", icon: "fa-palette", label: "الديكور والبيش", color: "from-amber-500 to-orange-500" },
  { key: "sharshef", icon: "fa-draw-polygon", label: "الشراشف والأسس", color: "from-emerald-500 to-teal-500" },
  { key: "insulation", icon: "fa-water", label: "العزل المائي", color: "from-blue-500 to-indigo-500" },
  { key: "tile", icon: "fa-cube", label: "القرميد", color: "from-rose-500 to-pink-500" },
  { key: "extra", icon: "fa-plus-circle", label: "إضافات", color: "from-slate-500 to-slate-400" },
];

export default function CalculatorPage() {
  const [input, setInput] = useState({
    length: 5, width: 4, slope: 20,
    numFacades: 2, numLegs: 6, legHeight: 2.7,
    withDecor: true, enableInsulation: false,
    tileIndex: 0,
  });
  const [customFields, setCustomFields] = useState([]);
  const [prices, setPrices] = useState({
    iron4x8: 12, iron10x10: 22, tile: 0.95,
    decor: 5, besh: 1.5, sharshef: 4, nathrayat: 150,
  });
  const [showPrices, setShowPrices] = useState(false);
  const [openStep, setOpenStep] = useState("basic");

  const h = (name) => (e) => {
    const { value, type, checked } = e.target;
    setInput((f) => ({ ...f, [name]: type === "checkbox" ? checked : Number(value) }));
  };
  const hSel = (name) => (e) => setInput((f) => ({ ...f, [name]: Number(e.target.value) }));

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

  const toggleStep = (key) => setOpenStep((prev) => (prev === key ? "" : key));

  const StepBox = ({ stepKey, children, icon, label, color }) => {
    const isOpen = openStep === stepKey;
    return (
      <div className={`bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "shadow-lg shadow-black/20" : ""}`}>
        <button onClick={() => toggleStep(stepKey)}
          className="w-full flex items-center gap-3 p-4 text-right hover:bg-white/5 transition">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
            <i className={`fa-solid ${icon} text-white text-sm`}></i>
          </div>
          <div className="flex-1">
            <span className="font-bold text-sm">{label}</span>
            {!isOpen && <span className="text-[10px] text-slate-500 block mt-0.5">اضغط للتوسيع</span>}
          </div>
          <i className={`fa-solid fa-chevron-down text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}></i>
        </button>
        <div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="p-4 pt-0 space-y-3 border-t border-white/5">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <label className="text-[10px] text-slate-400 font-bold block">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-600/30">
          <i className="fa-solid fa-calculator text-white text-xl"></i>
        </div>
        <div>
          <h1 className="text-2xl font-black">الحاسبة الذكية</h1>
          <p className="text-sm text-slate-400">حساب دقيق لكميات الورشة مع تقليل الهدر</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button key={s.key} onClick={() => toggleStep(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
              openStep === s.key
                ? `bg-gradient-to-r ${s.color} text-white shadow-lg`
                : "bg-[#0f172a] border border-white/5 text-slate-400 hover:text-white"
            }`}>
            <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[8px] font-black">{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">

          <StepBox stepKey="basic" icon="fa-ruler-combined" label="أبعاد الورشة والواجهات" color="from-sky-500 to-cyan-500">
            <div className="grid grid-cols-2 gap-3">
              <Field label="طول السقف (م)">
                <input type="number" value={input.length} onChange={h("length")} step="0.1"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-sky-500 transition" />
              </Field>
              <Field label="عرض السقف (م)">
                <input type="number" value={input.width} onChange={h("width")} step="0.1"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-sky-500 transition" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="عدد الواجهات">
                <div className="flex bg-[#1e293b] rounded-xl p-1 border border-white/10">
                  {[2, 3, 4].map((n) => (
                    <button key={n} onClick={() => setInput((f) => ({ ...f, numFacades: n }))}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${input.numFacades === n ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>{n === 2 ? "وجهين" : n === 3 ? "ثلاث أوجه" : "أربع أوجه"}</button>
                  ))}
                </div>
              </Field>
              <Field label="نسبة الميل (%)">
                <div className="flex bg-[#1e293b] rounded-xl p-1 border border-white/10">
                  {[0, 10, 20, 30, 40, 50].map((v) => (
                    <button key={v} onClick={() => setInput((f) => ({ ...f, slope: v }))}
                      className={`flex-1 py-2 rounded-lg font-bold text-[10px] transition ${input.slope === v ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>{v}%</button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="bg-gradient-to-r from-sky-600/10 to-cyan-600/10 border border-sky-500/10 rounded-xl p-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-sky-400">المساحة الأرضية: <span className="text-white">{result.flatArea.toFixed(2)} م²</span></span>
                <span className="text-sky-400">مجموع الواجهات: <span className="text-white">{result.totalFacadeLength} م</span></span>
                <span className="text-sky-400">المساحة الفعلية: <span className="text-amber-400">{result.actualArea.toFixed(2)} م²</span></span>
              </div>
            </div>
          </StepBox>

          <StepBox stepKey="iron" icon="fa-structure" label="هيكل الحديد 4×8 و 10×10" color="from-violet-500 to-purple-500">
            <div className="grid grid-cols-3 gap-3">
              <Field label="عدد الأرجل">
                <input type="number" value={input.numLegs} onChange={h("numLegs")}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-violet-500 transition" />
              </Field>
              <Field label="طول الرجل (م)">
                <input type="number" value={input.legHeight} onChange={h("legHeight")} step="0.1"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-violet-500 transition" />
              </Field>
            </div>
          </StepBox>

          <StepBox stepKey="decor" icon="fa-palette" label="الديكور الخشبي والبيش" color="from-amber-500 to-orange-500">
            <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-sm">ديكور خشبي داخلي</div>
                <div className="text-[10px] text-slate-400">البيش ينقص للنصف مع الديكور</div>
              </div>
              <div className="relative">
                <input type="checkbox" checked={input.withDecor} onChange={h("withDecor")} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:bg-amber-500 transition"></div>
                <div className="absolute w-5 h-5 bg-white rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
              </div>
            </label>
            {input.withDecor && (
              <div className="bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/10 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-amber-400">طول الديكور (المقاس الأصغر):</span><span className="font-bold text-white">{Math.min(input.length, input.width)} م</span></div>
                <div className="flex justify-between"><span className="text-amber-400">طول اللوح المناسب:</span><span className="font-bold text-white">{result.decor.optimalLen} م (هدر {result.decor.wasteCm} سم)</span></div>
                <div className="flex justify-between"><span className="text-amber-400">عدد الربطات:</span><span className="font-bold text-white">{result.decor.bundles} ربطة</span></div>
                <div className="flex justify-between"><span className="text-amber-400">البيش:</span><span className="font-bold text-white">{result.beshQty} وحدة</span></div>
              </div>
            )}
          </StepBox>

          <StepBox stepKey="sharshef" icon="fa-vector-polygon" label="الشراشف والأسس" color="from-emerald-500 to-teal-500">
            <div className="grid grid-cols-2 gap-3">
            </div>
            <div className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/10 rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-emerald-400">الشراشف (تجميع ذكي):</span>
                <span className="font-bold text-white">
                  {Object.entries(result.borders.lengths).map(([len, qty]) => `${qty}×${len}م`).join(" + ") || "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">مجموع أطوال الشراشف:</span>
                <span className="font-bold text-white">{result.borders.total} م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">أسس الخشب:</span>
                <span className="font-bold text-white">{result.woodBases} قطعة</span>
              </div>
            </div>
          </StepBox>

          <StepBox stepKey="insulation" icon="fa-shield-water" label="العزل المائي" color="from-blue-500 to-indigo-500">
            <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-sm">عزل مائي كامل</div>
                <div className="text-[10px] text-slate-400">زفتة + لاتي + مساطير + مشمع</div>
              </div>
              <div className="relative">
                <input type="checkbox" checked={input.enableInsulation} onChange={h("enableInsulation")} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:bg-blue-500 transition"></div>
                <div className="absolute w-5 h-5 bg-white rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
              </div>
            </label>
            {input.enableInsulation && result.insulation && (
              <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/10 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-blue-400">رولات الزفتة:</span><span className="font-bold text-white">{result.insulation.zaftaRolls} رول</span></div>
                <div className="flex justify-between"><span className="text-blue-400">ألواح اللاتي:</span><span className="font-bold text-white">{result.insulation.latiSheets} لوح</span></div>
                <div className="flex justify-between"><span className="text-blue-400">مساطر الزفتة:</span><span className="font-bold text-white">{result.insulation.zaftaRulers} م</span></div>
                <div className="flex justify-between"><span className="text-blue-400">المشمع:</span><span className="font-bold text-white">{result.tarpaulin.text}</span></div>
              </div>
            )}
          </StepBox>

          <StepBox stepKey="tile" icon="fa-house-chimney-crack" label="القرميد" color="from-rose-500 to-pink-500">
            <Field label="نوع القرميد">
              <select value={input.tileIndex} onChange={hSel("tileIndex")}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-rose-500 transition">
                {TILES_CATALOG.map((t, i) => (
                  <option key={i} value={i}>{t.name} — {t.origin} ({t.count} حبة/م²)</option>
                ))}
              </select>
            </Field>
            <div className="bg-gradient-to-r from-rose-600/10 to-pink-600/10 border border-rose-500/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-rose-400 block font-bold">عدد حبات القرميد</span>
              <span className="text-3xl font-black text-white">{result.totalTiles}</span>
              <span className="text-rose-400 text-xs block">{tile.name}</span>
            </div>
          </StepBox>

          <StepBox stepKey="extra" icon="fa-plus-circle" label="مواد إضافية وحقول مخصصة" color="from-slate-500 to-slate-400">

            <p className="text-xs text-slate-400">أضف مواد إضافية وحقول حسب رغبتك (تظهر في كشف المواد PDF)</p>
            {customFields.map((cf, i) => (
              <div key={i} className="flex items-center gap-2">
                <input placeholder="اسم المادة" value={cf.name} onChange={(e) => {
                  const c = [...customFields];
                  c[i].name = e.target.value;
                  setCustomFields(c);
                }} className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-brand-500" />
                <input placeholder="الكمية" type="number" value={cf.value} onChange={(e) => {
                  const c = [...customFields];
                  c[i].value = Number(e.target.value);
                  setCustomFields(c);
                }} className="w-16 bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-brand-500 text-center" />
                <input placeholder="وحدة" value={cf.unit || ""} onChange={(e) => {
                  const c = [...customFields];
                  c[i].unit = e.target.value;
                  setCustomFields(c);
                }} className="w-16 bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-brand-500 text-center" />
                <button onClick={() => setCustomFields(customFields.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-300 text-xs p-2">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))}
            <button onClick={() => setCustomFields([...customFields, { name: "", value: 0, unit: "" }])}
              className="w-full border border-dashed border-white/10 rounded-xl py-3 text-xs text-slate-400 hover:text-white hover:border-white/20 transition flex items-center justify-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة مادة إضافية
            </button>
          </StepBox>

          <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <i className="fa-solid fa-tags text-emerald-500"></i> التسعير
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={showPrices} onChange={() => setShowPrices(!showPrices)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[-18px]"></div>
              </label>
            </div>
            {showPrices && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "iron4x8", label: "حديد 4×8 (تيوب)" },
                  { key: "iron10x10", label: "حديد 10×10 (تيوب)" },
                  { key: "tile", label: "القرميد (حبة)" },
                  { key: "decor", label: "الديكور (م²)" },
                  { key: "besh", label: "البيش (وحدة)" },
                  { key: "sharshef", label: "الشراشف (م)" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold">{label}</label>
                    <input type="number" value={prices[key]} onChange={(e) => setPrices((f) => ({ ...f, [key]: Number(e.target.value) }))} step="0.5"
                      className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 transition" />
                  </div>
                ))}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">نثريات ومصاريف إضافية (د.أ)</label>
                  <input type="number" value={prices.nathrayat} onChange={(e) => setPrices((f) => ({ ...f, nathrayat: Number(e.target.value) }))} step="10"
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 transition" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-xl border-2 border-slate-100" dir="rtl">
            <div className="text-center pb-3 border-b-2 border-slate-200 relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-amber-500 text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg">النتائج</div>
              <h2 className="text-lg font-black mt-2">كشف المواد</h2>
              <p className="text-[10px] text-slate-500 font-bold">تقدير كميات الورشة</p>
            </div>

            <div className="space-y-3 py-3 text-sm font-semibold">
              <div className="flex justify-between bg-slate-100 p-2.5 rounded-xl">
                <span>المساحة الأرضية:</span>
                <span className="font-extrabold">{result.flatArea.toFixed(2)} م²</span>
              </div>
              <div className="flex justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span>مع الميل ({input.slope}%):</span>
                <span className="font-extrabold">{result.actualArea.toFixed(2)} م²</span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-border-all text-violet-500"></i> هيكل الحديد
                </h4>
                <div className="flex justify-between py-1"><span>حديد 4×8:</span><span className="font-bold">{result.iron4x8} تيوب</span></div>
                <div className="flex justify-between py-1"><span>حديد 10×10 فريم:</span><span className="font-bold">{result.iron10x10.frame} تيوب</span></div>
                <div className="flex justify-between py-1"><span>حديد 10×10 أرجل:</span><span className="font-bold">{result.iron10x10.legs} تيوب</span></div>
                <div className="flex justify-between py-1 text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                  <span>إجمالي 10×10:</span><span className="font-bold">{result.iron10x10.total} تيوب</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-palette text-amber-500"></i> الأخشاب والتشطيب
                </h4>
                <div className="flex justify-between py-1">
                  <span>ديكور:</span>
                  <span className="font-bold">{input.withDecor ? `${result.decor.bundles} ربطة (${result.decor.optimalLen}م)` : "بدون"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>البيش:</span>
                  <span className="font-bold">{result.beshQty} وحدة</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>أسس خشب:</span>
                  <span className="font-bold">{result.woodBases} قطعة</span>
                </div>
                <div className="mt-2 bg-slate-100 rounded-xl p-3">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">الشراشف (تجميع ذكي):</div>
                  <div className="font-bold text-xs text-brand-700">
                    {Object.entries(result.borders.lengths).map(([len, qty]) => `${qty} لوح (${len}م)`).join(" + ") || "0"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">المجموع: {result.borders.total} م</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-water text-blue-500"></i> الحماية والكسوة
                </h4>
                <div className="flex justify-between bg-amber-50 p-2 rounded-xl mb-2">
                  <span>مشمع:</span>
                  <span className="font-bold">{result.tarpaulin.text}</span>
                </div>
                {result.insulation && (
                  <div className="bg-emerald-50 p-2 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between"><span>زفتة:</span><span>{result.insulation.zaftaRolls} رول</span></div>
                    <div className="flex justify-between"><span>لاتي:</span><span>{result.insulation.latiSheets} لوح</span></div>
                    <div className="flex justify-between"><span>مساطر:</span><span>{result.insulation.zaftaRulers} م</span></div>
                  </div>
                )}
              </div>

              {result.tileStarts > 0 && (
                <div className="flex justify-between bg-orange-50 p-2 rounded-xl">
                  <span>بداية قرميد:</span>
                  <span className="font-bold">{result.tileStarts} حبة</span>
                </div>
              )}

              {customFields.length > 0 && (
                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-[10px] font-black text-slate-400 mb-2 flex items-center gap-1">
                    <i className="fa-solid fa-plus-circle text-orange-500"></i> مواد إضافية
                  </h4>
                  {customFields.map((cf, i) => (
                    <div key={i} className="flex justify-between py-1 text-xs">
                      <span>{cf.name}:</span>
                      <span className="font-bold">{cf.value} {cf.unit || ""}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg">
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold">القرميد</span>
                  <span className="block text-lg font-black text-amber-400">{result.totalTiles} حبة</span>
                </div>
                <span className="text-[10px] text-slate-300 text-left max-w-[50%]">{tile.name}</span>
              </div>
            </div>

            {costResult && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <h4 className="text-[10px] font-black text-emerald-800 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-coins text-emerald-500"></i> التقرير المالي
                </h4>
                <div className="space-y-1 text-xs">
                  {costResult.items.filter((i) => i.cost > 0).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.label}:</span>
                      <span>{item.cost.toFixed(1)} د.أ</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-amber-800">
                    <span>نثريات:</span>
                    <span>{prices.nathrayat.toFixed(1)} د.أ</span>
                  </div>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-200 mt-2 pt-2">
                  <span>المجموع التقديري:</span>
                  <span className="text-emerald-700">{costResult.totalWithNathrayat.toFixed(1)} د.أ</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => {
            const msg = `📋 *كشف مواد تقديري*\n` +
              `المساحة: ${result.actualArea.toFixed(2)} م²\n` +
              `حديد 4×8: ${result.iron4x8} تيوب\n` +
              `حديد 10×10: ${result.iron10x10.total} تيوب\n` +
              `قرميد: ${result.totalTiles} حبة (${tile.name})\n` +
              `مشمع: ${result.tarpaulin.text}\n` +
              (costResult ? `💰 التكلفة: ${costResult.totalWithNathrayat.toFixed(1)} د.أ` : "");
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
          }}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-lg">
            <i className="fa-brands fa-whatsapp text-2xl"></i> إرسال واتساب
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => downloadMaterialList(result, tile, { client: { name: "ورشة حالية" } }, customFields)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm">
              <i className="fa-solid fa-file-pdf text-red-400"></i> كشف مواد PDF
            </button>
            <button onClick={() => costResult && downloadQuotation(result, costResult, tile, prices, { client: { name: "ورشة حالية" } })}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              disabled={!costResult}>
              <i className="fa-solid fa-file-invoice text-amber-400"></i> عرض سعر PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
