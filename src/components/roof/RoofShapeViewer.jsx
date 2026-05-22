import { useMemo } from "react";

const W = 320, H = 220, OX = 40, OY = 40;

export default function RoofShapeViewer({ sides = [], onToggleFacade }) {
  const segments = useMemo(() => {
    if (!sides.length || sides.every((s) => s.length <= 0)) return [];
    const edges = [
      { sides: [], total: 0, pixels: W },
      { sides: [], total: 0, pixels: H },
      { sides: [], total: 0, pixels: W },
      { sides: [], total: 0, pixels: H },
    ];
    sides.forEach((side, i) => {
      const ei = i % 4;
      edges[ei].sides.push(i);
      edges[ei].total += Math.max(side.length, 0);
    });
    const result = [];
    for (let ei = 0; ei < 4; ei++) {
      const { sides: indices, total, pixels } = edges[ei];
      if (indices.length === 0 || total <= 0) continue;
      let pos = 0;
      const gap = 3;
      const avail = pixels - (indices.length - 1) * gap;
      if (avail <= 0) continue;
      for (const si of indices) {
        const side = sides[si];
        const segPx = (Math.max(side.length, 0) / total) * avail;
        const start = pos;
        const end = pos + segPx;
        pos = end + gap;
        let x1, y1, x2, y2;
        switch (ei) {
          case 0: x1 = OX + start; y1 = OY; x2 = OX + end; y2 = OY; break;
          case 1: x1 = OX + W; y1 = OY + start; x2 = OX + W; y2 = OY + end; break;
          case 2: x1 = OX + W - start; y1 = OY + H; x2 = OX + W - end; y2 = OY + H; break;
          case 3: x1 = OX; y1 = OY + H - start; x2 = OX; y2 = OY + H - end; break;
        }
        result.push({
          ...side, index: si, edge: ei,
          x1, y1, x2, y2,
          midX: (x1 + x2) / 2, midY: (y1 + y2) / 2,
        });
      }
    }
    return result;
  }, [sides]);

  if (!sides.length) return null;

  const facadeC = sides.filter((s) => s.hasFacade).length;
  const totalLen = sides.reduce((s, side) => s + Math.max(side.length, 0), 0);

  return (
    <div className="bg-surface border border-line rounded-2xl p-3 sm:p-4">
      <svg viewBox="0 0 400 300" className="w-full h-auto select-none"
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fefce8" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <filter id="ss">
            <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#b45309" floodOpacity="0.12" />
          </filter>
          <pattern id="tg" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="#fcd34d" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>

        <rect x={OX} y={OY} width={W} height={H} rx="12" fill="url(#sg)" filter="url(#ss)" />
        <rect x={OX} y={OY} width={W} height={H} rx="12" fill="url(#tg)" />

        <rect x={OX} y={OY} width={W} height={H} rx="12"
          fill="none" stroke="#a8a29e" strokeWidth="0.75" strokeDasharray="4 3" opacity="0.3" />

        <text x={OX + W / 2} y={OY + H / 2 - 8}
          textAnchor="middle" fontSize="13" fontWeight="bold" fill="#92400e" opacity="0.5">
          السطح
        </text>
        <text x={OX + W / 2} y={OY + H / 2 + 12}
          textAnchor="middle" fontSize="10" fill="#b45309" opacity="0.45">
          {facadeC}/{sides.length} أوجه · {totalLen.toFixed(1)} م
        </text>

        {segments.map((seg) => {
          const isF = seg.hasFacade;
          let dx = 0, dy = 0, idy = 0;
          if (seg.edge === 0) { dy = -18; idy = -28; }
          else if (seg.edge === 1) { dx = 24; idy = 14; }
          else if (seg.edge === 2) { dy = 18; idy = 28; }
          else { dx = -24; idy = 14; }

          return (
            <g key={seg.index}
              onClick={() => onToggleFacade?.(seg.index)}
              className="group cursor-pointer">
              <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                stroke="transparent" strokeWidth="22" />
              <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                stroke={isF ? "#d97706" : "#a3a3a3"}
                strokeWidth={isF ? 5 : 2.5}
                strokeLinecap="round"
                className="transition-all group-hover:opacity-80" />
              <circle cx={seg.x1} cy={seg.y1} r={isF ? 3.5 : 1.5}
                fill={isF ? "#d97706" : "#a3a3a3"} />
              <circle cx={seg.x2} cy={seg.y2} r={isF ? 3.5 : 1.5}
                fill={isF ? "#d97706" : "#a3a3a3"} />
              <text x={seg.midX + dx} y={seg.midY + dy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight="bold"
                fill={isF ? "#92400e" : "#78716c"}>
                {seg.length}م
              </text>
              <text x={seg.midX + dx} y={seg.midY + idy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fill={isF ? "#d97706" : "#a3a3a3"}>
                {isF ? "●" : "○"}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between mt-2 text-[10px] text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="w-3 h-0.5 rounded bg-amber-600 inline-block"></span> واجهة
          <span className="w-3 h-0.5 rounded bg-gray-400 mr-2 inline-block"></span> بدون
        </span>
        <span className="font-bold">اضغط على الضلع لتبديل الواجهة</span>
      </div>
    </div>
  );
}