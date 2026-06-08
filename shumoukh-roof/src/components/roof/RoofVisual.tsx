// @ts-nocheck
import { TILES_CATALOG } from "../../utils/constants";

const COLORS = {
  roof: { fill: "#FEF3C7", stroke: "#D97706", pattern: "#FCD34D" },
  arrow: "#64748B",
  dimBg: "#FFFFFF",
  dimText: "#1E293B",
  active: "#D97706",
  inactive: "#CBD5E1",
  tile: "#059669",
  decor: "#7C3AED",
  insulation: "#06B6D4",
};

function ArrowLine({ x1, y1, x2, y2 }) {
  const midX = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.arrow} strokeWidth={1.5} />
      <polygon points={`${x1},${y1} ${x1+5},${y1-4} ${x1+5},${y1+4}`} fill={COLORS.arrow} />
      <polygon points={`${x2},${y2} ${x2-5},${y2-4} ${x2-5},${y2+4}`} fill={COLORS.arrow} />
    </g>
  );
}

function ArrowLabel({ x, y, value, onChange }) {
  return (
    <g>
      <rect x={x - 28} y={y - 11} width={56} height={22} rx={6} fill={COLORS.dimBg} stroke={COLORS.arrow} strokeWidth={1} />
      <foreignObject x={x - 26} y={y - 9} width={52} height={18}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type="number"
          step="0.1"
          style={{
            width: "100%", height: "100%", border: "none", background: "transparent",
            textAlign: "center", fontSize: "13px", fontWeight: 700, color: COLORS.dimText,
            outline: "none", padding: 0, fontFamily: "inherit",
          }}
        />
      </foreignObject>
    </g>
  );
}

