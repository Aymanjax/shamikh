import { useRef } from "react";

let _nextId = 2;
const nextId = () => _nextId++;

// SVG صغير يُظهر الواجهات المُظللة حسب العدد
function ZoneMiniVisual({ length, width, numFacades }) {
  const W = 80, H = 56;
  const pad = 6;
  const rw = W - pad * 2, rh = H - pad * 2;
  const rx = pad, ry = pad;
  const active = "#f59e0b", inactive = "#e5e7eb";

  // sides: top, right, bottom, left
  const sides = [
    { x1: rx, y1: ry, x2: rx + rw, y2: ry },           // top
    { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh }, // right
    { x1: rx + rw, y1: ry + rh, x2: rx, y2: ry + rh }, // bottom
    { x1: rx, y1: ry + rh, x2: rx, y2: ry },            // left
  ];
  // 2=أمامي+خلفي, 3=3 أضلاع, 4=كل الأضلاع
  const activeMap = {
    2: [true, false, true, false],
    3: [true, true, true, false],
    4: [true, true, true, true],
  }[numFacades] || [true, false, true, false];

  const aspect = length / Math.max(width, 0.1);
  const drawW = Math.min(rw, rh * aspect);
  const drawH = drawW / aspect;
  const ox = rx + (rw - drawW) / 2;
  const oy = ry + (rh - drawH) / 2;

  const drawSides = [
    { x1: ox, y1: oy, x2: ox + drawW, y2: oy },
    { x1: ox + drawW, y1: oy, x2: ox + drawW, y2: oy + drawH },
    { x1: ox + drawW, y1: oy + drawH, x2: ox, y2: oy + drawH },
    { x1: ox, y1: oy + drawH, x2: ox, y2: oy },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <rect x={ox} y={oy} width={drawW} height={drawH} fill="#fffbeb" rx="2" />
      {drawSides.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={activeMap[i] ? active : inactive} strokeWidth={activeMap[i] ? 2.5 : 1.5} strokeLinecap="round" />
      ))}
    </svg>
  );
}

function ZoneCard({ zone, onChange, onRemove, canRemove }) {
  const upd = (field, val) => onChange({ ...zone, [field]: val });

  return (
    <div className="bg-surface border border-line rounded-2xl p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <input
          value={zone.name}
          onChange={(e) => upd("name", e.target.value)}
          placeholder="اسم القسم..."
          className="flex-1 bg-surface-input border border-line rounded-xl py-1.5 px-2.5 text-sm font-bold text-ink outline-none focus:border-amber-500 transition"
        />
        {canRemove && (
          <button onClick={onRemove}
            className="text-red-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition">
            <i className="fa-solid fa-trash-can text-xs"></i>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Mini visual */}
        <div className="shrink-0">
          <ZoneMiniVisual length={zone.length} width={zone.width} numFacades={zone.numFacades} />
        </div>

        {/* Inputs */}
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-ink-muted font-bold block">الطول (م)</label>
              <input type="number" value={zone.length} min="0.5" step="0.5"
                onChange={(e) => upd("length", Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-surface-input border border-line rounded-xl py-2 px-2.5 text-sm text-ink outline-none focus:border-amber-500 transition text-center font-bold" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-ink-muted font-bold block">العرض (م)</label>
              <input type="number" value={zone.width} min="0.5" step="0.5"
                onChange={(e) => upd("width", Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-surface-input border border-line rounded-xl py-2 px-2.5 text-sm text-ink outline-none focus:border-amber-500 transition text-center font-bold" />
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[10px] text-ink-muted font-bold block">الواجهات</label>
            <div className="flex gap-1">
              {[2, 3, 4].map((n) => (
                <button key={n} onClick={() => upd("numFacades", n)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                    zone.numFacades === n
                      ? "bg-amber-100 border-amber-400 text-amber-800"
                      : "bg-surface border-line text-ink-muted hover:border-amber-300"
                  }`}>
                  {n === 2 ? "وجهين" : n === 3 ? "٣ أوجه" : "٤ أوجه"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Area label */}
      <p className="text-[10px] text-ink-muted text-left" dir="ltr">
        {zone.length} × {zone.width} = <strong className="text-ink">{(zone.length * zone.width).toFixed(1)} م²</strong>
      </p>
    </div>
  );
}

export default function ZoneEditor({ zones, onChange }) {
  const totalArea = zones.reduce((s, z) => s + z.length * z.width, 0);

  const addZone = () => {
    onChange([
      ...zones,
      { id: nextId(), name: "قسم جديد", length: 3, width: 3, numFacades: 2 },
    ]);
  };

  const updateZone = (id, updated) =>
    onChange(zones.map((z) => (z.id === id ? updated : z)));

  const removeZone = (id) =>
    onChange(zones.filter((z) => z.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-ink-muted flex items-center gap-1">
          <i className="fa-solid fa-layer-group text-amber-500"></i>
          أقسام المبنى
        </p>
        <span className="text-[10px] text-ink-muted">
          المساحة الكلية: <strong className="text-ink">{totalArea.toFixed(1)} م²</strong>
        </span>
      </div>

      {zones.map((z) => (
        <ZoneCard
          key={z.id}
          zone={z}
          onChange={(updated) => updateZone(z.id, updated)}
          onRemove={() => removeZone(z.id)}
          canRemove={zones.length > 1}
        />
      ))}

      <button onClick={addZone}
        className="w-full border border-dashed border-amber-300 rounded-2xl py-3 text-xs font-bold text-amber-600 hover:bg-amber-50 transition flex items-center justify-center gap-2">
        <i className="fa-solid fa-plus"></i>
        إضافة قسم (غرفة جانبية / ملحق...)
      </button>
    </div>
  );
}
