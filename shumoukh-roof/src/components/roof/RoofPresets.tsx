// @ts-nocheck
import { useState } from "react";
import { useT } from "../../i18n";

const CATEGORIES = [
  {
    name: "كراجات ومستودعات",
    items: [
      { label: "🚗 كراج ٣×٢", desc: "مستطيل ٣×٢", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 0 }] },
      { label: "🚗 كراج ٤×٣", desc: "مستطيل ٤×٣", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }, { x: 0, y: 0 }] },
      { label: "🚘 كراج ٥×٤", desc: "مستطيل ٥×٤", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "🚘 كراج ٦×٤", desc: "مستطيل ٦×٤", slope: 18, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "📦 مستودع ٦×٥", desc: "مستطيل ٦×٥", slope: 15, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "📦 مستودع ٨×٥", desc: "مستطيل ٨×٥", slope: 15, vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "🏭 مستودع ١٠×٦", desc: "مستطيل ١٠×٦", slope: 12, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "🏭 مخزن ١٢×٦", desc: "مستطيل ١٢×٦", slope: 12, vertices: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "🏗️ صالة ١٠×٨", desc: "مستطيل كبير ١٠×٨", slope: 15, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 8 }, { x: 0, y: 8 }, { x: 0, y: 0 }] },
      { label: "🏗️ عنبر ١٥×٨", desc: "مستطيل كبير ١٥×٨", slope: 12, vertices: [{ x: 0, y: 0 }, { x: 15, y: 0 }, { x: 15, y: 8 }, { x: 0, y: 8 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "مجالس واستراحات",
    items: [
      { label: "🛋️ مجلس ٥×٤", desc: "مجلس مع عزل ٥×٤", slope: 25, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "🛋️ مجلس ٦×٤", desc: "مجلس مع عزل ٦×٤", slope: 25, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "🛋️ مجلس ٧×٥", desc: "مجلس كبير ٧×٥", slope: 30, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "🏡 استراحة ٨×٦", desc: "استراحة مع عزل ٨×٦", slope: 25, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "🏰 قصر ١٠×٨", desc: "قصر فاخر ١٠×٨", slope: 30, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 8 }, { x: 0, y: 8 }, { x: 0, y: 0 }] },
      { label: "🏛️ قاعة ١٢×٦", desc: "قاعة احتفالات ١٢×٦", slope: 22, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "أشكال L",
    items: [
      { label: "L-1", desc: "L صغير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "L-2", desc: "L متوسط", slope: 22, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "L-3", desc: "L كبير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "L-4", desc: "L طويل", slope: 15, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "L-5", desc: "L عريض", slope: 18, vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "L-6", desc: "L ممتد", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "L-7", desc: "L معكوس", slope: 22, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "L-8", desc: "L مزدوج", slope: 25, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 5 }, { x: 10, y: 5 }, { x: 10, y: 7 }, { x: 0, y: 7 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "أشكال T",
    items: [
      { label: "T-1", desc: "T صغير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 4 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "T-2", desc: "T متوسط", slope: 22, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "T-3", desc: "T كبير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 9, y: 3 }, { x: 9, y: 0 }, { x: 13, y: 0 }, { x: 13, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "T-4", desc: "T عريض", slope: 18, vertices: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 10, y: 2 }, { x: 10, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "T-5", desc: "T طويل", slope: 15, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 7 }, { x: 0, y: 7 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "أشكال U",
    items: [
      { label: "U-1", desc: "U صغير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "U-2", desc: "U متوسط", slope: 22, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }, { x: 7, y: 4 }, { x: 7, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 7 }, { x: 0, y: 7 }, { x: 0, y: 0 }] },
      { label: "U-3", desc: "U كبير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 5 }, { x: 9, y: 5 }, { x: 9, y: 0 }, { x: 13, y: 0 }, { x: 13, y: 8 }, { x: 0, y: 8 }, { x: 0, y: 0 }] },
      { label: "U-4", desc: "U عريض", slope: 18, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 9, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "U-5", desc: "U طويل", slope: 15, vertices: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 9 }, { x: 0, y: 9 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "أشكال Z",
    items: [
      { label: "Z-1", desc: "Z صغير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1.5 }, { x: 1.5, y: 1.5 }, { x: 1.5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 5.5 }, { x: 0, y: 5.5 }, { x: 0, y: 0 }] },
      { label: "Z-2", desc: "Z متوسط", slope: 22, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 5 }, { x: 7, y: 5 }, { x: 7, y: 7 }, { x: 0, y: 7 }, { x: 0, y: 0 }] },
      { label: "Z-3", desc: "Z كبير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 2.5 }, { x: 3, y: 2.5 }, { x: 3, y: 6 }, { x: 10, y: 6 }, { x: 10, y: 8.5 }, { x: 0, y: 8.5 }, { x: 0, y: 0 }] },
      { label: "Z-4", desc: "Z عريض", slope: 18, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 8 }, { x: 0, y: 8 }, { x: 0, y: 0 }] },
      { label: "Z-5", desc: "Z معكوس", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 5 }, { x: 7, y: 5 }, { x: 7, y: 3 }, { x: 9, y: 3 }, { x: 9, y: 7 }, { x: 0, y: 7 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "متعددة الأضلاع",
    items: [
      { label: "⬠ ٥-١", desc: "خماسي صغير", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 2.5 }, { x: 3, y: 4.5 }, { x: 0, y: 4.5 }, { x: 0, y: 0 }] },
      { label: "⬠ ٥-٢", desc: "خماسي كبير", slope: 22, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 3 }, { x: 5, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "⬡ ٦-١", desc: "سداسي", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "⬡ ٧-١", desc: "سباعي", slope: 18, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
      { label: "⬡ ٨-١", desc: "ثماني", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 0 }, { x: 11, y: 0 }, { x: 11, y: 6 }, { x: 2, y: 6 }, { x: 0, y: 4 }, { x: 0, y: 0 }] },
      { label: "⬢ ٩-١", desc: "تساعي", slope: 25, withDecor: true, enableInsulation: true, vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 0 }, { x: 11, y: 0 }, { x: 11, y: 7 }, { x: 2, y: 7 }, { x: 0, y: 5 }, { x: 0, y: 0 }] },
    ],
  },
  {
    name: "أشكال خاصة",
    items: [
      { label: "🔺 مثلث", desc: "مثلث ٦×٥", slope: 25, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 3, y: 5 }, { x: 0, y: 0 }] },
      { label: "⏢ شبه منحرف", desc: "شبه منحرف ٨×٥", slope: 22, vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 6, y: 5 }, { x: 2, y: 5 }, { x: 0, y: 0 }] },
      { label: "H-1", desc: "شكل H", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "C-1", desc: "شكل C", slope: 18, withDecor: true, vertices: [{ x: 0, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 4 }, { x: 7, y: 4 }, { x: 7, y: 6 }, { x: 0, y: 6 }, { x: 0, y: 0 }] },
      { label: "E-1", desc: "شكل E", slope: 20, vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 1.5 }, { x: 2, y: 1.5 }, { x: 2, y: 3 }, { x: 6, y: 3 }, { x: 6, y: 4.5 }, { x: 2, y: 4.5 }, { x: 2, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 7.5 }, { x: 0, y: 7.5 }, { x: 0, y: 0 }] },
    ],
  },
];

