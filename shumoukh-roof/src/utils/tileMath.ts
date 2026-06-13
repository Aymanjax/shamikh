/**
 * tileMath — Core roofing quantity formulas (fully typed, type-checked).
 *
 * These are the pure, deterministic calculations at the heart of the product
 * ("حساب بضاعة القرميد من الرسم"). They carry no `@ts-nocheck` and are covered
 * by unit tests in tileMath.test.ts so the numbers can be trusted.
 *
 * Everything here is a pure function: same inputs → same outputs, no I/O.
 */
import { MARKET_LENGTHS } from "./constants";

export interface Tile {
  /** Tiles per square metre of sloped roof area (حبة/م²). */
  count: number;
  name?: string;
  [key: string]: unknown;
}

export interface ActualAreaResult {
  flatArea: number;
  actualArea: number;
  slopeMultiplier: number;
}

export interface Iron10x10Result {
  frame: number;
  legs: number;
  total: number;
}

export interface DecorOptimal {
  optimalLen: number;
  wasteCm: number;
}

export interface DecorBroozResult {
  sheets: number;
  bundles: number;
  len: number;
}

export interface TarpaulinResult {
  text: string;
  rolls50: number;
  rolls25: number;
  rolls75: number;
}

export interface InsulationResult {
  zaftaRolls: number;
  latiSheets: number;
  zaftaRulers: number;
}

export interface BorderResult {
  lengths: Record<string, number>;
  total: number;
  platesTotal: number;
  waste: number;
  wastePercent: number;
}

/** Roof footprint area and the slope multiplier that converts it to surface area. */
export function calcActualArea(length: number, width: number, slopePercent: number): ActualAreaResult {
  const flat = length * width;
  const s = slopePercent / 100;
  const slp = Math.sqrt(1 + s * s);
  return { flatArea: flat, actualArea: flat * slp, slopeMultiplier: slp };
}

/** Total facade (cornice) length given how many sides carry a facade. */
export function calcFacadeTotal(numFacades: number, length: number, width: number): number {
  if (numFacades === 2) return +(length + width).toFixed(2);
  if (numFacades === 3) return +(length * 2 + width).toFixed(2);
  if (numFacades === 4) return +(2 * (length + width)).toFixed(2);
  return 0;
}

/** Roofing tubes (حديد 4×8): one tube covers ~2 m² of sloped roof. */
export function calcIron4x8(actualArea: number): number {
  return Math.ceil(actualArea / 2);
}

/** Frame + legs tubes (حديد 10×10) from facade length, leg count and leg height. */
export function calcIron10x10(totalFacadeLength: number, numLegs: number, legHeight: number): Iron10x10Result {
  const frame = Math.ceil(totalFacadeLength / 6);
  const piecesPerTube = legHeight > 0 ? Math.floor(6 / legHeight) : 0;
  const legs = piecesPerTube > 0 ? Math.ceil(numLegs / piecesPerTube) : 0;
  return { frame, legs, total: frame + legs };
}

/** Smallest market length that covers the shortest side (decor runs full length). */
export function calcDecorOptimal(minSide: number, availableLengths: number[]): DecorOptimal {
  if (minSide <= 0) return { optimalLen: 0, wasteCm: 0 };
  for (const l of availableLengths) {
    if (l >= minSide) return { optimalLen: l, wasteCm: Math.round((l - minSide) * 100) };
  }
  const last = availableLengths[availableLengths.length - 1];
  return { optimalLen: last, wasteCm: Math.round((last - minSide) * 100) };
}

/** Decor bundles needed to run along the longest side (one bundle ≈ 0.90 m). */
export function calcDecorBundles(maxSide: number): number {
  if (maxSide <= 0) return 0;
  return Math.round(maxSide / 0.90);
}

/** Decor "brooz" sheets/bundles for facade sides (3 sheets per facade, 10 per bundle). */
export function calcDecorBrooz(facadeCount: number, optimalLen: number): DecorBroozResult {
  if (!facadeCount || !optimalLen) return { sheets: 0, bundles: 0, len: 0 };
  const sheets = facadeCount * 3;
  const bundles = Math.ceil(sheets / 10);
  return { sheets, bundles, len: optimalLen };
}

/** Besh (under-tile battens). Double the count when decor is enabled. */
export function calcBesh(actualArea: number, withDecor: boolean): number {
  if (withDecor) return Math.ceil(actualArea);
  return Math.ceil(actualArea / 2);
}

