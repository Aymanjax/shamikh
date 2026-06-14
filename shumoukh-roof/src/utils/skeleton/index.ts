// @ts-nocheck
/**
 * Straight skeleton computation for roof modeling.
 * Wraps the straight-skeleton-offset algorithm and extracts skeleton arcs.
 */

import type { Point } from './vector';
import StraightSkeleton from './StraightSkeleton';
import SkeletonNode, { EDGE_TYPE_MAPPING, EDGE_TYPE_DEGENERACY } from './SkeletonNode';

export type SkEdgeType = "ridge" | "hip" | "valley" | "gable";

export interface SkEdge {
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  type: SkEdgeType;
}

export interface SkeletonResult {
  ridges: SkEdge[];
  hips: SkEdge[];
  valleys: SkEdge[];
  gables: SkEdge[];
  faces: number[][];
  vertices3D: { x: number; y: number }[];
}

/**
 * Computes the roof skeleton for a given polygon.
 * @param vertices - polygon vertices in order (no holes)
 */
export function computeRoofSkeleton(
  vertices: { x: number; y: number }[],
  gables: boolean[] = [],
): SkeletonResult {
  const n = vertices.length;
  if (n < 3) return emptyResult();

  // Gable edges as drawable segments + midpoints (orientation-proof matching).
  const gableSegs: SkEdge[] = [];
  const gableMids: Point[] = [];
  for (let i = 0; i < n; i++) {
    if (!gables[i]) continue;
    const a = vertices[i], b = vertices[(i + 1) % n];
    gableSegs.push({ start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, length: Math.hypot(b.x - a.x, b.y - a.y), type: 'gable' });
    gableMids.push([(a.x + b.x) / 2, (a.y + b.y) / 2]);
  }

  // Convert to Point[] and ensure the winding the core expects (offsets inward).
  const pts: Point[] = vertices.map(v => [v.x, v.y]);
  if (polygonArea(pts) < 0) pts.reverse();

  // Per-edge gable flags aligned to pts (match by midpoint so reversal is safe).
  const edgeGable: boolean[] = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    return gableMids.some(m => Math.hypot(m[0] - mx, m[1] - my) < 1e-6);
  });

  // Run the straight skeleton algorithm
  const ss = new StraightSkeleton();
  ss.setDistance(-Infinity); // shrink inward indefinitely
  ss.setEpsilon(0.0001);
  ss.execute(pts, [], edgeGable);

  // Extract skeleton arcs from the node graph
  const initialNodes = ss.getInitialNodes();
  const arcs = extractSkeletonArcs(initialNodes, vertices);

  // Build faces
  const faces = buildFaces(initialNodes, arcs);

  // Convert to output format
  const ridges: SkEdge[] = [];
  const hips: SkEdge[] = [];
  const valleys: SkEdge[] = [];

  // An arc whose both endpoints lie on the same gable wall is the trace of a
  // corner sliding along that wall — it coincides with the gable, so drop it.
  const onSameGable = (s: { x: number; y: number }, e: { x: number; y: number }) =>
    gableSegs.some(g => pointOnSeg(s, g) && pointOnSeg(e, g));

  // First pass: classify arcs, dropping sliding-along-gable traces.
  const rawRidges: SkEdge[] = [];
  for (const arc of arcs) {
    const length = Math.hypot(arc.end.x - arc.start.x, arc.end.y - arc.start.y);
    if (length < 1e-9) continue;
    if (onSameGable(arc.start, arc.end)) continue;
    const edge: SkEdge = { start: arc.start, end: arc.end, length, type: arc.eType };
    if (arc.eType === 'ridge') rawRidges.push(edge);
    else if (arc.eType === 'hip') hips.push(edge);
    else valleys.push(edge);
  }

  // Valley junctions: points where a valley ends. A ridge must terminate here.
  const valleyPts = valleys.flatMap(v => [v.start, v.end]);
  const nearValley = (p: { x: number; y: number }) =>
    valleyPts.some(q => Math.hypot(p.x - q.x, p.y - q.y) < 0.05);
  const gableSegAt = (p: { x: number; y: number }) => gableSegs.find(g => pointOnSeg(p, g));

  // Second pass: a ridge that reaches a gable wall is the high ridge of the
  // gabled end and is kept — UNLESS its interior end is a valley junction, in
  // which case the ridge must stop at the valley, so drop the stub up to the wall.
  for (const r of rawRidges) {
    const g = gableSegAt(r.start) ? r.start : (gableSegAt(r.end) ? r.end : null);
    if (g) {
      const interior = (g === r.start) ? r.end : r.start;
      const seg = gableSegAt(g)!;
      const ax = r.end.x - r.start.x, ay = r.end.y - r.start.y, al = Math.hypot(ax, ay) || 1;
      const gx = seg.end.x - seg.start.x, gy = seg.end.y - seg.start.y, gl = Math.hypot(gx, gy) || 1;
      const parallel = Math.abs((ax / al) * (gy / gl) - (ay / al) * (gx / gl)) < 1e-3;
      if (!parallel && nearValley(interior)) continue; // ridge stops at the valley
    }
    ridges.push(r);
  }

  const vertices3D = vertices.map(v => ({ x: v.x, y: v.y }));

  return { ridges, hips, valleys, gables: gableSegs, faces, vertices3D };
}

