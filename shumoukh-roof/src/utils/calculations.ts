// @ts-nocheck
import { MARKET_LENGTHS } from "./constants";
import { computeRoofSkeleton, calcTarabeeshFromSkeleton, customRectRoof } from "./roofSkeleton";
import {
  calcActualArea, calcFacadeTotal, calcIron4x8, calcIron10x10, calcDecorOptimal,
  calcDecorBundles, calcDecorBrooz, calcBesh, calcWoodBases, calcTarpaulin,
  calcTiles, calcTileStarts, calcTarabeesh, calcInsulation,
  optimizeBorders, optimizeIronFrame, optimizeBorderSections,
} from "./tileMath";

// Re-export the typed core formulas (now living in tileMath.ts, type-checked +
// unit-tested) so existing import sites keep working unchanged.
export {
  calcActualArea, calcFacadeTotal, calcIron4x8, calcIron10x10, calcDecorOptimal,
  calcDecorBundles, calcDecorBrooz, calcBesh, calcWoodBases, calcTarpaulin,
  calcTiles, calcTileStarts, calcTarabeesh, calcInsulation,
  optimizeBorders, optimizeIronFrame, optimizeBorderSections,
} from "./tileMath";

export function suggestLegs(sides: any[], maxSpan = 4) {
  if (!sides || sides.length === 0) return null;
  const activeSides = sides.filter((s) => s.isActive !== false);
  if (activeSides.length === 0) return null;
  const cornerSet = new Set<string>();
  for (const side of activeSides) {
    cornerSet.add(`${side.x1.toFixed(1)},${side.y1.toFixed(1)}`);
    cornerSet.add(`${side.x2.toFixed(1)},${side.y2.toFixed(1)}`);
  }
  const cornerLegs = cornerSet.size;
  let extraLegs = 0;
  for (const side of activeSides) {
    if (side.length > maxSpan) {
      extraLegs += Math.ceil(side.length / maxSpan) - 1;
    }
  }
  const total = cornerLegs + extraLegs;
  const min = Math.max(2, total);
  const max = total + 2;
  return { min, max, total, label: `${total} أرجل` };
}

