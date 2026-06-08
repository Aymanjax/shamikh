// @ts-nocheck
import { computeStraightSkeleton } from "./straightSkeleton";
import { initCGAL, isCGALReady, computeCGALSkeleton, cgalReady } from "./roofSkeletonCGAL";

const EPS = 0.001;
export const skeletonReady = cgalReady.then(() => true);

function r(n, d = 4) { return Math.round(n * 10 ** d) / 10 ** d; }
function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
function shoelaceArea(coords) {
  let s = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    s += coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1];
  }
  return s / 2;
}
function ensureCCW(coords) { return shoelaceArea(coords) < 0 ? coords.slice().reverse() : coords; }

/* ──────────────────────────────────────────
   الدالة الرئيسية
   ────────────────────────────────────────── */

export function computeRoofSkeleton(vertices, _slopePercent, sides) {
  if (!vertices || vertices.length < 3) return _empty("الرجاء إدخال 3 نقاط على الأقل");

  try {
    // Try CGAL WASM first for accurate results
    if (isCGALReady()) {
      const cgalResult = computeCGALSkeleton(vertices, sides);
      if (cgalResult && !cgalResult.valleys && !cgalResult.ridges) {
        // Empty result, fall through
      } else if (cgalResult) {
        return {
          ridges: cgalResult.ridges,
          hips: cgalResult.hips,
          valleys: cgalResult.valleys,
          gables: cgalResult.gables,
          faces: cgalResult.faces,
          faceHeights: cgalResult.faceHeights,
        };
      }
    }

    // Fall back to iterative weighted skeleton
    let coords = vertices.map(v => [v.x, v.y]);

    const [fx, fy] = coords[0], [lx, ly] = coords[coords.length - 1];
    if (Math.abs(fx - lx) < EPS && Math.abs(fy - ly) < EPS) coords = coords.slice(0, -1);
    if (coords.length < 3) return _empty("المساحة صغيرة جداً");

    const area = Math.abs(shoelaceArea(coords));
    if (area < 0.01) return _empty("المساحة صغيرة جداً — وسّع الشكل");

    coords = coords.filter((c, i, a) => dist(c[0], c[1], a[(i+1)%a.length][0], a[(i+1)%a.length][1]) >= EPS);
    if (coords.length < 3) return _empty("أضلاع متكررة — راجع الشكل");

    coords = ensureCCW(coords);
    const nOrig = coords.length;

    const velocities = coords.map((_, i) => (!sides || i >= sides.length || sides[i].isActive !== false) ? 1 : 0);

    const result = computeStraightSkeleton(
      coords.map(c => ({ x: c[0], y: c[1] })),
      velocities,
      { maxIter: 500 },
    );

    if (!result || result.edges.length === 0) return _empty("فشل حساب الشدات");

    const lambda = result.lambda || 0.03;

    // Use valleyMask from skeleton for accurate valley/hip/gable classification
    const vm = result.valleyMask || [];
    const vertKind = coords.map((_, i) => {
      const vP = velocities[(i - 1 + nOrig) % nOrig];
      const vC = velocities[i];
      if (vP === 0 || vC === 0) return 'gable';
      return vm[i] ? 'valley' : 'hip';
    });

    const timeMap = new Map();
    for (const v of result.verts) {
      const key = `${r(v.x,4)},${r(v.y,4)}`;
      if (!timeMap.has(key) || timeMap.get(key) > v.t) timeMap.set(key, v.t);
    }
    for (const c of coords) {
      const key = `${r(c[0],4)},${r(c[1],4)}`;
      if (!timeMap.has(key)) timeMap.set(key, 0);
    }

    const origKeys = new Set(coords.map(c => `${r(c[0],3)},${r(c[1],3)}`));
    const getTime  = (x, y) => timeMap.get(`${r(x,4)},${r(y,4)}`) ?? -1;
    const isOrig   = (x, y) => origKeys.has(`${r(x,3)},${r(y,3)}`);

    const ridges = [], hips = [], valleys = [], gables = [];
    const ridgeTol = lambda * 0.6;

    for (const seg of result.edges) {
      const { x: x1, y: y1 } = seg.start;
      const { x: x2, y: y2 } = seg.end;
      const len = dist(x1, y1, x2, y2);
      if (len < 0.001) continue;

      if (seg.isGableEdge) {
        gables.push(_seg(x1,y1,x2,y2,'gable'));
        continue;
      }

      const on1 = isOrig(x1, y1), on2 = isOrig(x2, y2);

      if (on1 && on2) continue;

      if (seg.vertexId !== undefined) {
        const vid = seg.vertexId % nOrig;
        const kind = vertKind[vid] || 'hip';
        if (kind === 'gable') gables.push(_seg(x1,y1,x2,y2,'gable'));
        else if (kind === 'valley') valleys.push(_seg(x1,y1,x2,y2,'valley'));
        else hips.push(_seg(x1,y1,x2,y2,'hip'));
        continue;
      }

      if (on1 || on2) continue;

      const t1 = getTime(x1, y1), t2 = getTime(x2, y2);
      if (t1 < 0 || t2 < 0) continue;

      if (Math.abs(t1 - t2) <= ridgeTol) {
        ridges.push(_seg(x1,y1,x2,y2,'ridge'));
      } else {
        hips.push(_seg(x1,y1,x2,y2,'hip'));
      }
    }

    const faces = result.polygons
      .filter(ring => ring.length >= 3)
      .map(ring => ring.map(p => ({ x: r(p.x), y: r(p.y) })));

    // Compute face heights from time values
    const timeLookup = new Map<string, number>();
    for (const v of result.verts) {
      timeLookup.set(`${r(v.x,3)},${r(v.y,3)}`, v.t);
    }
    const faceHeights = faces.map((face) => {
      let sum = 0, count = 0;
      for (const p of face) {
        const t = timeLookup.get(`${r(p.x,3)},${r(p.y,3)}`) || 0;
        sum += t; count++;
      }
      return count > 0 ? sum / count : 0;
    });

    return { ridges, hips, valleys, gables, faces, faceHeights };

  } catch (e) {
    console.warn("computeRoofSkeleton:", e);
    return _empty("خطأ — أعد رسم الشكل");
  }
}

