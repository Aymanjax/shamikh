import { describe, it, expect } from "vitest";
import { customRectRoof } from "./roofSkeleton";

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
  return customRectRoof(verts, sides) as any;
}

const allSegs = (res: any) => [...res.ridges, ...res.hips, ...res.valleys, ...res.gables];

/** Every endpoint must stay inside the rectangle — the core "lines don't escape/cross" guard. */
function endpointsInBounds(res: any) {
  return allSegs(res).every((e: any) =>
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
    expect(corners.some((p: any) => Math.abs(p.x - 10) < 0.01 && Math.abs(p.y - 6) < 0.01)).toBe(true);
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
