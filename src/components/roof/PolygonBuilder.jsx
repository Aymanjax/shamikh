import { useMemo, useRef, useEffect, useState } from "react";

const DIR_VEC = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };

const DIR_LABELS = { right: "يمين ←", left: "يسار →", up: "أعلى ↑", down: "أسفل ↓" };

const ARROW_SVG = {
  up:    "M0,-8 L5,2 L-5,2 Z",
  down:  "M0,8 L5,-2 L-5,-2 Z",
  right: "M8,0 L-2,5 L-2,-5 Z",
  left:  "M-8,0 L2,5 L2,-5 Z",
};

let _nextId = 100;
const nextId = () => _nextId++;

export function getNodes(segs) {
  let x = 0, y = 0;
  const nodes = [{ x, y }];
  for (const s of segs) {
    const [dx, dy] = DIR_VEC[s.dir];
    x += dx * s.length;
    y += dy * s.length;
    nodes.push({ x, y });
  }
  return nodes;
}

export function shoelaceArea(nodes) {
  let area = 0;
  const n = nodes.length;
  for (let i = 0; i < n - 1; i++)
    area += nodes[i].x * nodes[i + 1].y - nodes[i + 1].x * nodes[i].y;
  return Math.abs(area) / 2;
}

function fitViewport(nodes, W, H, pad = 60) {
  if (nodes.length < 2) {
    return { sx: () => W / 2, sy: () => H / 2, scale: 1 };
  }
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const mnX = Math.min(...xs), mxX = Math.max(...xs);
  const mnY = Math.min(...ys), mxY = Math.max(...ys);
  const rX = Math.max(mxX - mnX, 0.1), rY = Math.max(mxY - mnY, 0.1);
  const scale = Math.min((W - pad * 2) / rX, (H - pad * 2) / rY, 60);
  const ox = pad + (W - pad * 2 - rX * scale) / 2;
  const oy = pad + (H - pad * 2 - rY * scale) / 2;
  return {
    sx: (x) => ox + (x - mnX) * scale,
    sy: (y) => oy + (y - mnY) * scale,
    scale,
  };
}

const ARROW_OFFSET = 42; // SVG px from last node to arrow center

