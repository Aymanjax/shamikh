// @ts-nocheck
/**
 * Roof 3D Solid Builder
 *
 * Takes the 2D polygon + straight-skeleton + slope % and constructs an
 * OCCT BREP solid representing the complete roof structure:
 *   - Sloped roof faces at the correct pitch
 *   - Vertical wall extrusions where isActive === false
 *   - Ridge / hip / valley edges as topological edges
 *
 * Algorithm (face-by-face extrusion):
 *   1. For each skeleton face, compute the 3D position of every vertex via
 *      the height map (distance-to-nearest-wall-edge × slopeFactor).
 *   2. Build a planar OCCT Face from those 3D points.
 *   3. Sew all faces together into a Shell → Solid.
 *   4. Optionally add vertical wall faces along inactive edges.
 */

import { getOCCT } from "./occtEngine";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Build a height-map for every skeleton vertex.
 * height = distance to the nearest wall-edge × slopeFactor.
 */
function buildHeightMap(skeleton, polyVerts, slopeFactor) {
  /** @type {Map<string, number>} */
  const map = new Map();

  const allPts = [];
  for (const list of [skeleton.ridges, skeleton.hips, skeleton.valleys]) {
    if (!list) continue;
    for (const seg of list) {
      const sk = `${round(seg.start.x, 4)},${round(seg.start.y, 4)}`;
      const ek = `${round(seg.end.x, 4)},${round(seg.end.y, 4)}`;
      if (!map.has(sk)) { map.set(sk, 0); allPts.push(seg.start); }
      if (!map.has(ek)) { map.set(ek, 0); allPts.push(seg.end); }
    }
  }

  const n = polyVerts.length;
  for (const pt of allPts) {
    let minD = Infinity;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const d = distToSegment(pt.x, pt.y, polyVerts[i].x, polyVerts[i].y, polyVerts[j].x, polyVerts[j].y);
      if (d < minD) minD = d;
    }
    const key = `${round(pt.x, 4)},${round(pt.y, 4)}`;
    map.set(key, minD * slopeFactor);
  }
  return map;
}

function round(n, d = 4) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ */
/*  OCCT helpers (assumes module is loaded)                            */
/* ------------------------------------------------------------------ */

function gpPnt(x, y, z) {
  const { gp_Pnt } = getOCCT();
  return new gp_Pnt(x, y, z);
}

function gpDir(x, y, z) {
  const { gp_Dir } = getOCCT();
  return new gp_Dir(x, y, z);
}

/**
 * Build an OCCT TopoDS_Face from an array of 3D points (planar polygon).
 */
function buildFace(pts3d) {
  const oc = getOCCT();
  const { TColgp_Array1OfPnt, BRepBuilderAPI_MakePolygon, BRepBuilderAPI_MakeFace } = oc;

  const n = pts3d.length;
  if (n < 3) return null;

  const arr = new TColgp_Array1OfPnt(1, n + 1);
  for (let i = 0; i < n; i++) {
    arr.SetValue(i + 1, pts3d[i]);
  }
  // Close polygon
  arr.SetValue(n + 1, pts3d[0]);

  const wireBuilder = new BRepBuilderAPI_MakePolygon();
  for (let i = 1; i <= n + 1; i++) {
    wireBuilder.Add(arr.Value(i));
  }
  const wire = wireBuilder.Wire();
  if (wire.IsNull()) return null;

  const faceBuilder = new BRepBuilderAPI_MakeFace(wire, true);
  if (!faceBuilder.IsDone()) return null;
  return faceBuilder.Face();
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate a 3D BREP solid roof from the 2D skeleton.
 *
 * @param {object} skeleton   — { ridges, hips, valleys, faces }
 * @param {{x:number,y:number}[]} polyVerts — building outline (closed loop)
 * @param {number} slopePercent — e.g. 20 for 20 %
 * @param {number} [wallHeight=0.3] — vertical wall band height in metres
 * @returns {{ shape, faces: object[], stats: object } | null}
 *
 * shape    — OCCT TopoDS_Shape (the solid roof)
 * faces   — metadata per roof-face { vertices, area, normal }
 * stats   — { totalArea, ridgeLength, hipLength, valleyLength }
 */
export function generateRoof3D(skeleton, polyVerts, slopePercent, wallHeight = 0.3) {
  const oc = getOCCT();
  if (!oc || !skeleton || !polyVerts || polyVerts.length < 3) return null;

  const slopeFactor = slopePercent / 100;
  const heightMap = buildHeightMap(skeleton, polyVerts, slopeFactor);

  // ------------------------------------------------------------------
  // Build an OCCT face for each skeleton face
  // ------------------------------------------------------------------
  const ocFaces = [];
  const faceMeta = [];

  for (const face2d of skeleton.faces || []) {
    if (face2d.length < 3) continue;

    const pts3d = face2d.map((p) => {
      const z = heightMap.get(`${round(p.x, 4)},${round(p.y, 4)}`) || 0;
      return gpPnt(p.x, p.y, z);
    });

    const face = buildFace(pts3d);
    if (!face) continue;

    // Compute face area & normal
    const props = new oc.BRepGProp_Face(face);
    const surf = new oc.GProp_GProps();
    props.Add(surf);
    const area = surf.Mass();

    // Normal at face centre
    const uf = new oc.Adaptor3d_IsoCurve();
    const centre = surf.CentreOfMass();
    const norm = face.Normal(centre.X(), centre.Y(), centre.Z());

    ocFaces.push(face);
    faceMeta.push({
      vertices: pts3d.map((p) => ({ x: p.X(), y: p.Y(), z: p.Z() })),
      area: area,
      normal: { x: norm.X(), y: norm.Y(), z: norm.Z() },
    });
  }

  if (ocFaces.length === 0) return null;

  // ------------------------------------------------------------------
  // Sew all faces together into a single Shell / Solid
  // ------------------------------------------------------------------
  const sewed = new oc.BRepBuilderAPI_Sewing();
  for (const f of ocFaces) sewed.Add(f);
  sewed.Perform();
  const shell = sewed.SewedShape();
  if (shell.IsNull()) return null;

  // Convert shell → solid
  const solidMaker = new oc.BRepBuilderAPI_MakeSolid();
  solidMaker.Add(oc.TopoDS.Shell(shell));
  const solid = solidMaker.Solid();

  // ------------------------------------------------------------------
  // Optional: add vertical wall faces along inactive edges (future)
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // Skeleton line lengths (ridge / hip / valley remain unchanged)
  // ------------------------------------------------------------------
  const ridgeLen = (skeleton.ridges || []).reduce((s, r) => s + (r.length || 0), 0);
  const hipLen = (skeleton.hips || []).reduce((s, h) => s + (h.length || 0), 0);
  const valleyLen = (skeleton.valleys || []).reduce((s, v) => s + (v.length || 0), 0);

  return {
    shape: solid,
    faces: faceMeta,
    stats: {
      totalArea: faceMeta.reduce((s, f) => s + f.area, 0),
      ridgeLength: ridgeLen,
      hipLength: hipLen,
      valleyLength: valleyLen,
    },
  };
}