// مولّدات الأشكال البارامترية — كل القيم بالمتر، y للأسفل
const snap05 = (v) => Math.round(v * 2) / 2;

function buildL({ A, B, a, b }) {
  if (!(a < A && b < B)) return null;
  return [
    { x: 0, y: 0 }, { x: A - a, y: 0 }, { x: A - a, y: b }, { x: A, y: b },
    { x: A, y: B }, { x: 0, y: B }, { x: 0, y: 0 },
  ];
}

function buildU({ arm, open, H, h }) {
  if (!(h < H)) return null;
  const W = 2 * arm + open;
  return [
    { x: 0, y: 0 }, { x: arm, y: 0 }, { x: arm, y: h }, { x: arm + open, y: h },
    { x: arm + open, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }, { x: 0, y: 0 },
  ];
}

function buildT({ W, hh, w, d }) {
  if (!(w < W)) return null;
  const o = snap05((W - w) / 2);
  return [
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: hh }, { x: o + w, y: hh },
    { x: o + w, y: hh + d }, { x: o, y: hh + d }, { x: o, y: hh }, { x: 0, y: hh }, { x: 0, y: 0 },
  ];
}

const SHAPE_DEFS = {
  L: {
    fields: [
      { k: "A", labelKey: "calculator.presets.totalLen", def: 10 },
      { k: "B", labelKey: "calculator.presets.totalWid", def: 8 },
      { k: "a", labelKey: "calculator.presets.cutLen", def: 4 },
      { k: "b", labelKey: "calculator.presets.cutWid", def: 3 },
    ],
    build: buildL,
    icon: "⌐",
  },
  U: {
    fields: [
      { k: "arm", labelKey: "calculator.presets.armWid", def: 3 },
      { k: "open", labelKey: "calculator.presets.openWid", def: 4 },
      { k: "H", labelKey: "calculator.presets.totalWid", def: 8 },
      { k: "h", labelKey: "calculator.presets.openDep", def: 4 },
    ],
    build: buildU,
    icon: "⊔",
  },
  T: {
    fields: [
      { k: "W", labelKey: "calculator.presets.headWid", def: 10 },
      { k: "hh", labelKey: "calculator.presets.headThk", def: 4 },
      { k: "w", labelKey: "calculator.presets.stemWid", def: 4 },
      { k: "d", labelKey: "calculator.presets.stemLen", def: 4 },
    ],
    build: buildT,
    icon: "⊤",
  },
};

