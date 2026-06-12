import { describe, it, expect } from "vitest";
import {
  calcActualArea,
  calcFacadeTotal,
  calcIron4x8,
  calcIron10x10,
  calcDecorOptimal,
  calcDecorBundles,
  calcBesh,
  calcWoodBases,
  calcTarpaulin,
  calcTiles,
  calcTarabeesh,
  optimizeBorders,
  optimizeIronFrame,
} from "./tileMath";
import { calcAll, calcCosts } from "./calculations";
import { MARKET_LENGTHS } from "./constants";

const TILE = { count: 11, name: "اختبار" };

describe("calcActualArea", () => {
  it("flat roof: actual area equals footprint", () => {
    const r = calcActualArea(10, 8, 0);
    expect(r.flatArea).toBe(80);
    expect(r.actualArea).toBe(80);
    expect(r.slopeMultiplier).toBe(1);
  });

  it("30% slope multiplies area by sqrt(1 + 0.3^2)", () => {
    const r = calcActualArea(10, 8, 30);
    expect(r.slopeMultiplier).toBeCloseTo(1.04403, 4);
    expect(r.actualArea).toBeCloseTo(83.52, 2);
  });
});

describe("calcFacadeTotal", () => {
  it("2 / 3 / 4 facades", () => {
    expect(calcFacadeTotal(2, 10, 8)).toBe(18);
    expect(calcFacadeTotal(3, 10, 8)).toBe(28);
    expect(calcFacadeTotal(4, 10, 8)).toBe(36);
    expect(calcFacadeTotal(0, 10, 8)).toBe(0);
  });
});

describe("calcIron4x8", () => {
  it("rounds up to one tube per 2 m²", () => {
    expect(calcIron4x8(83.52)).toBe(42);
    expect(calcIron4x8(2)).toBe(1);
    expect(calcIron4x8(0)).toBe(0);
  });
});

describe("calcIron10x10", () => {
  it("frame + legs", () => {
    const r = calcIron10x10(12, 6, 2.7);
    expect(r.frame).toBe(2);
    expect(r.legs).toBe(3);
    expect(r.total).toBe(5);
  });

  it("zero leg height yields no legs", () => {
    expect(calcIron10x10(12, 6, 0).legs).toBe(0);
  });
});

describe("calcTiles — breakage allowance", () => {
  it("no breakage = area × count, rounded up", () => {
    expect(calcTiles(100, TILE, 0)).toBe(1100);
    expect(calcTiles(100, TILE)).toBe(1100);
  });

  it("adds the breakage percentage before rounding", () => {
    expect(calcTiles(100, TILE, 5)).toBe(1155);
    expect(calcTiles(100, TILE, 10)).toBe(1210);
  });

  it("ignores invalid / negative breakage", () => {
    expect(calcTiles(100, TILE, -5)).toBe(1100);
    expect(calcTiles(100, TILE, NaN)).toBe(1100);
  });

  it("breakage never lowers the tile count", () => {
    const base = calcTiles(83.52, TILE, 0);
    const withBreakage = calcTiles(83.52, TILE, 7);
    expect(withBreakage).toBeGreaterThanOrEqual(base);
  });
});

describe("calcBesh", () => {
  it("doubles when decor is enabled", () => {
    expect(calcBesh(50, true)).toBe(50);
    expect(calcBesh(50, false)).toBe(25);
  });
});

describe("calcDecorOptimal", () => {
  it("picks the smallest market length covering the side", () => {
    const r = calcDecorOptimal(4.0, MARKET_LENGTHS);
    expect(r.optimalLen).toBe(4.2);
    expect(r.wasteCm).toBe(20);
  });

  it("zero side → zero", () => {
    expect(calcDecorOptimal(0, MARKET_LENGTHS)).toEqual({ optimalLen: 0, wasteCm: 0 });
  });

  it("falls back to the longest length when nothing covers it", () => {
    expect(calcDecorOptimal(10, MARKET_LENGTHS).optimalLen).toBe(6.0);
  });
});

describe("calcDecorBundles", () => {
  it("≈ one bundle per 0.90 m", () => {
    expect(calcDecorBundles(9)).toBe(10);
    expect(calcDecorBundles(0)).toBe(0);
  });
});