/** True when point p lies on segment seg (within a small tolerance). */
function pointOnSeg(p: { x: number; y: number }, seg: SkEdge, tol = 1e-3): boolean {
  const ax = seg.start.x, ay = seg.start.y, bx = seg.end.x, by = seg.end.y;
  const dx = bx - ax, dy = by - ay;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-12) return Math.hypot(p.x - ax, p.y - ay) < tol;
  let t = ((p.x - ax) * dx + (p.y - ay) * dy) / L2;
  if (t < -tol || t > 1 + tol) return false;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (ax + t * dx), p.y - (ay + t * dy)) < tol;
}

function emptyResult(): SkeletonResult {
  return { ridges: [], hips: [], valleys: [], gables: [], faces: [], vertices3D: [] };
}

function polygonArea(pts: Point[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return a / 2;
}

interface ExtractedArc {
  start: { x: number; y: number };
  end: { x: number; y: number };
  eType: SkEdgeType;
  sourceIdx: number; // index of original vertex (or -1 for inner)
}

function nearVertex(
  c: { x: number; y: number },
  vertices: { x: number; y: number }[],
  eps = 1e-3
): boolean {
  return vertices.some((v) => Math.hypot(v.x - c.x, v.y - c.y) < eps);
}

/** Stable key at centimetre resolution so nearby vertices don't collide. */
function vKey(x: number, y: number): string {
  return `${Math.round(x * 100)},${Math.round(y * 100)}`;
}

/**
 * Build a set of rough (rounded) keys for polygon vertices that are reflex.
 */
function reflexVertices(vertices: { x: number; y: number }[]): Set<string> {
  const n = vertices.length;
  if (n < 3) return new Set();
  // Ensure CCW for correct sign
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
  }
  const ccw = area > 0;
  const reflex = new Set<string>();
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i + n - 1) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    const e1x = curr.x - prev.x;
    const e1y = curr.y - prev.y;
    const e2x = next.x - curr.x;
    const e2y = next.y - curr.y;
    const cross = e1x * e2y - e1y * e2x;
    const isReflex = ccw ? cross < 0 : cross > 0;
    if (isReflex) {
      reflex.add(vKey(curr.x, curr.y));
    }
  }
  return reflex;
}

/**
 * Return the type for an endpoint at a polygon vertex.
 */
function endpointType(
  c: { x: number; y: number },
  reflexVertSet: Set<string>
): 'hip' | 'valley' {
  const key = vKey(c.x, c.y);
  return reflexVertSet.has(key) ? 'valley' : 'hip';
}

