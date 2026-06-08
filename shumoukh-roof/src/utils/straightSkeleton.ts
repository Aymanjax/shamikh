// @ts-nocheck
/**
 * Straight Skeleton — Weighted per-edge velocity
 *
 * المبادئ:
 * 1. edgeNormal: [-dy/len, dx/len] (inward normal for CCW Y-down polygon)
 * 2. bisectorDir: weighted bisector with gable-wall constraint
 *    – إذا الجدار السابق معطل → الرأس ينزلق بعكس اتجاهه نحو الرأس الآخر
 *    – إذا الجدار الحالي معطل → الرأس ينزلق مع اتجاهه نحو الرأس الآخر
 *    – كلاهما نشطان → weighted bisector between wall normals
 *    – Math.abs(dot) يضمن اتجاه الانزلاق الصحيح للأشكال غير المنتظمة
 * 3. Valley detection: cross product < 0 → reflex angle → valley
 * 4. Adaptive lambda: minEdge / 80 → دقة عالية بدون overshoot
 * 5. وقف عند minimum area (قبل أن يعكس الـ polygon اتجاهه)
 * 6. edgeVels: تتبع سرعة كل حافة بشكل مستقل عن فهرس الرؤوس
 *    – عند دمج رأسين تُزال الحافة بينهما وتبقى سرعات الباقي كما هي
 */

function edgeNormal(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 1e-12) return [0, 0];
  return [-dy / len, dx / len];
}

function edgeDir(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 1e-12) return [0, 0];
  return [dx / len, dy / len];
}

/**
 * اتجاه bisector لـ vertex بين prev_edge و curr_edge
 * يستقبل سرعات (velocities) لكل جدار:
 *   vP=1 → الجدار السابق نشط، vP=0 → الجدار السابق معطل (gable)
 *   vC=1 → الجدار الحالي نشط، vC=0 → الجدار الحالي معطل (gable)
 */
function bisectorDir(px1, py1, px2, py2, vP, cx1, cy1, cx2, cy2, vC) {
  if (vP === 0 && vC === 0) return [0, 0];

  if (vP === 0) {
    const [tx, ty] = edgeDir(px1, py1, px2, py2);
    const [nx2, ny2] = edgeNormal(cx1, cy1, cx2, cy2);
    const speed = Math.abs(nx2 * tx + ny2 * ty);
    if (speed < 1e-12) return [0, 0];
    return [-speed * tx, -speed * ty];
  }

  if (vC === 0) {
    const [tx, ty] = edgeDir(cx1, cy1, cx2, cy2);
    const [nx1, ny1] = edgeNormal(px1, py1, px2, py2);
    const speed = Math.abs(nx1 * tx + ny1 * ty);
    if (speed < 1e-12) return [0, 0];
    return [speed * tx, speed * ty];
  }

  const [nx1, ny1] = edgeNormal(px1, py1, px2, py2);
  const [nx2, ny2] = edgeNormal(cx1, cy1, cx2, cy2);
  const bx = vP * nx1 + vC * nx2;
  const by = vP * ny1 + vC * ny2;
  const len = Math.hypot(bx, by);
  if (len < 1e-12) return [0, 0];
  return [bx / len, by / len];
}

function classifyVertex(pPrev, pCurr, pNext) {
  const e1x = pCurr[0] - pPrev[0], e1y = pCurr[1] - pPrev[1];
  const e2x = pNext[0] - pCurr[0], e2y = pNext[1] - pCurr[1];
  return (e1x * e2y - e1y * e2x) < 0 ? 'valley' : 'hip';
}

function polyArea(pts) {
  let a = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) / 2;
}

function ptSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  if (l2 < 1e-12) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* ──────────────────────────────────────────────── */

