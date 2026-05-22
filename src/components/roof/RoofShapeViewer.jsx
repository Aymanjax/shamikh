import { useMemo } from "react";

const VW = 420, VH = 310;
const RX = 70, RY = 55, RW = 280, RH = 200;

/*  توزيع الأضلاع كأشرطة خارجية حول المستطيل — لا تقاطع، لا تداخل  */

function layout(sides) {
  if (!sides.length) return [];
  const perim = [RW, RH, RW, RH];
  const dOut = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  const dAlg = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
  const base = [
    { x: RX, y: RY }, { x: RX + RW, y: RY },
    { x: RX + RW, y: RY + RH }, { x: RX, y: RY + RH },
  ];
  const grp = [[], [], [], []];
  sides.forEach((s, i) => grp[i % 4].push({ ...s, idx: i }));
  const out = [];
  for (let e = 0; e < 4; e++) {
    const g = grp[e];
    if (!g.length) continue;
    const total = g.reduce((s, side) => s + Math.max(side.length, 0), 0);
    if (total <= 0) continue;
    const gap = 5;
    const avail = perim[e] - (g.length - 1) * gap;
    let pos = 0;
    for (const side of g) {
      const bx = (Math.max(side.length, 0) / total) * avail;
      const c = pos + bx / 2;
      pos += bx + gap;
      const ax = base[e].x + dAlg[e].x * c;
      const ay = base[e].y + dAlg[e].y * c;
      const len = 18;
      const lx = ax + dOut[e].x * len;
      const ly = ay + dOut[e].y * len;
      out.push({ ...side, e, ax, ay, lx, ly });
    }
  }
  return out;
}

const pillCfg = [
  { rx: -15, ry: -16, rw: 30, rh: 14, tx: 0, ty: -9, fx: 0, fy: -7 },
  { rx: 3, ry: -7, rw: 30, rh: 14, tx: 18, ty: 0, fx: 18, fy: 2 },
  { rx: -15, ry: 2, rw: 30, rh: 14, tx: 0, ty: 9, fx: 0, fy: 11 },
  { rx: -33, ry: -7, rw: 30, rh: 14, tx: -18, ty: 0, fx: -18, fy: 2 },
];

export default function RoofShapeViewer({ sides = [], onToggleFacade }) {
  const items = useMemo(() => layout(sides), [sides]);

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
        {/*  مساحة السقف  */}
        <rect x={RX} y={RY} width={RW} height={RH} rx="6"
          fill="#fffbeb" stroke="#d6d3d1" strokeWidth="0.5"
          filter="url(#sf_rs)" />
        <rect x={RX} y={RY} width={RW} height={RH} rx="6"
          fill="none" stroke="#e7e5e4" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />

        {/*  نص وسطي  */}
        <text x={RX + RW / 2} y={RY + RH / 2 - 6}
          textAnchor="middle" fontSize="14" fontWeight="bold" fill="#d97706" opacity="0.3">سطح</text>
        <text x={RX + RW / 2} y={RY + RH / 2 + 12}
          textAnchor="middle" fontSize="10" fill="#b45309" opacity="0.3">
          {total.toFixed(1)}م · {fc}/{sides.length} أوجه
        </text>

        {/*  الأضلاع — كل ضلع: نقطة + خط + تسمية خارجية  */}
        {items.map((seg) => {
          const f = seg.hasFacade;
          const clr = f ? "#d97706" : "#a3a3a3";
          const bg = f ? "#fef3c7" : "#f5f5f4";
          const p = pillCfg[seg.e];

          return (
            <g key={seg.idx} onClick={() => onToggleFacade?.(seg.idx)} className="cursor-pointer">
              {/*  مساحة الضغط  */}
              <line x1={seg.ax} y1={seg.ay} x2={seg.lx} y2={seg.ly} stroke="transparent" strokeWidth="24" />

              {/*  نقطة على المستطيل  */}
              <circle cx={seg.ax} cy={seg.ay} r="3.5" fill={clr} />

              {/*  خط ممتد للخارج  */}
              <line x1={seg.ax} y1={seg.ay} x2={seg.lx} y2={seg.ly}
                stroke={clr} strokeWidth="2" strokeLinecap="round" />

              {/*  التسمية (البيل)  */}
              <rect x={seg.lx + p.rx} y={seg.ly + p.ry} width={p.rw} height={p.rh} rx="7"
                fill="white" stroke={clr} strokeWidth="0.5" />
              <text x={seg.lx + p.tx} y={seg.ly + p.ty}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="bold" fill={clr}>
                {seg.length}م
              </text>
              <text x={seg.lx + p.fx} y={seg.ly + p.fy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="5.5" fill={clr}>
                {f ? "●" : "○"}
              </text>
            </g>
          );
        })}

        <defs>
          <filter id="sf_rs">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.05" />
          </filter>
        </defs>
      </svg>

      <div className="flex items-center justify-between mt-2 text-[10px] text-ink-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-amber-600 inline-block"></span> واجهة</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-gray-400 inline-block"></span> بدون</span>
        </span>
        <span>ضغط لتبديل</span>
      </div>
    </div>
  );
}