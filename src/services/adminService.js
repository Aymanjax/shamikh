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

export function getDefaultConfig() {
  return {
    tileCatalog: [
      { name: "بلانيوم سكني (Planum)", origin: "إسبانيا", count: 11 },
      { name: "بلانيوم أسود (Planum)", origin: "إسبانيا", count: 11 },
      { name: "بلاك ستون (Planum)", origin: "إسبانيا", count: 11 },
      { name: "بلانيوم بني (Planum)", origin: "إسبانيا", count: 11 },
      { name: "بلانوم أحمر (Planum)", origin: "إسبانيا", count: 11 },
      { name: "فيسيوم 3 رمادي (Visum3 Gray)", origin: "إسبانيا", count: 11.5 },
      { name: "فيسيوم بني غامق (Visum3 Rustic)", origin: "إسبانيا", count: 11.5 },
      { name: "بلانا أسود (LOGICA Plana)", origin: "إسبانيا", count: 11 },
      { name: "بلانا ايموشن (LOGICA Emotion)", origin: "إسبانيا", count: 11 },
      { name: "فلات (Flat Natural / Red)", origin: "إسبانيا", count: 10.7 },
      { name: "إنوفا (Innova)", origin: "إسبانيا", count: 11.5 },
      { name: "فيينا (Vienna)", origin: "إسبانيا", count: 11.5 },
      { name: "فيرتوس كلينكر (Virtus Klinker)", origin: "BMI", count: 11.5 },
      { name: "سيبرانو (CEPRANO)", origin: "BMI", count: 14.5 },
      { name: "إم جي بلس (+MG)", origin: "BMI", count: 11 },
      { name: "فاريو 5 (Vario 5)", origin: "BMI", count: 14 },
      { name: "مارسيليا أيديال", origin: "اليونان", count: 11 },
      { name: "المنحني وتوسال (CURVED)", origin: "إسبانيا", count: 10.5 },
      { name: "ميجمو (Maigmo)", origin: "إسبانيا", count: 10.5 },
      { name: "لوسا لوجيكا (Lusa Logica)", origin: "BMI", count: 12 },
      { name: "كوبرت كلينكر (Cobert)", origin: "BMI", count: 12.5 },
      { name: "تيراكوتا (Terracotta)", origin: "إيطاليا", count: 14 },
      { name: "كلاسيك / نيوكلاسيك", origin: "إيطاليا", count: 14 },
      { name: "بورتوغيز (PORTOGHESE)", origin: "إيطاليا", count: 14 },
      { name: "أمازونيا (Amazonia)", origin: "البرازيل", count: 12 },
    ],
    marketLengths: [3.0, 3.3, 3.6, 3.9, 4.2, 4.8, 5.1, 5.4, 5.7, 6.0],
    orderItems: [
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
    ],
  };
}
