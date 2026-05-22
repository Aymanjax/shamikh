import { useMemo } from "react";

const VW = 440, VH = 330;
const RX = 80, RY = 65, RW = 280, RH = 200;

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
    const gap = 6;
    const avail = perim[e] - (g.length - 1) * gap;
    let pos = 0;
    for (const side of g) {
      const bx = (Math.max(side.length, 0) / total) * avail;
      const c = pos + bx / 2;
      pos += bx + gap;
      const ax = base[e].x + dAlg[e].x * c;
      const ay = base[e].y + dAlg[e].y * c;
      const dist = 20;
      const lx = ax + dOut[e].x * dist;
      const ly = ay + dOut[e].y * dist;
      out.push({ ...side, e, ax, ay, lx, ly });
    }
  }
  return out;
}

// pill width=48, height=22 — أعرض لاستيعاب "12.5م" بوضوح
// tx/ty = مركز النص داخل الـ pill
const pillCfg = [
  // أعلى (e=0): pill فوق نقطة التسمية، مُمركز أفقياً
  { rx: -24, ry: -26, rw: 48, rh: 22, tx: 0, ty: -15 },
  // يمين (e=1): pill يمتد للجهة اليمنى
  { rx:  4,  ry: -11, rw: 48, rh: 22, tx: 28, ty: 0  },
  // أسفل (e=2): pill أسفل نقطة التسمية، مُمركز
  { rx: -24, ry:  4,  rw: 48, rh: 22, tx: 0,  ty: 15 },
  // يسار (e=3): pill يمتد للجهة اليسرى
  { rx: -52, ry: -11, rw: 48, rh: 22, tx: -28, ty: 0 },
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
      <svg viewBox={`0 0 ${VW} ${VH}`} overflow="visible" className="w-full h-auto select-none" xmlns="http://www.w3.org/2000/svg">
        {/* مساحة السقف */}
        <rect x={RX} y={RY} width={RW} height={RH} rx="6"
          fill="#fffbeb" stroke="#d6d3d1" strokeWidth="1"
          filter="url(#sf_rs)" />
        <rect x={RX} y={RY} width={RW} height={RH} rx="6"
          fill="none" stroke="#e7e5e4" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />

        {/* نص وسطي */}
        <text x={RX + RW / 2} y={RY + RH / 2 - 6}
          textAnchor="middle" fontSize="14" fontWeight="bold" fill="#d97706" opacity="0.3">سطح</text>
        <text x={RX + RW / 2} y={RY + RH / 2 + 12}
          textAnchor="middle" fontSize="10" fill="#b45309" opacity="0.3">
          {total.toFixed(1)}م · {fc}/{sides.length} أوجه
        </text>

        {/* الأضلاع */}
        {items.map((seg) => {
          const f = seg.hasFacade;
          const clr = f ? "#d97706" : "#9ca3af";
          const bg  = f ? "#fef3c7" : "#f9fafb";
          const bdr = f ? "#f59e0b" : "#d1d5db";
          const p   = pillCfg[seg.e];

          return (
            <g key={seg.idx} onClick={() => onToggleFacade?.(seg.idx)} className="cursor-pointer">
              {/* منطقة الضغط — شفافة وأكبر للموبايل */}
              <line x1={seg.ax} y1={seg.ay} x2={seg.lx} y2={seg.ly} stroke="transparent" strokeWidth="32" />

              {/* نقطة على حافة المستطيل */}
              <circle cx={seg.ax} cy={seg.ay} r="4" fill={clr} />

              {/* خط ممتد للخارج */}
              <line x1={seg.ax} y1={seg.ay} x2={seg.lx} y2={seg.ly}
                stroke={clr} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />

              {/* الـ pill */}
              <rect x={seg.lx + p.rx} y={seg.ly + p.ry} width={p.rw} height={p.rh} rx="6"
                fill={bg} stroke={bdr} strokeWidth="1" />

              {/* رقم الضلع — صغير في الأعلى */}
              <text x={seg.lx + p.tx} y={seg.ly + p.ty - 5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="6.5" fill={clr} opacity="0.8">
                {seg.idx + 1}
              </text>

              {/* طول الضلع — رئيسي وأكبر */}
              <text x={seg.lx + p.tx} y={seg.ly + p.ty + 5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="bold" fill={clr}>
                {seg.length}م
              </text>
            </g>
          );
        })}

        <defs>
          <filter id="sf_rs">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.06" />
          </filter>
        </defs>
      </svg>

      <div className="flex items-center justify-between mt-2 text-[10px] text-ink-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border border-amber-400 bg-amber-100 inline-block"></span>
            واجهة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border border-gray-300 bg-gray-100 inline-block"></span>
            بدون واجهة
          </span>
        </span>
        <span>اضغط على الضلع لتبديل</span>
      </div>
    </div>
  );
}