export function computeStraightSkeleton(vertices, velocities, opts = {}) {
  if (!vertices || vertices.length < 3) return null;

  const n = vertices.length;
  const vels = [...(velocities || Array(n).fill(1))];

  let minEdge = Infinity;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const l = Math.hypot(vertices[j].x - vertices[i].x, vertices[j].y - vertices[i].y);
    if (l > 0.001 && l < minEdge) minEdge = l;
  }
  if (minEdge === Infinity) return null;
  const lambda = Math.min(minEdge / 80, 0.05);
  const maxIter = opts.maxIter || 1000;

  const valleyMask = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i - 1 + n) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
    valleyMask[i] = classifyVertex([prev.x, prev.y], [curr.x, curr.y], [next.x, next.y]) === 'valley';
  }

  let pts = vertices.map(v => [v.x, v.y]);
  let edgeVels = [...vels];
  let vertexTrack = pts.map((_, i) => new Set([i]));

  const firstPos = pts.map(p => [...p]);
  const allRings = [pts.map(p => ({ x: p[0], y: p[1] }))];
  const inactiveIds = new Set(vels.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0));

  let prevArea = Infinity;
  let ridgeRing = null;
  let mergedCount = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    const curN = pts.length;
    if (curN < 3) break;

    const next = pts.map((p, i) => {
      const prev = (i - 1 + curN) % curN;
      const nextI = (i + 1) % curN;
      const vP = edgeVels[prev];
      const vC = edgeVels[i];
      const [bx, by] = bisectorDir(
        pts[prev][0], pts[prev][1], p[0], p[1], vP,
        p[0], p[1], pts[nextI][0], pts[nextI][1], vC
      );
      const blen = Math.hypot(bx, by);
      if (blen < 1e-12) return [p[0], p[1]];
      return [p[0] + bx * lambda, p[1] + by * lambda];
    });

    const area = polyArea(next);

    if (area > prevArea + 0.0001 || area < 0.0001) {
      ridgeRing = pts.map(p => ({ x: p[0], y: p[1] }));
      break;
    }
    prevArea = area;

    // Merge close vertices, tracking edge velocities and vertex lineage
    const merged = [];
    const mergedEV = [];
    const mergedTrack = [];
    let skipNext = false;
    for (let i = 0; i < next.length; i++) {
      if (skipNext) { skipNext = false; continue; }
      const j = i + 1;
      if (j >= next.length) {
        merged.push([next[i][0], next[i][1]]);
        mergedEV.push(edgeVels[i]);
        mergedTrack.push(vertexTrack[i]);
        continue;
      }
      const d = Math.hypot(next[j][0] - next[i][0], next[j][1] - next[i][1]);
      if (d < lambda * 0.5 && next.length > 3) {
        merged.push([(next[i][0] + next[j][0]) / 2, (next[i][1] + next[j][1]) / 2]);
        mergedEV.push(edgeVels[j]);
        mergedTrack.push(new Set([...vertexTrack[i], ...vertexTrack[j]]));
        skipNext = true;
        mergedCount++;
      } else {
        merged.push([next[i][0], next[i][1]]);
        mergedEV.push(edgeVels[i]);
        mergedTrack.push(vertexTrack[i]);
      }
    }
    pts = merged;
    edgeVels = mergedEV;
    vertexTrack = mergedTrack;

    const ring = pts.map(p => ({ x: p[0], y: p[1] }));
    allRings.push(ring);

    if (area < 0.0001) { ridgeRing = ring; break; }
  }

  const minLen = Math.max(lambda * 0.1, 0.005);
  const skeletonEdges = [];

  // Pre-compute gable wall meeting points
  const gableMeeting = new Map();
  for (const eid of inactiveIds) {
    const A = vertices[eid];
    const B = vertices[(eid + 1) % n];
    const [gx, gy] = edgeDir(A.x, A.y, B.x, B.y);
    const prevVtx = vertices[(eid - 1 + n) % n];
    const [pnx, pny] = edgeNormal(prevVtx.x, prevVtx.y, A.x, A.y);
    const sA = Math.abs(pnx * gx + pny * gy);
    const nextVtx = vertices[(eid + 2) % n];
    const [nnx, nny] = edgeNormal(B.x, B.y, nextVtx.x, nextVtx.y);
    const sB = Math.abs(nnx * gx + nny * gy);
    const total = sA + sB;
    if (total < 1e-12) {
      gableMeeting.set(eid, { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 });
    } else {
      const r = sA / total;
      gableMeeting.set(eid, { x: A.x + r * (B.x - A.x), y: A.y + r * (B.y - A.y) });
    }
  }

  // Set of original vertex indices that are part of a gable wall (handled separately)
  const gableVerts = new Set();
  for (const eid of inactiveIds) {
    gableVerts.add(eid);
    gableVerts.add((eid + 1) % n);
  }

  // Hip/Valley: map each original vertex to its final position using vertex tracking
  const finalRing = ridgeRing || allRings[allRings.length - 1];
  const finalPos = new Array(n).fill(null);

  // vertexTrack and pts are always in sync — pts[i] in final ring tracks vertexTrack[i]
  for (let vi = 0; vi < vertexTrack.length && finalRing && vi < finalRing.length; vi++) {
    const pos = finalRing[vi];
    for (const origIdx of vertexTrack[vi]) {
      if (origIdx < n && !finalPos[origIdx]) {
        finalPos[origIdx] = { x: pos.x, y: pos.y };
      }
    }
  }

  // Handle any original vertices not tracked (fallback: closest point)
  for (let i = 0; i < n; i++) {
    if (finalPos[i]) continue;
    const [fx, fy] = firstPos[i];
    if (finalRing && finalRing.length > 0) {
      let minD = Infinity;
      for (const p of finalRing) {
        const d = Math.hypot(p.x - fx, p.y - fy);
        if (d < minD) { minD = d; finalPos[i] = { x: p.x, y: p.y }; }
      }
    }
  }

  for (let i = 0; i < n; i++) {
    const vP = vels[(i - 1 + n) % n] ?? 1;
    const vC = vels[i] ?? 1;
    if (vP === 0 && vC === 0) continue;
    if (gableVerts.has(i)) continue;
    const end = finalPos[i];
    if (!end) continue;
    const [fx, fy] = firstPos[i];
    const dist = Math.hypot(end.x - fx, end.y - fy);
    if (dist < 0.001) continue;
    skeletonEdges.push({
      start: { x: r4(fx), y: r4(fy) },
      end: { x: r4(end.x), y: r4(end.y) },
      vertexId: i,
    });
  }

  // Gable wall vertices: split the wall at M, add ridge from M to interior
  for (const eid of inactiveIds) {
    const A = vertices[eid];
    const B = vertices[(eid + 1) % n];
    const M = gableMeeting.get(eid);
    if (!M) continue;

    // Gable segments: A→M and M→B
    const dAM = Math.hypot(M.x - A.x, M.y - A.y);
    const dMB = Math.hypot(B.x - M.x, B.y - M.y);
    if (dAM > 0.001) {
      skeletonEdges.push({
        start: { x: r4(A.x), y: r4(A.y) },
        end: { x: r4(M.x), y: r4(M.y) },
        vertexId: eid,
        isGableEdge: true,
      });
    }
    if (dMB > 0.001) {
      skeletonEdges.push({
        start: { x: r4(M.x), y: r4(M.y) },
        end: { x: r4(B.x), y: r4(B.y) },
        vertexId: eid,
        isGableEdge: true,
      });
    }

    // Ridge from M to interior — use the tracked final position of either A or B
    const finalA = finalPos[eid];
    const finalB = finalPos[(eid + 1) % n];
    const ridgeEnd = finalA || finalB;
    if (ridgeEnd) {
      const dRidge = Math.hypot(ridgeEnd.x - M.x, ridgeEnd.y - M.y);
      if (dRidge > 0.001) {
        skeletonEdges.push({
          start: { x: r4(M.x), y: r4(M.y) },
          end: { x: r4(ridgeEnd.x), y: r4(ridgeEnd.y) },
        });
      }
      // Also mark the unused vertex's final position as handled
      if (finalA && finalB && finalA !== finalB) {
        // Rare case: they tracked to different positions — add the other too
        const dOther = Math.hypot(finalB.x - M.x, finalB.y - M.y);
        if (dOther > 0.001 && dRidge > 0.001) {
          skeletonEdges.push({
            start: { x: r4(M.x), y: r4(M.y) },
            end: { x: r4(finalB.x), y: r4(finalB.y) },
          });
        }
      }
    }
  }

  // Ridge: edges of final ring not on original boundary
  if (ridgeRing && ridgeRing.length >= 3) {
    const rn = ridgeRing.length;
    for (let i = 0; i < rn; i++) {
      const j = (i + 1) % rn;
      const a = ridgeRing[i], b = ridgeRing[j];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < minLen) continue;
      let onBoundary = false;
      for (let k = 0; k < n; k++) {
        const kj = (k + 1) % n;
        if (
          ptSegDist(a.x, a.y, vertices[k].x, vertices[k].y, vertices[kj].x, vertices[kj].y) < 0.05 &&
          ptSegDist(b.x, b.y, vertices[k].x, vertices[k].y, vertices[kj].x, vertices[kj].y) < 0.05
        ) { onBoundary = true; break; }
      }
      if (!onBoundary) skeletonEdges.push({
        start: { x: r4(a.x), y: r4(a.y) },
        end: { x: r4(b.x), y: r4(b.y) },
      });
    }
  }

  // Build time map
  const vertMap = new Map();
  for (let ri = 0; ri < allRings.length; ri++) {
    const t = ri * lambda;
    for (const p of allRings[ri]) {
      const k = `${r4(p.x)},${r4(p.y)}`;
      if (!vertMap.has(k) || vertMap.get(k).t > t) vertMap.set(k, { x: p.x, y: p.y, t });
    }
  }

  return {
    edges: skeletonEdges,
    polygons: allRings,
    verts: Array.from(vertMap.values()),
    lambda,
    valleyMask,
  };
}

function r4(n) { return Math.round(n * 10000) / 10000; }