export default function PolygonBuilder({ segments, onChange }) {
  const [addingDir, setAddingDir] = useState(null);
  const [inputVal, setInputVal] = useState("5");
  const inputRef = useRef(null);

  useEffect(() => {
    if (addingDir && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [addingDir]);

  const nodes = useMemo(() => getNodes(segments), [segments]);

  const SVG_W = 400, SVG_H = 260;
  const { sx, sy } = useMemo(() => fitViewport(nodes, SVG_W, SVG_H), [nodes]);

  const lastNode = nodes[nodes.length - 1];
  const lx = sx(lastNode.x), ly = sy(lastNode.y);

  const pathD = useMemo(() => {
    if (nodes.length < 2) return "";
    const pts = nodes.map((n) => `${sx(n.x)},${sy(n.y)}`);
    return `M ${pts.join(" L ")} Z`;
  }, [nodes, sx, sy]);

  const isClosed = nodes.length > 2 &&
    Math.abs(lastNode.x - nodes[0].x) < 0.01 &&
    Math.abs(lastNode.y - nodes[0].y) < 0.01;

  const toggleFacade = (idx) => {
    onChange(segments.map((s, i) => i === idx ? { ...s, hasFacade: !s.hasFacade } : s));
  };

  const undoLast = () => {
    if (segments.length > 1) onChange(segments.slice(0, -1));
    setAddingDir(null);
  };

  const confirmAdd = () => {
    const len = parseFloat(inputVal);
    if (!len || len <= 0) return;
    onChange([...segments, { id: nextId(), dir: addingDir, length: len, hasFacade: true }]);
    setAddingDir(null);
  };

  const arrowPositions = {
    up:    { ax: lx, ay: ly - ARROW_OFFSET },
    down:  { ax: lx, ay: ly + ARROW_OFFSET },
    right: { ax: lx + ARROW_OFFSET, ay: ly },
    left:  { ax: lx - ARROW_OFFSET, ay: ly },
  };

  return (
    <div className="relative bg-surface-subtle rounded-2xl overflow-hidden border border-line">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {segments.length > 1 && (
          <button onClick={undoLast}
            className="bg-surface border border-line rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-ink-muted hover:text-red-500 hover:border-red-300 transition flex items-center gap-1">
            <i className="fa-solid fa-rotate-left text-[10px]"></i> تراجع
          </button>
        )}
        {isClosed && (
          <span className="bg-emerald-50 border border-emerald-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <i className="fa-solid fa-circle-check text-[10px]"></i> مغلق
          </span>
        )}
      </div>

      {/* SVG canvas */}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto touch-none select-none"
        style={{ minHeight: 200 }} xmlns="http://www.w3.org/2000/svg">

        {/* Polygon fill */}
        {pathD && (
          <path d={pathD} fill="#fffbeb" stroke="none" opacity="0.8" />
        )}

        {/* Segment lines + toggle facade on tap */}
        {segments.map((seg, i) => {
          const from = nodes[i], to = nodes[i + 1];
          const x1 = sx(from.x), y1 = sy(from.y);
          const x2 = sx(to.x), y2 = sy(to.y);
          const clr = seg.hasFacade ? "#d97706" : "#9ca3af";
          const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
          return (
            <g key={seg.id} onClick={() => !addingDir && toggleFacade(i)} className="cursor-pointer">
              {/* Touch target */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="24" />
              {/* Visible line */}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={clr} strokeWidth={seg.hasFacade ? 2.5 : 1.5} strokeLinecap="round" />
              {/* Length label */}
              <rect x={midX - 14} y={midY - 8} width="28" height="14" rx="4"
                fill="white" stroke={clr} strokeWidth="0.5" opacity="0.9" />
              <text x={midX} y={midY} textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="bold" fill={clr}>
                {seg.length}م
              </text>
            </g>
          );
        })}

        {/* Intermediate nodes (corners) */}
        {nodes.slice(1, -1).map((node, i) => (
          <circle key={i} cx={sx(node.x)} cy={sy(node.y)} r="4"
            fill="white" stroke="#d97706" strokeWidth="1.5" />
        ))}

        {/* First node */}
        <circle cx={sx(nodes[0].x)} cy={sy(nodes[0].y)} r="5"
          fill={isClosed ? "#10b981" : "#fef3c7"}
          stroke={isClosed ? "#059669" : "#d97706"} strokeWidth="1.5" />

        {/* Last node (active — center of arrows) */}
        {!isClosed && (
          <>
            <circle cx={lx} cy={ly} r="10" fill="#d97706" opacity="0.15" />
            <circle cx={lx} cy={ly} r="5.5" fill="#d97706" />
          </>
        )}

        {/* Directional arrows (shown when not inputting) */}
        {!addingDir && !isClosed && Object.entries(arrowPositions).map(([dir, { ax, ay }]) => (
          <g key={dir} onClick={() => { setAddingDir(dir); setInputVal("5"); }} className="cursor-pointer">
            {/* Large touch target */}
            <circle cx={ax} cy={ay} r="22" fill="transparent" />
            {/* Background circle */}
            <circle cx={ax} cy={ay} r="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Arrow shape */}
            <path d={ARROW_SVG[dir]} transform={`translate(${ax},${ay})`}
              fill="#d97706" />
          </g>
        ))}

        {/* Dotted line connecting last to first (close hint) */}
        {!isClosed && nodes.length >= 3 && (
          <line
            x1={lx} y1={ly}
            x2={sx(nodes[0].x)} y2={sy(nodes[0].y)}
            stroke="#d1d5db" strokeWidth="1" strokeDasharray="3 3" />
        )}
      </svg>

      {/* Bottom: length input overlay */}
      {addingDir && (
        <div className="bg-surface border-t border-amber-200 p-3 flex items-center gap-2">
          <span className="text-xs font-bold text-ink-muted whitespace-nowrap">
            {DIR_LABELS[addingDir]}
          </span>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
            className="flex-1 text-center text-lg font-black bg-surface-input border border-amber-300 rounded-xl py-2 outline-none focus:border-amber-500"
          />
          <span className="text-sm font-bold text-ink-muted">م</span>
          <button onClick={confirmAdd}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl px-4 py-2 transition text-sm">
            ✓
          </button>
          <button onClick={() => setAddingDir(null)}
            className="text-ink-muted hover:text-ink px-2 py-2 text-lg">
            ✕
          </button>
        </div>
      )}

      {/* Legend */}
      {!addingDir && (
        <div className="px-3 pb-2 flex items-center justify-between text-[10px] text-ink-muted">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 rounded bg-amber-500 inline-block"></span>واجهة
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 rounded bg-gray-400 inline-block"></span>بدون
            </span>
          </span>
          <span>اضغط الأسهم للتمديد · اضغط الخط لتبديل الواجهة</span>
        </div>
      )}
    </div>
  );
}