/* ──────────────────────────────────────────
   customRectRoof: حل تحليلي دقيق للمستطيلات
   المبدأ: نحسب تقاطع الـ hips باستخدام معادلات المستقيمات (Line Intersection)
   الـ bisector بين جدارين متعامدين نشطين = خط بزاوية 45 درجة
   الـ ridge يمتد من نقطة التقاء الـ hips إلى الجدار المعطل
   ────────────────────────────────────────── */

export function customRectRoof(vertices, activeSides) {
  if (!vertices || vertices.length < 4) return null;

  // تجريد نقطة الإغلاق المكررة إن وجدت
  let v = vertices;
  if (v.length >= 5 && Math.abs(v[0].x - v[v.length - 1].x) < 0.01
      && Math.abs(v[0].y - v[v.length - 1].y) < 0.01) {
    v = v.slice(0, -1);
  }
  if (v.length !== 4) return null;

  const xs = v.map(p => p.x), ys = v.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  // تحقق أنه مستطيل محوري
  const corners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]];
  if (!corners.every(([bx,by]) => v.some(p => Math.abs(p.x-bx)<0.1 && Math.abs(p.y-by)<0.1))) return null;

  const W = maxX - minX; // العرض الأفقي
  const H = maxY - minY; // الارتفاع الرأسي

  // تعيين دور كل ضلع (top/right/bottom/left) من اتجاهه
  const sideRoles = _mapSideRoles(v, minX, maxX, minY, maxY);
  const active = { top: true, right: true, bottom: true, left: true };
  for (let i = 0; i < 4 && i < (activeSides?.length || 0); i++) {
    const role = sideRoles[i];
    if (role && activeSides[i]?.isActive === false) active[role] = false;
  }

  const { top, right, bottom, left } = active;
  const ridges = [], hips = [], valleys = [], gables = [];

  const s = (ax,ay,bx,by,type) => ({
    start: {x:r(ax),y:r(ay)}, end: {x:r(bx),y:r(by)},
    length: r(dist(ax,ay,bx,by)), type,
  });

  // ── أداة: سقف هيب قياسي لمستطيل (x0,y0)→(x1,y1) ──
  const standardHip = (x0, y0, x1, y1) => {
    const w = x1 - x0, h = y1 - y0;
    const off = Math.min(w, h) / 2;
    if (w >= h) {
      // ridge أفقي
      const vL = [x0+off, y0+off], vR = [x1-off, y0+off];
      hips.push(
        s(x0,y0,vL[0],vL[1],'hip'), s(x0,y1,vL[0],vL[1],'hip'),
        s(x1,y0,vR[0],vR[1],'hip'), s(x1,y1,vR[0],vR[1],'hip'),
      );
      if (vL[0] < vR[0]) ridges.push(s(vL[0],vL[1],vR[0],vR[1],'ridge'));
      // degenerate: pyramid
      else if (Math.abs(vL[0]-vR[0]) < 0.01) hips.splice(-4); // سيُعاد بعدها
    } else {
      // ridge رأسي
      const vT = [x0+off, y0+off], vB = [x0+off, y1-off];
      hips.push(
        s(x0,y0,vT[0],vT[1],'hip'), s(x1,y0,vT[0],vT[1],'hip'),
        s(x0,y1,vB[0],vB[1],'hip'), s(x1,y1,vB[0],vB[1],'hip'),
      );
      if (vT[1] < vB[1]) ridges.push(s(vT[0],vT[1],vB[0],vB[1],'ridge'));
    }
  };

  // ── 4 جدران نشطة ──
  if (top && right && bottom && left) {
    standardHip(minX, minY, maxX, maxY);
    return { ridges, hips, valleys, gables };
  }

  // ── يسار + يمين معطلان → ridge أفقي كامل ──
  if (top && !right && bottom && !left) {
    const ry = minY + H/2;
    ridges.push(s(minX,ry,maxX,ry,'ridge'));
    gables.push(s(minX,minY,minX,ry,'gable'),s(minX,ry,minX,maxY,'gable'));
    gables.push(s(maxX,minY,maxX,ry,'gable'),s(maxX,ry,maxX,maxY,'gable'));
    return { ridges, hips, valleys, gables };
  }

  // ── أعلى + أسفل معطلان → ridge رأسي كامل ──
  if (!top && right && !bottom && left) {
    const rx = minX + W/2;
    ridges.push(s(rx,minY,rx,maxY,'ridge'));
    gables.push(s(minX,minY,rx,minY,'gable'),s(rx,minY,maxX,minY,'gable'));
    gables.push(s(minX,maxY,rx,maxY,'gable'),s(rx,maxY,maxX,maxY,'gable'));
    return { ridges, hips, valleys, gables };
  }

  // ── جدار واحد معطل: حساب تقاطع الـ hips بدقة باستخدام معادلات المستقيمات ──
  //
  // المبدأ الهندسي:
  //   لكل زاوية بين جدارين نشطين متعامدين، الـ bisector بزاوية 45 درجة.
  //   الـ hip من الزاوية العليا اليسرى:  x = minX + (y - minY)
  //   الـ hip من الزاوية العليا اليمنى:  x = maxX - (y - minY)
  //   الـ hip من الزاوية السفلى اليسرى:  x = minX + (maxY - y)
  //   الـ hip من الزاوية السفلى اليمنى:  x = maxX - (maxY - y)
  //
  //   نحسب نقطة تقاطع الـ hips باستخدام حل المعادلتين، ثم يمتد الـ ridge
  //   من نقطة الالتقاء إلى الجدار المعطل.

  const halfW = W / 2, halfH = H / 2;
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;

  // أسفل معطل — hips من الزاويتين العلويتين يلتقيان وينزل ridge للأسفل
  if (top && right && !bottom && left) {
    if (halfW <= H + 0.01) {
      // الحالة الطبيعية: الـ hips يلتقيان عند (midX, minY+halfW)
      const ax = midX, ay = minY + halfW;
      hips.push(s(minX,minY,ax,ay,'hip'));
      hips.push(s(maxX,minY,ax,ay,'hip'));
      ridges.push(s(ax,ay,midX,maxY,'ridge'));
      gables.push(s(minX,maxY,midX,maxY,'gable'));
      gables.push(s(midX,maxY,maxX,maxY,'gable'));
    } else {
      // الـ hips يضربون الجدار الأسفل قبل الالتقاء
      const lx = minX + H, rx = maxX - H;
      hips.push(s(minX,minY,lx,maxY,'hip'));
      hips.push(s(maxX,minY,rx,maxY,'hip'));
      ridges.push(s(lx,maxY,rx,maxY,'ridge'));
      gables.push(s(minX,maxY,lx,maxY,'gable'));
      gables.push(s(rx,maxY,maxX,maxY,'gable'));
    }
    return { ridges, hips, valleys, gables };
  }

  // أعلى معطل — hips من الزاويتين السفليتين يلتقيان ويطلع ridge للأعلى
  if (!top && right && bottom && left) {
    if (halfW <= H + 0.01) {
      const ax = midX, ay = maxY - halfW;
      hips.push(s(minX,maxY,ax,ay,'hip'));
      hips.push(s(maxX,maxY,ax,ay,'hip'));
      ridges.push(s(ax,ay,midX,minY,'ridge'));
      gables.push(s(minX,minY,midX,minY,'gable'));
      gables.push(s(midX,minY,maxX,minY,'gable'));
    } else {
      const lx = minX + H, rx = maxX - H;
      hips.push(s(minX,maxY,lx,minY,'hip'));
      hips.push(s(maxX,maxY,rx,minY,'hip'));
      ridges.push(s(lx,minY,rx,minY,'ridge'));
      gables.push(s(minX,minY,lx,minY,'gable'));
      gables.push(s(rx,minY,maxX,minY,'gable'));
    }
    return { ridges, hips, valleys, gables };
  }

  // يمين معطل — hips من الزاويتين اليسريتين يلتقيان ويمتد ridge لليمين
  if (top && !right && bottom && left) {
    if (halfH <= W + 0.01) {
      const ax = minX + halfH, ay = midY;
      hips.push(s(minX,minY,ax,ay,'hip'));
      hips.push(s(minX,maxY,ax,ay,'hip'));
      ridges.push(s(ax,ay,maxX,midY,'ridge'));
      gables.push(s(maxX,minY,maxX,midY,'gable'));
      gables.push(s(maxX,midY,maxX,maxY,'gable'));
    } else {
      const ty = minY + W, by = maxY - W;
      hips.push(s(minX,minY,maxX,ty,'hip'));
      hips.push(s(minX,maxY,maxX,by,'hip'));
      ridges.push(s(maxX,ty,maxX,by,'ridge'));
      gables.push(s(maxX,minY,maxX,ty,'gable'));
      gables.push(s(maxX,by,maxX,maxY,'gable'));
    }
    return { ridges, hips, valleys, gables };
  }

  // يسار معطل — hips من الزاويتين اليمنيتين يلتقيان ويمتد ridge لليسار
  if (top && right && bottom && !left) {
    if (halfH <= W + 0.01) {
      const ax = maxX - halfH, ay = midY;
      hips.push(s(maxX,minY,ax,ay,'hip'));
      hips.push(s(maxX,maxY,ax,ay,'hip'));
      ridges.push(s(ax,ay,minX,midY,'ridge'));
      gables.push(s(minX,minY,minX,midY,'gable'));
      gables.push(s(minX,midY,minX,maxY,'gable'));
    } else {
      const ty = minY + W, by = maxY - W;
      hips.push(s(maxX,minY,minX,ty,'hip'));
      hips.push(s(maxX,maxY,minX,by,'hip'));
      ridges.push(s(minX,ty,minX,by,'ridge'));
      gables.push(s(minX,minY,minX,ty,'gable'));
      gables.push(s(minX,by,minX,maxY,'gable'));
    }
    return { ridges, hips, valleys, gables };
  }

  // fallback: hip عادي
  standardHip(minX, minY, maxX, maxY);
  return { ridges, hips, valleys, gables };
}

