import { describe, it, expect } from "vitest";
import { customRectRoof } from "./roofSkeleton";

type Pt = { x: number; y: number };
type Seg = { start: Pt; end: Pt; length: number; type: string };
type Face = { poly: Pt[]; eave: { ax: number; ay: number; bx: number; by: number } };
type Skel = { ridges: Seg[]; hips: Seg[]; valleys: Seg[]; gables: Seg[]; slopeFaces: Face[] };

// Rectangle 10 (W) × 6 (H), vertices ordered TL, TR, BR, BL (screen coords, y-down).
// Edge → role mapping (from _mapSideRoles): 0=top, 1=right, 2=bottom, 3=left.
const ROLES = ["top", "right", "bottom", "left"] as const;
type Role = (typeof ROLES)[number];

function rect(disabled: Role[] = []) {
  const verts = [
    { x: 0, y: 0 }, // TL
    { x: 10, y: 0 }, // TR
    { x: 10, y: 6 }, // BR
    { x: 0, y: 6 }, // BL
  ];
  const sides = ROLES.map((role) => ({ isActive: !disabled.includes(role) }));
  return customRectRoof(verts, sides) as unknown as Skel;
}

const allSegs = (res: Skel) => [...res.ridges, ...res.hips, ...res.valleys, ...res.gables];

/** Every endpoint must stay inside the rectangle — the core "lines don't escape/cross" guard. */
function endpointsInBounds(res: Skel) {
  return allSegs(res).every((e: Seg) =>
    e.start.x >= -0.01 && e.start.x <= 10.01 && e.start.y >= -0.01 && e.start.y <= 6.01 &&
    e.end.x >= -0.01 && e.end.x <= 10.01 && e.end.y >= -0.01 && e.end.y <= 6.01);
}

describe("customRectRoof — unified analytic solver", () => {
  it("4 active walls → full hip (4 hips, 1 horizontal ridge, no gables)", () => {
    const res = rect([]);
    expect(res.hips).toHaveLength(4);
    expect(res.ridges).toHaveLength(1);
    expect(res.gables).toHaveLength(0);
    // W > H ⇒ horizontal ridge of length W − H = 4
    expect(res.ridges[0].length).toBeCloseTo(4, 1);
    expect(endpointsInBounds(res)).toBe(true);
  });

  it("one wall disabled (bottom) → 2 hips + 1 ridge + 2 gables (100% case)", () => {
    const res = rect(["bottom"]);
    expect(res.hips).toHaveLength(2);
    expect(res.ridges).toHaveLength(1);
    expect(res.gables).toHaveLength(2);
    expect(endpointsInBounds(res)).toBe(true);
  });

  it("two OPPOSITE walls disabled (left+right) → full ridge, no hips", () => {
    const res = rect(["left", "right"]);
    expect(res.hips).toHaveLength(0);
    expect(res.ridges).toHaveLength(1);
    expect(res.ridges[0].length).toBeCloseTo(10, 1); // ridge spans full width
    expect(endpointsInBounds(res)).toBe(true);
  });

  it("two ADJACENT walls disabled (top+left) → single hip + ridge, NO crossing (the bug)", () => {
    const res = rect(["top", "left"]);
    // Previously this fell through to a full 4-sided hip (4 hips) that crossed
    // the gable area. The unified solver yields exactly one hip + one ridge.
    expect(res.hips).toHaveLength(1);
    expect(res.ridges).toHaveLength(1);
    expect(endpointsInBounds(res)).toBe(true);
    // Hip runs from the active–active corner (BR) to the ridge end.
    const hip = res.hips[0];
    const corners = [hip.start, hip.end];
    expect(corners.some((p: Pt) => Math.abs(p.x - 10) < 0.01 && Math.abs(p.y - 6) < 0.01)).toBe(true);
  });

  it("three walls disabled (only bottom active) → mono-pitch ridge, no hips", () => {
    const res = rect(["top", "left", "right"]);
    expect(res.hips).toHaveLength(0);
    expect(res.ridges).toHaveLength(1);
    expect(res.ridges[0].length).toBeCloseTo(10, 1);
    expect(endpointsInBounds(res)).toBe(true);
  });

  it("all four walls disabled → flat roof: 4 gables, no ridge/hip", () => {
    const res = rect(["top", "right", "bottom", "left"]);
    expect(res.ridges).toHaveLength(0);
    expect(res.hips).toHaveLength(0);
    expect(res.gables).toHaveLength(4);
    expect(endpointsInBounds(res)).toBe(true);
  });

  it("exposes one sloped face per active wall, each a valid polygon with an eave", () => {
    expect(rect([]).slopeFaces).toHaveLength(4);            // 4 active
    expect(rect(["bottom"]).slopeFaces).toHaveLength(3);   // 3 active
    expect(rect(["left", "right"]).slopeFaces).toHaveLength(2);
    expect(rect(["top", "left"]).slopeFaces).toHaveLength(2);
    expect(rect(["top", "left", "right"]).slopeFaces).toHaveLength(1);
    expect(rect(["top", "right", "bottom", "left"]).slopeFaces).toHaveLength(0);
    for (const f of rect([]).slopeFaces) {
      expect(f.poly.length).toBeGreaterThanOrEqual(3);
      expect(f.eave).toBeTruthy();
    }
  });

  it("returns null for non-rectangular input (defers to the general engine)", () => {
    const tri = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];
    expect(customRectRoof(tri, [])).toBeNull();
  });

  it("every disabled-wall combination keeps all lines inside the rectangle", () => {
    const combos: Role[][] = [
      [], ["top"], ["right"], ["bottom"], ["left"],
      ["top", "right"], ["right", "bottom"], ["bottom", "left"], ["left", "top"],
      ["top", "bottom"], ["left", "right"],
      ["top", "right", "bottom"], ["right", "bottom", "left"],
      ["top", "right", "bottom", "left"],
    ];
    for (const c of combos) {
      const res = rect(c);
      expect(res).not.toBeNull();
      expect(res.ridges.length).toBeLessThanOrEqual(1);
      expect(endpointsInBounds(res)).toBe(true);
    }
  });
});

