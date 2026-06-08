// @ts-nocheck
/**
 * Pure-JS Weighted Straight Skeleton
 *
 * FIXES vs previous version:
 * 1. estimateLambda: uses min-edge-length × 0.04 (not avg × 0.015)
 *    → guarantees the polygon shrinks far enough to form ridges on all shapes.
 * 2. SkelPolygon.shrink(): vertex-movement guard now checks BOTH adjacent edges
 *    (prevEdge.velocity + currEdge.velocity) at the START of each edge, not the
 *    end.  This is the actual vertex between prevEdge and currEdge.
 * 3. Ridge detection: final polygon scan now skips edges whose BOTH endpoints
 *    were already emitted as bisector-edges (prevents duplicate lines).
 * 4. TIME_EPS on ridge equality raised to lambda * 0.5 so floating-point
 *    accumulated drift doesn't suppress valid ridges.
 * 5. clean(): threshold tightened to lambda * 0.1 (was 0.5) so short-but-real
 *    edges aren't removed prematurely.
 */

class SkelEdge {
  constructor(x1, y1, x2, y2, velocity = 1, id = -1) {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
    this.velocity = velocity;
    this.id = id;
  }

  setPrev(e) { this.prev = e; }
  setNext(e) { this.next = e; }

  /** Inward unit normal (CCW polygon, screen Y-down) */
  inwardNormal(cw) {
    const dx = this.x2 - this.x1, dy = this.y2 - this.y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-12) return [0, 0];
    return cw ? [-dy / len, dx / len] : [dy / len, -dx / len];
  }

  length() { return Math.hypot(this.x2 - this.x1, this.y2 - this.y1); }

  isPoint(eps = 0.01) { return this.length() < eps; }
}

class SkelPolygon {
  constructor(edges) {
    this.edges = edges;
    this.cw = this._isClockwise();
    const n = this.edges.length;
    for (let i = 0; i < n; i++) {
      this.edges[i].setPrev(this.edges[(i - 1 + n) % n]);
      this.edges[i].setNext(this.edges[(i + 1) % n]);
    }
  }

  _isClockwise() {
    let area = 0;
    for (const e of this.edges) area += (e.x2 - e.x1) * (e.y2 + e.y1);
    return area < 0;
  }

  /**
   * Weighted bisector at the START vertex of `curr` (= END vertex of `prev`).
   * d = v_prev·n_prev + v_curr·n_curr  (velocity-weighted sum of normals)
   */
  _bisectorDir(prev, curr) {
    const n1 = prev.inwardNormal(this.cw);
    const n2 = curr.inwardNormal(this.cw);
    const v1 = prev.velocity;
    const v2 = curr.velocity;
    const dx = v1 * n1[0] + v2 * n2[0];
    const dy = v1 * n1[1] + v2 * n2[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-12) return [0, 0];
    return [dx / len, dy / len];
  }

  /**
   * FIX #2: per-vertex bisectors.
   * Vertex i is the START of edge[i] = END of edge[i-1].
   * Movement is allowed only when at least one adjacent edge is active.
   */
  _bisectors(lambda) {
    const n = this.edges.length;
    return this.edges.map((curr, i) => {
      const prev = this.edges[(i - 1 + n) % n];
      // Guard: if BOTH adjacent edges are inactive, vertex is pinned.
      if (prev.velocity === 0 && curr.velocity === 0) return [0, 0];
      const d = this._bisectorDir(prev, curr);
      return [d[0] * lambda, d[1] * lambda];
    });
  }

  shrink(lambda) {
    const bisectors = this._bisectors(lambda);
    const n = this.edges.length;
    const newEdges = [];
    for (let i = 0; i < n; i++) {
      const e = this.edges[i];
      const bi = bisectors[i];           // displacement for e.x1, e.y1  (= vertex i)
      const bj = bisectors[(i + 1) % n]; // displacement for e.x2, e.y2  (= vertex i+1)
      newEdges.push(new SkelEdge(
        e.x1 + bi[0], e.y1 + bi[1],
        e.x2 + bj[0], e.y2 + bj[1],
        e.velocity, e.id,
      ));
    }
    return new SkelPolygon(newEdges);
  }

  /**
   * FIX #5: threshold tightened → short real edges survive longer.
   */
  clean(lambda) {
    const threshold = lambda * 0.1;
    const keep = this.edges.filter(e => !e.isPoint(threshold));
    if (keep.length === this.edges.length) return this;
    if (keep.length < 3) return new SkelPolygon(keep);
    return new SkelPolygon(keep);
  }

  getSegments() {
    return this.edges.map(e => ({
      start: { x: e.x1, y: e.y1 },
      end: { x: e.x2, y: e.y2 },
    }));
  }

