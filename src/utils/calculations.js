import { MARKET_LENGTHS } from "./constants";

export function calcActualArea(length, width, slopePercent) {
  const flat = length * width;
  const slp = 1 + slopePercent / 100;
  return { flatArea: flat, actualArea: flat * slp, slopeMultiplier: slp };
}

export function calcFacadeTotal(numFacades, length, width) {
  if (numFacades === 2) return +(length + width).toFixed(2);
  if (numFacades === 3) return +(length * 2 + width).toFixed(2);
  if (numFacades === 4) return +(2 * (length + width)).toFixed(2);
  return 0;
}

export function calcIron4x8(actualArea) {
  return Math.ceil(actualArea / 2);
}

export function calcIron10x10(totalFacadeLength, numLegs, legHeight) {
  const frame = Math.ceil(totalFacadeLength / 6);
  const piecesPerTube = legHeight > 0 ? Math.floor(6 / legHeight) : 0;
  const legs = piecesPerTube > 0 ? Math.ceil(numLegs / piecesPerTube) : 0;
  return { frame, legs, total: frame + legs };
}

export function calcDecorOptimal(minSide, availableLengths) {
  if (minSide <= 0) return { optimalLen: 0, wasteCm: 0 };
  for (const l of availableLengths) {
    if (l >= minSide) return { optimalLen: l, wasteCm: Math.round((l - minSide) * 100) };
  }
  const last = availableLengths[availableLengths.length - 1];
  return { optimalLen: last, wasteCm: Math.round((last - minSide) * 100) };
}

export function calcDecorBundles(maxSide) {
  if (maxSide <= 0) return 0;
  return Math.round(maxSide / 0.90);
}

export function optimizeBorders(totalLength) {
  if (totalLength <= 0) return { lengths: {}, total: 0, platesTotal: 0, waste: 0, wastePercent: 0 };
  let fullSixes = 0;
  let remainder = totalLength;
  if (totalLength > 12) {
    fullSixes = Math.floor(totalLength / 6) - 1;
    remainder = totalLength - fullSixes * 6;
  }
  let bestSum = Infinity;
  let bestCombo = [];
  for (const l of MARKET_LENGTHS) {
    if (l >= remainder && l < bestSum) { bestSum = l; bestCombo = [l]; }
  }
  for (const l1 of MARKET_LENGTHS) {
    for (const l2 of MARKET_LENGTHS) {
      const sum = l1 + l2;
      if (sum >= remainder && sum < bestSum) { bestSum = sum; bestCombo = [l1, l2]; }
    }
  }
  const lengths = {};
  if (fullSixes > 0) lengths[6.0] = fullSixes;
  bestCombo.forEach((len) => { lengths[len] = (lengths[len] || 0) + 1; });
  return {
    lengths, total: +(fullSixes * 6 + bestSum).toFixed(2),
    platesTotal: (fullSixes > 0 ? fullSixes : 0) + bestCombo.length,
    waste: +((fullSixes * 6 + bestSum) - totalLength).toFixed(2),
    wastePercent: +((((fullSixes * 6 + bestSum) / totalLength) - 1) * 100).toFixed(1),
  };
}

