const PRESETS = [
  { label: "🚗 كراج", length: 5, width: 4, slope: 20, numFacades: 2, withDecor: false, enableInsulation: false, tileIndex: 0 },
  { label: "📦 مستودع", length: 10, width: 6, slope: 15, numFacades: 2, withDecor: false, enableInsulation: false, tileIndex: 0 },
  { label: "🏡 استراحة", length: 8, width: 5, slope: 25, numFacades: 3, withDecor: true, enableInsulation: true, tileIndex: 0 },
  { label: "🕌 مجلس", length: 6, width: 5, slope: 30, numFacades: 3, withDecor: true, enableInsulation: true, tileIndex: 0 },
  { label: "🌳 مظلة", length: 4, width: 3, slope: 10, numFacades: 2, withDecor: false, enableInsulation: false, tileIndex: 0 },
];

export default function RoofPresets({ onSelect, current }) {
  const isMatch = (p) =>
    p.length === current.length && p.width === current.width &&
    p.slope === current.slope && p.numFacades === current.numFacades &&
    p.withDecor === current.withDecor && p.enableInsulation === current.enableInsulation;

  return (
    <div>
      <p className="text-[11px] font-bold text-ink-muted mb-2 flex items-center gap-1">
        <i className="fa-solid fa-bolt text-amber-500"></i> قوالب سريعة
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => onSelect(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isMatch(p)
                ? "bg-amber-100 border-amber-400 text-amber-800"
                : "bg-surface border-line text-ink-muted hover:border-amber-300 hover:text-ink"
            }`}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}