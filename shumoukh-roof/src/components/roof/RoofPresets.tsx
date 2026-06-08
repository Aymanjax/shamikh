// @ts-nocheck
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

export default function RoofPresets({ onSelect }) {
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
