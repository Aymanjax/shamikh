// القاموس العربي — مفاتيح مسطّحة بنقاط (namespace.key)
// قيم الجمع تُكتب ككائن { zero, one, two, few, many, other } ويُختار حسب قواعد اللغة
export const ar = {
  // الهوية
  "app.name": "شموخ ERP",
  "app.tagline": "إدارة مشاريع القرميد",

  // التنقّل
  "nav.home": "الرئيسية",
  "nav.calculator": "حساب البضاعة",
  "nav.projects": "المشاريع",
  "nav.invoices": "الفواتير",
  "nav.workers": "العمال",
  "nav.subscription": "الاشتراك",
  "nav.settings": "الإعدادات",
  "nav.admin": "التحكم",
  "nav.logout": "تسجيل الخروج",

  // إجراءات عامة
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.add": "إضافة",
  "common.search": "بحث",
  "common.close": "إغلاق",
  "common.confirm": "تأكيد",
  "common.back": "رجوع",
  "common.loading": "جارٍ التحميل…",
  "common.language.ar": "العربية",
  "common.language.en": "English",

  // المظهر والإعدادات
  "appearance.title": "المظهر",
  "appearance.subtitle": "الوضع الليلي، حجم الخط، اللغة",
  "appearance.darkMode": "الوضع الليلي",
  "appearance.darkModeDesc": "تغيير مظهر التطبيق إلى الوضع الداكن",
  "appearance.fontSize": "حجم الخط",
  "appearance.fontSmall": "صغير",
  "appearance.fontNormal": "وسط",
  "appearance.fontLarge": "كبير",
  "appearance.language": "اللغة",
  "appearance.languageDesc": "لغة واجهة التطبيق",

  // المصادقة
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",

  // أمثلة على الجمع والتعويض
  "common.itemsCount": { zero: "لا توجد عناصر", one: "عنصر واحد", two: "عنصران", few: "{n} عناصر", many: "{n} عنصرًا", other: "{n} عنصر" },
  "common.greeting": "مرحبًا {name}",
} as const;