export function calcAll(input: any) {
  const { slopePercent = 20, spacingCm = 55, numLegs = 6, legHeight = 2.7, withDecor = true, enableInsulation = false, tile, ironCarryWaste = true, breakagePercent = 0 } = input;

  if (input.sides && input.sides.length > 0) {
    const s = slopePercent / 100;
    const slopeMul = Math.sqrt(1 + s * s);
    const facadeSides = input.sides.filter((s: any) => s.hasFacade);
    const nonFacadeSides = input.sides.filter((s: any) => !s.hasFacade);
    const totalFacadeLength = facadeSides.reduce((sum: number, side: any) => sum + side.length, 0);
    const nonFacadeTotal = nonFacadeSides.reduce((sum: number, side: any) => sum + side.length, 0);
    const metalSheets = Math.ceil(nonFacadeTotal / 2);
    let cornerStarts = 0;
    for (let i = 0; i < input.sides.length; i++) {
      const cur = input.sides[i];
      const nxt = input.sides[(i + 1) % input.sides.length];
      if (cur.hasFacade && nxt.hasFacade) cornerStarts++;
    }
    const borderLengths = facadeSides.map((s: any) => s.length);
    const al = Math.max(input.area?.length || 0, 0.1);
    const aw = Math.max(input.area?.width || 0, 0.1);
    const totalFlat = Math.max(input.area?.total || al * aw, 0.1);
    const actual = totalFlat * slopeMul;
    const decorOpt = withDecor ? calcDecorOptimal(Math.min(al, aw), MARKET_LENGTHS) : { optimalLen: 0, wasteCm: 0 };
    const decorBundles = withDecor ? calcDecorBundles(Math.max(al, aw)) : 0;
    const borders = optimizeBorderSections(borderLengths) || { sections: [], lengths: {}, total: 0, platesTotal: 0, waste: 0, wastePercent: 0 };
    const ironFrame = optimizeIronFrame(borderLengths, ironCarryWaste) || { sections: [], totalPieces: 0, total: 0, waste: 0, wastePercent: 0 };
    const wb = borders.sections.reduce((sum: number, sec: any) => sum + calcWoodBases(sec.requiredLength, spacingCm), 0);
    const ir4 = calcIron4x8(actual);
    const ins = enableInsulation ? calcInsulation(actual, totalFacadeLength, ir4) : null;
    const legsPerTube = legHeight > 0 ? Math.floor(6 / legHeight) : 0;
    const ironLegs = legsPerTube > 0 ? Math.ceil(numLegs / legsPerTube) : 0;
    const longAsas = cornerStarts;
    const activeSidesArr = input.sides.filter((s: any) => s.isActive !== false);
    const activeRatio = activeSidesArr.length / input.sides.length;
    const customSkel = input.vertices?.length >= 3 ? customRectRoof(input.vertices, input.sides) : null;
    const skel = customSkel || (input.vertices?.length >= 3 ? computeRoofSkeleton(input.vertices, slopePercent, input.sides) : null);
    const noSlopeCount = input.sides.filter((s: any) => s.isActive === false).length;
    let tarabeeshVal;
    if (noSlopeCount > 0) {
      tarabeeshVal = skel ? calcTarabeeshFromSkeleton(skel, slopePercent, input.vertices, input.sides) : calcTarabeesh(al, aw, slopePercent, activeRatio >= 0.5 ? "gable" : "shed", activeRatio);
    } else {
      tarabeeshVal = skel ? calcTarabeeshFromSkeleton(skel, slopePercent, input.vertices, input.sides) : calcTarabeesh(al, aw, slopePercent, "hip", 1);
    }
    const tarabeeshTubes = Math.ceil(tarabeeshVal / 6);
    // Filter skeleton for display (hide hips/valleys at no-slope vertices)
    let displaySkeleton = skel;
    if (skel && noSlopeCount > 0 && input.sides && input.vertices) {
      const flatKeys = new Set<string>();
      for (let i = 0; i < input.sides.length && i < input.vertices.length; i++) {
        if (input.sides[i].isActive === false) {
          const v1 = input.vertices[i];
          const v2 = input.vertices[(i + 1) % input.vertices.length];
          if (v1) flatKeys.add(`${v1.x.toFixed(3)},${v1.y.toFixed(3)}`);
          if (v2) flatKeys.add(`${v2.x.toFixed(3)},${v2.y.toFixed(3)}`);
        }
      }
      const flat = (e: any) => flatKeys.has(`${e.start.x.toFixed(3)},${e.start.y.toFixed(3)}`) || flatKeys.has(`${e.end.x.toFixed(3)},${e.end.y.toFixed(3)}`);
      displaySkeleton = {
        ridges: skel.ridges || [],
        hips: (skel.hips || []).filter((h: any) => !flat(h)),
        valleys: (skel.valleys || []).filter((v: any) => !flat(v)),
        gables: skel.gables || [],
        faces: skel.faces || [],
      };
    }
    const totalTilesBase = calcTiles(actual, tile, 0);
    const totalTiles = calcTiles(actual, tile, breakagePercent);
    return { flatArea: +totalFlat.toFixed(2), actualArea: +actual.toFixed(2), slopeMultiplier: slopeMul, totalFacadeLength, iron4x8: ir4, iron10x10: { frame: ironFrame.totalPieces, legs: ironLegs, total: ironFrame.totalPieces + ironLegs }, ironFrame, tarabeeshTubes, totalIronAll: ir4 + ironFrame.totalPieces + ironLegs + tarabeeshTubes, decor: { optimalLen: decorOpt.optimalLen, wasteCm: decorOpt.wasteCm, bundles: decorBundles }, decorBrooz: calcDecorBrooz(facadeSides.length, decorOpt.optimalLen), beshQty: calcBesh(actual, withDecor), woodBases: wb, borders, tarpaulin: calcTarpaulin(actual), totalTiles, totalTilesBase, breakagePercent, tilesBreakage: totalTiles - totalTilesBase, tileStarts: cornerStarts, tarabeesh: tarabeeshVal, longAsas, metalSheets, nonFacadeTotal, tileSelected: tile, insulation: ins, roofSkeleton: displaySkeleton };
  }

  if (input.sections && input.sections.length > 0) {
    const s = slopePercent / 100;
    const slopeMul = Math.sqrt(1 + s * s);
    let totalFlat = 0, totalFacade = 0;
    const borderLens: number[] = [];
    let largestMin = 0, largestMax = 0, decorBundlesTotal = 0;
    input.sections.forEach((sec: any) => {
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
    const borders = optimizeBorderSections(borderLens)!;
    const wb = borders.sections.reduce((sum: number, sec: any) => sum + calcWoodBases(sec.requiredLength, spacingCm), 0);
    const ir4 = calcIron4x8(actual);
    const ins = enableInsulation ? calcInsulation(actual, totalFacade, ir4) : null;
    const totalTilesBase = calcTiles(actual, tile, 0);
    const totalTiles = calcTiles(actual, tile, breakagePercent);
    return { flatArea: +totalFlat.toFixed(2), actualArea: +actual.toFixed(2), slopeMultiplier: slopeMul, totalFacadeLength: totalFacade, iron4x8: ir4, iron10x10: calcIron10x10(totalFacade, numLegs, legHeight), ironFrame: null, decor: { optimalLen: decorOpt.optimalLen, wasteCm: decorOpt.wasteCm, bundles: withDecor ? decorBundlesTotal : 0 }, decorBrooz: calcDecorBrooz(input.sections.reduce((sum: number, sec: any) => sum + (sec.numFacades || 2), 0), decorOpt.optimalLen), beshQty: input.sections.reduce((sum: number, sec: any) => sum + calcBesh(sec.length * sec.width * slopeMul, withDecor), 0), woodBases: wb, borders, tarpaulin: calcTarpaulin(actual), totalTiles, totalTilesBase, breakagePercent, tilesBreakage: totalTiles - totalTilesBase, tileStarts: input.sections.reduce((sum: number, sec: any) => sum + calcTileStarts(sec.numFacades || 2), 0), tarabeesh: calcTarabeesh(largestMax, largestMin, slopePercent), tarabeeshTubes: Math.ceil(calcTarabeesh(largestMax, largestMin, slopePercent) / 6), totalIronAll: ir4 + calcIron10x10(totalFacade, numLegs, legHeight).total + Math.ceil(calcTarabeesh(largestMax, largestMin, slopePercent) / 6), longAsas: 0, metalSheets: 0, nonFacadeTotal: 0, tileSelected: tile, insulation: ins };
  }

  const { length = 5, width = 4, numFacades = 2 } = input;
  const { flatArea, actualArea, slopeMultiplier } = calcActualArea(length, width, slopePercent);
  const totalFacadeLength = input.borderSections?.length ? input.borderSections.reduce((s: number, l: number) => s + l, 0) : calcFacadeTotal(numFacades, length, width);
  const iron4x8 = calcIron4x8(actualArea);
  const iron10x10 = calcIron10x10(totalFacadeLength, numLegs, legHeight);
  const minSide = Math.min(length, width);
  const maxSide = Math.max(length, width);
  const decorOptimal = calcDecorOptimal(minSide, MARKET_LENGTHS);
  const decorBundles = calcDecorBundles(maxSide);
  const beshQty = calcBesh(actualArea, withDecor);
  const borders = input.borderSections?.length ? optimizeBorderSections(input.borderSections) : optimizeBorders(totalFacadeLength);
  const woodBases = input.borderSections?.length ? borders!.sections.reduce((sum: number, sec: any) => sum + calcWoodBases(sec.requiredLength, spacingCm), 0) : calcWoodBases(borders.total, spacingCm);
  const tarpaulin = calcTarpaulin(actualArea);
  const totalTilesBase = calcTiles(actualArea, tile, 0);
  const totalTiles = calcTiles(actualArea, tile, breakagePercent);
  const tileStarts = calcTileStarts(numFacades);
  const tarabeesh = calcTarabeesh(length, width, slopePercent);
  const tarabeeshTubes = Math.ceil(tarabeesh / 6);
  const insulation = enableInsulation ? calcInsulation(actualArea, totalFacadeLength, iron4x8) : null;
  return { flatArea, actualArea, slopeMultiplier, totalFacadeLength, iron4x8, iron10x10, ironFrame: null, tarabeeshTubes, totalIronAll: iron4x8 + iron10x10.total + tarabeeshTubes, decor: { optimalLen: decorOptimal.optimalLen, wasteCm: decorOptimal.wasteCm, bundles: decorBundles }, decorBrooz: calcDecorBrooz(numFacades, decorOptimal.optimalLen), beshQty, woodBases, borders, tarpaulin, totalTiles, totalTilesBase, breakagePercent, tilesBreakage: totalTiles - totalTilesBase, tileStarts, tarabeesh, longAsas: 0, metalSheets: 0, nonFacadeTotal: 0, tileSelected: tile, insulation };
}

const EXTRA_FORMULAS: Record<string, string> = {
  زيت_حار: "hotOil", فرنيش: "varnish", نفط: "naphtha", روف_جارد: "roofGuard", رول_دهان: "paintRoller", فرش: "brushes",
  مسامير_بولاد: "steelNails", مسامير_فرد: "nailsF40", مسامير_فرد_بولاد: "nailsSteelIndividual", مسامير_4سم: "nails4cm",
  اسلاك_لحام: "weldingWire", فيبر_قص_حديد: "fiberDiscs", مبروم_حديد: "twistedIron", سيخ_مبروم: "twistedIron",
  بودرة: "powder", اسمنت: "cement",
};

function normalizeName(name: string) {
  if (!name) return "";
  return name.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48)).replace(/\(.*?\)/g, "").replace(/[_\s]+/g, "_").trim();
}