export function optimizeBorderSections(sections) {
  if (!sections || sections.length === 0) return null;
  const optimized = sections.map((len, i) => ({
    sectionIndex: i,
    requiredLength: len,
    ...optimizeBorders(len),
  }));
  const totalNeeded = sections.reduce((s, l) => s + l, 0);
  const totalBought = optimized.reduce((s, o) => s + o.total, 0);
  const allLengths = {};
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

export function calcBesh(actualArea, withDecor) {
  if (withDecor) return Math.ceil(actualArea);
  return Math.ceil(actualArea / 2);
}

export function calcWoodBases(sharshefLength, spacingCm = 55) {
  if (sharshefLength <= 0) return 0;
  return Math.ceil(sharshefLength / (spacingCm / 100));
}

export function calcTarpaulin(actualArea) {
  if (actualArea <= 0) return { text: "0 رول", rolls50: 0, rolls25: 0, rolls75: 0 };
  if (actualArea <= 25) return { text: "1 رول (25م)", rolls50: 0, rolls25: 1, rolls75: 0 };

  const full50 = Math.floor(actualArea / 50);
  const remainder = actualArea % 50;

  let text, rolls50 = full50, rolls25 = 0, rolls75 = 0;

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

export function calcTiles(actualArea, tile) {
  return Math.ceil(actualArea * tile.count);
}

export function calcTileStarts(numFacades) {
  return numFacades || 0;
}

export function calcTarabeesh(numFacades) {
  return (numFacades || 0) * 2;
}

export function calcInsulation(actualArea, totalFacadeLength) {
  return {
    zaftaRolls: Math.ceil(actualArea / 9),
    latiSheets: Math.ceil(actualArea / 2.9),
    zaftaRulers: Math.ceil(totalFacadeLength / 6),
  };
}

export function calcAll(input) {
  const {
    slopePercent = 20, spacingCm = 55,
    numLegs = 6, legHeight = 2.7,
    withDecor = true, enableInsulation = false, tile,
  } = input;

  // === Sides mode (all sides individually) ===
  if (input.sides && input.sides.length > 0) {
    const slopeMul = 1 + slopePercent / 100;
    const facadeSides = input.sides.filter((s) => s.hasFacade);
    const totalFacadeLength = facadeSides.reduce((s, side) => s + side.length, 0);
    const borderLengths = facadeSides.map((s) => s.length);
    const al = Math.max(input.area?.length || 0, 0.1);
    const aw = Math.max(input.area?.width || 0, 0.1);
    const totalFlat = Math.max(input.area?.total || al * aw, 0.1);
    const actual = totalFlat * slopeMul;

    const decorOpt = withDecor ? calcDecorOptimal(Math.min(al, aw), MARKET_LENGTHS) : { optimalLen: 0, wasteCm: 0 };
    const decorBundles = withDecor ? calcDecorBundles(Math.max(al, aw)) : 0;
    const borders = optimizeBorderSections(borderLengths);
    const wb = borders.sections.reduce((s, sec) => s + calcWoodBases(sec.requiredLength, spacingCm), 0);
    const ins = enableInsulation ? calcInsulation(actual, totalFacadeLength) : null;

    return {
      flatArea: +totalFlat.toFixed(2),
      actualArea: +actual.toFixed(2),
      slopeMultiplier: slopeMul, totalFacadeLength,
      iron4x8: calcIron4x8(actual),
      iron10x10: calcIron10x10(totalFacadeLength, numLegs, legHeight),
      decor: { optimalLen: decorOpt.optimalLen, wasteCm: decorOpt.wasteCm, bundles: decorBundles },
      beshQty: calcBesh(actual, withDecor),
      woodBases: wb, borders, tarpaulin: calcTarpaulin(actual),
      totalTiles: calcTiles(actual, tile),
      tileStarts: facadeSides.length,
      tarabeesh: facadeSides.length * 2,
      tileSelected: tile, insulation: ins,
    };
  }

  // === Multi-section mode (array of rectangles) ===
  if (input.sections && input.sections.length > 0) {
    const slopeMul = 1 + slopePercent / 100;
    let totalFlat = 0;
    let totalFacade = 0;
    const borderLens = [];
    let largestMin = 0;
    let largestMax = 0;
    let decorBundlesTotal = 0;

    input.sections.forEach((sec) => {
      const area = sec.length * sec.width;
      totalFlat += area;
      const fl = calcFacadeTotal(sec.numFacades || 2, sec.length, sec.width);
      totalFacade += fl;
      borderLens.push(fl);
      const mn = Math.min(sec.length, sec.width);
      const mx = Math.max(sec.length, sec.width);
      if (mn > largestMin) { largestMin = mn; largestMax = mx; }
      if (withDecor) decorBundlesTotal += calcDecorBundles(mx);
    });

    const actual = totalFlat * slopeMul;
    const decorOpt = withDecor ? calcDecorOptimal(largestMin, MARKET_LENGTHS) : { optimalLen: 0, wasteCm: 0 };
    const borders = optimizeBorderSections(borderLens);
    const wb = borders.sections.reduce((s, sec) => s + calcWoodBases(sec.requiredLength, spacingCm), 0);
    const ins = enableInsulation ? calcInsulation(actual, totalFacade) : null;

    return {
      flatArea: +totalFlat.toFixed(2),
      actualArea: +actual.toFixed(2),
      slopeMultiplier: slopeMul, totalFacadeLength: totalFacade,
      iron4x8: calcIron4x8(actual),
      iron10x10: calcIron10x10(totalFacade, numLegs, legHeight),
      decor: { optimalLen: decorOpt.optimalLen, wasteCm: decorOpt.wasteCm, bundles: withDecor ? decorBundlesTotal : 0 },
      beshQty: input.sections.reduce((s, sec) => s + calcBesh(sec.length * sec.width * slopeMul, withDecor), 0),
      woodBases: wb, borders, tarpaulin: calcTarpaulin(actual),
      totalTiles: calcTiles(actual, tile),
      tileStarts: input.sections.reduce((s, sec) => s + calcTileStarts(sec.numFacades || 2), 0),
      tarabeesh: input.sections.reduce((s, sec) => s + calcTarabeesh(sec.numFacades || 2), 0),
      tileSelected: tile, insulation: ins,
    };
  }

  // === Legacy single-section mode ===
  const { length = 5, width = 4, numFacades = 2 } = input;
  const { flatArea, actualArea, slopeMultiplier } = calcActualArea(length, width, slopePercent);
  const totalFacadeLength = input.borderSections?.length
    ? input.borderSections.reduce((s, l) => s + l, 0)
    : calcFacadeTotal(numFacades, length, width);
  const iron4x8 = calcIron4x8(actualArea);
  const iron10x10 = calcIron10x10(totalFacadeLength, numLegs, legHeight);
  const minSide = Math.min(length, width);
  const maxSide = Math.max(length, width);
  const decorOptimal = calcDecorOptimal(minSide, MARKET_LENGTHS);
  const decorBundles = calcDecorBundles(maxSide);
  const beshQty = calcBesh(actualArea, withDecor);
  const borders = input.borderSections?.length
    ? optimizeBorderSections(input.borderSections)
    : optimizeBorders(totalFacadeLength);
  const woodBases = input.borderSections?.length
    ? borders.sections.reduce((s, sec) => s + calcWoodBases(sec.requiredLength, spacingCm), 0)
    : calcWoodBases(borders.total, spacingCm);
  const tarpaulin = calcTarpaulin(actualArea);
  const totalTiles = calcTiles(actualArea, tile);
  const tileStarts = calcTileStarts(numFacades);
  const tarabeesh = calcTarabeesh(numFacades);
  const insulation = enableInsulation ? calcInsulation(actualArea, totalFacadeLength) : null;
  return {
    flatArea, actualArea, slopeMultiplier, totalFacadeLength,
    iron4x8, iron10x10,
    decor: { optimalLen: decorOptimal.optimalLen, wasteCm: decorOptimal.wasteCm, bundles: decorBundles },
    beshQty, woodBases, borders, tarpaulin, totalTiles, tileStarts, tarabeesh,
    tileSelected: tile, insulation,
  };
}

export function calcCosts(materials, prices, nathrayat = 0) {
  const items = [
    { label: "حديد 4×8", cost: materials.iron4x8 * prices.iron4x8 },
    { label: "حديد 10×10", cost: materials.iron10x10.total * prices.iron10x10 },
    { label: "القرميد", cost: materials.totalTiles * prices.tile },
    { label: "بداية قرميد", cost: (materials.tileStarts || 0) * (prices.tileStarts || 0) },
    { label: "الديكور", cost: materials.decor.bundles * materials.decor.optimalLen * prices.decor },
    { label: "البيش", cost: materials.beshQty * prices.besh },
    { label: "الشراشف", cost: materials.borders.total * prices.sharshef },
    { label: "مشمع", cost: ((materials.tarpaulin?.rolls50 || 0) + (materials.tarpaulin?.rolls25 || 0) + (materials.tarpaulin?.rolls75 || 0)) * (prices.tarpaulin || 0) },
    { label: "زفتة", cost: (materials.insulation?.zaftaRolls || 0) * (prices.zafta || 0) },
    { label: "الواح لاتي", cost: (materials.insulation?.latiSheets || 0) * (prices.latiSheets || 0) },
    { label: "أسس خشب", cost: (materials.woodBases || 0) * (prices.woodBases || 0) },
    { label: "طرابيش", cost: (materials.tarabeesh || 0) * (prices.tarabeesh || 0) },
  ];
  const totalMaterials = items.reduce((s, i) => s + i.cost, 0);
  return { items, totalMaterials, totalWithNathrayat: totalMaterials + nathrayat };
}
