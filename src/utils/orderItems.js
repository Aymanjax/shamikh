export const ORDER_ITEMS = [
  { id: "tiles", name: "قرميد", unit: "حبة" },
  { id: "iron4x8", name: "حديد 4×8", unit: "تيوب" },
  { id: "iron10x10", name: "حديد 10×10", unit: "تيوب" },
  { id: "sharshef", name: "شراشف", unit: "م" },
  { id: "decor", name: "ديكور", unit: "ربطة" },
  { id: "ases", name: "اسس", unit: "قطعة" },
  { id: "mishma", name: "مشمع", unit: "رول" },
  { id: "tarabeesh", name: "طرابيش", unit: "حبة" },
  { id: "bidaya", name: "بداية", unit: "حبة" },
  { id: "lati", name: "الواح لاتي", unit: "لوح" },
  { id: "zafta", name: "رول زفته", unit: "رول" },
  { id: "dehan_mai", name: "دهان مائي", unit: "علبة" },
  { id: "bakit_baraghi", name: "بكيت براغي", unit: "بكيت" },
];

export function createDefaultOrder() {
  return ORDER_ITEMS.map((item) => ({
    ...item,
    quantity: 0,
    received: 0,
  }));
}
