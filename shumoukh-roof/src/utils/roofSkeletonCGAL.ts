// @ts-nocheck
import { SkeletonBuilder } from 'straight-skeleton';

const EPS = 0.001;

let _ready = false;
let _initPromise: Promise<boolean> | null = null;

export function initCGAL(): Promise<boolean> {
  if (_ready) return Promise.resolve(true);
  if (_initPromise) return _initPromise;
  _initPromise = SkeletonBuilder.init()
    .then(() => { _ready = true; return true; })
    .catch((err) => { console.warn('CGAL WASM init failed:', err); _ready = false; return false; });
  return _initPromise;
}

export function isCGALReady(): boolean { return _ready; }

export const cgalReady = initCGAL();

function r(n: number, d = 4) { return Math.round(n * 10 ** d) / 10 ** d; }
function dist(ax: number, ay: number, bx: number, by: number) { return Math.hypot(bx - ax, by - ay); }

function shoelaceArea(coords: number[][]) {
  let s = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    s += coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1];
  }
  return s / 2;
}

function ensureCCW(coords: number[][]) {
  return shoelaceArea(coords) < 0 ? coords.slice().reverse() : coords;
}

function isReflexVertex(coords: number[][], idx: number) {
  const n = coords.length;
  const prev = coords[(idx - 1 + n) % n];
  const curr = coords[idx];
  const next = coords[(idx + 1) % n];
  const e1x = curr[0] - prev[0], e1y = curr[1] - prev[1];
  const e2x = next[0] - curr[0], e2y = next[1] - curr[1];
  const cross = e1x * e2y - e1y * e2x;
  return cross < 0;
}

export interface SkEdge {
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  type: string;
}

export interface CGALSkeletonResult {
  ridges: SkEdge[];
  hips: SkEdge[];
  valleys: SkEdge[];
  gables: SkEdge[];
  faces: { x: number; y: number }[][];
  faceHeights: number[];
}

export function computeCGALSkeleton(vertices: { x: number; y: number }[], sides?: { isActive?: boolean }[]): CGALSkeletonResult | null {
  if (!_ready) return null;
  if (!vertices || vertices.length < 3) return null;

  let coords = vertices.map(v => [v.x, v.y]);

  const [fx, fy] = coords[0], [lx, ly] = coords[coords.length - 1];
  if (Math.abs(fx - lx) < EPS && Math.abs(fy - ly) < EPS) coords = coords.slice(0, -1);
  if (coords.length < 3) return null;

  coords = coords.filter((c, i, a) => {
    const n = a[(i + 1) % a.length];
    return dist(c[0], c[1], n[0], n[1]) >= EPS;
  });
  if (coords.length < 3) return null;

  coords = ensureCCW(coords);
  if (Math.abs(shoelaceArea(coords)) < 0.01) return null;

  const hasInactive = sides && sides.some(s => s.isActive === false);
  if (hasInactive) return null;

  const nOrig = coords.length;

  try {
    const closedCoords = [...coords, coords[0]];
    const polygon = [closedCoords.map(c => [c[0], c[1]]) as number[][]];

    const result = SkeletonBuilder.buildFromPolygon(polygon);
    if (!result || result.vertices.length === 0) return null;

    const reflexSet = new Set<number>();
    for (let i = 0; i < nOrig; i++) {
      if (isReflexVertex(coords, i)) reflexSet.add(i);
    }

    function findOrigIdx(x: number, y: number) {
      for (let i = 0; i < nOrig; i++) {
        if (Math.abs(x - coords[i][0]) < 0.05 && Math.abs(y - coords[i][1]) < 0.05) return i;
      }
      return -1;
    }

    const faces = result.polygons
      .filter(poly => poly.length >= 3)
      .map(poly => poly.map(vi => ({
        x: r(result.vertices[vi][0]),
        y: r(result.vertices[vi][1]),
      })));

    const faceHeights: number[] = result.polygons.map((poly) => {
      if (poly.length === 0) return 0;
      let sumTime = 0;
      for (const vi of poly) {
        sumTime += result.vertices[vi][2] || 0;
      }
      return sumTime / poly.length;
    });

    const edgeMap = new Map<string, {
      x1: number; y1: number; x2: number; y2: number;
      face1: number; face2: number;
      v1Idx: number; v2Idx: number;
      v1Time: number; v2Time: number;
    }>();

    for (let fi = 0; fi < result.polygons.length; fi++) {
      const poly = result.polygons[fi];
      for (let i = 0; i < poly.length; i++) {
        const j = (i + 1) % poly.length;
        const v1 = result.vertices[poly[i]];
        const v2 = result.vertices[poly[j]];
        const x1 = r(v1[0]), y1 = r(v1[1]);
        const x2 = r(v2[0]), y2 = r(v2[1]);

        if (dist(x1, y1, x2, y2) < 0.001) continue;

        const key = x1 < x2 || (x1 === x2 && y1 < y2)
          ? `${x1},${y1}-${x2},${y2}`
          : `${x2},${y2}-${x1},${y1}`;

        if (edgeMap.has(key)) {
          const entry = edgeMap.get(key)!;
          entry.face2 = fi;
        } else {
          edgeMap.set(key, {
            x1, y1, x2, y2, face1: fi, face2: -1,
            v1Idx: poly[i], v2Idx: poly[j],
            v1Time: v1[2], v2Time: v2[2],
          });
        }
      }
    }

    const ridges: SkEdge[] = [], hips: SkEdge[] = [], valleys: SkEdge[] = [], gables: SkEdge[] = [];

    for (const [, edge] of edgeMap) {
      const { x1, y1, x2, y2, v1Idx, v2Idx, v1Time, v2Time } = edge;
      const len = dist(x1, y1, x2, y2);
      if (len < 0.001) continue;

      const origIdx1 = findOrigIdx(x1, y1);
      const origIdx2 = findOrigIdx(x2, y2);
      const onB1 = origIdx1 >= 0;
      const onB2 = origIdx2 >= 0;

      if (onB1 && onB2 && edge.face2 === -1) continue;
      if (onB1 && onB2) continue;

      if (edge.face2 >= 0) {
        if (onB1 || onB2) {
          const idx = onB1 ? origIdx1 : origIdx2;
          if (idx >= 0 && reflexSet.has(idx)) {
            valleys.push(_seg(x1, y1, x2, y2, 'valley'));
          } else {
            hips.push(_seg(x1, y1, x2, y2, 'hip'));
          }
        } else {
          if (Math.abs(v1Time - v2Time) < 0.01) {
            ridges.push(_seg(x1, y1, x2, y2, 'ridge'));
          } else {
            hips.push(_seg(x1, y1, x2, y2, 'hip'));
          }
        }
      }
    }

    return { ridges, hips, valleys, gables, faces, faceHeights };
  } catch (e) {
    console.warn('CGAL skeleton failed:', e);
    return null;
  }
}

function _seg(x1: number, y1: number, x2: number, y2: number, type: string): SkEdge {
  return { start: { x: r(x1), y: r(y1) }, end: { x: r(x2), y: r(y2) }, length: r(dist(x1, y1, x2, y2)), type };
}
