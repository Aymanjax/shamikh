// @ts-nocheck
import { computeStraightSkeleton } from "./straightSkeleton";

const EPS       = 0.001;
const TIME_EPS  = 0.001; // used only for wall-vertex detection (t ≈ 0)

export const skeletonReady = Promise.resolve(true);

function round(n, d = 4) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function shoelaceArea(coords) {
  let sum = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    sum += coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1];
  }
  return sum / 2;
}

function ensureCCW(coords) {
  return shoelaceArea(coords) < 0 ? coords.slice().reverse() : coords;
}

function isReflex(prev, curr, next) {
  const v1x = curr[0] - prev[0], v1y = curr[1] - prev[1];
  const v2x = next[0] - curr[0], v2y = next[1] - curr[1];
  const cross = v1x * v2y - v1y * v2x;
  // In CCW polygon (Y-down screen): cross < 0 → reflex
  return cross < 0;
}

function removeCollinear(points) {
  const n = points.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p1 = points[(i - 1 + n) % n];
    const p2 = points[i];
    const p3 = points[(i + 1) % n];
    const area = Math.abs(p2[0] * (p3[1] - p1[1]) + p3[0] * (p1[1] - p2[1]) + p1[0] * (p2[1] - p3[1]));
    if (area > 0.005) out.push(p2);
  }
  return out;
}

/* ================================================================== */
/*  Main export                                                        */
/* ================================================================== */

export function computeRoofSkeleton(vertices, _slopePercent, sides) {
  if (!vertices || vertices.length < 3) {
    return _empty("الرجاء إدخال 3 نقاط على الأقل");
  }

  try {
    // --- 1. Prepare polygon coords ---
    let coords = vertices.map(v => [v.x, v.y]);

    // Remove closing duplicate
    const [fx, fy] = coords[0];
    const [lx, ly] = coords[coords.length - 1];
    if (Math.abs(fx - lx) < EPS && Math.abs(fy - ly) < EPS) coords = coords.slice(0, -1);

    if (coords.length < 3) return _empty("المساحة صغيرة جداً");

    const area = Math.abs(shoelaceArea(coords));
    if (area < 0.01) return _empty("المساحة صغيرة جداً — وسّع الشكل");

    // Deduplicate consecutive identical points
    const deduped = coords.filter((c, i, a) => {
      const j = (i + 1) % a.length;
      return dist(c[0], c[1], a[j][0], a[j][1]) >= EPS;
    });
    if (deduped.length < 3) return _empty("أضلاع متكررة — راجع الشكل");

    coords = ensureCCW(removeCollinear(deduped));
    if (coords.length < 3) return _empty("الشكل يحتاج 3 أضلاع على الأقل");

    // --- 2. Per-edge velocities ---
    const velocities = coords.map((_, i) =>
      sides && i < sides.length ? (sides[i].isActive !== false ? 1 : 0) : 1
    );

    // --- 3. Run skeleton ---
    const result = computeStraightSkeleton(
      coords.map(c => ({ x: c[0], y: c[1] })),
      velocities,
      { maxIter: 400 },
    );

    if (!result || result.edges.length === 0) {
      return _empty("فشل حساب الشدات — قد يكون الشكل معقداً جداً");
    }

    const lambda = result.lambda || 0.05;

    // --- 4. Build vertex time lookup ---
    const timeMap = new Map();
    for (const v of result.verts) {
      const key = `${round(v.x, 4)},${round(v.y, 4)}`;
      if (!timeMap.has(key) || timeMap.get(key) > v.t) timeMap.set(key, v.t);
    }
    // Original wall vertices have time = 0
    for (const c of coords) {
      const key = `${round(c[0], 4)},${round(c[1], 4)}`;
      if (!timeMap.has(key)) timeMap.set(key, 0);
    }

    // --- 5. Build original-vertex set ---
    const nOrig = coords.length;
    const origKeys = new Set(coords.map(c => `${round(c[0], 3)},${round(c[1], 3)}`));

    // Per-vertex kind (hip / valley / gable)
    const vertKind = coords.map((curr, i) => {
      const prev = coords[(i - 1 + nOrig) % nOrig];
      const next = coords[(i + 1) % nOrig];
      const vPrev = velocities[(i - 1 + nOrig) % nOrig];
      const vCurr = velocities[i];
      if (vPrev === 0 || vCurr === 0) return 'gable';
      if (isReflex(prev, curr, next)) return 'valley';
      return 'hip';
    });

    // --- 6. Classify edges ---
    const { ridges, hips, valleys, gables } = _classifyEdges(
      result.edges, timeMap, origKeys, vertKind, nOrig, lambda,
    );

    // --- 7. Build faces ---
    const faces = [];
    for (const ring of result.polygons) {
      if (ring.length >= 3) {
        faces.push(ring.map(p => ({ x: round(p.x), y: round(p.y) })));
      }
    }

    return { ridges, hips, valleys, gables, faces };

  } catch (e) {
    console.warn("computeRoofSkeleton failed:", e);
    return _empty("خطأ غير متوقع — أعد رسم الشكل وحاول مجدداً");
  }
}

