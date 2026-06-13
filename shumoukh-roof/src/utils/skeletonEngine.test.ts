import { describe, it, expect } from "vitest";
import { computeRoofSkeleton as eventSkeleton } from "./skeleton";
import { computeRoofSkeleton as roofSkeleton } from "./roofSkeleton";

type Pt = { x: number; y: number };
type Seg = { start: Pt; end: Pt; length: number; type: string };

// L-shaped polygon with a reflex vertex at (3,4) → must yield a valley line.
const L = [
  { x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 },
  { x: 3, y: 4 }, { x: 3, y: 8 }, { x: 0, y: 8 },
];
const Lbounds = (p: Pt) => p.x >= -0.2 && p.x <= 6.2 && p.y >= -0.2 && p.y <= 8.2;

describe("event-based straight skeleton engine", () => {
  it("rectangle → 4 inward hips + 1 ridge, all inside (winding fixed)", () => {
    const R = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }, { x: 0, y: 6 }];
    const res = eventSkeleton(R);
    expect(res.hips).toHaveLength(4);
    expect(res.ridges.length).toBeGreaterThanOrEqual(1);
    const all = [...res.ridges, ...res.hips];
    expect(all.every((e: Seg) => e.start.x >= -0.2 && e.start.x <= 10.2 && e.end.x >= -0.2 && e.end.x <= 10.2)).toBe(true);
  });

  it("L-shape → finds the valley at the reflex corner, no lines escape", () => {
    const res = eventSkeleton(L);
    const all = [...res.ridges, ...res.hips, ...res.valleys];
    expect(all.length).toBeGreaterThan(0);
    expect(res.valleys.length).toBeGreaterThanOrEqual(1);
    expect(all.every((e: Seg) => Lbounds(e.start) && Lbounds(e.end))).toBe(true);
  });
});

describe("roofSkeleton routes complex all-active shapes through the event engine", () => {
  it("L-shape (no disabled walls) yields an in-bounds skeleton with a valley", () => {
    const sides = L.map(() => ({ isActive: true }));
    const res = roofSkeleton(L, 30, sides);
    const all = [...res.ridges, ...res.hips, ...res.valleys];
    expect(all.length).toBeGreaterThan(0);
    expect(res.valleys.length).toBeGreaterThanOrEqual(1);
    expect(all.every((e: Seg) => Lbounds(e.start) && Lbounds(e.end))).toBe(true);
  });

  it("L-shape WITH a disabled wall (iterative path) keeps every line inside the footprint", () => {
    const sides = L.map((_, i) => ({ isActive: i !== 0 })); // أول جدار جملون
    const res = roofSkeleton(L, 30, sides);
    const all = [...res.ridges, ...res.hips, ...res.valleys, ...res.gables];
    expect(all.every((e: Seg) => Lbounds(e.start) && Lbounds(e.end))).toBe(true);
  });
});
