import { useState, useMemo } from "react";
import { TILES_CATALOG } from "../utils/constants";
import { calcAll, calcCosts } from "../utils/calculations";
import { downloadMaterialList, downloadQuotation } from "../services/pdfService";

export default function CalculatorPage() {
  const [input, setInput] = useState({
    length: 5, width: 4, slope: 20,
    spacing: 55, facadeLength: 13, numLegs: 6, legHeight: 2.7,
    withDecor: true, enableInsulation: false,
    tileIndex: 0,
  });
  const [prices, setPrices] = useState({
    iron4x8: 12, iron10x10: 22, tile: 0.95,
    decor: 5, besh: 1.5, sharshef: 4, nathrayat: 150,
  });
  const [showPrices, setShowPrices] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInput((f) => ({ ...f, [name]: type === "checkbox" ? checked : Number(value) }));
  };

  const tile = TILES_CATALOG[input.tileIndex] || TILES_CATALOG[0];

  const result = useMemo(() => calcAll({
    segments: [{ length: input.length, width: input.width }],
    slopePercent: input.slope,
    spacingCm: input.spacing,
    facadeLength: input.facadeLength,
    numLegs: input.numLegs,
    legHeight: input.legHeight,
    withDecor: input.withDecor,
    enableInsulation: input.enableInsulation,
    tile,
  }), [input, tile]);

  const costResult = useMemo(() => {
    if (!showPrices) return null;
    return calcCosts(result, prices, prices.nathrayat);
  }, [result, prices, showPrices]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h1 className="text-2xl font-black">الحاسبة الذكية</h1>
          <p className="text-sm text-slate-400">حساب كميات المواد بدقة مع تقليل الهدر</p>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-sm"><i className="fa-solid fa-ruler-combined text-brand-500"></i> أبعاد الورشة</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">الطول (م)</label>
              <input type="number" name="length" value={input.length} onChange={handleChange} step="0.1"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">العرض (م)</label>
              <input type="number" name="width" value={input.width} onChange={handleChange} step="0.1"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">الميل (%)</label>
              <select name="slope" value={input.slope} onChange={handleChange}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-brand-500">
                <option value="0">0%</option><option value="10">10%</option>
                <option value="20">20%</option><option value="30">30%</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-sm"><i className="fa-solid fa-arrows-to-dot text-brand-500"></i> الهيكل والارتكاز</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">مسافات الحديد</label>
              <div className="flex bg-[#1e293b] rounded-xl p-1 border border-white/10">
                <button onClick={() => setInput((f) => ({ ...f, spacing: 55 }))}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${input.spacing === 55 ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"}`}>55 سم</button>
                <button onClick={() => setInput((f) => ({ ...f, spacing: 60 }))}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${input.spacing === 60 ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"}`}>60 سم</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">عدد الأرجل</label>
              <input type="number" name="numLegs" value={input.numLegs} onChange={handleChange}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">ارتفاع الرجل (م)</label>
              <input type="number" name="legHeight" value={input.legHeight} onChange={handleChange} step="0.1"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold">أطوال الواجهات (م)</label>
            <input type="number" name="facadeLength" value={input.facadeLength} onChange={handleChange} step="0.1"
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-sm"><i className="fa-solid fa-palette text-brand-500"></i> التشطيب والقرميد</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">نوع القرميد</label>
              <select name="tileIndex" value={input.tileIndex} onChange={(e) => setInput((f) => ({ ...f, tileIndex: Number(e.target.value) }))}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-brand-500">
                {TILES_CATALOG.map((t, i) => (
                  <option key={i} value={i}>{t.name} - {t.origin} ({t.count} حبة/م²)</option>
                ))}
              </select>
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-sm">ديكور خشبي داخلي</div>
                <div className="text-[10px] text-slate-400">يزيد كمية البيش 50% (×1.5)</div>
              </div>
              <div className="relative">
                <input type="checkbox" name="withDecor" checked={input.withDecor} onChange={handleChange} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:bg-brand-500 transition"></div>
                <div className="absolute w-5 h-5 bg-white rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-sm">عزل مائي كامل</div>
                <div className="text-[10px] text-slate-400">زفتة + لاتي + مساطير</div>
              </div>
              <div className="relative">
                <input type="checkbox" name="enableInsulation" checked={input.enableInsulation} onChange={handleChange} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 transition"></div>
                <div className="absolute w-5 h-5 bg-white rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm"><i className="fa-solid fa-tags text-emerald-500"></i> التسعير</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={showPrices} onChange={() => setShowPrices(!showPrices)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-[-18px]"></div>
              <span className="mr-3 text-xs font-bold text-slate-400">تفعيل</span>
            </label>
          </div>
          {showPrices && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">حديد 4×8 (تيوب)</label>
                <input type="number" value={prices.iron4x8} onChange={(e) => setPrices((f) => ({ ...f, iron4x8: Number(e.target.value) }))} step="0.5"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
              <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">حديد 10×10 (تيوب)</label>
                <input type="number" value={prices.iron10x10} onChange={(e) => setPrices((f) => ({ ...f, iron10x10: Number(e.target.value) }))} step="0.5"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
              <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">القرميد (حبة)</label>
                <input type="number" value={prices.tile} onChange={(e) => setPrices((f) => ({ ...f, tile: Number(e.target.value) }))} step="0.05"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
              <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">الديكور (م²)</label>
                <input type="number" value={prices.decor} onChange={(e) => setPrices((f) => ({ ...f, decor: Number(e.target.value) }))} step="0.5"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
              <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">البيش (وحدة)</label>
                <input type="number" value={prices.besh} onChange={(e) => setPrices((f) => ({ ...f, besh: Number(e.target.value) }))} step="0.1"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
              <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold">الشراشف (م)</label>
                <input type="number" value={prices.sharshef} onChange={(e) => setPrices((f) => ({ ...f, sharshef: Number(e.target.value) }))} step="0.5"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
              <div className="col-span-2 space-y-1"><label className="text-[10px] text-slate-400 font-bold">نثريات</label>
                <input type="number" value={prices.nathrayat} onChange={(e) => setPrices((f) => ({ ...f, nathrayat: Number(e.target.value) }))} step="10"
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" /></div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl" dir="rtl">
          <div className="text-center pb-3 border-b-2 border-slate-200">
            <h2 className="text-lg font-black">كشف المواد</h2>
            <p className="text-[10px] text-slate-500 font-bold">تقدير كميات الورشة</p>
          </div>

          <div className="space-y-3 py-3 text-sm font-semibold">
            <div className="flex justify-between bg-slate-100 p-2.5 rounded-xl">
              <span>المساحة الأرضية:</span>
              <span className="font-extrabold">{result.flatArea.toFixed(2)} م²</span>
            </div>
            <div className="flex justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <span>المساحة مع الميل ({input.slope}%):</span>
              <span className="font-extrabold">{result.actualArea.toFixed(2)} م²</span>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-[10px] font-black text-slate-400 mb-2">هيكل الحديد</h4>
              <div className="flex justify-between py-1"><span>حديد 4×8:</span><span className="font-bold">{result.iron4x8} تيوب</span></div>
              <div className="flex justify-between py-1"><span>حديد 10×10:</span><span className="font-bold">{result.iron10x10.total} تيوب</span></div>
              <p className="text-[10px] text-slate-400 text-left">{result.iron10x10.facades} واجهات / {result.iron10x10.legs} أرجل / {result.iron10x10.crossbars} قواطع</p>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-[10px] font-black text-slate-400 mb-2">الأخشاب والتشطيب</h4>
              <div className="flex justify-between py-1">
                <span>ديكور:</span>
                <span className="font-bold">{input.withDecor ? `${result.decor.bundles} ربطة` : "بدون"}</span>
              </div>
              {input.withDecor && (
                <p className="text-[10px] text-brand-700 font-bold text-left">لوح {result.decor.optimalLen}م (هدر: {result.decor.wasteCm}سم)</p>
              )}
              <div className="flex justify-between py-1">
                <span>البيش:</span>
                <span className="font-bold">{result.beshQty.toFixed(1)} وحدة</span>
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
                <div className="text-[10px] text-slate-400 mt-1">المجموع: {result.borders.total.toFixed(1)} م</div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-[10px] font-black text-slate-400 mb-2">الحماية والكسوة</h4>
              <div className="flex justify-between bg-amber-50 p-2 rounded-xl mb-2">
                <span>مشمع:</span>
                <span className="font-bold">{result.tarpaulin.text}</span>
              </div>
              {result.insulation && (
                <div className="bg-emerald-50 p-2 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between"><span>زفتة:</span><span>{result.insulation.zaftaRolls} رول</span></div>
                  <div className="flex justify-between"><span>لاتي:</span><span>{result.insulation.latiSheets} لوح</span></div>
                  <div className="flex justify-between"><span>مساطير:</span><span>{result.insulation.zaftaRulers} م</span></div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="block text-[9px] text-slate-400 font-bold">القرميد</span>
                <span className="block text-lg font-black text-brand-400">{result.totalTiles} حبة</span>
              </div>
              <span className="text-[10px] text-slate-300 text-left max-w-[50%]">{tile.name}</span>
            </div>
          </div>

          {costResult && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <h4 className="text-[10px] font-black text-emerald-800 mb-2">التقرير المالي</h4>
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
          const text = `📋 *كشف مواد تقديري*\n`;
          const msg = text +
            `المساحة: ${result.actualArea.toFixed(2)} م²\n` +
            `حديد 4×8: ${result.iron4x8} تيوب\n` +
            `حديد 10×10: ${result.iron10x10.total} تيوب\n` +
            `قرميد: ${result.totalTiles} حبة (${tile.name})\n` +
            `مشمع: ${result.tarpaulin.text}\n` +
            (costResult ? `💰 التكلفة: ${costResult.totalWithNathrayat.toFixed(1)} د.أ` : "");
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
        }}
          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2">
          <i className="fa-brands fa-whatsapp text-xl"></i> إرسال واتساب
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => downloadMaterialList(result, tile, { client: { name: "ورشة حالية" } })}
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
  );
}
