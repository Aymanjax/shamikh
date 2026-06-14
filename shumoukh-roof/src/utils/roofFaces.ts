// @ts-nocheck
/**
 * roofFaces — extract roof faces (planar subdivision) from the 2D roof skeleton.
 *
 * The polygon boundary edges together with the skeleton segments
 * (ridges + hips + valleys + gables) form a planar graph that partitions the
 * roof footprint into faces — one sloped face per eave, plus vertical faces for
 * gable walls. We build a half-edge structure and traverse minimal cycles to
 * recover those faces. This is gable-aware because it consumes whatever skeleton
 * the (gable-aware) engine produced.
 *
 * Output faces are arrays of { x, y } points (CCW). Heights are assigned later
 * from each vertex's distance to the nearest eave (see roofGeometry/viewer).
 */

const TOL = 1e-3;

function keyOf(x, y) {
  return `${Math.round(x / TOL)},${Math.round(y / TOL)}`;
}

function polyArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}

/**
 * Build the set of roof faces from the polygon outline and the skeleton.
 * @param {{x:number,y:number}[]} polygon  closed ring (no repeated last point)
 * @param {{ridges,hips,valleys,gables}} skeleton segment lists
 * @returns {{x:number,y:number}[][]} faces (each a CCW ring)
 */
export function facesFromSkeleton(polygon, skeleton) {
  if (!polygon || polygon.length < 3) return [];

  // ---- 1. collect undirected segments ----
  const segs = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    segs.push([polygon[i], polygon[(i + 1) % n]]);
  }
  for (const list of ["ridges", "hips", "valleys", "gables"]) {
    for (const e of skeleton?.[list] || []) segs.push([e.start, e.end]);
  }

  // ---- 2. unique nodes ----
  const nodes = new Map(); // key -> {x,y,out:[]}
  const nodeOf = (p) => {
    const k = keyOf(p.x, p.y);
    let nd = nodes.get(k);
    if (!nd) { nd = { x: p.x, y: p.y, out: [] }; nodes.set(k, nd); }
    return nd;
  };

  // ---- 3. directed half-edges ----
  const halfEdges = [];
  const addHalf = (from, to) => {
    const h = { from, to, angle: Math.atan2(to.y - from.y, to.x - from.x), twin: null, next: null, visited: false };
    from.out.push(h);
    halfEdges.push(h);
    return h;
  };
  const seen = new Set();
  for (const [a, b] of segs) {
    if (keyOf(a.x, a.y) === keyOf(b.x, b.y)) continue;
    const ek = keyOf(a.x, a.y) + "|" + keyOf(b.x, b.y);
    const ek2 = keyOf(b.x, b.y) + "|" + keyOf(a.x, a.y);
    if (seen.has(ek) || seen.has(ek2)) continue; // dedupe overlapping segments
    seen.add(ek);
    const na = nodeOf(a), nb = nodeOf(b);
    const h1 = addHalf(na, nb);
    const h2 = addHalf(nb, na);
    h1.twin = h2; h2.twin = h1;
  }

  // ---- 4. CCW order of out-edges per node ----
  for (const nd of nodes.values()) {
    nd.out.sort((p, q) => p.angle - q.angle);
  }

  // next(h) = twin(h) rotated to the previous out-edge in CCW order around the
  // target node → traces faces on the left, yielding minimal cycles.
  const nextHalf = (h) => {
    const t = h.twin;
    const out = t.from.out;
    const idx = out.indexOf(t);
    const prev = out[(idx - 1 + out.length) % out.length];
    return prev;
  };

  // ---- 5. traverse face cycles ----
  const faces = [];
  for (const h0 of halfEdges) {
    if (h0.visited) continue;
    const ring = [];
    let h = h0;
    let guard = 0;
    do {
      h.visited = true;
      ring.push({ x: h.from.x, y: h.from.y });
      h = nextHalf(h);
      if (++guard > halfEdges.length + 5) break;
    } while (h !== h0);
    if (ring.length < 3) continue;
    const area = polyArea(ring);
    if (area > TOL) faces.push(ring);          // interior face (CCW, positive area)
    // negative-area cycle = outer boundary → skip
  }

  return faces;
}