/* ──────────────────────────────────────────
   Tarabeesh calculator
   ────────────────────────────────────────── */

export function calcTarabeeshFromSkeleton(skeleton, slopePercent, vertices, sides) {
  if (!skeleton) return 0;
  const sf = Math.sqrt(1 + (slopePercent/100)**2);

  const flatKeys = new Set();
  let hasFlat = false;
  if (sides && vertices) {
    for (let i = 0; i < sides.length && i < vertices.length; i++) {
      if (sides[i].isActive === false) {
        hasFlat = true;
        const v1 = vertices[i], v2 = vertices[(i+1)%vertices.length];
        if (v1) flatKeys.add(`${r(v1.x,3)},${r(v1.y,3)}`);
        if (v2) flatKeys.add(`${r(v2.x,3)},${r(v2.y,3)}`);
      }
    }
  }

  const needsSlope = e => !hasFlat || !(
    flatKeys.has(`${r(e.start.x,3)},${r(e.start.y,3)}`) ||
    flatKeys.has(`${r(e.end.x,3)},${r(e.end.y,3)}`)
  );

  const sum = arr => (arr||[]).reduce((s,e) => s + (e.length||0), 0);
  const sumSloped = arr => (arr||[]).reduce((s,e) => s + (e.length||0) * (needsSlope(e) ? sf : 1), 0);

  return +(sum(skeleton.ridges) + sumSloped(skeleton.hips) + sumSloped(skeleton.valleys)).toFixed(2);
}

