const PRESETS = [
  {
    label: "🚗 كراج",
    description: "مستطيل ٥×٤",
    sides: [
      { length: 5, hasFacade: true },
      { length: 4, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 4, hasFacade: true },
    ],
    area: { length: 5, width: 4 },
    slope: 20,
  },
  {
    label: "📦 مستودع",
    description: "مستطيل كبير ١٠×٦",
    sides: [
      { length: 10, hasFacade: true },
      { length: 6, hasFacade: true },
      { length: 10, hasFacade: true },
      { length: 6, hasFacade: true },
    ],
    area: { length: 10, width: 6 },
    slope: 15,
  },
  {
    label: "🏡 منزل L",
    description: "ثمانية أضلاع مع زاوية",
    sides: [
      { length: 8, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 4, hasFacade: true },
      { length: 3, hasFacade: false },
      { length: 4, hasFacade: true },
      { length: 5, hasFacade: true },
    ],
    area: { length: 8, width: 5 },
    slope: 25, withDecor: true,
  },
  {
    label: "🏛️ مجلس",
    description: "مستطيل ٧×٥ بثلاث واجهات",
    sides: [
      { length: 7, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 7, hasFacade: true },
      { length: 5, hasFacade: true },
    ],
    area: { length: 7, width: 5 },
    slope: 30, withDecor: true, enableInsulation: true,
    numFacades: 3,
  },
  {
    label: "🔲 شكل T",
    description: "ثلاثة أقسام شكل T",
    sides: [
      { length: 8, hasFacade: true },
      { length: 4, hasFacade: true },
      { length: 4, hasFacade: true },
      { length: 4, hasFacade: false },
      { length: 4, hasFacade: true },
      { length: 4, hasFacade: true },
      { length: 4, hasFacade: false },
      { length: 4, hasFacade: true },
    ],
    area: { length: 8, width: 4 },
    slope: 20,
  },
  {
    label: "🔳 شكل U",
    description: "ثلاثة أقسام شكل U",
    sides: [
      { length: 6, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 3, hasFacade: false },
      { length: 2, hasFacade: false },
      { length: 3, hasFacade: false },
      { length: 5, hasFacade: true },
      { length: 6, hasFacade: true },
      { length: 5, hasFacade: true },
    ],
    area: { length: 6, width: 5 },
    slope: 20,
  },
  {
    label: "🏠 فيلا",
    description: "فيلا كبيرة مع كراج ١٠×٨",
    sides: [
      { length: 10, hasFacade: true },
      { length: 8, hasFacade: true },
      { length: 10, hasFacade: true },
      { length: 3, hasFacade: false },
      { length: 3, hasFacade: true },
      { length: 5, hasFacade: true },
    ],
    area: { length: 10, width: 8 },
    slope: 20, withDecor: true, enableInsulation: true,
  },
  {
    label: "🏘️ استراحة",
    description: "استراحة ٦×٥ مع ملحق",
    sides: [
      { length: 6, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 3, hasFacade: true },
      { length: 3, hasFacade: false },
      { length: 3, hasFacade: true },
      { length: 5, hasFacade: true },
    ],
    area: { length: 6, width: 5 },
    slope: 25, withDecor: true, enableInsulation: true,
  },
  {
    label: "🧩 بروز سلم",
    description: "سقف ٧×٥ مع بروز سلم ٢×١.٥",
    sides: [
      { length: 7, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 2, hasFacade: true },
      { length: 1.5, hasFacade: false },
      { length: 2, hasFacade: true },
      { length: 5, hasFacade: true },
      { length: 7, hasFacade: true },
      { length: 5, hasFacade: true },
    ],
    area: { length: 7, width: 5 },
    slope: 20,
  },
];

export default function RoofPresets({ onSelect, current }) {
  const isMatch = (p) => {
    if (p.sides.length !== current.sides?.length) return false;
    return p.sides.every((s, i) => {
      const c = current.sides[i];
      return c && Math.abs(s.length - c.length) < 0.01 && s.hasFacade === c.hasFacade;
    });
  };

  return (
    <div>
      <p className="text-[11px] font-bold text-ink-muted mb-2 flex items-center gap-1">
        <i className="fa-solid fa-bolt text-amber-500"></i> قوالب سريعة
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => onSelect(p)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
              isMatch(p)
                ? "bg-amber-100 border-amber-400 text-amber-800"
                : "bg-surface border-line text-ink-muted hover:border-amber-300 hover:text-ink"
            }`}
            title={p.description}>
            {p.label} <span className="text-[8px] opacity-60">({p.sides.length} أضلاع)</span>
          </button>
        ))}
      </div>
    </div>
  );
}