/* ================================================================== */
/*  Edge classification                                                */
/*                                                                     */
/*  KEY FIX: Ridge tolerance is now lambda-based (not TIME_EPS=0.001). */
/*  Two interior vertices at the same "height" (iteration time) form  */
/*  a ridge. We allow t1 ≈ t2 within ridgeTol = lambda * 0.5.        */
/* ================================================================== */

function _classifyEdges(edges, timeMap, origKeys, vertKind, nOrig, lambda) {
  const ridges = [], hips = [], valleys = [], gables = [];
  const ridgeTol = lambda * 0.5; // FIX #4

  const getTime = (x, y) => timeMap.get(`${round(x, 4)},${round(y, 4)}`) ?? -1;
  const isOrig  = (x, y) => origKeys.has(`${round(x, 3)},${round(y, 3)}`);

  for (const seg of edges) {
    const { x: x1, y: y1 } = seg.start;
    const { x: x2, y: y2 } = seg.end;
    const len = dist(x1, y1, x2, y2);
    if (len < 0.001) continue;

    const t1 = getTime(x1, y1);
    const t2 = getTime(x2, y2);

    // ---- Gable: explicitly marked ----
    if (seg.isGableEdge) {
      gables.push(_seg(x1, y1, x2, y2, 'gable'));
      continue;
    }

    const on1 = isOrig(x1, y1);
    const on2 = isOrig(x2, y2);

    // Skip pure wall edges (both on original boundary with t ≈ 0)
    if (on1 && on2) continue;

    // ---- Bisector edges (have vertexId) → hip / valley / gable ----
    if (seg.vertexId !== undefined) {
      const vid = seg.vertexId % nOrig;
      const kind = vertKind[vid] || 'hip';
      if (kind === 'gable') gables.push(_seg(x1, y1, x2, y2, 'gable'));
      else if (kind === 'valley') valleys.push(_seg(x1, y1, x2, y2, 'valley'));
      else hips.push(_seg(x1, y1, x2, y2, 'hip'));
      continue;
    }

    // ---- No vertexId: edge from final collapsed polygon ----
    // Skip if one endpoint is on original wall boundary
    if (on1 || on2) continue;

    // t values must be known
    if (t1 < 0 || t2 < 0) continue;

    // FIX #4: ridge if both ends at same height (within lambda-based tolerance)
    if (Math.abs(t1 - t2) <= ridgeTol) {
      ridges.push(_seg(x1, y1, x2, y2, 'ridge'));
    }
    // Otherwise it's an additional hip/valley from the inner polygon —
    // classify by which endpoint is higher
    else {
      const kind = t1 < t2 ? 'hip' : 'valley';
      (kind === 'hip' ? hips : valleys).push(_seg(x1, y1, x2, y2, kind));
    }
  }

  return { ridges, hips, valleys, gables };
}

function _seg(x1, y1, x2, y2, type) {
  return {
    start:  { x: round(x1), y: round(y1) },
    end:    { x: round(x2), y: round(y2) },
    length: round(dist(x1, y1, x2, y2)),
    type,
  };
}

function _empty(error) {
  return { ridges: [], hips: [], valleys: [], faces: [], gables: [], error };
}

/* ================================================================== */
/*  Tarabeesh (skeleton-based)                                        */
/* ================================================================== */

export function calcTarabeeshFromSkeleton(skeleton, slopePercent, vertices, sides) {
  if (!skeleton) return 0;
  const slope = slopePercent / 100;
  const slopeFactor = Math.sqrt(1 + slope * slope);

  const flatVertKeys = new Set();
  let hasFlatSides = false;
  if (sides && vertices) {
    for (let i = 0; i < sides.length && i < vertices.length; i++) {
      if (sides[i].isActive === false) {
        hasFlatSides = true;
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        if (v1) flatVertKeys.add(`${round(v1.x, 3)},${round(v1.y, 3)}`);
        if (v2) flatVertKeys.add(`${round(v2.x, 3)},${round(v2.y, 3)}`);
      }
    }
  }

  const needsSlope = e => {
    if (!hasFlatSides) return true;
    return !(
      flatVertKeys.has(`${round(e.start.x, 3)},${round(e.start.y, 3)}`) ||
      flatVertKeys.has(`${round(e.end.x, 3)},${round(e.end.y, 3)}`)
    );
  };

  const ridgeTotal   = (skeleton.ridges  || []).reduce((s, r) => s + (r.length || 0), 0);
  const hipTotal     = (skeleton.hips    || []).reduce((s, h) => s + (h.length || 0) * (needsSlope(h) ? slopeFactor : 1), 0);
  const valleyTotal  = (skeleton.valleys || []).reduce((s, v) => s + (v.length || 0) * (needsSlope(v) ? slopeFactor : 1), 0);

  return +(ridgeTotal + hipTotal + valleyTotal).toFixed(2);
}

