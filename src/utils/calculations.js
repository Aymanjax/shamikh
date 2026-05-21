import { MARKET_LENGTHS } from "./constants";

export function calcActualArea(segments, slopePercent) {
  const flatArea = segments.reduce((sum, s) => sum + (s.length || 0) * (s.width || 0), 0);
  const slopeMultiplier = 1 + (slopePercent / 100);
  return flatArea * slopeMultiplier;
}

export function calcIron4x8(baseLength, baseWidth, slopeMultiplier, spacingCm = 55) {
  const spacingM = spacingCm / 100;
  const lines = Math.ceil(baseLength / spacingM) + 1;
  const totalMeters = (lines * baseWidth) * slopeMultiplier;
  return Math.ceil(totalMeters / 6.0);
}

export function calcIron10x10(baseLength, baseWidth, slopeMultiplier, totalFacadeLength, numLegs, legHeight) {
  const piecesPerTube = legHeight > 0 ? Math.floor(6.0 / legHeight) : 0;
  const legs = piecesPerTube > 0 ? Math.ceil(numLegs / piecesPerTube) : 0;
  const facades = Math.ceil(totalFacadeLength / 6.0);

  const cutsInLength = Math.floor(baseLength / 3);
  const cutsInWidth = Math.floor(baseWidth / 3);
  let crossMeters = (cutsInLength * baseWidth) + (cutsInWidth * baseLength);
  crossMeters *= slopeMultiplier;
  const crossbars = Math.ceil(crossMeters / 6.0);

  return { legs, facades, crossbars, total: legs + facades + crossbars };
}

export function calcDecor(minSide, maxSide, slopeMultiplier, withDecor) {
  if (!withDecor || minSide <= 0) {
    return { optimalLen: 0, bundles: 0, wasteCm: 0 };
  }

  let optimalLen = 6.0;
  for (const l of MARKET_LENGTHS) {
    if (l >= minSide) { optimalLen = l; break; }
  }

  const wasteCm = Math.round((optimalLen - minSide) * 100);
  const bundles = Math.ceil((maxSide * slopeMultiplier) / 0.90);

  return { optimalLen, bundles, wasteCm };
}

export function calcBesh(actualArea, withDecor) {
  const factor = withDecor ? 1.5 : 1.0;
  return actualArea * factor;
}

export function calcWoodBases(totalFacadeLength, spacingCm = 55) {
  return Math.ceil(totalFacadeLength / (spacingCm / 100));
}

export function optimizeBorders(totalFacadeLength) {
  if (totalFacadeLength <= 0) return { lengths: {}, total: 0, platesTotal: 0 };

  let fullSixes = 0;
  let remainder = totalFacadeLength;

  if (totalFacadeLength > 12) {
    fullSixes = Math.floor(totalFacadeLength / 6) - 1;
    remainder = totalFacadeLength - fullSixes * 6;
  }

  let bestSum = Infinity;
  let bestCombo = [];

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

  const lengths = {};
  if (fullSixes > 0) lengths[6.0] = fullSixes;
  bestCombo.forEach((len) => { lengths[len] = (lengths[len] || 0) + 1; });

  const platesTotal = (fullSixes > 0 ? fullSixes : 0) + bestCombo.length;
  const total = fullSixes * 6 + bestSum;

  return { lengths, total, platesTotal };
}

export function calcTarpaulin(actualArea) {
  const linearMeters = actualArea / 0.85;
  if (actualArea <= 0) return { text: "0 رول", rolls50: 0, rolls25: 0 };

  const rolls50 = Math.floor(linearMeters / 50);
  const remainder = linearMeters % 50;

  let text;
  if (remainder === 0) {
    text = rolls50 > 0 ? `${rolls50} رول (50م)` : "1 رول (25م)";
  } else if (remainder <= 25) {
    text = rolls50 > 0 ? `${rolls50} رول (50م) + 1 رول (25م)` : "1 رول (25م)";
  } else {
    text = `${rolls50 + 1} رول (50م)`;
  }

  return { text, rolls50, rolls25: remainder > 0 && remainder <= 25 ? 1 : 0 };
}

export function calcTiles(actualArea, tile) {
  return Math.ceil(actualArea * tile.count);
}

export function calcInsulation(actualArea, totalFacadeLength) {
  return {
    zaftaRolls: Math.ceil(actualArea / 9.0),
    latiSheets: Math.ceil(actualArea / 2.9),
    zaftaRulers: (totalFacadeLength * 0.5).toFixed(1),
  };
}

export function calcAll(input) {
  const {
    segments, slopePercent, spacingCm = 55,
    facadeLength, numLegs, legHeight,
    withDecor, enableInsulation, tile,
  } = input;

  const baseLength = segments[0]?.length || 0;
  const baseWidth = segments[0]?.width || 0;
  const slpM = 1 + slopePercent / 100;
  const flatArea = segments.reduce((sum, s) => sum + (s.length || 0) * (s.width || 0), 0);
  const actualArea = flatArea * slpM;

  const minSide = Math.min(baseLength, baseWidth);
  const maxSide = Math.max(baseLength, baseWidth);

  const iron4x8 = calcIron4x8(baseLength, baseWidth, slpM, spacingCm);
  const iron10x10 = calcIron10x10(baseLength, baseWidth, slpM, facadeLength, numLegs, legHeight);
  const decor = calcDecor(minSide, maxSide, slpM, withDecor);
  const beshQty = calcBesh(actualArea, withDecor);
  const woodBases = calcWoodBases(facadeLength, spacingCm);
  const borders = optimizeBorders(facadeLength);
  const tarpaulin = calcTarpaulin(actualArea);
  const totalTiles = calcTiles(actualArea, tile);
  const insulation = enableInsulation ? calcInsulation(actualArea, facadeLength) : null;

  return {
    flatArea,
    actualArea,
    slopeMultiplier: slpM,
    iron4x8,
    iron10x10,
    decor,
    beshQty,
    woodBases,
    borders,
    tarpaulin,
    totalTiles,
    tileSelected: tile,
    insulation,
  };
}

export function calcCosts(materials, prices, nathrayat = 0) {
  const items = [
    { label: "حديد 4×8", cost: materials.iron4x8 * prices.iron4x8 },
    { label: "حديد 10×10", cost: materials.iron10x10.total * prices.iron10x10 },
    { label: "القرميد", cost: materials.totalTiles * prices.tile },
    { label: "الديكور", cost: materials.decor.bundles * materials.decor.optimalLen * prices.decor },
    { label: "البيش", cost: materials.beshQty * prices.besh },
    { label: "الشراشف", cost: materials.borders.total * prices.sharshef },
  ];

  const totalMaterials = items.reduce((s, i) => s + i.cost, 0);
  const totalWithNathrayat = totalMaterials + nathrayat;

  return { items, totalMaterials, totalWithNathrayat };
}
