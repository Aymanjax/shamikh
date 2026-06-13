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

// ── computeRoofSkeleton: gable-aware engine (lean-to / shed model) ──
// A gabled wall is a fixed (non-offsetting) edge, so its corners slide along it
// (no spurious triangle) and the roof ridge stops at the interior junction
// instead of running up to the gable wall.
import { computeRoofSkeleton } from "./roofSkeleton";

const near = (a: Pt, x: number, y: number, e = 0.05) =>
  Math.abs(a.x - x) < e && Math.abs(a.y - y) < e;
const touches = (s: Seg, x: number, y: number) => near(s.start, x, y) || near(s.end, x, y);

describe("computeRoofSkeleton — gable-aware engine (ridge stops at valley)", () => {
  it("L-shape, top wall gable → ridge stays interior, no stub up to the wall", () => {
    const verts = [
      { x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 5 },
      { x: 4, y: 5 }, { x: 4, y: 10 }, { x: 0, y: 10 },
    ];
    const sides = verts.map((_, i) => ({ isActive: i !== 0 })); // edge 0 (top) = gable
    const sk = computeRoofSkeleton(verts, 30, sides) as unknown as Skel;
    // no ridge runs up to the gabled top wall (y ≈ 0)
    const onTopWall = (p: Pt) => Math.abs(p.y) < 0.05 && p.x >= -0.05 && p.x <= 8.05;
    expect(sk.ridges.some((r) => onTopWall(r.start) || onTopWall(r.end))).toBe(false);
    // the gable wall is emitted, and its corners carry no hips
    expect(sk.gables.length).toBeGreaterThanOrEqual(1);
    expect(sk.hips.some((h) => touches(h, 0, 0) || touches(h, 8, 0))).toBe(false);
  });

  it("T-shape, top wall gable → ridge stops at the valley junction, not the wall", () => {
    const verts = [
      { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 4 }, { x: 8, y: 4 },
      { x: 8, y: 12 }, { x: 4, y: 12 }, { x: 4, y: 4 }, { x: 0, y: 4 },
    ];
    const sides = verts.map((_, i) => ({ isActive: i !== 0 })); // top wall gable
    const sk = computeRoofSkeleton(verts, 30, sides) as unknown as Skel;
    // ridge does not reach the gabled top wall (y ≈ 0) …
    const onTopWall = (p: Pt) => Math.abs(p.y) < 0.05 && p.x >= -0.05 && p.x <= 12.05;
    expect(sk.ridges.some((r) => onTopWall(r.start) || onTopWall(r.end))).toBe(false);
    // … it stops at the valley junction (6,2)
    expect(sk.ridges.some((r) => touches(r, 6, 2))).toBe(true);
    expect(sk.hips.some((h) => touches(h, 0, 0) || touches(h, 12, 0))).toBe(false);
  });
});