const ITEM_KEY_MAP = Object.fromEntries(Object.entries(EXTRA_FORMULAS));

function getFormulaKey(name: string) {
  const norm = normalizeName(name);
  if (ITEM_KEY_MAP[norm]) return ITEM_KEY_MAP[norm];
  for (const [key, val] of Object.entries(ITEM_KEY_MAP)) {
    if (norm.includes(key) || key.includes(norm)) return val;
  }
  return null;
}

function calcOilVarnish(area: number) {
  if (area < 15) return { k5: 0, k1: 1 };
  if (area < 50) return { k5: 1, k1: 0 };
  const blocks50 = Math.ceil(area / 50);
  return { k5: blocks50 - 1, k1: blocks50 - 1 };
}

export function calcExtraMaterials(actualArea: number, tarabeeshLength: number) {
  const area = actualArea || 0;
  const tarabeesh = tarabeeshLength || 0;
  const oil = calcOilVarnish(area);
  const varnish = calcOilVarnish(area);
  let naphtha: number;
  if (area < 15) naphtha = 1;
  else if (area <= 50) naphtha = Math.ceil(area / 15) * 2;
  else if (area <= 100) naphtha = 4;
  else naphtha = 6;
  const roofGuardNeeded = Math.ceil(tarabeesh / 12);
  const roofGuard5K = Math.floor(roofGuardNeeded / 5);
  const roofGuard1K = roofGuardNeeded - roofGuard5K * 5;
  const paintRoller = Math.ceil(tarabeesh / 80);
  const brushes = Math.ceil(tarabeesh / 100) * 3;
  const steelNailsPacks = Math.ceil((tarabeesh * 5) / 50);
  const nailsF40 = Math.ceil(area / 60);
  const nailsSteelIndividual = Math.ceil(area / 70);
  const nails4cm = Math.ceil(area / 50) * 0.5;
  const weldingWire = Math.ceil(area / 70);
  const fiberDiscs = Math.ceil(area / 50) * 5;
  const twistedIron = Math.ceil(area / 50);
  const powderBags = Math.ceil(tarabeesh / 1.5);
  const cement = Math.ceil(powderBags / 12);
  return {
    hotOil: { k5: oil.k5, k1: oil.k1 }, varnish: { k5: varnish.k5, k1: varnish.k1 }, naphtha,
    roofGuard: { k5: roofGuard5K, k1: roofGuard1K }, paintRoller, brushes, steelNailsPacks, nailsF40,
    nailsSteelIndividual, nails4cm, weldingWire, fiberDiscs, twistedIron, powderBags, cement,
    _getFormulaKey: getFormulaKey,
  };
}

