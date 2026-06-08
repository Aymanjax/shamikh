/**
 * Draw roof skeleton lines on a 2D Canvas context.
 *
 * Two drawing modes:
 *
 * 1. drawRoofSkeleton() — for classified skeleton from our engine:
 *      { ridges, hips, valleys, gables }
 *    External wall boundary is drawn from polygonVertices.
 *
 * 2. drawRawSkeleton() — for raw straight-skeleton package output:
 *      { edges: {start,end}[], polygons: number[][] }
 *    Automatically filters out boundary edges so only interior
 *    roof lines (hips/valleys/ridges) are drawn.
 *
 * Both accept canvasWidth/canvasHeight to auto-scale the drawing
 * so the polygon fills the canvas with padding.
 */

export interface SkeletonEdge {
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
}

export interface RoofSkeleton {
  ridges: SkeletonEdge[];
  hips: SkeletonEdge[];
  valleys: SkeletonEdge[];
  gables: SkeletonEdge[];
}

export interface DrawOptions {
  /** Canvas pixel width — used for auto-scale (omit for manual scale) */
  canvasWidth?: number;
  /** Canvas pixel height — used for auto-scale (omit for manual scale) */
  canvasHeight?: number;
  /** Padding inside canvas when auto-scaling (default 30) */
  padding?: number;
  /** Manual scale override (auto-computed if canvasWidth/canvasHeight given) */
  scale?: number;
  /** Offset in canvas pixels */
  offsetX?: number;
  offsetY?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
}

export interface SkeletonDrawOptions extends DrawOptions {
  wallColor?: string;
  wallWidth?: number;
  ridgeColor?: string;
  hipColor?: string;
  valleyColor?: string;
  gableColor?: string;
  skeletonWidth?: number;
  skeletonDash?: number[];
}

const DEFAULTS = {
  wallColor: "#d97706",
  wallWidth: 2,
  ridgeColor: "#ea580c",
  hipColor: "#dc2626",
  valleyColor: "#2563eb",
  gableColor: "#9ca3af",
  skeletonWidth: 2,
  skeletonDash: [5, 5] as number[],
  padding: 30,
};

/* ─────────── HELPERS ─────────── */

/** Compute scale + offset so polygon fits inside canvas with padding. */
function fitTransform(
  verts: { x: number; y: number }[],
  cw?: number,
  ch?: number,
  padding = 30,
): { scale: number; ox: number; oy: number } {
  if (!cw || !ch || verts.length < 2) return { scale: 1, ox: 0, oy: 0 };

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of verts) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  const pw = maxX - minX || 1;
  const ph = maxY - minY || 1;
  const sx = (cw - padding * 2) / pw;
  const sy = (ch - padding * 2) / ph;
  const scale = Math.min(sx, sy);

  // Center the polygon in the canvas
  const ox = (cw - pw * scale) / 2 - minX * scale;
  const oy = (ch - ph * scale) / 2 - minY * scale;

  return { scale, ox, oy };
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  scale: number, ox: number, oy: number,
) {
  ctx.beginPath();
  ctx.moveTo(x1 * scale + ox, y1 * scale + oy);
  ctx.lineTo(x2 * scale + ox, y2 * scale + oy);
  ctx.stroke();
}

function applyStroke(ctx: CanvasRenderingContext2D, color: string, width: number, dash: number[]) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
}

/* ─────────── 1. CLASSIFIED SKELETON ─────────── */

/**
 * Draw a classified roof skeleton.
 *
 * @param ctx      Canvas 2D context
 * @param skeleton { ridges, hips, valleys, gables }
 * @param polyVerts Building footprint vertices (for outer wall)
 * @param opts     Styling + canvas sizing options
 */