/* ──────────────────────────────────────────
   Helpers
   ────────────────────────────────────────── */

function _empty(error: string) {
  return { ridges: [], hips: [], valleys: [], gables: [], faces: [], faceHeights: [], error };
}

/**
 * Compute water flow direction for each wall (edge) of the building.
 * Returns an array of direction info per edge:
 *   - from midpoint of wall, pointing inward toward the ridge
 */
export function computeWaterDirections(
  vertices: { x: number; y: number }[],
  sides?: { isActive?: boolean }[]
): { edgeIndex: number; fromX: number; fromY: number; toX: number; toY: number; isActive: boolean; arrowLen: number }[] {
  if (!vertices || vertices.length < 2) return [];

  const n = vertices.length;
  const hasClosing = n >= 2 &&
    Math.abs(vertices[0].x - vertices[n - 1].x) < EPS &&
    Math.abs(vertices[0].y - vertices[n - 1].y) < EPS;
  const count = hasClosing ? n - 1 : n;

  const directions: any[] = [];

  for (let i = 0; i < count; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % n];
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) { directions.push(null); continue; }

    const isActive = !sides || sides.length <= i || sides[i].isActive !== false;

    // Inward normal for CCW polygon: rotate edge direction 90° CCW → (-dy, dx)
    const nx = -dy / len;
    const ny = dx / len;

    const midX = (v1.x + v2.x) / 2;
    const midY = (v1.y + v2.y) / 2;

    // Arrow length: 20% of wall length, min 0.4m
    const arrowLen = Math.max(0.4, len * 0.2);

    directions.push({
      edgeIndex: i,
      fromX: midX,
      fromY: midY,
      toX: midX + nx * arrowLen * 1.8,
      toY: midY + ny * arrowLen * 1.8,
      innerX: nx,
      innerY: ny,
      isActive,
      arrowLen,
    });
  }

  return directions;
}

function _seg(x1,y1,x2,y2,type) {
  return { start:{x:r(x1),y:r(y1)}, end:{x:r(x2),y:r(y2)}, length:r(dist(x1,y1,x2,y2)), type };
}

function _mapSideRoles(vertices, minX, maxX, minY, maxY) {
  return vertices.map((v, i) => {
    const b = vertices[(i+1)%vertices.length];
    const mx = (v.x+b.x)/2, my = (v.y+b.y)/2;
    if (Math.abs(my-minY) < 0.15) return 'top';
    if (Math.abs(mx-maxX) < 0.15) return 'right';
    if (Math.abs(my-maxY) < 0.15) return 'bottom';
    if (Math.abs(mx-minX) < 0.15) return 'left';
    return null;
  });
}