export function buildExtraFields(result: any, itemDefs: Array<{ name: string; value?: string; unit: string }>) {
  if (!result) return [];
  const ex = calcExtraMaterials(result.actualArea, result.tarabeesh || 0);
  const fields: Array<{ name: string; value: string; unit: string }> = [];
  (itemDefs || []).forEach((item) => {
    const key = ex._getFormulaKey(item.name);
    const unit = item.unit || "";
    if (!key) { fields.push({ name: item.name, value: "0", unit }); return; }
    switch (key) {
      case "hotOil":
        if (ex.hotOil.k5 > 0) fields.push({ name: `${item.name} (5ك)`, value: `${ex.hotOil.k5}`, unit });
        if (ex.hotOil.k1 > 0) fields.push({ name: `${item.name} (1ك)`, value: `${ex.hotOil.k1}`, unit });
        if (ex.hotOil.k5 === 0 && ex.hotOil.k1 === 0) fields.push({ name: item.name, value: "0", unit });
        break;
      case "varnish":
        if (ex.varnish.k5 > 0) fields.push({ name: `${item.name} (5ك)`, value: `${ex.varnish.k5}`, unit });
        if (ex.varnish.k1 > 0) fields.push({ name: `${item.name} (1ك)`, value: `${ex.varnish.k1}`, unit });
        if (ex.varnish.k5 === 0 && ex.varnish.k1 === 0) fields.push({ name: item.name, value: "0", unit });
        break;
      case "roofGuard":
        if (ex.roofGuard.k5 > 0) fields.push({ name: `${item.name} (5ك)`, value: `${ex.roofGuard.k5}`, unit });
        if (ex.roofGuard.k1 > 0) fields.push({ name: `${item.name} (1ك)`, value: `${ex.roofGuard.k1}`, unit });
        if (ex.roofGuard.k5 === 0 && ex.roofGuard.k1 === 0) fields.push({ name: item.name, value: "0", unit });
        break;
      case "naphtha": fields.push({ name: item.name, value: `${ex.naphtha}`, unit }); break;
      case "paintRoller": fields.push({ name: item.name, value: `${ex.paintRoller}`, unit }); break;
      case "brushes": fields.push({ name: item.name, value: `${ex.brushes}`, unit }); break;
      case "steelNails": fields.push({ name: item.name, value: `${ex.steelNailsPacks}`, unit }); break;
      case "nailsF40": fields.push({ name: item.name, value: `${ex.nailsF40}`, unit }); break;
      case "nailsSteelIndividual": fields.push({ name: item.name, value: `${ex.nailsSteelIndividual}`, unit }); break;
      case "nails4cm": fields.push({ name: item.name, value: `${ex.nails4cm}`, unit }); break;
      case "weldingWire": fields.push({ name: item.name, value: `${ex.weldingWire}`, unit }); break;
      case "fiberDiscs": fields.push({ name: item.name, value: `${ex.fiberDiscs}`, unit }); break;
      case "twistedIron": fields.push({ name: item.name, value: `${ex.twistedIron}`, unit }); break;
      case "powder": fields.push({ name: item.name, value: `${ex.powderBags}`, unit }); break;
      case "cement": fields.push({ name: item.name, value: `${ex.cement}`, unit }); break;
      default: fields.push({ name: item.name, value: "0", unit });
    }
  });
  return fields;
}