/* ================================================================== */
/*  customRectRoof — analytical exact solution for axis-aligned rects */
/*                                                                     */
/*  FIX: Correct geometry for all 4 single-wall-disabled cases.       */
/*  The "right wall" and "left wall" cases used H/2 as offset which   */
/*  is correct (half of the shorter dimension = H), but the ridge     */
/*  end-point was wrong — it should extend all the way to the wall.   */
/* ================================================================== */

export function customRectRoof(vertices, activeSides) {
  // Only handle exact 4-vertex axis-aligned rectangles
  if (!vertices || vertices.length !== 4) return null;

  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  // Verify all 4 corners present (rectangle check)
  const bbCorners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]];
  const isRect = bbCorners.every(([bx,by]) =>
    vertices.some(v => Math.abs(v.x-bx)<0.1 && Math.abs(v.y-by)<0.1)
  );
  if (!isRect) return null;

  const L = maxX - minX; // horizontal span
  const H = maxY - minY; // vertical span

  // Sides in polygon order (depends on vertex winding)
  // We detect which side each edge represents by its direction:
  //   side 0: p0→p1, side 1: p1→p2, side 2: p2→p3, side 3: p3→p0
  // Then map to Top/Right/Bottom/Left by examining bounding-box membership.
  const isActive = i => activeSides?.[i]?.isActive !== false;

  // Determine which cardinal walls are active
  // We map sides[0..3] to their geometric role
  const sideRole = _sideRoles(vertices, minX, maxX, minY, maxY);
  const wallActive = { top: true, right: true, bottom: true, left: true };
  for (let i = 0; i < 4; i++) {
    if (!isActive(i) && sideRole[i]) wallActive[sideRole[i]] = false;
  }

  const { top, right, bottom, left } = wallActive;
  const ridges = [], hips = [], valleys = [], gables = [];

  const seg = (ax, ay, bx, by, type) => ({
    start: { x: round(ax), y: round(ay) },
    end:   { x: round(bx), y: round(by) },
    length: round(dist(ax, ay, bx, by)),
    type,
  });

  // ---- Helper: standard hip roof from bounding box ----
  const hipRoof = (x0, y0, x1, y1) => {
    const w = x1 - x0, h = y1 - y0;
    if (w >= h) {
      const off = h / 2;
      const vL = { x: x0+off, y: y0+off };
      const vR = { x: x1-off, y: y0+off };
      hips.push(
        seg(x0,y0, vL.x,vL.y,'hip'), seg(x0,y1, vL.x,vL.y,'hip'),
        seg(x1,y0, vR.x,vR.y,'hip'), seg(x1,y1, vR.x,vR.y,'hip'),
      );
      if (vL.x < vR.x) ridges.push(seg(vL.x,vL.y, vR.x,vR.y,'ridge'));
    } else {
      const off = w / 2;
      const vT = { x: x0+off, y: y0+off };
      const vB = { x: x0+off, y: y1-off };
      hips.push(
        seg(x0,y0, vT.x,vT.y,'hip'), seg(x1,y0, vT.x,vT.y,'hip'),
        seg(x0,y1, vB.x,vB.y,'hip'), seg(x1,y1, vB.x,vB.y,'hip'),
      );
      if (vT.y < vB.y) ridges.push(seg(vT.x,vT.y, vB.x,vB.y,'ridge'));
    }
  };

  // ---- All active → standard hip roof ----
  if (top && right && bottom && left) {
    hipRoof(minX, minY, maxX, maxY);
    return { ridges, hips, valleys, gables };
  }

  // ---- Left + Right disabled → full-width gable ridge (horizontal) ----
  if (top && !right && bottom && !left) {
    const ry = minY + H/2;
    ridges.push(seg(minX,ry, maxX,ry,'ridge'));
    gables.push(seg(minX,minY, minX,ry,'gable'), seg(minX,ry, minX,maxY,'gable'));
    gables.push(seg(maxX,minY, maxX,ry,'gable'), seg(maxX,ry, maxX,maxY,'gable'));
    return { ridges, hips, valleys, gables };
  }

  // ---- Top + Bottom disabled → full-height gable ridge (vertical) ----
  if (!top && right && !bottom && left) {
    const rx = minX + L/2;
    ridges.push(seg(rx,minY, rx,maxY,'ridge'));
    gables.push(seg(minX,minY, rx,minY,'gable'), seg(rx,minY, maxX,minY,'gable'));
    gables.push(seg(minX,maxY, rx,maxY,'gable'), seg(rx,maxY, maxX,maxY,'gable'));
    return { ridges, hips, valleys, gables };
  }

  // ---- Single wall disabled: ridge runs TO the disabled wall ----

  // Bottom disabled
  if (top && right && !bottom && left) {
    const off = Math.min(H, L/2);
    const rl = { x: minX+off, y: maxY };
    const rr = { x: maxX-off, y: maxY };
    if (rl.x < rr.x) ridges.push(seg(rl.x,rl.y, rr.x,rr.y,'ridge'));
    hips.push(seg(minX,minY, rl.x,rl.y,'hip'), seg(maxX,minY, rr.x,rr.y,'hip'));
    if (rl.x > minX) gables.push(seg(minX,maxY, rl.x,maxY,'gable'));
    if (rr.x < maxX) gables.push(seg(rr.x,maxY, maxX,maxY,'gable'));
    if (rl.x >= rr.x) { // degenerate: single apex
      const cx = (minX+maxX)/2;
      hips.push(seg(minX,minY, cx,maxY,'hip'), seg(maxX,minY, cx,maxY,'hip'));
    }
    return { ridges, hips, valleys, gables };
  }

  // Top disabled
  if (!top && right && bottom && left) {
    const off = Math.min(H, L/2);
    const rl = { x: minX+off, y: minY };
    const rr = { x: maxX-off, y: minY };
    if (rl.x < rr.x) ridges.push(seg(rl.x,rl.y, rr.x,rr.y,'ridge'));
    hips.push(seg(minX,maxY, rl.x,rl.y,'hip'), seg(maxX,maxY, rr.x,rr.y,'hip'));
    if (rl.x > minX) gables.push(seg(minX,minY, rl.x,minY,'gable'));
    if (rr.x < maxX) gables.push(seg(rr.x,minY, maxX,minY,'gable'));
    if (rl.x >= rr.x) {
      const cx = (minX+maxX)/2;
      hips.push(seg(minX,maxY, cx,minY,'hip'), seg(maxX,maxY, cx,minY,'hip'));
    }
    return { ridges, hips, valleys, gables };
  }

  // Right disabled — FIX: ridge extends horizontally to the right wall
  if (top && !right && bottom && left) {
    const off = H/2;
    const rStart = { x: minX + off, y: minY + off }; // apex over left half
    const rEnd   = { x: maxX,       y: minY + off }; // touches right wall
    ridges.push(seg(rStart.x,rStart.y, rEnd.x,rEnd.y,'ridge'));
    hips.push(seg(minX,minY, rStart.x,rStart.y,'hip'));
    hips.push(seg(minX,maxY, rStart.x,rStart.y,'hip'));
    gables.push(seg(maxX,minY, rEnd.x,rEnd.y,'gable'));
    gables.push(seg(rEnd.x,rEnd.y, maxX,maxY,'gable'));
    return { ridges, hips, valleys, gables };
  }

  // Left disabled — FIX: ridge extends horizontally to the left wall
  if (top && right && bottom && !left) {
    const off = H/2;
    const rStart = { x: maxX - off, y: minY + off }; // apex over right half
    const rEnd   = { x: minX,       y: minY + off }; // touches left wall
    ridges.push(seg(rStart.x,rStart.y, rEnd.x,rEnd.y,'ridge'));
    hips.push(seg(maxX,minY, rStart.x,rStart.y,'hip'));
    hips.push(seg(maxX,maxY, rStart.x,rStart.y,'hip'));
    gables.push(seg(minX,minY, rEnd.x,rEnd.y,'gable'));
    gables.push(seg(rEnd.x,rEnd.y, minX,maxY,'gable'));
    return { ridges, hips, valleys, gables };
  }

  // Fallback: treat as standard hip roof
  hipRoof(minX, minY, maxX, maxY);
  return { ridges, hips, valleys, gables };
}

/* ================================================================== */
/*  Helper: map each side index to its cardinal role                   */
/* ================================================================== */

function _sideRoles(vertices, minX, maxX, minY, maxY) {
  const roles = [];
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i+1) % n];
    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
    if (Math.abs(my - minY) < 0.1) roles.push('top');
    else if (Math.abs(mx - maxX) < 0.1) roles.push('right');
    else if (Math.abs(my - maxY) < 0.1) roles.push('bottom');
    else if (Math.abs(mx - minX) < 0.1) roles.push('left');
    else roles.push(null);
  }
  return roles;
}