/** Wooden bases spaced every `spacingCm` along the sharshef run. */
export function calcWoodBases(sharshefLength: number, spacingCm = 55): number {
  if (sharshefLength <= 0) return 0;
  return Math.ceil(sharshefLength / (spacingCm / 100));
}

/** Tarpaulin (مشمع) rolls, expressed as a human-readable breakdown. */
export function calcTarpaulin(actualArea: number): TarpaulinResult {
  if (actualArea <= 0) return { text: "0 رول", rolls50: 0, rolls25: 0, rolls75: 0 };
  if (actualArea <= 25) return { text: "1 رول (25م)", rolls50: 0, rolls25: 1, rolls75: 0 };
  const full50 = Math.floor(actualArea / 50);
  const remainder = actualArea % 50;
  let text: string;
  let rolls50 = full50;
  let rolls25 = 0;
  let rolls75 = 0;
  if (remainder === 0) {
    rolls75 = Math.ceil(full50 / 1.5);
    text = `${full50} رول (50م)`;
  } else if (remainder <= 25) {
    rolls25 = 1;
    text = full50 > 0 ? `${full50} رول (50م) + 1 رول (25م)` : "1 رول (25م)";
  } else {
    rolls50 = full50 + 1;
    text = `${full50 + 1} رول (50م)`;
  }
  return { text, rolls50, rolls25, rolls75 };
}

/**
 * Total tile pieces (حبة) for the sloped area, plus an optional breakage/cutting
 * allowance. Roofers add ~5–10% for tiles broken in transit and cut at hips,
 * valleys and edges, so `breakagePercent` is rolled in before rounding up.
 */
export function calcTiles(actualArea: number, tile: Tile, breakagePercent = 0): number {
  const safeBreakage = Number.isFinite(breakagePercent) && breakagePercent > 0 ? breakagePercent : 0;
  const base = actualArea * tile.count;
  return Math.ceil(base * (1 + safeBreakage / 100));
}

/** Number of tile "starts" — one per facade side. */
export function calcTileStarts(numFacades: number): number {
  return numFacades || 0;
}

/** Ridge + hip/valley line length for a simple roof, by roof type. */
export function calcTarabeesh(
  length: number,
  width: number,
  slopePercent: number,
  roofType: "hip" | "gable" | "shed" = "hip",
  activeRatio = 1,
): number {
  if (!length || !width || !slopePercent) return 0;
  const shorter = Math.min(length, width);
  const longer = Math.max(length, width);
  const slope = slopePercent / 100;
  const height = (shorter / 2) * slope;
  if (roofType === "shed") return 0;
  if (roofType === "gable") {
    const ridge = longer;
    const gableEdge = Math.sqrt((shorter / 2) * (shorter / 2) + height * height);
    const numEdges = Math.round(activeRatio * 2);
    const total = ridge + numEdges * gableEdge;
    return +total.toFixed(2);
  }
  const ridge = longer - shorter;
  const horizontalDiag = shorter / Math.sqrt(2);
  const slopedHip = Math.sqrt(horizontalDiag * horizontalDiag + height * height);
  const numHips = Math.round(activeRatio * 4);
  const total = ridge + numHips * slopedHip;
  return +total.toFixed(2);
}

/** Waterproofing materials (zafta rolls, lati sheets, zafta rulers). */
export function calcInsulation(actualArea: number, _totalFacadeLength: number, iron4x8: number): InsulationResult {
  return {
    zaftaRolls: Math.ceil(actualArea / 9),
    latiSheets: Math.ceil(actualArea / 2.9),
    zaftaRulers: Math.round((iron4x8 || 0) * 0.75),
  };
}

