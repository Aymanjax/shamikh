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
export function computeRoofSkeleton(vertices: { x: number; y: number }[]): SkeletonResult {
  const n = vertices.length;
  if (n < 3) return emptyResult();

  // Convert to Point[] and ensure CCW
  const pts: Point[] = vertices.map(v => [v.x, v.y]);
  if (polygonArea(pts) > 0) pts.reverse();

  // Run the straight skeleton algorithm
  const ss = new StraightSkeleton();
  ss.setDistance(-Infinity); // shrink inward indefinitely
  ss.setEpsilon(0.0001);
  ss.execute(pts);

  // Extract skeleton arcs from the node graph
  const initialNodes = ss.getInitialNodes();
  const arcs = extractSkeletonArcs(initialNodes, vertices);

  // Build faces
  const faces = buildFaces(initialNodes, arcs);

  // Convert to output format
  const ridges: SkEdge[] = [];
  const hips: SkEdge[] = [];
  const valleys: SkEdge[] = [];

  for (const arc of arcs) {
    const dx = arc.end.x - arc.start.x;
    const dy = arc.end.y - arc.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 1e-9) continue;
    const edge: SkEdge = { start: arc.start, end: arc.end, length, type: arc.eType };
    if (arc.eType === 'ridge') ridges.push(edge);
    else if (arc.eType === 'hip') hips.push(edge);
    else valleys.push(edge);
  }

  const vertices3D = vertices.map(v => ({ x: v.x, y: v.y }));

  return { ridges, hips, valleys, gables: [], faces, vertices3D };
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
  eps = 1e-6
): boolean {
  return vertices.some((v) => Math.hypot(v.x - c.x, v.y - c.y) < eps);
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
      reflex.add(`${Math.round(curr.x)},${Math.round(curr.y)}`);
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
  const key = `${Math.round(c.x)},${Math.round(c.y)}`;
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
