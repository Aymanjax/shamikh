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

export function calcDecorBundles(maxSide, slopeMultiplier) {
  if (maxSide <= 0) return 0;
  return Math.ceil((maxSide * slopeMultiplier) / 0.90);
}

export function optimizeBorders(totalLength) {
  if (totalLength <= 0) return { lengths: {}, total: 0, platesTotal: 0 };
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
  };
}

export function calcBesh(actualArea, withDecor) {
  if (withDecor) return Math.ceil(actualArea / 2);
  return Math.ceil(actualArea);
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

export function calcInsulation(actualArea, totalFacadeLength) {
  return {
    zaftaRolls: Math.ceil(actualArea / 9),
    latiSheets: Math.ceil(actualArea / 2.9),
    zaftaRulers: Math.ceil(totalFacadeLength / 6),
  };
}

export function calcSmallProjectItems(actualArea) {
  if (actualArea >= 100) return [];

  const items = [
    { name: "زيت حار", unit: "جلن 5ك", qty: 1 },
    { name: "فرنيش", unit: "جلن", qty: 1 },
    { name: "رول دهان", unit: "حبة", qty: 1 },
    { name: "فرش", unit: "حبة", qty: 3 },
    { name: "مسامير فرد", unit: "كغم", qty: 1 },
    { name: "مسامير فرد بولاد", unit: "كغم", qty: 1 },
    { name: "مسامير 4سم", unit: "كغم", qty: 1 },
    { name: "مسامير بولاد", unit: "كغم", qty: 7 },
    { name: "مبروم حديد", unit: "ربطة", qty: 1 },
    { name: "فيبر قص حديد", unit: "حبة", qty: 1 },
    { name: "اسلاك لحام", unit: "كغم", qty: 1 },
    { name: "اسمنت", unit: "كيس", qty: 1 },
    { name: "بودرة", unit: "كيس", qty: 1 },
  ];

  if (actualArea < 20) {
    items.push({ name: "روف جارد", unit: "صغير", qty: 1 });
  } else {
    items.push({ name: "روف جارد", unit: "5ك", qty: 1 });
  }

  return items;
}

export function calcAll(input) {
  const {
    length, width, slopePercent = 20, spacingCm = 55,
    numFacades = 2, numLegs = 6, legHeight = 2.7,
    withDecor = true, enableInsulation = false, tile,
  } = input;

  const { flatArea, actualArea, slopeMultiplier } = calcActualArea(length, width, slopePercent);
  const totalFacadeLength = calcFacadeTotal(numFacades, length, width);
  const iron4x8 = calcIron4x8(actualArea);
  const iron10x10 = calcIron10x10(totalFacadeLength, numLegs, legHeight);
  const minSide = Math.min(length, width);
  const maxSide = Math.max(length, width);
  const decorOptimal = calcDecorOptimal(minSide, MARKET_LENGTHS);
  const decorBundles = calcDecorBundles(maxSide, slopeMultiplier);
  const beshQty = calcBesh(actualArea, withDecor);
  const borders = optimizeBorders(totalFacadeLength);
  const woodBases = calcWoodBases(borders.total, spacingCm);
  const tarpaulin = calcTarpaulin(actualArea);
  const totalTiles = calcTiles(actualArea, tile);
  const tileStarts = calcTileStarts(numFacades);
  const insulation = enableInsulation ? calcInsulation(actualArea, totalFacadeLength) : null;
  const smallItems = calcSmallProjectItems(actualArea);

  return {
    flatArea, actualArea, slopeMultiplier, totalFacadeLength,
    iron4x8, iron10x10,
    decor: { optimalLen: decorOptimal.optimalLen, wasteCm: decorOptimal.wasteCm, bundles: decorBundles },
    beshQty, woodBases, borders, tarpaulin, totalTiles, tileStarts,
    tileSelected: tile, insulation, smallItems,
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
  return { items, totalMaterials, totalWithNathrayat: totalMaterials + nathrayat };
}
