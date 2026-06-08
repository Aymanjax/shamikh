// @ts-nocheck
import { useRef, useEffect, useState, useCallback } from "react";
import { isPolygonClosed } from "../../utils/buildingGeometry";

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-8) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function getSkeletonPoints(skeleton) {
  const map = new Map();
  for (const seg of [...(skeleton.ridges || []), ...(skeleton.hips || []), ...(skeleton.valleys || []), ...(skeleton.gables || [])]) {
    const sk = `${seg.start.x.toFixed(4)},${seg.start.y.toFixed(4)}`;
    const ek = `${seg.end.x.toFixed(4)},${seg.end.y.toFixed(4)}`;
    if (!map.has(sk)) map.set(sk, seg.start);
    if (!map.has(ek)) map.set(ek, seg.end);
  }
  return Array.from(map.values());
}

const ALL_EDGES = [
  { key: "ridges", color: "#ea580c", label: "Ridge" },
  { key: "hips", color: "#dc2626", label: "Hip" },
  { key: "valleys", color: "#2563eb", label: "Valley" },
  { key: "gables", color: "#9ca3af", label: "Gable" },
];

export default function Roof3DViewer({ vertices, skeleton, slope = 20 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rotRef = useRef(-Math.PI / 4);
  const scaleRef = useRef(1);
  const dragRef = useRef(null);
  const dimsRef = useRef({ w: 0, h: 0 });
  const [wireframe, setWireframe] = useState(false);
  const [, forceRender] = useState(0);
  const animRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !skeleton || !vertices || vertices.length < 3) return;
    const { w, h } = dimsRef.current;
    if (!w || !h) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const rot = rotRef.current;
    const sc = scaleRef.current;
    const slopeFrac = (slope || 20) / 100;
    const polyVerts = isPolygonClosed(vertices) ? vertices.slice(0, -1) : vertices;
    if (polyVerts.length < 3) return;

    const pts = getSkeletonPoints(skeleton);
    const heightMap = new Map();
    for (const pt of pts) {
      let minDist = Infinity;
      for (let i = 0; i < polyVerts.length; i++) {
        const j = (i + 1) % polyVerts.length;
        const d = pointToSegmentDist(pt.x, pt.y, polyVerts[i].x, polyVerts[i].y, polyVerts[j].x, polyVerts[j].y);
        if (d < minDist) minDist = d;
      }
      heightMap.set(`${pt.x.toFixed(4)},${pt.y.toFixed(4)}`, minDist * slopeFrac);
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of polyVerts) {
      const rx = v.x * Math.cos(rot) - v.y * Math.sin(rot);
      const ry = v.x * Math.sin(rot) + v.y * Math.cos(rot);
      if (rx < minX) minX = rx; if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry; if (ry > maxY) maxY = ry;
    }
    for (const pt of pts) {
      const z = heightMap.get(`${pt.x.toFixed(4)},${pt.y.toFixed(4)}`) || 0;
      const rx = pt.x * Math.cos(rot) - pt.y * Math.sin(rot);
      const ry = pt.x * Math.sin(rot) + pt.y * Math.cos(rot);
      const sy = ry * 0.35 + z * 0.65;
      if (rx < minX) minX = rx; if (rx > maxX) maxX = rx;
      if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    }
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const margin = 40;
    const autoScale = Math.min((w - margin * 2) / rangeX, (h - margin * 2) / rangeY) * sc;
    const cx = w / 2, cy = h / 2 + margin * 0.5;

    const proj = (x, y, z) => {
      const rx = x * Math.cos(rot) - y * Math.sin(rot);
      const ry = x * Math.sin(rot) + y * Math.cos(rot);
      return { sx: cx + rx * autoScale, sy: cy - (ry * 0.35 + z * 0.65) * autoScale };
    };

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#e0f2fe");
    grad.addColorStop(1, "#f0f9ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const getFaceCenterZ = (face) => {
      let sum = 0;
      for (const v of face) {
        sum += heightMap.get(`${v.x.toFixed(4)},${v.y.toFixed(4)}`) || 0;
      }
      return sum / face.length;
    };

    const faces = skeleton.faces || [];
    const sortedFaces = [...faces].sort((a, b) => getFaceCenterZ(a) - getFaceCenterZ(b));

    const maxZ = Math.max(...pts.map(p => heightMap.get(`${p.x.toFixed(4)},${p.y.toFixed(4)}`) || 0), 0.01);
    const minZ = Math.min(...pts.map(p => heightMap.get(`${p.x.toFixed(4)},${p.y.toFixed(4)}`) || 0));

    if (!wireframe) {
      for (const face of sortedFaces) {
        const centerZ = getFaceCenterZ(face);
        const t = maxZ > minZ ? (centerZ - minZ) / (maxZ - minZ) : 0.5;
        const r = Math.round(245 - t * 80);
        const g = Math.round(235 - t * 60);
        const b2 = Math.round(125 - t * 40);
        ctx.beginPath();
        for (let i = 0; i < face.length; i++) {
          const z = heightMap.get(`${face[i].x.toFixed(4)},${face[i].y.toFixed(4)}`) || 0;
          const { sx, sy } = proj(face[i].x, face[i].y, z);
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = `rgb(${r},${g},${b2})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    ctx.beginPath();
    for (let i = 0; i < polyVerts.length; i++) {
      const { sx, sy } = proj(polyVerts[i].x, polyVerts[i].y, 0);
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    if (!wireframe) {
      ctx.fillStyle = "rgba(255,251,235,0.3)";
      ctx.fill();
    }
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let gx = 0; gx <= 20; gx += 2) {
      const p1 = proj(gx, 0, 0), p2 = proj(gx, 20, 0);
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 0.5; ctx.stroke();
    }
    for (let gy = 0; gy <= 20; gy += 2) {
      const p1 = proj(0, gy, 0), p2 = proj(20, gy, 0);
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
      ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 0.5; ctx.stroke();
    }

    for (const pt of pts) {
      const z = heightMap.get(`${pt.x.toFixed(4)},${pt.y.toFixed(4)}`) || 0;
      if (z < 0.01) continue;
      const t = proj(pt.x, pt.y, z), b = proj(pt.x, pt.y, 0);
      ctx.beginPath(); ctx.moveTo(t.sx, t.sy); ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = "#d1d5db"; ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    }

    for (const { key, color } of ALL_EDGES) {
      for (const seg of (skeleton[key] || [])) {
        const z1 = heightMap.get(`${seg.start.x.toFixed(4)},${seg.start.y.toFixed(4)}`) || 0;
        const z2 = heightMap.get(`${seg.end.x.toFixed(4)},${seg.end.y.toFixed(4)}`) || 0;
        const p1 = proj(seg.start.x, seg.start.y, z1);
        const p2 = proj(seg.end.x, seg.end.y, z2);
        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy);
        ctx.strokeStyle = color;
        ctx.lineWidth = key === "ridges" ? 3 : 2;
        if (key === "gables") ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    for (const pt of pts) {
      const z = heightMap.get(`${pt.x.toFixed(4)},${pt.y.toFixed(4)}`) || 0;
      const { sx, sy } = proj(pt.x, pt.y, z);
      ctx.beginPath(); ctx.arc(sx, sy, wireframe ? 3 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = z < 0.01 ? "#6b7280" : (wireframe ? "#1f2937" : "#374151");
      ctx.fill();
    }

    if (!wireframe) {
      const shadowMult = 0.85;
      ctx.beginPath();
      for (let i = 0; i < polyVerts.length; i++) {
        const { sx, sy } = proj(polyVerts[i].x, polyVerts[i].y, 0);
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.08 - Math.abs(rot) / (Math.PI * 3))})`;
      ctx.fill();
    }

    const legendItems = [];
    if (wireframe) legendItems.push({ color: "#666", label: "Wireframe" });
    else {
      legendItems.push(...ALL_EDGES);
      legendItems.push({ color: "#9ca3af", label: `${slope || 20}% ميل` });
      if (faces.length > 0) legendItems.push({ color: `rgb(${245 - 80 * 0.5},${235 - 60 * 0.5},${125 - 40 * 0.5})`, label: "أوجه السقف" });
    }
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    let ly = 10;
    for (const { label, color } of legendItems) {
      ctx.fillStyle = color;
      ctx.fillRect(w - 48, ly + 3, 14, 3);
      ctx.fillStyle = "#374151";
      ctx.fillText(label, w - 10, ly);
      ly += 16;
    }
  }, [vertices, skeleton, slope, wireframe]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const r = containerRef.current.getBoundingClientRect();
      dimsRef.current = { w: r.width, h: r.height };
      forceRender(n => n + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const handleStart = (clientX) => {
    dragRef.current = { startX: clientX, startRot: rotRef.current };
  };

  const handleMove = (clientX) => {
    if (!dragRef.current) return;
    const dx = clientX - dragRef.current.startX;
    rotRef.current = dragRef.current.startRot + dx / 200;
    if (!animRef.current) animRef.current = requestAnimationFrame(() => {
      animRef.current = null;
      draw();
    });
  };

  const handleEnd = () => { dragRef.current = null; };

  return (
    <div ref={containerRef} className="bg-white border border-line rounded-2xl overflow-hidden relative"
      style={{ aspectRatio: "1/1", cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => { if (dragRef.current) handleMove(e.clientX); }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onWheel={(e) => {
        e.preventDefault();
        scaleRef.current = Math.max(0.3, Math.min(3, scaleRef.current * (e.deltaY > 0 ? 0.9 : 1.1)));
        draw();
      }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => { if (dragRef.current) handleMove(e.touches[0].clientX); }}
      onTouchEnd={handleEnd}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button onClick={() => setWireframe(w => !w)}
          className={`px-2 py-1 rounded-lg text-[9px] font-bold border shadow-sm transition ${
            wireframe ? "bg-slate-800 text-white border-slate-700" : "bg-white text-ink-muted border-line hover:border-slate-300 hover:text-ink"
          }`}>
          <i className={`fa-solid ${wireframe ? "fa-cube" : "fa-border-all"} ml-1`}></i>
          {wireframe ? "تظليل" : "هيكلي"}
        </button>
      </div>
      <div className="absolute bottom-2 left-2 text-[8px] text-ink-muted select-none">
        اسحب للتدوير · عجلة للتكبير
      </div>
    </div>
  );
}