describe("calcWoodBases", () => {
  it("one base every spacing (default 55 cm)", () => {
    expect(calcWoodBases(5.5)).toBe(10);
    expect(calcWoodBases(0)).toBe(0);
  });
});

describe("calcTarpaulin", () => {
  it("small / empty roofs", () => {
    expect(calcTarpaulin(0).text).toBe("0 رول");
    expect(calcTarpaulin(20).rolls25).toBe(1);
  });

  it("exact multiples and remainders", () => {
    expect(calcTarpaulin(100)).toMatchObject({ rolls50: 2, rolls25: 0 });
    expect(calcTarpaulin(60)).toMatchObject({ rolls50: 1, rolls25: 1 });
    expect(calcTarpaulin(90)).toMatchObject({ rolls50: 2, rolls25: 0 });
  });
});

describe("calcTarabeesh", () => {
  it("hip roof ridge + four sloped hips", () => {
    expect(calcTarabeesh(10, 8, 30, "hip", 1)).toBeCloseTo(25.13, 1);
  });

  it("shed roof has no ridge lines", () => {
    expect(calcTarabeesh(10, 8, 30, "shed")).toBe(0);
  });

  it("guards against missing dimensions", () => {
    expect(calcTarabeesh(0, 5, 30)).toBe(0);
  });
});

describe("optimizeBorders", () => {
  it("empty length", () => {
    expect(optimizeBorders(0)).toMatchObject({ total: 0, platesTotal: 0 });
  });

  it("single plate for a short run", () => {
    const r = optimizeBorders(5);
    expect(r.total).toBeCloseTo(5.1, 2);
    expect(r.platesTotal).toBe(1);
  });

  it("uses full 6 m plates plus an optimal remainder", () => {
    const r = optimizeBorders(20);
    expect(r.lengths["6"]).toBe(2);
    expect(r.total).toBeCloseTo(20.1, 2);
    expect(r.waste).toBeCloseTo(0.1, 2);
    expect(r.platesTotal).toBe(4);
  });
});

describe("optimizeIronFrame", () => {
  it("returns null for no sections", () => {
    expect(optimizeIronFrame([])).toBeNull();
  });

  it("buys whole 6 m tubes across sections", () => {
    const r = optimizeIronFrame([10, 10])!;
    expect(r.totalPieces).toBe(4);
    expect(r.total).toBe(24);
    expect(r.wastePercent).toBeCloseTo(20, 1);
  });
});

describe("calcAll — integration (breakage threaded through)", () => {
  const result = calcAll({ length: 10, width: 8, slopePercent: 30, tile: TILE, breakagePercent: 5, numFacades: 2 });

  it("computes sloped area", () => {
    expect(result.actualArea).toBeCloseTo(83.52, 1);
  });

  it("applies the breakage allowance to the tile total", () => {
    expect(result.breakagePercent).toBe(5);
    expect(result.totalTiles).toBeGreaterThan(result.totalTilesBase);
    expect(result.tilesBreakage).toBe(result.totalTiles - result.totalTilesBase);
  });
});

describe("calcCosts", () => {
  it("sums material lines and adds the extras (نثريات)", () => {
    const materials = {
      iron4x8: 10,
      iron10x10: { total: 5 },
      totalTiles: 1000,
      decor: { bundles: 2, optimalLen: 4 },
      decorBrooz: { bundles: 0, len: 0 },
      beshQty: 50,
      borders: { total: 30 },
      tarpaulin: { rolls50: 1, rolls25: 0, rolls75: 0 },
      insulation: null,
      woodBases: 10,
      longAsas: 0,
      metalSheets: 0,
    };
    const prices = {
      iron4x8: 12, iron10x10: 22, tile: 1, decor: 5, decorBrooz: 0, besh: 1.5,
      sharshef: 4, tarpaulin: 0, zafta: 0, latiSheets: 0, woodBases: 0,
      longAsas: 0, metalSheet: 0, silicone: 0,
    };
    const r = calcCosts(materials, prices, 100);
    expect(r.totalMaterials).toBeCloseTo(1465, 2);
    expect(r.totalWithNathrayat).toBeCloseTo(1565, 2);
  });
});