export function drawRoofSkeleton(
  ctx: CanvasRenderingContext2D,
  skeleton: RoofSkeleton,
  polyVerts: { x: number; y: number }[],
  opts: SkeletonDrawOptions = {},
): void {
  const { wallColor, wallWidth, ridgeColor, hipColor, valleyColor, gableColor,
          skeletonWidth, skeletonDash, padding } = { ...DEFAULTS, ...opts };

  const { scale, ox, oy } = opts.scale
    ? { scale: opts.scale, ox: opts.offsetX || 0, oy: opts.offsetY || 0 }
    : fitTransform(polyVerts, opts.canvasWidth, opts.canvasHeight, padding);

  ctx.lineCap = opts.lineCap || "round";
  ctx.lineJoin = opts.lineJoin || "round";

  // ---- 1. Outer wall boundary (solid) ----
  if (polyVerts.length >= 3) {
    applyStroke(ctx, wallColor, wallWidth, []);
    ctx.beginPath();
    ctx.moveTo(polyVerts[0].x * scale + ox, polyVerts[0].y * scale + oy);
    for (let i = 1; i < polyVerts.length; i++) {
      ctx.lineTo(polyVerts[i].x * scale + ox, polyVerts[i].y * scale + oy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // ---- 2. Ridges (solid, thicker) ----
  if (skeleton.ridges?.length) {
    applyStroke(ctx, ridgeColor, skeletonWidth + 0.5, []);
    for (const seg of skeleton.ridges) {
      drawSegment(ctx, seg.start.x, seg.start.y, seg.end.x, seg.end.y, scale, ox, oy);
    }
  }

  // ---- 3. Hips (dashed) ----
  if (skeleton.hips?.length) {
    applyStroke(ctx, hipColor, skeletonWidth, skeletonDash);
    for (const seg of skeleton.hips) {
      drawSegment(ctx, seg.start.x, seg.start.y, seg.end.x, seg.end.y, scale, ox, oy);
    }
  }

  // ---- 4. Valleys (dashed) ----
  if (skeleton.valleys?.length) {
    applyStroke(ctx, valleyColor, skeletonWidth, skeletonDash);
    for (const seg of skeleton.valleys) {
      drawSegment(ctx, seg.start.x, seg.start.y, seg.end.x, seg.end.y, scale, ox, oy);
    }
  }

  // ---- 5. Gables (dashed, thinner) ----
  if (skeleton.gables?.length) {
    applyStroke(ctx, gableColor, skeletonWidth - 0.5, skeletonDash);
    for (const seg of skeleton.gables) {
      drawSegment(ctx, seg.start.x, seg.start.y, seg.end.x, seg.end.y, scale, ox, oy);
    }
  }

  ctx.setLineDash([]);
}

/* ─────────── 2. RAW STRAIGHT-SKELETON PACKAGE ─────────── */

/**
 * Normalize a vertex value from npm package ([x,y] or [x,y,t]) or custom engine ({x,y}).
 */
function asPoint(v: any): { x: number; y: number } | null {
  if (!v) return null;
  if (Array.isArray(v)) return { x: v[0], y: v[1] };
  if (typeof v.x === 'number') return { x: v.x, y: v.y };
  return null;
}

/**
 * Derive interior skeleton edges from raw skeleton data (both npm package and custom engine).
 *
 * npm package format: { vertices: [x,y,t][], polygons: number[][] }
 * Custom engine format: { edges: {start:{x,y},end:{x,y}}[], polygons?: number[][], vertices?: {x,y}[] }
 *
 * @returns Array of { start: {x,y}, end: {x,y} } interior edges
 */
function deriveInteriorEdges(
  raw: any,
  polyVerts: { x: number; y: number }[],
): { start: { x: number; y: number }; end: { x: number; y: number } }[] {
  // Build boundary edge set from polygon vertices
  const boundaryKeys = new Set<string>();
  const n = polyVerts.length;
  for (let i = 0; i < n; i++) {
    boundaryKeys.add(segKey(polyVerts[i], polyVerts[(i + 1) % n]));
  }

  // Count face adjacency for each edge from polygon data
  const faceCount: Record<string, number> = {};
  if (raw.polygons && (raw.vertices || (raw as any).verts)) {
    const verts = raw.vertices || (raw as any).verts;
    for (const poly of raw.polygons) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const va = asPoint(verts[a]);
        const vb = asPoint(verts[b]);
        if (!va || !vb) continue;
        const key = segKey(va, vb);
        faceCount[key] = (faceCount[key] || 0) + 1;
      }
    }
  }

  // Build edges list
  const interiorEdges: { start: { x: number; y: number }; end: { x: number; y: number } }[] = [];

  // If raw.edges is present (custom engine format), use it
  if (raw.edges) {
    for (const seg of raw.edges) {
      const start = asPoint(seg.start);
      const end = asPoint(seg.end);
      if (!start || !end) continue;
      const key = segKey(start, end);
      if (boundaryKeys.has(key)) continue;
      if (raw.polygons && (faceCount[key] || 0) < 2) continue;
      interiorEdges.push({ start, end });
    }
    return interiorEdges;
  }

  // Without edges array (npm package format), derive edges from polygons
  if (!raw.polygons || !raw.vertices) return interiorEdges;

  const verts = raw.vertices;
  for (const poly of raw.polygons) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const start = asPoint(verts[a]);
      const end = asPoint(verts[b]);
      if (!start || !end) continue;
      const key = segKey(start, end);
      // Only include interior edges (shared by 2+ faces, not boundary)
      if ((faceCount[key] || 0) < 2) continue;
      if (boundaryKeys.has(key)) continue;
      // Avoid duplicates
      if (!interiorEdges.some(e => segKey(e.start, e.end) === key)) {
        interiorEdges.push({ start, end });
      }
    }
  }

  return interiorEdges;
}

