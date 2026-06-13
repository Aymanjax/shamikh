// @ts-nocheck
import { computeStraightSkeleton } from "./straightSkeleton";
import { computeRoofSkeleton as computeEventSkeleton } from "./skeleton";
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

    // محرك الأحداث (edge + split events) يحسب الشدّات بدقة للأشكال المعقّدة
    // والوديان دون تقاطع. نستخدمه عندما لا توجد جدران معطّلة (لا يدعم الجملونات).
    const anyDisabled = sides && sides.some((sd) => sd && sd.isActive === false);
    if (!anyDisabled) {
      try {
        const ev = computeEventSkeleton(coords.map((c) => ({ x: c[0], y: c[1] })));
        if (ev && (ev.ridges.length || ev.hips.length || ev.valleys.length)) {
          return { ridges: ev.ridges, hips: ev.hips, valleys: ev.valleys, gables: [], faces: [], faceHeights: [] };
        }
      } catch (e) {
        console.warn("event skeleton failed, falling back to iterative:", e);
      }
    }

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

  // ──────────────────────────────────────────────────────────────
  // حل تحليلي موحّد لأي مستطيل محوري مع أي تركيبة جدران مائلة/جملون.
  //
  // المبدأ: كل ضلع مائل (نشط) ينزاح للداخل بسرعة 1، وكل ضلع جملون
  // (معطّل) يبقى ثابتاً. تحت هذا الانزياح يبقى الشكل مستطيلاً دائماً،
  // فتنهار إحدى الأبعاد أولاً (لحظة تكوّن النصوة):
  //   عرض(t) = W − kx·t   حيث kx = عدد الأضلاع الرأسية النشطة (يسار/يمين)
  //   ارتفاع(t) = H − ky·t حيث ky = عدد الأضلاع الأفقية النشطة (أعلى/أسفل)
  // النصوة تتكوّن عند tStar = min(W/kx, H/ky)، ثم كل زاوية تترك أثراً:
  //   • زاوية بين ضلعين نشطين  → hip (خط 45°)
  //   • زاوية على ضلع جملون    → الأثر ينزلق على الجدار (gable)
  //   • زاوية بين جملونين      → ثابتة (بلا أثر)
  // هذه الصيغة تغطّي كل الحالات (0..4 جدران معطّلة) دون تقاطع خطوط.
  // ──────────────────────────────────────────────────────────────
  const aL = left ? 1 : 0, aR = right ? 1 : 0, aT = top ? 1 : 0, aB = bottom ? 1 : 0;
  const kx = aL + aR;   // أضلاع رأسية نشطة
  const ky = aT + aB;   // أضلاع أفقية نشطة
  const tx = kx > 0 ? W / kx : Infinity;
  const ty = ky > 0 ? H / ky : Infinity;
  const tStar = Math.min(tx, ty);

  // كل الجدران جملون → سقف مسطّح بلا شدّات؛ نرسم الجدران الأربعة كجملونات
  if (!isFinite(tStar)) {
    gables.push(
      s(minX,minY,maxX,minY,'gable'), s(maxX,minY,maxX,maxY,'gable'),
      s(maxX,maxY,minX,maxY,'gable'), s(minX,maxY,minX,minY,'gable'),
    );
    return { ridges, hips, valleys, gables, slopeFaces: [] };
  }

  // مواقع الزوايا النهائية بعد الانزياح حتى لحظة النصوة
  const Lx = minX + aL * tStar, Rx = maxX - aR * tStar;
  const Ty = minY + aT * tStar, By = maxY - aB * tStar;

  // كل زاوية: نقطة البداية، نقطتها النهائية، وعدد أضلاعها النشطة
  const cornerList = [
    { x0: minX, y0: minY, fx: Lx, fy: Ty, act: aL + aT }, // أعلى-يسار (يسار، أعلى)
    { x0: maxX, y0: minY, fx: Rx, fy: Ty, act: aT + aR }, // أعلى-يمين (أعلى، يمين)
    { x0: maxX, y0: maxY, fx: Rx, fy: By, act: aR + aB }, // أسفل-يمين (يمين، أسفل)
    { x0: minX, y0: maxY, fx: Lx, fy: By, act: aB + aL }, // أسفل-يسار (أسفل، يسار)
  ];

  for (const c of cornerList) {
    if (dist(c.x0, c.y0, c.fx, c.fy) < 0.01) continue; // زاوية ثابتة (جملونان)
    if (c.act === 2) hips.push(s(c.x0, c.y0, c.fx, c.fy, 'hip'));
    else gables.push(s(c.x0, c.y0, c.fx, c.fy, 'gable')); // أثر منزلق على جدار الجملون
  }

  // النصوة = القطعة بين موضعَي الزوايا النهائية المتمايزين
  const uniq = [];
  for (const p of [[Lx,Ty],[Rx,Ty],[Rx,By],[Lx,By]]) {
    if (!uniq.some(q => Math.abs(q[0]-p[0]) < 0.01 && Math.abs(q[1]-p[1]) < 0.01)) uniq.push(p);
  }
  if (uniq.length === 2) {
    ridges.push(s(uniq[0][0], uniq[0][1], uniq[1][0], uniq[1][1], 'ridge'));
  }
  // uniq.length === 1 → هرم (بلا نصوة)

  // ── أوجه السقف المائلة (لرسم شبكة القرميد باتجاه ميل كل وجه) ──
  // كل وجه = ضلع المزراب (eave) + أثرَا زاويتيه حتى النصوة. نخزّن المضلّع
  // وحافة المزراب ليتمكّن الراسم من محاذاة شبكة القرميد مع اتجاه الميل.
  const cf = { TL: [Lx, Ty], TR: [Rx, Ty], BR: [Rx, By], BL: [Lx, By] };
  const orig = { TL: [minX, minY], TR: [maxX, minY], BR: [maxX, maxY], BL: [minX, maxY] };
  const faceDefs = [
    { on: top,    a: "TL", b: "TR" },
    { on: right,  a: "TR", b: "BR" },
    { on: bottom, a: "BR", b: "BL" },
    { on: left,   a: "BL", b: "TL" },
  ];
  const slopeFaces = [];
  for (const fd of faceDefs) {
    if (!fd.on) continue;
    const A = orig[fd.a], B = orig[fd.b], Bf = cf[fd.b], Af = cf[fd.a];
    const ring = [];
    for (const p of [A, B, Bf, Af]) {
      const last = ring[ring.length - 1];
      if (!last || dist(last[0], last[1], p[0], p[1]) > 0.01) ring.push(p);
    }
    while (ring.length > 1 && dist(ring[0][0], ring[0][1], ring[ring.length - 1][0], ring[ring.length - 1][1]) < 0.01) ring.pop();
    if (ring.length < 3) continue;
    slopeFaces.push({
      poly: ring.map(p => ({ x: r(p[0]), y: r(p[1]) })),
      eave: { ax: r(A[0]), ay: r(A[1]), bx: r(B[0]), by: r(B[1]) },
    });
  }

  return { ridges, hips, valleys, gables, slopeFaces };
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
