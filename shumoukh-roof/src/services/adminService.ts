// @ts-nocheck
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CONFIG_PATH = "config/program";

export async function getProgramConfig() {
  const snap = await getDoc(doc(db, CONFIG_PATH));
  if (snap.exists()) return snap.data();
  return null;
}

export async function saveProgramConfig(data) {
  await setDoc(doc(db, CONFIG_PATH), data, { merge: true });
}

const TILE_PRESETS = [
  { name: "بلانيوم سكني (Planum)", origin: "إسبانيا", count: 11, family: "terracotta", colorHex: "#d4784e", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
  { name: "بلانيوم أسود (Planum)", origin: "إسبانيا", count: 11, family: "dark", colorHex: "#5a5a5a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
  { name: "بلاك ستون (Planum)", origin: "إسبانيا", count: 11, family: "dark", colorHex: "#4a4a4a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
  { name: "بلانيوم بني (Planum)", origin: "إسبانيا", count: 11, family: "brown", colorHex: "#8b5e3c", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/brown-seamless.jpg" },
  { name: "بلانوم أحمر (Planum)", origin: "إسبانيا", count: 11, family: "terracotta", colorHex: "#c46040", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
  { name: "فيسيوم 3 رمادي (Visum3 Gray)", origin: "إسبانيا", count: 11.5, family: "dark", colorHex: "#6a6a6a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
  { name: "فيسيوم بني غامق (Visum3 Rustic)", origin: "إسبانيا", count: 11.5, family: "brown", colorHex: "#7a4e2c", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/brown-seamless.jpg" },
  { name: "بلانا أسود (LOGICA Plana)", origin: "إسبانيا", count: 11, family: "dark", colorHex: "#3a3a3a", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/dark-seamless.jpg" },
  { name: "بلانا ايموشن (LOGICA Emotion)", origin: "إسبانيا", count: 11, family: "modern", colorHex: "#9e8e7e", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/modern-seamless.jpg" },
  { name: "فلات (Flat Natural / Red)", origin: "إسبانيا", count: 10.7, family: "terracotta", colorHex: "#d4784e", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
  { name: "إنوفا (Innova)", origin: "إسبانيا", count: 11.5, family: "modern", colorHex: "#a89484", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/modern-seamless.jpg" },
  { name: "فيينا (Vienna)", origin: "إسبانيا", count: 11.5, family: "modern", colorHex: "#b09888", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/modern-seamless.jpg" },
  { name: "فيرتوس كلينكر (Virtus Klinker)", origin: "BMI", count: 11.5, family: "modern", colorHex: "#8a7a6a", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/klinker-seamless.jpg" },
  { name: "سيبرانو (CEPRANO)", origin: "BMI", count: 14.5, family: "special", colorHex: "#7a6a5a", width: 0.27, length: 0.46, type: "ceramic", textureUrl: "/textures/tiles/klinker-seamless.jpg" },
  { name: "إم جي بلس (+MG)", origin: "BMI", count: 11, family: "modern", colorHex: "#9a8a7a", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/modern-seamless.jpg" },
  { name: "فاريو 5 (Vario 5)", origin: "BMI", count: 14, family: "modern", colorHex: "#8e7e6e", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/modern-seamless.jpg" },
  { name: "مارسيليا أيديال", origin: "اليونان", count: 11, family: "terracotta", colorHex: "#da8054", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
  { name: "المنحني وتوسال (CURVED)", origin: "إسبانيا", count: 10.5, family: "curved", colorHex: "#c47040", width: 0.27, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/curved-seamless.jpg" },
  { name: "ميجمو (Maigmo)", origin: "إسبانيا", count: 10.5, family: "curved", colorHex: "#be6838", width: 0.27, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/curved-seamless.jpg" },
  { name: "لوسا لوجيكا (Lusa Logica)", origin: "BMI", count: 12, family: "modern", colorHex: "#928270", width: 0.28, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/modern-seamless.jpg" },
  { name: "كوبرت كلينكر (Cobert)", origin: "BMI", count: 12.5, family: "curved", colorHex: "#b86030", width: 0.27, length: 0.48, type: "ceramic", textureUrl: "/textures/tiles/curved-seamless.jpg" },
  { name: "تيراكوتا (Terracotta)", origin: "إيطاليا", count: 14, family: "terracotta", colorHex: "#d07048", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
  { name: "كلاسيك / نيوكلاسيك", origin: "إيطاليا", count: 14, family: "brown", colorHex: "#7a5030", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/brown-seamless.jpg" },
  { name: "بورتوغيز (PORTOGHESE)", origin: "إيطاليا", count: 14, family: "terracotta", colorHex: "#cc6c44", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
  { name: "أمازونيا (Amazonia)", origin: "البرازيل", count: 12, family: "terracotta", colorHex: "#c86a42", width: 0.29, length: 0.47, type: "ceramic", textureUrl: "/textures/tiles/terracotta-seamless.jpg" },
];

export function getDefaultConfig() {
  return {
    tileCatalog: TILE_PRESETS.map(t => ({
      name: t.name, origin: t.origin, count: t.count,
      family: t.family, colorHex: t.colorHex,
      width: t.width, length: t.length, type: t.type,
      textureUrl: t.textureUrl,
    })),
    marketLengths: [3.0, 3.3, 3.6, 3.9, 4.2, 4.8, 5.1, 5.4, 5.7, 6.0],
    orderItems: [
      { id: "tiles", name: "قرميد", unit: "حبة" },
      { id: "iron4x8", name: "حديد 4×8", unit: "تيوب" },
      { id: "iron10x10", name: "حديد 10×10", unit: "تيوب" },
      { id: "sharshef", name: "شراشف", unit: "م" },
      { id: "decor", name: "ديكور", unit: "ربطة" },
      { id: "ases", name: "اسس", unit: "قطعة" },
      { id: "long_ases", name: "اسس طويل", unit: "قطعة" },
      { id: "metal_sheets", name: "شرحات صاج", unit: "شريحة" },
      { id: "mishma", name: "مشمع", unit: "رول" },
      { id: "lati", name: "الواح لاتي", unit: "لوح" },
      { id: "zafta", name: "رول زفته", unit: "رول" },
      { id: "dehan_mai", name: "دهان مائي", unit: "علبة" },
      { id: "bakit_baraghi", name: "بكيت براغي", unit: "بكيت" },
    ],
    extraItems: [
      { name: "زيت حار", unit: "جلن" },
      { name: "فرنيش", unit: "جلن" },
      { name: "نفط", unit: "تنكة" },
      { name: "روف جارد", unit: "ك" },
      { name: "رول دهان", unit: "حبة" },
      { name: "فرش", unit: "حبة" },
      { name: "مسامير بولاد", unit: "بكيت" },
      { name: "مسامير فرد", unit: "بكيت" },
      { name: "مسامير فرد بولاد", unit: "بكيت" },
      { name: "مسامير 4سم", unit: "بكيت" },
      { name: "اسلاك لحام", unit: "بكيت" },
      { name: "فيبر قص حديد", unit: "حبة" },
      { name: "مبروم حديد", unit: "ربطة" },
      { name: "بودرة", unit: "شوال" },
      { name: "اسمنت", unit: "كيس" },
    ],
  };
}
