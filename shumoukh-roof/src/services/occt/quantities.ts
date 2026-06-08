// @ts-nocheck
/**
 * Automatic Quantity Takeoff
 *
 * Uses OCCT's precise BRepGProp engine to extract:
 *   - Surface area per roof face (for tiles / sheeting)
 *   - Edge lengths (for flashings, gutters, ridges)
 *   - Volume (for insulation / concrete fill)
 *
 * Pure-geometry fallback when OCCT is not loaded uses the skeleton
 * face vertices and slopes.
 */

import { getOCCT, isOCCTReady } from "./occtEngine";

/* ------------------------------------------------------------------ */
/*  OCCT-based exact quantities                                        */
/* ------------------------------------------------------------------ */

/**
 * Compute precise quantities from the 3D roof solid.
 *
 * @param {import("opencascade.js").TopoDS_Shape} shape — roof solid
 * @returns {{
 *   totalSurfaceArea: number,
 *   totalEdgeLength: number,
 *   totalVolume: number,
 *   faceAreas: number[],
 * }}
 */
export function computeOCCTQuantities(shape) {
  const oc = getOCCT();

  // -- Volume --------------------------------------------------------
  const volProps = new oc.GProp_GProps();
  oc.BRepGProp.VolumeProperties(shape, volProps);
  const totalVolume = volProps.Mass();

  // -- Surface area --------------------------------------------------
  const surfProps = new oc.GProp_GProps();
  oc.BRepGProp.SurfaceProperties(shape, surfProps);
  const totalSurfaceArea = surfProps.Mass();

  // -- Edge length ---------------------------------------------------
  const linProps = new oc.GProp_GProps();
  oc.BRepGProp.LinearProperties(shape, linProps);
  const totalEdgeLength = linProps.Mass();

  // -- Per-face areas ------------------------------------------------
  const faceAreas = [];
  const explorer = new oc.TopExp_Explorer(shape, oc.TopAbs_FACE);
  while (explorer.More()) {
    const face = oc.TopoDS.Face(explorer.Current());
    explorer.Next();

    const fProps = new oc.GProp_GProps();
    oc.BRepGProp.SurfaceProperties(face, fProps);
    faceAreas.push(fProps.Mass());
  }

  return {
    totalSurfaceArea,
    totalEdgeLength,
    totalVolume,
    faceAreas,
  };
}

/* ------------------------------------------------------------------ */
/*  Fallback quantities (skeleton-based, no OCCT)                      */
/* ------------------------------------------------------------------ */

function round(n, d = 4) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/**
 * Compute quantities from skeleton + slope (no OCCT needed).
 *
 * @param {object} skeleton — { ridges, hips, valleys, faces }
 * @param {{x:number,y:number}[]} polyVerts — building outline
 * @param {number} slopePercent
 * @returns {{
 *   totalArea: number,
 *   ridgeLength: number,
 *   hipLength: number,
 *   valleyLength: number,
 *   edgeCount: number,
 * }}
 */
export function computeFallbackQuantities(skeleton, polyVerts, slopePercent) {
  const slopeFactor = Math.sqrt(1 + (slopePercent / 100) ** 2);

  // Area = 2D poly area × slope factor (approximate for simple hip roofs)
  const polyArea2d = polygonArea(polyVerts);
  const totalArea = polyArea2d * slopeFactor;

  const ridgeLen = (skeleton.ridges || []).reduce((s, r) => s + (r.length || 0), 0);
  const hipLen = (skeleton.hips || []).reduce((s, h) => s + (h.length || 0), 0);
  const valleyLen = (skeleton.valleys || []).reduce((s, v) => s + (v.length || 0), 0);

  return {
    totalArea: round(totalArea, 2),
    ridgeLength: round(ridgeLen, 2),
    hipLength: round(hipLen, 2),
    valleyLength: round(valleyLen, 2),
    edgeCount: (skeleton.ridges?.length || 0) + (skeleton.hips?.length || 0) + (skeleton.valleys?.length || 0),
  };
}

function polygonArea(verts) {
  let area = 0;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += verts[i].x * verts[j].y;
    area -= verts[j].x * verts[i].y;
  }
  return Math.abs(area) / 2;
}

/* ------------------------------------------------------------------ */
/*  Unified entry point                                                */
/* ------------------------------------------------------------------ */

/**
 * Auto-selects OCCT or fallback depending on whether the WASM is loaded.
 */
export function computeQuantities(skeleton, polyVerts, slopePercent, shape) {
  if (isOCCTReady() && shape) {
    const q = computeOCCTQuantities(shape);
    return {
      method: "occt",
      ...q,
    };
  }
  const f = computeFallbackQuantities(skeleton, polyVerts, slopePercent);
  return {
    method: "fallback",
    ...f,
  };
}
