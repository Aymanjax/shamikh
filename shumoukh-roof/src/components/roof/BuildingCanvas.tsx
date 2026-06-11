// @ts-nocheck
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { edgesFromVertices, snapToGrid, isPolygonClosed, verticesFromEdges, isRectangular } from "../../utils/buildingGeometry";
import { computeRoofSkeleton, customRectRoof, computeWaterDirections } from "../../utils/roofSkeleton";
import { X, Plus, Trash2, Undo2, Maximize2, Minimize2, ZoomIn, ZoomOut, Check, Move, Ruler, Grid3x3, Eye, EyeOff, GripVertical } from "lucide-react";

const GRID_M = 20, PAD = 30, SZ = 700;
const SCALE = (SZ - 2 * PAD) / GRID_M;
const MIN_ZOOM = 0.15, MAX_ZOOM = 6;

const ZOOM_LEVELS = [0.15, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6];

function toK(pt) {
  return { kx: PAD + pt.x * SCALE, ky: PAD + pt.y * SCALE };
}

function svgPoint(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgPt = pt.matrixTransform(svgEl.getScreenCTM().inverse());
  return { x: (svgPt.x - PAD) / SCALE, y: (svgPt.y - PAD) / SCALE };
}

function constrainAxis(last, target) {
  const dx = target.x - last.x;
  const dy = target.y - last.y;
  if (Math.abs(dx) > Math.abs(dy)) return { x: target.x, y: last.y };
  return { x: last.x, y: target.y };
}