/**
 * Draw raw straight-skeleton package output (StrandedKitty format).
 *
 * Supports both:
 * - npm package: { vertices: [x,y,t][], polygons: number[][] }
 * - Custom engine: { edges: {start:{x,y},end:{x,y}}[], polygons?: number[][], vertices?: {x,y}[] }
 */
export function drawRawSkeleton(
  ctx: CanvasRenderingContext2D,
  raw: any,
  polyVerts: { x: number; y: number }[],
  opts: SkeletonDrawOptions = {},
): void {
  if (!raw) return;

  const interiorEdges = deriveInteriorEdges(raw, polyVerts);
  if (interiorEdges.length === 0) return;

  const { wallColor, wallWidth, ridgeColor, skeletonWidth, skeletonDash, padding } =
    { ...DEFAULTS, ...opts };

  const { scale, ox, oy } = opts.scale
    ? { scale: opts.scale, ox: opts.offsetX || 0, oy: opts.offsetY || 0 }
    : fitTransform(polyVerts, opts.canvasWidth, opts.canvasHeight, padding);

  ctx.lineCap = opts.lineCap || "round";
  ctx.lineJoin = opts.lineJoin || "round";

  // ---- 1. Draw outer wall boundary (solid) ----
  if (polyVerts.length >= 3) {
    applyStroke(ctx, wallColor, wallWidth, []);
    ctx.beginPath();
    ctx.moveTo(polyVerts[0].x * scale + ox, polyVerts[0].y * scale + oy);
    for (let i = 1; i < polyVerts.length; i++) {
      ctx.lineTo(polyVerts[i].x * scale + ox, polyVerts[i].y * scale + oy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // ---- 2. Draw interior skeleton edges (dashed) ----
  applyStroke(ctx, ridgeColor, skeletonWidth, skeletonDash);
  for (const seg of interiorEdges) {
    drawSegment(ctx, seg.start.x, seg.start.y, seg.end.x, seg.end.y, scale, ox, oy);
  }

  ctx.setLineDash([]);
}

/* ─────────── UTILITY ─────────── */

function segKey(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const ax = a.x.toFixed(4), ay = a.y.toFixed(4);
  const bx = b.x.toFixed(4), by = b.y.toFixed(4);
  return ax < bx || (ax === bx && ay < by)
    ? `${ax},${ay}|${bx},${by}`
    : `${bx},${by}|${ax},${ay}`;
}