// ── computeRoofSkeleton: gable post-process on non-rectangular shapes ──
// Regression for the spurious-triangle bug: gabling a wall whose two corners
// reach two *different* inner skeleton nodes used to push a ridge from the wall
// midpoint M to each node, forming a triangle. The midpoint must now connect to
// a single point on the ridge network instead.
import { computeRoofSkeleton } from "./roofSkeleton";

const near = (a: Pt, x: number, y: number, e = 0.05) =>
  Math.abs(a.x - x) < e && Math.abs(a.y - y) < e;
const touches = (s: Seg, x: number, y: number) => near(s.start, x, y) || near(s.end, x, y);

describe("computeRoofSkeleton — gable post-process (no spurious triangle)", () => {
  it("L-shape, top wall gable → single ridge stub to midpoint, no triangle", () => {
    const verts = [
      { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 5 },
      { x: 4, y: 5 }, { x: 4, y: 10 }, { x: 0, y: 10 },
    ];
    const sides = verts.map((_, i) => ({ isActive: i !== 0 })); // edge 0 (top) = gable
    const sk = computeRoofSkeleton(verts, 30, sides) as unknown as Skel;
    const M = { x: 4, y: 0 }; // midpoint of the gabled top wall
    // exactly ONE ridge touches the wall midpoint (the stub) — not two (triangle)
    const ridgesAtM = sk.ridges.filter((r) => touches(r, M.x, M.y));
    expect(ridgesAtM).toHaveLength(1);
    // no hip may dangle off the two gable corners (0,0) / (8,0)
    expect(sk.hips.some((h) => touches(h, 0, 0) || touches(h, 8, 0))).toBe(false);
  });

  it("T-shape, top wall gable → single ridge stub to junction, no triangle", () => {
    const verts = [
      { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 4 }, { x: 8, y: 4 },
      { x: 8, y: 12 }, { x: 4, y: 12 }, { x: 4, y: 4 }, { x: 0, y: 4 },
    ];
    const sides = verts.map((_, i) => ({ isActive: i !== 0 })); // top wall gable
    const sk = computeRoofSkeleton(verts, 30, sides) as unknown as Skel;
    const M = { x: 6, y: 0 };
    const ridgesAtM = sk.ridges.filter((r) => touches(r, M.x, M.y));
    expect(ridgesAtM).toHaveLength(1);
    expect(sk.hips.some((h) => touches(h, 0, 0) || touches(h, 12, 0))).toBe(false);
  });
});
