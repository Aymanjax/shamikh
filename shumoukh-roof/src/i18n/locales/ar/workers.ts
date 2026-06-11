// مفاتيح قسم workers — صفحة العمال
export const workers = {
  // المهن (القيمة المخزنة بالعربية في Firestore، الترجمة للعرض فقط)
  "workers.role.tiler": "مبلط",
  "workers.role.blacksmith": "حداد",
  "workers.role.assistant": "مساعد",
  "workers.role.laborer": "عامل",
  "workers.role.supervisor": "مشرف",
  "workers.role.driver": "سائق",

  // رأس الصفحة
  "workers.title": "العمال",
  "workers.subtitle": "إدارة العمال والمهام اليومية",
  "workers.addWorker": "إضافة عامل",

  // خطأ التحميل
  "workers.loadError": "تعذر تحميل بيانات العمال",
  "workers.loadErrorHint": "تحقق من اتصالك بالإنترنت وحاول مرة أخرى",

  // الحالة الفارغة
  "workers.emptyTitle": "لا يوجد عمال",
  "workers.emptyHint": "أضف عامل جديد للبدء",

  // بطاقة العامل
  "workers.deleteConfirm": "حذف العامل \"{name}\"؟",
  "workers.deleteAria": "حذف العامل {name}",
  "workers.wagePerDay": "{wage} د.أ/يوم",
  "workers.total": "الإجمالي",

  // نافذة الإضافة
  "workers.name": "الاسم",
  "workers.role": "المهنة",
  "workers.phone": "الهاتف",
  "workers.project": "المشروع",
  "workers.wageLabel": "الأجر (د.أ/يوم)",
  "workers.daysLabel": "عدد الأيام",
  "workers.adding": "جارٍ الإضافة...",
} as const;
