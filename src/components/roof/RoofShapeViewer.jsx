import { useMemo } from "react";

const VW = 400, VH = 280;
const RX = 60, RY = 50, RW = 280, RH = 180;

/*  Trace each side around the rectangle perimeter, splitting at corners  */

function distribute(sides) {
  const total = sides.reduce((s, side) => s + Math.max(side.length, 0), 0) || 1;
  const perim = 2 * (RW + RH);
  const gap = 3; // px gap between sides
  const rawSegs = [];
  let pos = 0;
  for (let i = 0; i < sides.length; i++) {
    const px = (Math.max(sides[i].length, 0) / total) * (perim - sides.length * gap);
    const s = pos; const e = pos + px;
    pos = e + gap;
    rawSegs.push({ i, side: sides[i], start: s, end: e });
  }

  // Split each raw segment at corners
  const corners = [
    { pos: RW, x: RX + RW, y: RY },
    { pos: RW + RH, x: RX + RW, y: RY + RH },
    { pos: 2 * RW + RH, x: RX, y: RY + RH },
    { pos: 2 * RW + 2 * RH, x: RX, y: RY },
  ];
  const totalP = 2 * (RW + RH);

  const segs = [];
  for (const rs of rawSegs) {
    const subSegs = [];
    let p = rs.start;
    const e = rs.end;
    while (p < e - 0.01) {
      const next = corners.find((c) => c.pos > p && c.pos <= e);
      if (next) {
        subSegs.push({ ...posToXY(p), x2: next.x, y2: next.y });
        p = next.pos;
      } else {
        subSegs.push({ ...posToXY(p), ...posToXY(e) });
        p = e;
      }
    }
    // Compute midpoint and label position from the average of sub-segments
    let ax = 0, ay = 0, count = 0;
    for (const ss of subSegs) { ax += (ss.x1 + ss.x2) / 2; ay += (ss.y1 + ss.y2) / 2; count++; }
    const mx = ax / count, my = ay / count;
    // Label offset outward from rectangle
    const topD = Math.abs(my - RY), botD = Math.abs(my - (RY + RH));
    const lftD = Math.abs(mx - RX), rgtD = Math.abs(mx - (RX + RW));
    const minD = Math.min(topD, botD, lftD, rgtD);
    let lx, ly;
    if (minD === topD) { lx = mx; ly = RY - 24; }
    else if (minD === botD) { lx = mx; ly = RY + RH + 24; }
    else if (minD === lftD) { lx = RX - 40; ly = my; }
    else { lx = RX + RW + 40; ly = my; }
    const tw = Math.max(rs.side.length.toString().length * 7 + 24, 36);
    segs.push({ ...rs.side, index: rs.i, subs: subSegs, mx, my, lx, ly, tw });
  }
  return segs;

  function posToXY(p) {
    let pp = ((p % totalP) + totalP) % totalP;
    if (pp <= RW) return { x1: RX + pp, y1: RY };
    if (pp <= RW + RH) return { x1: RX + RW, y1: RY + pp - RW };
    if (pp <= 2 * RW + RH) return { x1: RX + RW - (pp - RW - RH), y1: RY + RH };
    return { x1: RX, y1: RY + RH - (pp - 2 * RW - RH) };
  }
}

export default function RoofShapeViewer({ sides = [], onToggleFacade }) {
  const segs = useMemo(() => distribute(sides), [sides]);

  const total = sides.reduce((s, side) => s + Math.max(side.length, 0), 0);
  const fc = sides.filter((s) => s.hasFacade).length;

  if (!sides.length) return (
    <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-ink-muted">
      أضف أضلاعاً لرسم السقف
    </div>
  );

  return (
    <div className="bg-surface border border-line rounded-2xl p-3 sm:p-4">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none" xmlns="http://www.w3.org/2000/svg">
        {/* Roof rectangle */}
        <rect x={RX} y={RY} width={RW} height={RH} rx="6"
          fill="#fffbeb" stroke="#d6d3d1" strokeWidth="0.5"
          filter="url(#rs_sh)" />
        <rect x={RX} y={RY} width={RW} height={RH} rx="6"
          fill="none" stroke="#e7e5e4" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.6" />

        {/* Center label */}
        <text x={RX + RW / 2} y={RY + RH / 2 - 6}
          textAnchor="middle" fontSize="13" fontWeight="bold" fill="#d97706" opacity="0.3">
          سطح
        </text>
        <text x={RX + RW / 2} y={RY + RH / 2 + 12}
          textAnchor="middle" fontSize="10" fill="#b45309" opacity="0.3">
          {total.toFixed(1)}م · {fc}/{sides.length} أوجه
        </text>

        {/* Side segments */}
        {segs.map((seg) => {
          const f = seg.hasFacade;
          return (
            <g key={seg.index} onClick={() => onToggleFacade?.(seg.index)} className="cursor-pointer">
              {/* Hit area */}
              {seg.subs.map((ss, j) => (
                <line key={j} x1={ss.x1} y1={ss.y1} x2={ss.x2} y2={ss.y2}
                  stroke="transparent" strokeWidth="24" />
              ))}
              {/* Perimeter lines */}
              {seg.subs.map((ss, j) => (
                <line key={j} x1={ss.x1} y1={ss.y1} x2={ss.x2} y2={ss.y2}
                  stroke={f ? "#d97706" : "#a3a3a3"}
                  strokeWidth={f ? 5 : 2.5}
                  strokeLinecap="round" />
              ))}
              {/* Vertex dots */}
              {seg.subs.map((ss, j) => (
                <circle key={j} cx={ss.x1} cy={ss.y1} r={f ? 3 : 1.5}
                  fill={f ? "#d97706" : "#a3a3a3"} />
              ))}
              {/* Number badge */}
              <circle cx={seg.mx} cy={seg.my} r="8.5"
                fill={f ? "#d97706" : "#a3a3a3"} opacity="0.85" />
              <text x={seg.mx} y={seg.my + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill="white" fontWeight="black">
                {seg.index + 1}
              </text>
              {/* Label tag */}
              <rect x={seg.lx - seg.tw / 2} y={seg.ly - 10} width={seg.tw} height="20" rx="10"
                fill="white" stroke={f ? "#fde68a" : "#e5e5e5"} strokeWidth="0.5" opacity="0.95" />
              <text x={seg.lx} y={seg.ly + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="bold"
                fill={f ? "#92400e" : "#78716c"}>
                {seg.length}م
              </text>
              {/* Facade indicator */}
              <text x={seg.lx} y={seg.ly - 15}
                textAnchor="middle" fontSize="6.5"
                fill={f ? "#d97706" : "#a3a3a3"}>
                {f ? "● واجهة" : "○ بدون"}
              </text>
            </g>
          );
        })}

        <defs>
          <filter id="rs_sh">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.05" />
          </filter>
        </defs>
      </svg>

      <div className="flex items-center justify-between mt-2 text-[10px] text-ink-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded-sm bg-amber-600 inline-block"></span> واجهة</span>
          <span className="flex items-center gap-1"><span className="w-4 h-1.5 rounded-sm bg-gray-400 inline-block"></span> بدون</span>
        </span>
        <span>ضغط على الضلع لتبديل الواجهة</span>
      </div>
    </div>
  );
}