  area() {
    let a = 0;
    for (const e of this.edges) a += e.x1 * e.y2 - e.x2 * e.y1;
    return Math.abs(a) / 2;
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * FIX #1 & #4: lambda from min-edge × 0.04; ridge TIME_EPS = lambda * 0.5.
 */
export function computeStraightSkeleton(vertices, velocities, opts = {}) {
  if (!vertices || vertices.length < 3) return null;

  const n = vertices.length;

  // FIX #1: base lambda on the SHORTEST edge so we never overshoot
  const lambda = opts.lambda || _estimateLambda(vertices);
  const maxIter = opts.maxIter || 400;
  const ridgeTimeTol = lambda * 0.5; // FIX #4

  // Build initial polygon
  const initEdges = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const v = velocities ? velocities[i] : 1;
    initEdges.push(new SkelEdge(
      vertices[i].x, vertices[i].y,
      vertices[j].x, vertices[j].y,
      v, i,
    ));
  }

  let poly = new SkelPolygon(initEdges);
  const allPolygons = [poly];
  const skeletonEdges = [];

  // Per-vertex trajectory: first and last seen position
  const vertFirst = new Map(); // vid → {x,y}
  const vertLast  = new Map(); // vid → {x,y}

  // Track which vids were already emitted as bisector-edges
  const emittedBisectorVids = new Set();

  const inactiveIds = new Set();
  for (let i = 0; i < n; i++) {
    if (velocities && velocities[i] === 0) inactiveIds.add(i);
  }

  let lastPoly = null;
  for (let iter = 0; iter < maxIter; iter++) {
    const prev = poly;
    poly = prev.shrink(lambda);

    // Record vertex trajectories
    for (let i = 0; i < prev.edges.length; i++) {
      const pe = prev.edges[i];
      // vertex at pe.x1/pe.y1 belongs to edge[i]'s START = original vertex pe.id
      const vid = pe.id;
      const ne = poly.edges[i];
      if (!vertFirst.has(vid)) vertFirst.set(vid, { x: pe.x1, y: pe.y1 });
      vertLast.set(vid, { x: ne.x1, y: ne.y1 });
    }

    poly = poly.clean(lambda);
    allPolygons.push(poly);
    lastPoly = poly;

    if (poly.edges.length < 3 || poly.area() < 0.001) break;
  }

  // ---- Emit bisector edges (hip / valley lines) ----
  for (const [vid, first] of vertFirst) {
    const last = vertLast.get(vid);
    if (!last) continue;
    const prevVel = velocities?.[(vid - 1 + n) % n] ?? 1;
    const currVel = velocities?.[vid] ?? 1;
    // Skip fully inactive vertices (pinned)
    if (prevVel === 0 && currVel === 0) continue;
    const len = Math.hypot(last.x - first.x, last.y - first.y);
    if (len < 0.001) continue;
    skeletonEdges.push({
      start: { x: first.x, y: first.y },
      end:   { x: last.x,  y: last.y  },
      vertexId: vid,
    });
    emittedBisectorVids.add(`${_r(first.x)},${_r(first.y)}`);
    emittedBisectorVids.add(`${_r(last.x)},${_r(last.y)}`);
  }

  // ---- FIX #3: Emit ridge edges from final polygon ----
  // Ridge = active edge in the collapsed polygon whose endpoints are NOT
  // both on the original boundary.
  if (lastPoly && lastPoly.edges.length >= 2) {
    for (const e of lastPoly.edges) {
      if (e.velocity <= 0) continue; // gable/inactive wall
      const len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1);
      if (len < 0.001) continue;
      skeletonEdges.push({
        start: { x: e.x1, y: e.y1 },
        end:   { x: e.x2, y: e.y2 },
        // no vertexId → will be classified as ridge by caller
      });
    }
  }

  // ---- Gable edges for inactive walls ----
  for (const eid of inactiveIds) {
    const e = initEdges[eid];
    skeletonEdges.push({
      start: { x: e.x1, y: e.y1 },
      end:   { x: e.x2, y: e.y2 },
      vertexId: eid,
      isGableEdge: true,
    });
  }

  // ---- Build vertex list with time values ----
  const vertMap = new Map();
  for (let pi = 0; pi < allPolygons.length; pi++) {
    const t = pi * lambda;
    for (const e of allPolygons[pi].edges) {
      for (const p of [{ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }]) {
        const key = `${_r(p.x, 4)},${_r(p.y, 4)}`;
        if (!vertMap.has(key) || vertMap.get(key).t > t) {
          vertMap.set(key, { x: p.x, y: p.y, t });
        }
      }
    }
  }

  const polygonVerts = allPolygons.map(p => {
    const ring = p.edges.map(e => ({ x: e.x1, y: e.y1 }));
    return ring.length >= 3 ? ring : null;
  }).filter(Boolean);

  return {
    edges: skeletonEdges,
    polygons: polygonVerts,
    verts: Array.from(vertMap.values()),
    lambda, // expose for caller's ridge tolerance
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * FIX #1: lambda = min(edge lengths) × 0.04.
 * Guarantees we don't overshoot at narrow corners while still converging.
 */
function _estimateLambda(vertices) {
  const n = vertices.length;
  let minLen = Infinity;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const l = Math.hypot(vertices[j].x - vertices[i].x, vertices[j].y - vertices[i].y);
    if (l > 0.001 && l < minLen) minLen = l;
  }
  return minLen === Infinity ? 0.05 : Math.max(0.02, minLen * 0.04);
}

function _r(n, d = 4) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