/** Optimise sharshef plates for one continuous border length, minimising waste. */
export function optimizeBorders(totalLength: number): BorderResult {
  if (totalLength <= 0) {
    return { lengths: {}, total: 0, platesTotal: 0, waste: 0, wastePercent: 0 };
  }
  let fullSixes = 0;
  let remainder = totalLength;
  if (totalLength > 12) {
    fullSixes = Math.floor(totalLength / 6) - 1;
    remainder = totalLength - fullSixes * 6;
  }
  let bestSum = Infinity;
  let bestCombo: number[] = [];
  for (const l of MARKET_LENGTHS) {
    if (l >= remainder && l < bestSum) {
      bestSum = l;
      bestCombo = [l];
    }
  }
  for (const l1 of MARKET_LENGTHS) {
    for (const l2 of MARKET_LENGTHS) {
      const sum = l1 + l2;
      if (sum >= remainder && sum < bestSum) {
        bestSum = sum;
        bestCombo = [l1, l2];
      }
    }
  }
  const lengths: Record<string, number> = {};
  if (fullSixes > 0) lengths["6"] = fullSixes;
  bestCombo.forEach((len) => {
    const key = String(len);
    lengths[key] = (lengths[key] || 0) + 1;
  });
  return {
    lengths,
    total: +(fullSixes * 6 + bestSum).toFixed(2),
    platesTotal: (fullSixes > 0 ? fullSixes : 0) + bestCombo.length,
    waste: +(fullSixes * 6 + bestSum - totalLength).toFixed(2),
    wastePercent: +(((fullSixes * 6 + bestSum) / totalLength - 1) * 100).toFixed(1),
  };
}

export interface IronSection {
  sectionIndex: number;
  requiredLength: number;
  effectiveLength: number;
  pieces: number;
  bought: number;
  waste: number;
}

export interface IronFrameResult {
  sections: IronSection[];
  totalPieces: number;
  total: number;
  totalNeeded: number;
  waste: number;
  wastePercent: number;
}

/** Optimise 6 m iron tubes across several border sections, carrying offcuts. */
export function optimizeIronFrame(sections: number[], carryWaste = true): IronFrameResult | null {
  if (!sections || sections.length === 0) return null;
  const optimized: IronSection[] = [];
  let carry = 0;
  for (let i = 0; i < sections.length; i++) {
    const origLen = sections[i];
    const effLen = Math.max(0, origLen - carry);
    const pieces = effLen > 0 ? Math.ceil(effLen / 6) : 0;
    const bought = pieces * 6;
    const waste = +(bought - effLen).toFixed(2);
    optimized.push({ sectionIndex: i, requiredLength: origLen, effectiveLength: effLen, pieces, bought, waste });
    carry = carryWaste && waste > 2 ? waste : 0;
  }
  const totalNeeded = sections.reduce((s, l) => s + l, 0);
  const totalPieces = optimized.reduce((s, o) => s + o.pieces, 0);
  const totalBought = totalPieces * 6;
  return {
    sections: optimized,
    totalPieces,
    total: totalBought,
    totalNeeded,
    waste: +(totalBought - totalNeeded).toFixed(2),
    wastePercent: totalNeeded > 0 ? +((totalBought / totalNeeded - 1) * 100).toFixed(1) : 0,
  };
}

export interface BorderSection extends BorderResult {
  sectionIndex: number;
  requiredLength: number;
  effectiveLength: number;
}

export interface BorderSectionsResult {
  sections: BorderSection[];
  lengths: Record<string, number>;
  total: number;
  platesTotal: number;
  totalNeeded: number;
  waste: number;
  wastePercent: number;
}

/** Optimise sharshef plates across several border sections, carrying offcuts. */
export function optimizeBorderSections(sections: number[]): BorderSectionsResult | null {
  if (!sections || sections.length === 0) return null;
  const optimized: BorderSection[] = [];
  let carry = 0;
  for (let i = 0; i < sections.length; i++) {
    const origLen = sections[i];
    const effLen = Math.max(0, origLen - carry);
    const opt = optimizeBorders(effLen);
    optimized.push({ sectionIndex: i, requiredLength: origLen, effectiveLength: effLen, ...opt });
    carry = opt.waste > 2 ? opt.waste : 0;
  }
  const totalNeeded = sections.reduce((s, l) => s + l, 0);
  const totalBought = optimized.reduce((s, o) => s + o.total, 0);
  const allLengths: Record<string, number> = {};
  optimized.forEach((o) => {
    Object.entries(o.lengths).forEach(([len, count]) => {
      allLengths[len] = (allLengths[len] || 0) + count;
    });
  });
  return {
    sections: optimized,
    lengths: allLengths,
    total: totalBought,
    platesTotal: optimized.reduce((s, o) => s + o.platesTotal, 0),
    totalNeeded,
    waste: +(totalBought - totalNeeded).toFixed(2),
    wastePercent: totalNeeded > 0 ? +((totalBought / totalNeeded - 1) * 100).toFixed(1) : 0,
  };
}