export function calcCosts(materials: any, prices: any, nathrayat = 0) {
  const items = [
    { label: "حديد 4×8", cost: materials.iron4x8 * prices.iron4x8 },
    { label: "حديد 10×10", cost: materials.iron10x10.total * prices.iron10x10 },
    { label: "القرميد", cost: materials.totalTiles * prices.tile },
    { label: "الديكور", cost: materials.decor.bundles * materials.decor.optimalLen * prices.decor },
    { label: "ديكور البروز", cost: (materials.decorBrooz?.bundles || 0) * (materials.decorBrooz?.len || 0) * (prices.decorBrooz || 0) },
    { label: "البيش", cost: materials.beshQty * prices.besh },
    { label: "الشراشف", cost: materials.borders.total * prices.sharshef },
    { label: "مشمع", cost: ((materials.tarpaulin?.rolls50 || 0) + (materials.tarpaulin?.rolls25 || 0) + (materials.tarpaulin?.rolls75 || 0)) * (prices.tarpaulin || 0) },
    { label: "زفتة", cost: (materials.insulation?.zaftaRolls || 0) * (prices.zafta || 0) },
    { label: "الواح لاتي", cost: (materials.insulation?.latiSheets || 0) * (prices.latiSheets || 0) },
    { label: "أسس خشب", cost: (materials.woodBases || 0) * (prices.woodBases || 0) },
    { label: "أسس طويل", cost: (materials.longAsas || 0) * (prices.longAsas || 0) },
    { label: "شرحات صاج", cost: (materials.metalSheets || 0) * (prices.metalSheet || 0) },
    { label: "سلكون", cost: (materials.metalSheets || 0) * (prices.silicone || 0) },
  ];
  const totalMaterials = items.reduce((s, i) => s + i.cost, 0);
  return { items, totalMaterials, totalWithNathrayat: totalMaterials + nathrayat };
}
