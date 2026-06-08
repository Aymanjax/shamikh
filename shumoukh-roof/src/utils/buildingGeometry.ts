// @ts-nocheck
export function edgesFromVertices(vertices) {
  if (!vertices || vertices.length < 2) return [];
  const closed = [...vertices];
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
    closed.push(first);
  }
  const edges = [];
  for (let i = 0; i < closed.length - 1; i++) {
    const p1 = closed[i], p2 = closed[i + 1];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    let direction;
    if (Math.abs(dx) < 0.001 && dy > 0.001) direction = "down";
    else if (Math.abs(dx) < 0.001 && dy < -0.001) direction = "up";
    else if (dx > 0.001 && Math.abs(dy) < 0.001) direction = "right";
    else if (dx < -0.001 && Math.abs(dy) < 0.001) direction = "left";
    else direction = "diagonal";
    edges.push({
      length: Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100,
      direction,
      hasFacade: true,
      isActive: true,
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
    });
  }
  return edges;
}

export function shoelaceArea(vertices) {
  if (!vertices || vertices.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    sum += vertices[i].x * vertices[j].y;
    sum -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(sum) / 2;
}

export function isPolygonClosed(vertices) {
  if (!vertices || vertices.length < 3) return false;
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  return Math.abs(first.x - last.x) < 0.001 && Math.abs(first.y - last.y) < 0.001;
}

const GRID = 0.5;
const SNAP = GRID / 2;

export function snapToGrid(v) {
  return {
    x: Math.round(v.x / GRID) * GRID,
    y: Math.round(v.y / GRID) * GRID,
  };
}

export function isNearPoint(a, b, threshold = SNAP) {
  return Math.abs(a.x - b.x) < threshold && Math.abs(a.y - b.y) < threshold;
}

export function isValidNextPoint(vertices, point) {
  if (!vertices.length) return true;
  const last = vertices[vertices.length - 1];
  if (isNearPoint(point, last)) return false;
  const dx = point.x - last.x;
  const dy = point.y - last.y;
  return (Math.abs(dx) < 0.001 && Math.abs(dy) > 0.001) ||
         (Math.abs(dy) < 0.001 && Math.abs(dx) > 0.001);
}

export const DIR_MAP = {
  right: { dx: 1, dy: 0 },
  left: { dx: -1, dy: 0 },
  down: { dx: 0, dy: 1 },
  up: { dx: 0, dy: -1 },
};

export function verticesFromEdges(edges, startPt) {
  const sx = startPt ? startPt.x : 0;
  const sy = startPt ? startPt.y : 0;
  if (!edges || !edges.length) return startPt ? [{ x: sx, y: sy }] : [];
  const verts = [{ x: sx, y: sy }];
  let cx = sx, cy = sy;
  for (const e of edges) {
    const d = DIR_MAP[e.direction];
    if (!d) return [];
    cx += d.dx * e.length;
    cy += d.dy * e.length;
    cx = Math.round(cx * 100) / 100;
    cy = Math.round(cy * 100) / 100;
    verts.push({ x: cx, y: cy });
  }
  return verts;
}

export function svgToPngDataUrl(svgElement, size = 600) {
  const clone = svgElement.cloneNode(true);
  clone.setAttribute("width", size);
  clone.setAttribute("height", size);
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function fitSvgToBounds(svgElement, vertices, paddingM = 1.5) {
  if (!vertices || vertices.length < 2) return svgElement;
  const SCALE = 32, PAD = 30;
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  const minXP = PAD + (Math.min(...xs) - paddingM) * SCALE;
  const maxXP = PAD + (Math.max(...xs) + paddingM) * SCALE;
  const minYP = PAD + (Math.min(...ys) - paddingM) * SCALE;
  const maxYP = PAD + (Math.max(...ys) + paddingM) * SCALE;
  const w = maxXP - minXP || SCALE;
  const h = maxYP - minYP || SCALE;
  svgElement.setAttribute("viewBox", `${minXP} ${minYP} ${w} ${h}`);
  svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svgElement;
}

export function isConvexPolygon(vertices) {
  if (!vertices || vertices.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const c = vertices[(i + 2) % vertices.length];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) > 1e-10) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

export function isRectangular(vertices) {
  if (!vertices || vertices.length < 4) return false;
  let v = vertices;
  if (v.length >= 5 && Math.abs(v[0].x - v[v.length - 1].x) < 0.01 && Math.abs(v[0].y - v[v.length - 1].y) < 0.01) {
    v = v.slice(0, -1);
  }
  if (v.length !== 4) return false;
  const xs = v.map(p => p.x), ys = v.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const corners = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
  return corners.every(([cx, cy]) => v.some(p => Math.abs(p.x - cx) < 0.1 && Math.abs(p.y - cy) < 0.1));
}