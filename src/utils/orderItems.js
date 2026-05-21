export const ORDER_ITEMS = [
  { id: "tiles", name: "قرميد", unit: "حبة" },
  { id: "iron4x8", name: "حديد 4×8", unit: "تيوب" },
  { id: "iron10x10", name: "حديد 10×10", unit: "تيوب" },
  { id: "sharshef", name: "شراشف", unit: "م" },
  { id: "decor", name: "ديكور", unit: "ربطة" },
  { id: "ases", name: "اسس", unit: "قطعة" },
  { id: "mishma", name: "مشمع", unit: "رول" },
  { id: "mabroum", name: "مبروم حديد", unit: "كغم" },
  { id: "tarabeesh", name: "طرابيش", unit: "حبة" },
  { id: "bidaya", name: "بداية", unit: "حبة" },
  { id: "lati", name: "الواح لاتي", unit: "لوح" },
  { id: "zafta", name: "رول زفته", unit: "رول" },
  { id: "dehan_mai", name: "دهان مائي", unit: "علبة" },
  { id: "dehan_roof", name: "دهان روف جارد", unit: "علبة" },
  { id: "bakit_baraghi", name: "بكيت براغي", unit: "بكيت" },
  { id: "msamer_fard_bolad", name: "مسامير فرد بولاد", unit: "كغم" },
  { id: "msamer_fard_adi", name: "مسامير فرد عادي", unit: "كغم" },
  { id: "bolad_adi", name: "بولاد عادي", unit: "كغم" },
  { id: "msamer_4cm", name: "مسامير 4سم", unit: "كغم" },
  { id: "frnish", name: "فرنيش", unit: "علبة" },
  { id: "zeit_har", name: "زيت حار", unit: "لتر" },
  { id: "fiber", name: "فيبر قص حديد", unit: "حبة" },
  { id: "aslak_liham", name: "اسلاك لحام", unit: "كغم" },
  { id: "esment", name: "اسمت", unit: "كيس" },
  { id: "bodra", name: "بودرة", unit: "كيس" },
];

export function createDefaultOrder() {
  return ORDER_ITEMS.map((item) => ({
    ...item,
    quantity: 0,
    received: 0,
  }));
}