export default function RoofPresets({ onSelect }) {
  const t = useT();
  const [shape, setShape] = useState(null);
  const [dims, setDims] = useState({});
  const [shapeError, setShapeError] = useState(false);

  const pickShape = (key) => {
    if (shape === key) { setShape(null); return; }
    const init = {};
    SHAPE_DEFS[key].fields.forEach((f) => { init[f.k] = f.def; });
    setDims(init);
    setShape(key);
    setShapeError(false);
  };

  const applyShape = () => {
    const def = SHAPE_DEFS[shape];
    const clean = {};
    for (const f of def.fields) {
      const v = snap05(Number(dims[f.k]) || 0);
      if (!(v >= 0.5)) { setShapeError(true); return; }
      clean[f.k] = v;
    }
    const vertices = def.build(clean);
    if (!vertices) { setShapeError(true); return; }
    setShapeError(false);
    onSelect({ label: t(`calculator.presets.shape${shape}`), desc: t(`calculator.presets.shape${shape}`), slope: 20, vertices });
  };

  const handleRandom = () => {
    const all = CATEGORIES.flatMap((c) => c.items);
    const pick = all[Math.floor(Math.random() * all.length)];
    onSelect(pick);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-ink-muted flex items-center gap-1">
          <i className="fa-solid fa-bolt text-amber-500"></i> قوالب سريعة
        </p>
        <button onClick={handleRandom}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
          <i className="fa-solid fa-shuffle"></i> عشوائي
        </button>
      </div>
      {/* أشكال بارامترية: اختر L/U/T واكتب الأبعاد */}
      <div className="mb-3">
        <p className="text-[9px] font-bold text-ink-muted/60 mb-1.5 mr-0.5">{t("calculator.presets.shapes")}</p>
        <div className="flex gap-1.5 flex-wrap">
          {Object.keys(SHAPE_DEFS).map((key) => (
            <button key={key} onClick={() => pickShape(key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                shape === key ? "bg-amber-500/20 border-amber-400 text-amber-700" : "bg-surface border-line text-ink-muted hover:border-amber-300 hover:text-ink"}`}>
              <span className="font-mono ml-1">{SHAPE_DEFS[key].icon}</span> {t(`calculator.presets.shape${key}`)}
            </button>
          ))}
        </div>
        {shape && (
          <div className="mt-2 p-2.5 rounded-xl border border-amber-300/40 bg-amber-50/50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {SHAPE_DEFS[shape].fields.map((f) => (
                <label key={f.k} className="flex items-center gap-1.5 text-[9px] text-ink-muted">
                  <span className="flex-1">{t(f.labelKey)}</span>
                  <input type="number" min="0.5" step="0.5" value={dims[f.k] ?? ""}
                    onChange={(e) => setDims((d) => ({ ...d, [f.k]: e.target.value }))}
                    className="w-14 bg-white border border-line rounded-lg py-1 px-1.5 text-center text-[10px] text-ink-primary outline-none focus:border-amber-400" />
                  <span>م</span>
                </label>
              ))}
            </div>
            {shapeError && <p className="text-[9px] text-red-500 font-bold">{t("calculator.presets.invalidDims")}</p>}
            <button onClick={applyShape}
              className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 transition">
              {t("calculator.presets.apply")}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="text-[9px] font-bold text-ink-muted/60 mb-1.5 mr-0.5">{cat.name}</p>
            <div className="flex gap-1.5 flex-wrap">
              {cat.items.map((p) => (
                <button key={p.label} onClick={() => onSelect(p)}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition bg-surface border-line text-ink-muted hover:border-amber-300 hover:text-ink"
                  title={p.desc}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
