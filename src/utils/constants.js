export const MARKET_LENGTHS = [3.0, 3.3, 3.6, 3.9, 4.2, 4.8, 5.1, 5.4, 5.7, 6.0];

export const TILES_CATALOG = [
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
];

export const PROJECT_STATUSES = ["draft", "sent", "approved", "in_progress", "completed"];

export const STATUS_LABELS = {
  draft: "مسودة", sent: "أرسل للعميل", approved: "موافق عليه",
  in_progress: "قيد التنفيذ", completed: "منجز",
};

export const STATUS_COLORS = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
};