function getDirection(last, cur) {
  const dx = cur.x - last.x;
  const dy = cur.y - last.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export default function BuildingCanvas({ vertices, sides, onChange, onToggleFacade, onToggleActive, area, slope }) {
  const [edges, setEdges] = useState([]);
  const [rectL, setRectL] = useState(5);
  const [rectW, setRectW] = useState(4);
  const [showEdgeTable, setShowEdgeTable] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [pinchDist, setPinchDist] = useState(null);

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const panStartRef = useRef(null);
  const clickStartRef = useRef(null);
  const clickMovedRef = useRef(false);
  const touchDrawRef = useRef(false);
  const touchPanRef = useRef(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const closed = isPolygonClosed(vertices);
  const isRect = useMemo(() => isRectangular(vertices), [vertices]);

  zoomRef.current = zoom;
  panRef.current = pan;

  const viewBox = useMemo(() => {
    const w = SZ / zoom, h = SZ / zoom;
    const cx = SZ / 2 - pan.x * (SZ / zoom);
    const cy = SZ / 2 - pan.y * (SZ / zoom);
    return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
  }, [zoom, pan]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const curZoom = zoomRef.current;
      const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, curZoom * factor));
      setZoom(newZoom);
      setPan((p) => ({
        x: p.x + (mx - 0.5) * (SZ / curZoom - SZ / newZoom) / (SZ / curZoom),
        y: p.y + (my - 0.5) * (SZ / curZoom - SZ / newZoom) / (SZ / curZoom),
      }));
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, []);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const zoomToFit = useCallback(() => {
    if (!vertices.length || !svgRef.current) { resetView(); return; }
    const xs = vertices.map(v => v.x), ys = vertices.map(v => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = (maxX - minX) + 2, h = (maxY - minY) + 2;
    const fit = Math.min((SZ / w) / SCALE, (SZ / h) / SCALE, 3);
    setZoom(Math.max(MIN_ZOOM, fit));
    setPan({ x: (minX + maxX) / 2 - 10, y: (minY + maxY) / 2 - 10 });
  }, [vertices, resetView]);

  const zoomIn = useCallback(() => {
    const idx = ZOOM_LEVELS.findIndex(z => z > zoom + 0.01);
    if (idx >= 0) setZoom(ZOOM_LEVELS[idx]);
    else setZoom(z => Math.min(MAX_ZOOM, z * 1.3));
  }, [zoom]);
  const zoomOut = useCallback(() => {
    const idx = [...ZOOM_LEVELS].reverse().findIndex(z => z < zoom - 0.01);
    if (idx >= 0) setZoom(ZOOM_LEVELS[ZOOM_LEVELS.length - 1 - idx]);
    else setZoom(z => Math.max(MIN_ZOOM, z / 1.3));
  }, [zoom]);

  const svgCoord = useCallback((clientX, clientY) => {
    if (!svgRef.current) return null;
    return svgPoint(svgRef.current, clientX, clientY);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setPinchDist(Math.sqrt(dx * dx + dy * dy));
      touchPanRef.current = {
        mx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        my: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        px: pan.x, py: pan.y,
      };
    } else if (e.touches.length === 1) {
      e.preventDefault();
      if (!closed) {
        const pt = svgCoord(e.touches[0].clientX, e.touches[0].clientY);
        if (!pt) return;
        const snapped = snapToGrid(pt);
        if (vertices.length === 0) onChange([snapped]);
        touchDrawRef.current = true;
      } else {
        touchPanRef.current = {
          mx: e.touches[0].clientX, my: e.touches[0].clientY,
          px: pan.x, py: pan.y,
        };
      }
    }
  }, [closed, vertices, pan, onChange, svgCoord]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchDist !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = newDist / pinchDist;
      setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * scale)));
      setPinchDist(newDist);
      if (touchPanRef.current) {
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = svgRef.current.getBoundingClientRect();
        const panDx = (mx - touchPanRef.current.mx) / rect.width;
        const panDy = (my - touchPanRef.current.my) / rect.height;
        setPan({ x: touchPanRef.current.px + panDx, y: touchPanRef.current.py + panDy });
      }
    } else if (e.touches.length === 2 && pinchDist === null) {
      e.preventDefault();
    } else if (e.touches.length === 1 && touchDrawRef.current && !closed) {
      e.preventDefault();
      const pt = svgCoord(e.touches[0].clientX, e.touches[0].clientY);
      if (!pt || vertices.length === 0) return;
      const last = vertices[vertices.length - 1];
      const snapped = snapToGrid(pt);
      if (snapped.x !== last.x || snapped.y !== last.y) {
        const constrained = constrainAxis(last, snapped);
        if (constrained.x !== last.x || constrained.y !== last.y) {
          const dir = getDirection(last, constrained);
          const len = Math.sqrt((constrained.x - last.x) ** 2 + (constrained.y - last.y) ** 2);
          setGhost({ from: last, to: constrained, dir, len });
          return;
        }
      }
      setGhost(null);
    } else if (e.touches.length === 1 && touchPanRef.current && closed) {
      e.preventDefault();
      const mx = e.touches[0].clientX;
      const my = e.touches[0].clientY;
      const rect = svgRef.current.getBoundingClientRect();
      const panDx = (mx - touchPanRef.current.mx) / rect.width;
      const panDy = (my - touchPanRef.current.my) / rect.height;
      setPan({ x: touchPanRef.current.px + panDx, y: touchPanRef.current.py + panDy });
    }
  }, [pinchDist, closed, vertices, svgCoord]);

  const edgesFromVerts = useMemo(() => edgesFromVertices(vertices), [vertices]);

  useEffect(() => {
    if (vertices.length === 0) {
      if (edges.length > 0) setEdges([]);
      return;
    }
    const synced = edgesFromVerts
      .filter((e) => e.direction !== "diagonal")
      .map((e) => ({ direction: e.direction, length: e.length }));
    const same = synced.length === edges.length &&
      synced.every((e, i) => e.direction === edges[i]?.direction && Math.abs(e.length - edges[i]?.length) < 0.01);
    if (!same && synced.length > 0) setEdges(synced);
  }, [vertices, edgesFromVerts]);

  const DIM_PRESETS = [
    { label: "٣×٢", l: 3, w: 2 }, { label: "٤×٣", l: 4, w: 3 }, { label: "٥×٤", l: 5, w: 4 },
    { label: "٦×٤", l: 6, w: 4 }, { label: "٦×٥", l: 6, w: 5 }, { label: "٨×٥", l: 8, w: 5 },
    { label: "١٠×٦", l: 10, w: 6 }, { label: "١٢×٧", l: 12, w: 7 }, { label: "١٥×٨", l: 15, w: 8 },
  ];

  const addVertex = useCallback((pt) => {
    const snapped = snapToGrid(pt);
    if (vertices.length === 0) {
      onChange([snapped]);
      return;
    }
    const last = vertices[vertices.length - 1];
    if (snapped.x === last.x && snapped.y === last.y) return;
    const constrained = constrainAxis(last, snapped);
    if (constrained.x === last.x && constrained.y === last.y) return;
    onChange([...vertices, constrained]);
  }, [vertices, onChange]);

  const handleClose = useCallback(() => {
    if (vertices.length < 2) return;
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    const dx = first.x - last.x;
    const dy = first.y - last.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
    onChange([...vertices, { ...first }]);
  }, [vertices, onChange]);

  const handleTouchEnd = useCallback(() => {
    if (touchDrawRef.current) {
      touchDrawRef.current = false;
      if (ghost && !closed) {
        if (vertices.length >= 2) {
          const first = vertices[0];
          const dist = Math.sqrt((ghost.to.x - first.x) ** 2 + (ghost.to.y - first.y) ** 2);
          if (dist < 0.5) { handleClose(); setGhost(null); return; }
        }
        addVertex(ghost.to);
      }
      setGhost(null);
    }
    touchPanRef.current = null;
    setPinchDist(null);
  }, [ghost, closed, addVertex, vertices, handleClose]);

  const handleCanvasClick = useCallback((e) => {
    if (closed) return;
    const pt = svgCoord(e.clientX, e.clientY);
    if (!pt) return;
    if (vertices.length >= 2) {
      const first = vertices[0];
      const dist = Math.sqrt((pt.x - first.x) ** 2 + (pt.y - first.y) ** 2);
      if (dist < 0.5) { handleClose(); return; }
    }
    if (clickMovedRef.current) return;
    addVertex(pt);
  }, [closed, vertices, svgCoord, addVertex, handleClose]);

  const handleCanvasMove = useCallback((e) => {
    if (clickStartRef.current) {
      const dx = e.clientX - clickStartRef.current.x;
      const dy = e.clientY - clickStartRef.current.y;
      if (dx * dx + dy * dy > 16) clickMovedRef.current = true;
    }
    const pt = svgCoord(e.clientX, e.clientY);
    if (!pt) return;
    setCursorPos(pt);
    if (!closed && vertices.length > 0 && !isPanning) {
      const last = vertices[vertices.length - 1];
      const snapped = snapToGrid(pt);
      if (snapped.x !== last.x || snapped.y !== last.y) {
        const constrained = constrainAxis(last, snapped);
        if (constrained.x !== last.x || constrained.y !== last.y) {
          const dir = getDirection(last, constrained);
          const len = Math.sqrt((constrained.x - last.x) ** 2 + (constrained.y - last.y) ** 2);
          setGhost({ from: last, to: constrained, dir, len });
          return;
        }
      }
    }
    setGhost(null);
  }, [closed, vertices, isPanning, svgCoord]);

  const handleCanvasLeave = useCallback(() => {
    setCursorPos(null);
    setGhost(null);
    clickStartRef.current = null;
  }, []);

  const handleQuickRect = () => {
    const l = Math.max(0.5, rectL);
    const w = Math.max(0.5, rectW);
    const ne = [
      { direction: "right", length: l },
      { direction: "down", length: w },
      { direction: "left", length: l },
      { direction: "up", length: w },
    ];
    setEdges(ne);
    setShowEdgeTable(false);
    onChange(verticesFromEdges(ne, { x: 0, y: 0 }));
  };

  const handleDirChange = (i, dir) => {
    const ne = edges.map((e, j) => j === i ? { ...e, direction: dir } : e);
    setEdges(ne);
    if (ne.length > 0) onChange(verticesFromEdges(ne, { x: 0, y: 0 }));
  };

  const handleLengthChange = (i, val) => {
    const len = Math.max(0.5, Number(val) || 0);
    const ne = edges.map((e, j) => j === i ? { ...e, length: len } : e);
    setEdges(ne);
    if (ne.length > 0) onChange(verticesFromEdges(ne, { x: 0, y: 0 }));
  };

  const handleAddEdge = () => {
    const ne = [...edges, { direction: "right", length: 3 }];
    setEdges(ne);
    onChange(verticesFromEdges(ne, { x: 0, y: 0 }));
  };

  const handleRemoveEdge = (i) => {
    const ne = edges.filter((_, j) => j !== i);
    setEdges(ne);
    onChange(ne.length === 0 ? [] : verticesFromEdges(ne, { x: 0, y: 0 }));
  };

  const handleUndo = () => {
    if (closed) return;
    if (edges.length === 0) { onChange([]); setEdges([]); return; }
    handleRemoveEdge(edges.length - 1);
  };

  const handleClear = () => { onChange([]); setEdges([]); setGhost(null); resetView(); };

  const handleVertexDown = (idx, e) => {
    if (!closed) return;
    e.preventDefault();
    e.stopPropagation();
    setDragIdx(idx);
  };

  const handleDragMove = useCallback((e) => {
    if (dragIdx === null || !svgRef.current) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const pt = svgCoord(t.clientX, t.clientY);
    if (pt) {
      const snapped = snapToGrid(pt);
      const nv = [...vertices];
      nv[dragIdx] = snapped;
      if (dragIdx === 0 && closed) nv[nv.length - 1] = snapped;
      onChange(nv);
    }
  }, [dragIdx, vertices, closed, onChange, svgCoord]);

  const handleDragUp = useCallback(() => { setDragIdx(null); clickStartRef.current = null; }, []);

  useEffect(() => {
    if (dragIdx === null) return;
    const onMove = (e) => handleDragMove(e);
    const onUp = () => handleDragUp();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragIdx, handleDragMove, handleDragUp]);

  const [edgeDragIdx, setEdgeDragIdx] = useState(null);
  const edgeDragStartRef = useRef(null);
  const edgeDraggedRef = useRef(false);

  const handleEdgeDown = useCallback((i, e) => {
    e.preventDefault();
    e.stopPropagation();
    const ni = (i + 1) % vertices.length;
    if (!closed && i >= vertices.length - 1) return;
    const ev = e.touches ? e.touches[0] : e;
    const isH = Math.abs(vertices[ni].x - vertices[i].x) > Math.abs(vertices[ni].y - vertices[i].y);
    edgeDragStartRef.current = { sx: ev.clientX, sy: ev.clientY, vx: vertices[i].x, vy: vertices[i].y, nx: vertices[ni].x, ny: vertices[ni].y, isH };
    edgeDraggedRef.current = false;
    setEdgeDragIdx(i);
  }, [closed, vertices]);

  const handleEdgeDragMove = useCallback((e) => {
    if (edgeDragIdx === null) return;
    const ed = edgeDragStartRef.current;
    if (!ed) return;
    const ev = e.touches ? e.touches[0] : e;
    const dx = (ev.clientX - ed.sx) / SCALE;
    const dy = (ev.clientY - ed.sy) / SCALE;
    if (dx * dx + dy * dy > 0.01) edgeDraggedRef.current = true;
    const snap = (v) => Math.round(v / 0.5) * 0.5;
    const nv = [...vertices];
    const ni = (edgeDragIdx + 1) % vertices.length;
    if (ed.isH) {
      const d = snap(dy);
      nv[edgeDragIdx] = { x: ed.vx, y: ed.vy + d };
      nv[ni] = { x: ed.nx, y: ed.ny + d };
    } else {
      const d = snap(dx);
      nv[edgeDragIdx] = { x: ed.vx + d, y: ed.vy };
      nv[ni] = { x: ed.nx + d, y: ed.ny };
    }
    if (closed && (ni === 0 || edgeDragIdx === 0)) nv[nv.length - 1] = { ...nv[0] };
    onChange(nv);
  }, [edgeDragIdx, vertices, closed, onChange]);

  const handleEdgeDragUp = useCallback(() => { setEdgeDragIdx(null); }, []);

  useEffect(() => {
    if (edgeDragIdx === null) return;
    const onMove = (e) => handleEdgeDragMove(e);
    const onUp = () => handleEdgeDragUp();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [edgeDragIdx, handleEdgeDragMove, handleEdgeDragUp]);

  const handleBgMouseDown = useCallback((e) => {
    if (e.button !== 0 || dragIdx !== null) return;
    e.preventDefault();
    clickStartRef.current = { x: e.clientX, y: e.clientY };
    clickMovedRef.current = false;
    setIsPanning(true);
    panStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y, zoomV: zoom };
  }, [dragIdx, pan, zoom]);

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e) => {
      if (!panStartRef.current) return;
      e.preventDefault();
      const rect = svgRef.current.getBoundingClientRect();
      const dx = (e.clientX - panStartRef.current.clientX) / rect.width;
      const dy = (e.clientY - panStartRef.current.clientY) / rect.height;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    };
    const onUp = () => { setIsPanning(false); panStartRef.current = null; clickStartRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isPanning]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const zoomInRef = useRef(zoomIn);
  const zoomOutRef = useRef(zoomOut);
  const resetViewRef = useRef(resetView);
  zoomInRef.current = zoomIn;
  zoomOutRef.current = zoomOut;
  resetViewRef.current = resetView;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleUndo(); }
      if (e.key === "=" || e.key === "+") { e.preventDefault(); zoomInRef.current(); }
      if (e.key === "-") { e.preventDefault(); zoomOutRef.current(); }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); resetViewRef.current(); }
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setIsFullscreen(s => !s); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const kVerts = useMemo(() => vertices.map((v) => {
    const { kx, ky } = toK(v);
    return { ...v, kx, ky };
  }), [vertices]);

  const skeleton = useMemo(() => {
    if (!closed || vertices.length < 3) return null;
    const custom = customRectRoof(vertices, sides);
    if (custom) return custom;
    const sk = computeRoofSkeleton(vertices, slope || 20, sides);
    if (sk && !sk.error) return sk;
    return null;
  }, [closed, vertices, slope, sides]);

  const waterDirections = useMemo(() => {
    if (!closed || vertices.length < 3) return [];
    return computeWaterDirections(vertices, sides);
  }, [closed, vertices, sides]);

  const markedSkeleton = useMemo(() => {
    if (!skeleton || !closed) return null;
    const flatVertKeys = new Set();
    for (let i = 0; i < sides.length && i < vertices.length; i++) {
      if (sides[i]?.isActive === false) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        if (v1) flatVertKeys.add(`${v1.x.toFixed(3)},${v1.y.toFixed(3)}`);
        if (v2) flatVertKeys.add(`${v2.x.toFixed(3)},${v2.y.toFixed(3)}`);
      }
    }
    function isFlat(e) {
      const sk = `${e.start.x.toFixed(3)},${e.start.y.toFixed(3)}`;
      const ek = `${e.end.x.toFixed(3)},${e.end.y.toFixed(3)}`;
      return flatVertKeys.has(sk) || flatVertKeys.has(ek);
    }
    return {
      ridges: (skeleton.ridges || []).map(r => ({ ...r, flat: false })),
      hips: (skeleton.hips || []).map(h => ({ ...h, flat: isFlat(h) })),
      valleys: (skeleton.valleys || []).map(v => ({ ...v, flat: isFlat(v) })),
      gables: (skeleton.gables || []).map(g => ({ ...g, flat: true })),
      faces: skeleton.faces || [],
    };
  }, [skeleton, sides, vertices, closed]);

  const gridLines = useMemo(() => {
    const lines = [];
    const count = Math.round(GRID_M / 0.5) + 1;
    for (let i = 0; i < count; i++) {
      const pos = PAD + i * (SCALE * 0.5);
      const major = i % 10 === 0;
      lines.push(
        <line key={`v${i}`} x1={pos} y1={PAD} x2={pos} y2={PAD + GRID_M * SCALE}
          stroke={major ? "#d1d5db" : "#f3f4f6"} strokeWidth={major ? 1 : 0.5} />,
        <line key={`h${i}`} x1={PAD} y1={pos} x2={PAD + GRID_M * SCALE} y2={pos}
          stroke={major ? "#d1d5db" : "#f3f4f6"} strokeWidth={major ? 1 : 0.5} />
      );
    }
    return lines;
  }, []);

  const axisLabels = [];
  for (let val = 0; val <= GRID_M; val += 5) {
    const pos = PAD + val * SCALE;
    axisLabels.push(
      <text key={`ax${val}`} x={pos - 4} y={PAD + GRID_M * SCALE + 12} fontSize={9} fill="#9ca3af">{val}</text>,
      <text key={`ay${val}`} x={PAD - 14} y={pos + 4} fontSize={9} fill="#9ca3af">{val}</text>
    );
  }

  const polygonFill = closed && kVerts.length > 2 ? (
    <polygon points={kVerts.map(v => `${v.kx},${v.ky}`).join(" ")} fill="#fffbeb" opacity={0.5} />
  ) : null;

  const roofFaceEls = closed && skeleton && skeleton.faces ? skeleton.faces.map((face, fi) => {
    if (!face || face.length < 3) return null;
    const pts = face.map(p => { const k = toK(p); return `${k.kx},${k.ky}`; }).join(" ");
    const h = (skeleton.faceHeights && skeleton.faceHeights[fi]) ? skeleton.faceHeights[fi] : 0;
    const maxH = skeleton.faceHeights ? Math.max(...skeleton.faceHeights, 0.01) : 1;
    const ratio = Math.min(h / maxH, 1);
    // Color gradient: light amber → darker amber → orange based on height
    const r = Math.round(245 - ratio * 40);
    const g = Math.round(200 - ratio * 110);
    const b = Math.round(130 - ratio * 90);
    const opacity = 0.12 + ratio * 0.15;
    return (
      <polygon key={`face${fi}`} points={pts}
        fill={`rgb(${r},${g},${b})`}
        fillOpacity={opacity}
        stroke={`rgb(${r - 30},${g - 30},${b - 20})`}
        strokeWidth={0.5}
        strokeOpacity={0.3}
      />
    );
  }) : null;

  const waterArrowEls = closed && waterDirections.length > 0 ? waterDirections.filter(d => d && d.isActive).map((d, i) => {
    const f = toK({ x: d.fromX, y: d.fromY });
    const t = toK({ x: d.toX, y: d.toY });
    const arrowLen = 8;
    const angle = Math.atan2(t.ky - f.ky, t.kx - f.kx);
    const ax1 = t.kx - arrowLen * Math.cos(angle - 0.5);
    const ay1 = t.ky - arrowLen * Math.sin(angle - 0.5);
    const ax2 = t.kx - arrowLen * Math.cos(angle + 0.5);
    const ay2 = t.ky - arrowLen * Math.sin(angle + 0.5);
    return (
      <g key={`water${i}`}>
        <line x1={f.kx} y1={f.ky} x2={t.kx} y2={t.ky}
          stroke="#38bdf8" strokeWidth={1.5} strokeLinecap="round" opacity={0.7}
          strokeDasharray="3 2" />
        <polygon points={`${t.kx},${t.ky} ${ax1},${ay1} ${ax2},${ay2}`}
          fill="#38bdf8" opacity={0.7} />
      </g>
    );
  }) : null;

  const ghostLine = ghost && !closed ? (() => {
    const f = toK(ghost.from);
    const t = toK(ghost.to);
    const mx = (f.kx + t.kx) / 2, my = (f.ky + t.ky) / 2;
    return (
      <g>
        <line x1={f.kx} y1={f.ky} x2={t.kx} y2={t.ky} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round" opacity={0.7} />
        <circle cx={t.kx} cy={t.ky} r={5} fill="#f59e0b" opacity={0.5} />
        <rect x={mx - 14} y={my - 7} width={28} height={14} rx={4} fill="white" fillOpacity={0.85} stroke="#f59e0b" strokeWidth={0.5} />
        <text x={mx} y={my + 3} fontSize={7} fontWeight="bold" fill="#d97706" textAnchor="middle">{ghost.len.toFixed(1)}</text>
      </g>
    );
  })() : null;

  const closedEdgeEls = closed ? edgesFromVerts.map((e, i) => {
    const { kx: x1, ky: y1 } = toK({ x: e.x1, y: e.y1 });
    const { kx: x2, ky: y2 } = toK({ x: e.x2, y: e.y2 });
    const isActiveSide = sides[i]?.isActive !== false;
    const hasFacadeSide = sides[i]?.hasFacade !== false;
    const clr = isActiveSide ? (hasFacadeSide ? "#d97706" : "#9ca3af") : "#cbd5e1";
    const dash = isActiveSide ? "none" : "8 4";
    const sw = isActiveSide ? 4 : 2;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const outside = { right: { x: 0, y: -1 }, left: { x: 0, y: 1 }, down: { x: -1, y: 0 }, up: { x: 1, y: 0 } };
    const dir = outside[e.direction] || { x: 0, y: -1 };
    const lx = mx + dir.x * 12, ly = my + dir.y * 12;
    const xOff = -dir.y * 10, yOff = dir.x * 10;
    return (
      <g key={`e${i}`} className={isRect ? "cursor-pointer" : "cursor-not-allowed"} onClick={(e) => { e.stopPropagation(); if (closed && !edgeDraggedRef.current && isRect) onToggleActive?.(i); }}

        onMouseDown={(e) => handleEdgeDown(i, e)} onTouchStart={(e) => handleEdgeDown(i, e)}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={clr} strokeWidth={sw} strokeDasharray={dash} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={24} strokeLinecap="round" />
        <circle cx={mx} cy={my} r={3} fill={clr} />
        <text x={lx} y={ly - 2} fontSize={8} fontWeight="bold" fill={clr} fontFamily="system-ui" textAnchor="middle" paintOrder="stroke" stroke="white" strokeWidth={3}>{i + 1}</text>
        <text x={lx} y={ly + 9} fontSize={6} fill={clr} fontFamily="system-ui" textAnchor="middle" paintOrder="stroke" stroke="white" strokeWidth={3}>{e.length.toFixed(1)}م</text>
        {!isActiveSide && (
          <g>
            <line x1={mx + xOff - 5} y1={my + yOff - 5} x2={mx + xOff + 5} y2={my + yOff + 5} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            <line x1={mx + xOff + 5} y1={my + yOff - 5} x2={mx + xOff - 5} y2={my + yOff + 5} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
          </g>
        )}
      </g>
    );
  }) : null;

  const openEdgeEls = !closed && vertices.length > 1 ? vertices.slice(0, -1).map((v, i) => {
    const nv = vertices[i + 1];
    const { kx: x1, ky: y1 } = toK(v);
    const { kx: x2, ky: y2 } = toK(nv);
    const isH = Math.abs(nv.x - v.x) > Math.abs(nv.y - v.y);
    const len = Math.sqrt((nv.x - v.x) ** 2 + (nv.y - v.y) ** 2);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dir = isH ? { x: 0, y: -1 } : { x: 1, y: 0 };
    const lx = mx + dir.x * 12, ly = my + dir.y * 12;
    return (
      <g key={`d${i}`} className="cursor-pointer"
        onMouseDown={(e) => handleEdgeDown(i, e)} onTouchStart={(e) => handleEdgeDown(i, e)}
        onClick={(e) => e.stopPropagation()}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d97706" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={24} strokeLinecap="round" />
        <circle cx={mx} cy={my} r={3} fill="#d97706" />
        <text x={lx} y={ly - 2} fontSize={8} fontWeight="bold" fill="#d97706" fontFamily="system-ui" textAnchor="middle" paintOrder="stroke" stroke="white" strokeWidth={3}>{i + 1}</text>
        <text x={lx} y={ly + 9} fontSize={6} fill="#d97706" fontFamily="system-ui" textAnchor="middle" paintOrder="stroke" stroke="white" strokeWidth={3}>{len.toFixed(1)}م</text>
      </g>
    );
  }) : null;

  const vertexDots = kVerts.map((v, i) => {
    const isLast = i === kVerts.length - 1 && closed;
    if (isLast) return null;
    const sideActive = sides[i]?.isActive !== false;
    const prevSideActive = i > 0 ? sides[i - 1]?.isActive !== false : sides[sides.length - 1]?.isActive !== false;
    const hasActive = sideActive || prevSideActive;
    const clr = !hasActive ? "#cbd5e1" : (closed && sides[i]?.hasFacade !== false) ? "#d97706" : "#6b7280";
    const r = closed ? 12 : 9;
    const hitR = closed ? 26 : 20;
    return (
      <g key={`v${i}`}>
        <circle cx={v.kx} cy={v.ky} r={hitR} fill="transparent"
          className={closed ? "cursor-grab max-md:!cursor-grab" : "cursor-pointer"}
          onClick={!closed && i === 0 ? (e) => { e.stopPropagation(); handleClose(); } : undefined} />
        <circle cx={v.kx} cy={v.ky} r={dragIdx === i ? r + 4 : r}
          fill={i === 0 ? "#16a34a" : clr} stroke="white" strokeWidth={3}
          className={closed ? "cursor-grab" : ""}
          onClick={!closed && i === 0 ? (e) => { e.stopPropagation(); handleClose(); } : (e) => e.stopPropagation()}
          onMouseDown={(e) => handleVertexDown(i, e)}
          onTouchStart={(e) => handleVertexDown(i, e)} />
      </g>
    );
  });

  const closeHint = !closed && vertices.length >= 2 ? (() => {
    const first = kVerts[0];
    return (
      <circle cx={first.kx} cy={first.ky} r={16} fill="none" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 3" opacity={0.6}>
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
    );
  })() : null;

  const canvasUI = (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 bg-slate-100 border-2 border-slate-100 rounded-xl p-2 overflow-x-auto">
        <span className="text-[10px] font-bold text-ink-muted shrink-0">الأبعاد:</span>
        <input type="number" value={rectL} min="0.5" step="0.5"
          onChange={(e) => setRectL(Number(e.target.value))}
          className="w-14 bg-slate-100 border-2 border-slate-200 rounded-lg py-1.5 px-2 text-center text-[11px] text-ink-primary outline-none focus:border-ice-blue-400/40" />
        <span className="text-[10px] text-ink-muted">×</span>
        <input type="number" value={rectW} min="0.5" step="0.5"
          onChange={(e) => setRectW(Number(e.target.value))}
          className="w-14 bg-slate-100 border-2 border-slate-200 rounded-lg py-1.5 px-2 text-center text-[11px] text-ink-primary outline-none focus:border-ice-blue-400/40" />
        <span className="text-[10px] text-ink-muted">م</span>
        <button onClick={handleQuickRect}
          className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-600 font-bold py-1.5 px-3 rounded-lg text-[11px] transition shrink-0">
          رسم
        </button>
        <div className="hidden sm:flex gap-1 mr-1 overflow-x-auto">
          {DIM_PRESETS.map((d) => (
            <button key={d.label} onClick={() => { setRectL(d.l); setRectW(d.w); }}
              className={`px-2 py-1 rounded-md text-[9px] font-bold border transition shrink-0 ${rectL === d.l && rectW === d.w ? "bg-amber-500/20 border-amber-500/30 text-amber-600" : "bg-slate-100 border-2 border-slate-200 text-ink-muted hover:border-ice-blue-400"}`}>
              {d.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowEdgeTable(s => !s)}
          className="mr-auto text-[10px] font-bold text-ink-muted hover:text-ink-primary transition bg-slate-100 border-2 border-slate-200 rounded-lg py-1.5 px-2.5 shrink-0">
          {showEdgeTable ? 'إخفاء' : (vertices.length === 0 ? 'الأضلاع' : 'تعديل')}
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden relative select-none"
        style={{ aspectRatio: isFullscreen ? "16/9" : "1/1", touchAction: "none" }}>
        <svg ref={svgRef} viewBox={viewBox} width="100%" height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: "block",
            cursor: isPanning ? "grabbing" : (closed ? "default" : "crosshair"),
          }}
          onMouseDown={handleBgMouseDown}
          onMouseMove={handleCanvasMove}
          onMouseLeave={handleCanvasLeave}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          <rect width={SZ} height={SZ} fill="white" />
          {gridLines}
          {axisLabels}
          {polygonFill}
          {roofFaceEls}
          {waterArrowEls}
          {markedSkeleton && (
            <g className="skeleton">
              {markedSkeleton.ridges.map((r, i) => {
                const s = toK(r.start), e = toK(r.end);
                const mx = (s.kx + e.kx) / 2, my = (s.ky + e.ky) / 2;
                return <g key={`ridge${i}`}>
                  <line x1={s.kx} y1={s.ky} x2={e.kx} y2={e.ky} stroke="#ea580c" strokeWidth={2.5} strokeLinecap="round" />
                  <rect x={mx - 14} y={my - 7} width={28} height={14} rx={4} fill="white" fillOpacity={0.85} stroke="#ea580c" strokeWidth={0.5} />
                  <text x={mx} y={my + 3} fontSize={7} fontWeight="bold" fill="#ea580c" textAnchor="middle">{r.length.toFixed(1)}</text>
                </g>;
              })}
              {markedSkeleton.hips.map((h, i) => {
                const s = toK(h.start), e = toK(h.end);
                const mx = (s.kx + e.kx) / 2, my = (s.ky + e.ky) / 2;
                const flat = h.flat;
                return <g key={`hip${i}`}>
                  <line x1={s.kx} y1={s.ky} x2={e.kx} y2={e.ky} stroke={flat ? "#9ca3af" : "#dc2626"} strokeWidth={flat ? 1.5 : 2} strokeDasharray={flat ? "6 4" : "none"} strokeLinecap="round" />
                  {!flat && <><rect x={mx - 14} y={my - 7} width={28} height={14} rx={4} fill="white" fillOpacity={0.85} stroke="#dc2626" strokeWidth={0.5} />
                  <text x={mx} y={my + 3} fontSize={7} fontWeight="bold" fill="#dc2626" textAnchor="middle">{h.length.toFixed(1)}</text></>}
                </g>;
              })}
              {markedSkeleton.valleys.map((v, i) => {
                const s = toK(v.start), e = toK(v.end);
                const mx = (s.kx + e.kx) / 2, my = (s.ky + e.ky) / 2;
                const flat = v.flat;
                return <g key={`val${i}`}>
                  <line x1={s.kx} y1={s.ky} x2={e.kx} y2={e.ky} stroke={flat ? "#9ca3af" : "#2563eb"} strokeWidth={flat ? 1.5 : 2} strokeDasharray={flat ? "6 4" : "6 3"} strokeLinecap="round" />
                  {!flat && <><rect x={mx - 14} y={my - 7} width={28} height={14} rx={4} fill="white" fillOpacity={0.85} stroke="#2563eb" strokeWidth={0.5} />
                  <text x={mx} y={my + 3} fontSize={7} fontWeight="bold" fill="#2563eb" textAnchor="middle">{v.length.toFixed(1)}</text></>}
                </g>;
              })}
              {markedSkeleton.gables.map((g, i) => {
                const s = toK(g.start), e = toK(g.end);
                const mx = (s.kx + e.kx) / 2, my = (s.ky + e.ky) / 2;
                return <g key={`gab${i}`}>
                  <line x1={s.kx} y1={s.ky} x2={e.kx} y2={e.ky} stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="8 4" strokeLinecap="round" />
                  <rect x={mx - 14} y={my - 7} width={28} height={14} rx={4} fill="white" fillOpacity={0.85} stroke="#9ca3af" strokeWidth={0.5} />
                  <text x={mx} y={my + 3} fontSize={7} fontWeight="bold" fill="#9ca3af" textAnchor="middle">{g.length.toFixed(1)}</text>
                </g>;
              })}
            </g>
          )}
          {closedEdgeEls}
          {openEdgeEls}
          {ghostLine}
          {closeHint}
          {vertexDots}
        </svg>

        {/* Close button overlay */}
        {!closed && vertices.length >= 2 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <button onClick={handleClose}
              className="bg-accent-emerald hover:bg-emerald-600 text-paper font-bold py-2.5 px-6 rounded-xl text-[13px] transition shadow-lg flex items-center gap-2 animate-pulse">
              <Check className="w-4 h-4" /> إغلاق الشكل
            </button>
          </div>
        )}

        {/* Empty state */}
        {vertices.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <svg viewBox="0 0 200 200" className="w-44 h-44 mx-auto mb-2 opacity-80">
                {Array.from({length: 11}, (_, i) => {
                  const pos = 20 + i * 16;
                  return (
                    <g key={`g${i}`}>
                      <line x1={pos} y1={20} x2={pos} y2={180}
                        stroke="#d1d5db" strokeWidth={i % 5 === 0 ? "0.8" : "0.4"} />
                      <line x1={20} y1={pos} x2={180} y2={pos}
                        stroke="#d1d5db" strokeWidth={i % 5 === 0 ? "0.8" : "0.4"} />
                    </g>
                  );
                })}
                <text x={20} y={194} fontSize="6" fill="#9ca3af" textAnchor="middle">0</text>
                <text x={180} y={194} fontSize="6" fill="#9ca3af" textAnchor="middle">10</text>
                <text x={14} y={22} fontSize="6" fill="#9ca3af" textAnchor="end">0</text>
                <text x={14} y={182} fontSize="6" fill="#9ca3af" textAnchor="end">10</text>
                <circle cx="40" cy="150" r="6" fill="none" stroke="#16a34a" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0;0;0.7;0;0;0" keyTimes="0;0.04;0.06;0.12;0.14;1" dur="12s" repeatCount="indefinite" />
                </circle>
                <g>
                  <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.05;0.06;0.14;0.16;1" dur="12s" repeatCount="indefinite" />
                  <polygon points="32,158 40,148 38,160" fill="#16a34a" />
                </g>
                <polygon points="40,150 170,150 170,40 40,40" fill="#fffbeb">
                  <animate attributeName="opacity" values="0;0;0.45;0.45;0;0" keyTimes="0;0.38;0.42;0.75;0.77;1" dur="12s" repeatCount="indefinite" />
                </polygon>
                <polyline points="40,150 170,150 170,40 40,40 40,150" fill="none" stroke="#d97706" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" strokeDasharray="480">
                  <animate attributeName="stroke-dashoffset" values="480;480;0;0;480;480" keyTimes="0;0.1;0.35;0.75;0.77;1" dur="12s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.75;0.77;1" dur="12s" repeatCount="indefinite" />
                </polyline>
                {[
                  { cx: 40, cy: 150, num: 1, fill: "#16a34a", kt: [0.07, 0.09] },
                  { cx: 170, cy: 150, num: 2, fill: "#d97706", kt: [0.18, 0.2] },
                  { cx: 170, cy: 40, num: 3, fill: "#d97706", kt: [0.27, 0.29] },
                  { cx: 40, cy: 40, num: 4, fill: "#d97706", kt: [0.35, 0.37] },
                ].map(({ cx, cy, num, fill, kt }) => (
                  <g key={`demoV${num}`}>
                    <circle cx={cx} cy={cy} r={num === 1 ? 5 : 4} fill={fill} stroke="white" strokeWidth="1.5">
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${kt[0]};${kt[1]};0.75;0.77;1`} dur="12s" repeatCount="indefinite" />
                    </circle>
                    <g>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${kt[0]};${kt[1]};0.75;0.77;1`} dur="12s" repeatCount="indefinite" />
                      <text x={cx} y={cy - 8} fontSize="6" fontWeight="bold" fill={fill} textAnchor="middle">{num}</text>
                    </g>
                  </g>
                ))}
                {[
                  { x1: 75, y1: 150, x2: 110, y2: 150, label: "8.0م", kt: [0.14, 0.16] },
                  { x1: 170, y1: 115, x2: 170, y2: 80, label: "7.0م", kt: [0.23, 0.25], lx: 162, ly: 108 },
                  { x1: 125, y1: 40, x2: 90, y2: 40, label: "8.0م", kt: [0.32, 0.34] },
                  { x1: 40, y1: 85, x2: 40, y2: 120, label: "7.0م", kt: [0.4, 0.42], lx: 28, ly: 108 },
                ].map(({ x1, y1, x2, y2, label, kt, lx, ly }, i) => (
                  <g key={`demoE${i}`}>
                    <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${kt[0]};${kt[1]};0.75;0.77;1`} dur="12s" repeatCount="indefinite" />
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d97706" strokeWidth="1" />
                    <polygon points={`${x2},${y2} ${x2 - (x2 > x1 ? 6 : -6)},${y2 - 3} ${x2 - (x2 > x1 ? 6 : -6)},${y2 + 3}`} fill="#d97706" />
                    <text x={lx || (x1 + x2) / 2} y={ly || ((y1 + y2) / 2) - 5} fontSize="5" fill="#d97706" textAnchor="middle" fontWeight="bold">{label}</text>
                  </g>
                ))}
              </svg>
              <p className="text-xs text-ink-muted/60 font-bold">اضغط على الشبكة لبدء الرسم</p>
              <p className="text-[9px] text-ink-muted/40 mt-1">أو استخدم الأبعاد أعلاه للرسم السريع</p>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 border-2 border-slate-200 rounded-xl px-2 py-1.5 shadow-sm no-print z-10">
          <button onClick={zoomOut} className="w-7 h-7 rounded-lg hover:bg-slate-100 text-ink-muted hover:text-ink-primary transition flex items-center justify-center">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1">
            <input type="range" min={MIN_ZOOM * 100} max={MAX_ZOOM * 100} step={5} value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-20 sm:w-24 h-1.5 appearance-none bg-amber-200 rounded-full cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-sm" />
          </div>
          <button onClick={zoomIn} className="w-7 h-7 rounded-lg hover:bg-slate-100 text-ink-muted hover:text-ink-primary transition flex items-center justify-center">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-bold text-ink-muted w-9 text-center">{Math.round(zoom * 100)}%</span>
          <div className="w-px h-5 bg-slate-200" />
          <button onClick={zoomToFit} className="w-7 h-7 rounded-lg hover:bg-slate-100 text-ink-muted hover:text-ink-primary transition flex items-center justify-center" title="ملاءمة الرسم">
            <Maximize2 className="w-3 h-3" />
          </button>
          <button onClick={resetView} className="w-7 h-7 rounded-lg hover:bg-slate-100 text-ink-muted hover:text-ink-primary transition flex items-center justify-center" title="تصغير الكل">
            <Minimize2 className="w-3 h-3" />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <button onClick={() => setIsFullscreen(s => !s)}
            className={`w-7 h-7 rounded-lg hover:bg-slate-100 transition flex items-center justify-center ${isFullscreen ? "bg-amber-500/20 text-amber-600" : "text-ink-muted hover:text-ink-primary"}`}
            title={isFullscreen ? "خروج من الشاشة الكاملة" : "شاشة كاملة"}>
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>

        {/* Cursor coordinates */}
        {cursorPos && (
          <div className="absolute bottom-14 left-2 bg-white/90 border-2 border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold text-ink-muted no-print z-10 flex items-center gap-2">
            <span>{cursorPos.x.toFixed(1)}, {cursorPos.y.toFixed(1)}</span>
            {ghost && (
              <span className="text-amber-400 flex items-center gap-1">
                <Move className="w-3 h-3" />
                {ghost.len.toFixed(1)}م
              </span>
            )}
            {closed && area > 0 && (
              <span className="text-amber-400">مساحة: {area.toFixed(1)} م²</span>
            )}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="absolute top-2 right-2 hidden sm:flex gap-1 no-print z-10">
          <span className="bg-white/70 border-2 border-slate-200 rounded-md px-1.5 py-0.5 text-[7px] text-ink-muted font-mono">Ctrl+Z</span>
          <span className="bg-white/70 border-2 border-slate-200 rounded-md px-1.5 py-0.5 text-[7px] text-ink-muted font-mono">+/-</span>
          <span className="bg-white/70 border-2 border-slate-200 rounded-md px-1.5 py-0.5 text-[7px] text-ink-muted font-mono">F</span>
        </div>
      </div>

      {/* Edge table */}
      {showEdgeTable && (
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 space-y-1.5">
          <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-ink-muted pb-1 border-b border-slate-100">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 text-right">الاتجاه</div>
            <div className="col-span-3 text-right">الطول</div>
            <div className="col-span-3 text-center">ميل/سكني</div>
          </div>
          {edges.length === 0 && !closed && (
            <p className="text-[10px] text-ink-muted text-center py-2">ما في أضلاع — اضف أول ضلع</p>
          )}
          {edges.map((e, i) => (
            <div key={i} className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-1 flex justify-center">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 font-bold flex items-center justify-center text-[9px]">{i + 1}</span>
              </div>
              <div className="col-span-5 flex gap-1">
                {["right", "left", "down", "up"].map((d) => (
                  <button key={d} disabled={closed}
                    onClick={() => handleDirChange(i, d)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${e.direction === d
                      ? (closed ? "bg-slate-100 text-ink-muted cursor-default" : "bg-amber-500/20 text-amber-600 shadow-sm")
                      : (closed ? "bg-white border-2 border-slate-100 text-ink-muted cursor-default" : "bg-slate-100 border-2 border-slate-200 text-ink-muted hover:border-ice-blue-400/40 hover:text-ink-primary")
                    }`}>
                    {{ right: "→", left: "←", down: "↓", up: "↑" }[d]}
                  </button>
                ))}
              </div>
              <div className="col-span-3">
                <input type="number" value={e.length} min="0.5" step="0.5" disabled={closed}
                  onChange={(ev) => handleLengthChange(i, ev.target.value)}
                  className={`w-full border rounded-lg py-1 px-1.5 text-center text-[11px] outline-none ${closed ? "bg-white text-ink-muted border-slate-100 cursor-default" : "bg-slate-100 border-slate-200 text-ink-primary focus:border-ice-blue-400/40"}`} />
              </div>
              <div className="col-span-3 flex justify-center gap-1">
                {closed && (
                  <>
                    <button onClick={() => onToggleActive?.(i)}
                      disabled={!isRect}
                      className={`w-7 h-7 rounded-lg border text-[9px] font-bold transition flex items-center justify-center ${sides[i]?.isActive !== false ? "bg-amber-500/20 border-amber-500/30 text-amber-600 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400" : "bg-slate-100 border-slate-200 text-ink-muted hover:bg-amber-500/20 hover:border-amber-500/30 hover:text-amber-600"} ${!isRect ? "opacity-30 cursor-not-allowed" : ""}`}
                      title={!isRect ? "الجدران المعطلة خاصة بالمستطيلات فقط" : (sides[i]?.isActive !== false ? "إلغاء الميل" : "تفعيل الميل")}>
                      {sides[i]?.isActive !== false ? "م" : "—"}
                    </button>
                  </>
                )}
                {!closed && (
                  <button onClick={() => handleRemoveEdge(i)}
                    className="w-7 h-7 rounded-lg border-2 border-slate-200 bg-slate-100 text-red-400 hover:text-red-300 hover:border-red-500/30 transition flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!closed && (
            <button onClick={handleAddEdge}
              className="w-full mt-1 py-1.5 rounded-lg text-[10px] font-bold border border-dashed border-slate-200 text-ink-muted hover:text-ink-primary hover:border-ice-blue-400/40 transition flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> {edges.length === 0 ? 'أضف أول ضلع' : 'إضافة ضلع'}
            </button>
          )}
        </div>
      )}

      {edges.length > 0 && !showEdgeTable && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {edges.map((e, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border-2 border-slate-100 rounded-xl px-3 py-1.5 text-[10px]">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-ink-muted">{{ right: "→ يمين", left: "← يسار", down: "↓ تحت", up: "↑ فوق" }[e.direction] || e.direction}</span>
              <span className="flex-1 text-left font-bold text-ink-primary">{e.length.toFixed(1)}م</span>
              {closed && (sides[i]?.isActive === false) && (
                <span className="text-[8px] text-ink-muted bg-slate-200 rounded-full px-1.5 py-0.5">بدون ميل</span>
              )}
              {!closed && (
                <button onClick={() => handleRemoveEdge(i)} className="text-red-400 hover:text-red-300 p-1">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {edges.length > 0 && (
            <button onClick={handleUndo}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition bg-slate-100 border-slate-200 text-ink-muted hover:border-ice-blue-400 hover:text-ink-primary">
              <Undo2 className="w-3 h-3 ml-1 inline" /> تراجع
            </button>
          )}
          <button onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition bg-slate-100 border-slate-200 text-ink-muted hover:border-red-400 hover:text-red-500">
            <Trash2 className="w-3 h-3 ml-1 inline" /> مسح
          </button>
          {!closed && vertices.length >= 2 && (
            <button onClick={handleClose}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-accent-emerald text-paper hover:bg-emerald-600 transition">
              <Check className="w-3 h-3 ml-1 inline" /> إغلاق
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-ink-muted">
          {edges.length > 0 && (
            <span><Grid3x3 className="w-3 h-3 ml-1 inline text-amber-400" />{edges.length} أضلاع</span>
          )}
          {area > 0 && (
            <span><Ruler className="w-3 h-3 ml-1 inline text-amber-400" />{area.toFixed(1)} م²</span>
          )}
        </div>
      </div>

      {/* Help */}
      {closed && (
        <div className="bg-[rgba(56,182,248,0.04)] border border-[rgba(56,182,248,0.1)] rounded-xl p-2.5 space-y-1.5">
          <p className="text-[9px] font-bold text-ice-blue-600 flex items-center gap-1">
            التحكم بالأضلاع — اسحب الرأس أو انقر على الضلع:
          </p>
          <svg viewBox="0 0 250 70" className="w-full h-12">
            <line x1="10" y1="55" x2="60" y2="55" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            <text x="68" y="58" fontSize="6" fill="#d97706" fontFamily="system-ui">له ميل (طرابيش)</text>
            <line x1="135" y1="55" x2="185" y2="55" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 4" strokeLinecap="round" />
            <text x="193" y="58" fontSize="6" fill="#cbd5e1" fontFamily="system-ui">بدون ميل (بدون طرابيش)</text>
          </svg>
          <p className="text-[7px] text-ice-blue-600/70 text-center leading-tight">
            انقر على الضلع لتبديل حالة الميل — الطرابيش تُحسب حسب الأضلاع النشطة
          </p>
        </div>
      )}

      {vertices.length === 0 && (
        <p className="text-[9px] text-ink-muted text-center">
          اضغط على الشبكة لبدء الرسم، أو استخدم الأبعاد أعلاه والقوالب الجاهزة
        </p>
      )}
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-100">
          <span className="text-sm font-bold text-ink-primary">
            شاشة الرسم
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-ink-muted hidden sm:block">
              <kbd className="bg-slate-100 border-2 border-slate-200 rounded px-1 py-0.5 font-mono text-[8px]">Ctrl+Z</kbd> تراجع
              <kbd className="bg-slate-100 border-2 border-slate-200 rounded px-1 py-0.5 font-mono text-[8px] mr-1">+/-</kbd> تكبير
            </span>
            <button onClick={() => setIsFullscreen(false)}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-1.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> خروج
            </button>
          </div>
        </div>
        <div className="flex-1 p-3 overflow-hidden">
          {canvasUI}
        </div>
      </div>
    );
  }

  return <div className="space-y-3">{canvasUI}</div>;
}