export default function RoofVisual({
  length, width, slope, numFacades, withDecor, enableInsulation,
  tileIndex, onLengthChange, onWidthChange, onSlopeChange,
  onNumFacadesChange, onDecorToggle, onInsulationToggle, onTileChange,
}) {
  const vbW = 600, vbH = 420;
  const pad = 70;
  const availW = vbW - pad * 2 - 50;
  const availH = vbH - pad * 2 - 50;
  const scale = Math.min(availW / Math.max(length, 1), availH / Math.max(width, 1), 45);
  const rw = Math.max(length, 1) * scale;
  const rh = Math.max(width, 1) * scale;
  const rx = (vbW - rw) / 2;
  const ry = (vbH - rh) / 2;
  const tile = TILES_CATALOG[tileIndex] || TILES_CATALOG[0];

  const handleLen = (v) => { const n = parseFloat(v); if (!isNaN(n) && n > 0) onLengthChange(n); };
  const handleWid = (v) => { const n = parseFloat(v); if (!isNaN(n) && n > 0) onWidthChange(n); };

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-auto max-h-[420px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="tilePattern" x="0" y="0" width="12" height="8" patternUnits="userSpaceOnUse">
          <rect width="12" height="8" fill={COLORS.roof.fill} />
          <rect x="0" y="0" width="12" height="1" fill={COLORS.roof.pattern} opacity="0.4" />
        </pattern>
      </defs>

      {/* Length arrow (top) */}
      <ArrowLine x1={rx - 10} y1={ry - 35} x2={rx + rw + 10} y2={ry - 35} />
      <ArrowLabel x={rx + rw / 2} y={ry - 35} value={length} onChange={handleLen} />

      {/* Width arrow (right) */}
      <ArrowLine x1={rx + rw + 35} y1={ry - 10} x2={rx + rw + 35} y2={ry + rh + 10} />
      <ArrowLabel x={rx + rw + 35} y={ry + rh / 2} value={width} onChange={handleWid} />

      {/* Roof rectangle */}
      <rect x={rx} y={ry} width={rw} height={rh} rx={4} fill="url(#tilePattern)" stroke={COLORS.roof.stroke} strokeWidth={2} />
      <rect x={rx} y={ry} width={rw} height={rh} rx={4} fill="none" stroke={COLORS.roof.stroke} strokeWidth={1} strokeDasharray="4,3" opacity="0.3" />

      {/* Roof label */}
      <text x={rx + rw / 2} y={ry + rh / 2 - 14} textAnchor="middle" fill={COLORS.roof.stroke} fontSize="14" fontWeight="700" fontFamily="inherit">
        🧱 سقف
      </text>
      <text x={rx + rw / 2} y={ry + rh / 2 + 6} textAnchor="middle" fill={COLORS.arrow} fontSize="11" fontWeight="600" fontFamily="inherit">
        {tile.name}
      </text>
      {slope > 0 && (
        <text x={rx + rw / 2} y={ry + rh / 2 + 22} textAnchor="middle" fill={COLORS.arrow} fontSize="10" fontWeight="600" fontFamily="inherit">
          ☀️ ميل {slope}%
        </text>
      )}

      {/* Slope triangle (bottom right) */}
      {slope > 0 && (
        <g transform={`translate(${rx + rw - 60}, ${ry + rh + 15})`}>
          <rect x="0" y="0" width="60" height="24" rx={4} fill="white" stroke={COLORS.arrow} strokeWidth={0.5} />
          <polygon points="8,18 52,18 52,6" fill={COLORS.roof.stroke} opacity="0.3" stroke={COLORS.roof.stroke} strokeWidth={1} />
          <text x="30" y="16" textAnchor="middle" fill={COLORS.dimText} fontSize="9" fontWeight="700" fontFamily="inherit">
            {slope}%
          </text>
          <text x="30" y="10" textAnchor="middle" fill={COLORS.dimText} fontSize="7" fontWeight="600" fontFamily="inherit">
            الميل
          </text>
        </g>
      )}

      {/* Interactive feature buttons */}
      {/* Facades */}
      <g transform={`translate(${rx - 5}, ${ry + 8})`}>
        <rect x="-40" y="0" width="40" height="66" rx={6} fill="white" stroke={COLORS.inactive} strokeWidth={1} />
        <text x="-20" y="16" textAnchor="middle" fill={COLORS.arrow} fontSize="7" fontWeight="600" fontFamily="inherit">الواجهات</text>
        {[2, 3, 4].map((n, i) => (
          <g key={n} onClick={() => onNumFacadesChange(n)} style={{ cursor: "pointer" }}>
            <rect x="-32" y={22 + i * 15} width="24" height="13" rx={4} fill={numFacades === n ? COLORS.active : COLORS.inactive} />
            <text x="-20" y={32 + i * 15} textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="inherit">
              {n}
            </text>
          </g>
        ))}
      </g>

      {/* Decor toggle */}
      <g transform={`translate(${rx + rw - 50}, ${ry + 8})`} onClick={onDecorToggle} style={{ cursor: "pointer" }}>
        <rect x="0" y="0" width="50" height="28" rx={6} fill={withDecor ? "#EDE9FE" : "white"} stroke={withDecor ? COLORS.decor : COLORS.inactive} strokeWidth={1} />
        <text x="25" y="12" textAnchor="middle" fill={withDecor ? COLORS.decor : COLORS.arrow} fontSize="9" fontWeight="700" fontFamily="inherit">
          {withDecor ? "✅" : "❌"}
        </text>
        <text x="25" y="24" textAnchor="middle" fill={withDecor ? COLORS.decor : COLORS.arrow} fontSize="8" fontWeight="600" fontFamily="inherit">
          ديكور
        </text>
      </g>

      {/* Insulation toggle */}
      <g transform={`translate(${rx + rw - 50}, ${ry + 42})`} onClick={onInsulationToggle} style={{ cursor: "pointer" }}>
        <rect x="0" y="0" width="50" height="28" rx={6} fill={enableInsulation ? "#E0F2FE" : "white"} stroke={enableInsulation ? COLORS.insulation : COLORS.inactive} strokeWidth={1} />
        <text x="25" y="12" textAnchor="middle" fill={enableInsulation ? COLORS.insulation : COLORS.arrow} fontSize="9" fontWeight="700" fontFamily="inherit">
          {enableInsulation ? "✅" : "❌"}
        </text>
        <text x="25" y="24" textAnchor="middle" fill={enableInsulation ? COLORS.insulation : COLORS.arrow} fontSize="8" fontWeight="600" fontFamily="inherit">
          عزل
        </text>
      </g>

      {/* Tile selector */}
      <g transform={`translate(${rx + rw - 50}, ${ry + rh - 36})`} onClick={onTileChange} style={{ cursor: "pointer" }}>
        <rect x="0" y="0" width="50" height="36" rx={6} fill="white" stroke={COLORS.tile} strokeWidth={1} />
        <text x="25" y="14" textAnchor="middle" fontSize="12">🧱</text>
        <text x="25" y="30" textAnchor="middle" fill={COLORS.tile} fontSize="7" fontWeight="700" fontFamily="inherit">
          قرميد
        </text>
      </g>
    </svg>
  );
}