/**
 * Classify a single skeleton segment based on its endpoints.
 * Follows the same logic as the Rust reference implementation.
 */
function classifyArc(
  start: { x: number; y: number },
  end: { x: number; y: number },
  polyVerts: { x: number; y: number }[],
  reflexVertSet: Set<string>
): 'ridge' | 'hip' | 'valley' {
  const startOnPoly = nearVertex(start, polyVerts);
  const endOnPoly = nearVertex(end, polyVerts);

  if (startOnPoly && !endOnPoly) return endpointType(start, reflexVertSet);
  if (!startOnPoly && endOnPoly) return endpointType(end, reflexVertSet);
  if (startOnPoly && endOnPoly) {
    // Both on polygon vertices; use the more severe
    const t0 = endpointType(start, reflexVertSet);
    const t1 = endpointType(end, reflexVertSet);
    return t0 === 'valley' || t1 === 'valley' ? 'valley' : 'hip';
  }
  // Neither endpoint is on a polygon vertex → interior ridge
  return 'ridge';
}

function extractSkeletonArcs(
  initialNodes: SkeletonNode[],
  polyVerts: { x: number; y: number }[]
): ExtractedArc[] {
  const arcs: ExtractedArc[] = [];
  const visited = new Set<SkeletonNode>();
  const reflexVertSet = reflexVertices(polyVerts);

  // Collect ALL unique skeleton segments (both mapping and degeneracy)
  // by doing a full graph traversal
  for (const initNode of initialNodes) {
    collectAllEdges(initNode, arcs, visited);
  }

  // Now re-classify each arc using the polygon-aware classifier
  for (const arc of arcs) {
    const newType = classifyArc(arc.start, arc.end, polyVerts, reflexVertSet);
    arc.eType = newType;
  }

  return arcs;
}

function collectAllEdges(
  node: SkeletonNode,
  arcs: ExtractedArc[],
  visited: Set<SkeletonNode>
) {
  if (visited.has(node)) return;
  visited.add(node);

  node.outgoingEdges.forEach((edgeType, target) => {
    // Record the edge only if we haven't already (prevent duplicates)
    const alreadyRecorded = arcs.some(
      (a) =>
        (a.start.x === node.p[0] && a.start.y === node.p[1] &&
         a.end.x === target.p[0] && a.end.y === target.p[1]) ||
        (a.start.x === target.p[0] && a.start.y === target.p[1] &&
         a.end.x === node.p[0] && a.end.y === node.p[1])
    );
    if (!alreadyRecorded) {
      arcs.push({
        start: { x: node.p[0], y: node.p[1] },
        end: { x: target.p[0], y: target.p[1] },
        eType: 'ridge', // temporary, will be re-classified
        sourceIdx: -1,
      });
    }
    if (!visited.has(target)) {
      collectAllEdges(target, arcs, visited);
    }
  });
}

function buildFaces(initialNodes: SkeletonNode[], arcs: ExtractedArc[]): number[][] {
  const faces: number[][] = [];

  // Simple face construction: each original edge forms a face
  // The face includes the original edge and connected skeleton nodes
  for (let i = 0; i < initialNodes.length; i++) {
    const j = (i + 1) % initialNodes.length;
    const faceVerts: number[] = [i];

    // Find arcs connected to this vertex and add their endpoints
    const endpoints: number[] = [];
    for (const arc of arcs) {
      if (arc.sourceIdx === i && arc.eType !== 'ridge') {
        // Find the index of this arc's end point
        const idx = arcs.indexOf(arc);
        endpoints.push(initialNodes.length + idx);
      }
    }

    // Add j
    faceVerts.push(j);

    if (faceVerts.length >= 3) faces.push(faceVerts);
  }

  return faces;
}

/* === للتوافق مع الاستيرادات الحالية === */
export const skeletonReady = Promise.resolve(true);

export function computeRoofSkeletonBp() {
  return { ridges: [], hips: [], valleys: [], faces: [], gables: [], error: "غير متاح" };
}
