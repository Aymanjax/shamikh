// مفاتيح قسم subscription — صفحة الاشتراك، حارس الاشتراك، أدوات الاشتراك
export const subscription = {
  // تسميات أنواع الاشتراك (الرموز المخزنة في Firestore لا تتغير)
  "subscription.type.freeTrial": "فترة مجانية",
  "subscription.type.limited": "محدودة",
  "subscription.type.basic": "أساسية",
  "subscription.type.advanced": "متقدمة",
  "subscription.type.none": "بدون اشتراك",

  // رأس الصفحة
  "subscription.page.subtitle": "حالة خطتك الحالية وما تشمله كل خطة",

  // بطاقة الحالة
  "subscription.status.active": "نشط",
  "subscription.cta.upgradeWhatsApp": "ترقية الخطة عبر واتساب",
  "subscription.cta.renewWhatsApp": "تجديد الاشتراك عبر واتساب",
  "subscription.stats.daysRemaining": "الأيام المتبقية",
  "subscription.stats.dayUnit": "يوم",
  "subscription.stats.endDate": "تاريخ الانتهاء",
  "subscription.stats.elapsed": "المدة المستهلكة",
  "subscription.stats.elapsedAria": "نسبة المدة المستهلكة من الاشتراك",
  "subscription.alert.expired": "انتهى اشتراكك. جدد الآن حتى لا تفقد الوصول للميزات المتقدمة، بياناتك محفوظة ولن تُحذف.",
  "subscription.alert.expiringSoon": "اشتراكك ينتهي خلال {n} يوم. تواصل معنا للتجديد قبل انقطاع الميزات.",

  // الخطط
  "subscription.plans.freeTrial.name": "الفترة المجانية",
  "subscription.plans.freeTrial.note": "{months} أشهر لكل حساب جديد",
  "subscription.plans.basic.name": "الأساسية",
  "subscription.plans.basic.note": "للمقاول الفردي",
  "subscription.plans.advanced.name": "المتقدمة",
  "subscription.plans.advanced.note": "للورش والشركات",

  // جدول مقارنة الخطط
  "subscription.table.title": "ماذا تشمل كل خطة",
  "subscription.table.feature": "الميزة",
  "subscription.table.currentPlan": "خطتك الحالية",
  "subscription.table.available": "متوفر",

  // الميزات
  "subscription.feature.calc": "حساب كميات القرميد والحديد",
  "subscription.feature.saveProjects": "حفظ المشاريع وفتحها في الحاسبة",
  "subscription.feature.invoices": "الفواتير وعروض الأسعار",
  "subscription.feature.roof3d": "معاينة السطح ثلاثي الأبعاد",
  "subscription.feature.workers": "إدارة العمال والأجور",
  "subscription.feature.nationalInvoice": "الربط مع الفاتورة الوطنية",

  // ملاحظة الفترة المجانية
  "subscription.trial.title": "كل حساب جديد يبدأ بفترة مجانية {months} أشهر",
  "subscription.trial.body": "خلال الفترة المجانية كل الميزات مفتوحة بدون قيود: الحاسبة، المعاينة ثلاثية الأبعاد، العمال، والفواتير. عند الاقتراب من الانتهاء تواصل معنا لاختيار الخطة المناسبة لعملك.",
  "subscription.trial.settingsLink": "إعدادات الحساب",

  // حارس الاشتراك
  "subscription.guard.expiredTitle": "انتهى اشتراكك",
  "subscription.guard.lockedTitle": "هذه الميزة غير متاحة في خطتك",
  "subscription.guard.expiredBody": "بياناتك محفوظة، جدد الاشتراك لاستعادة الوصول الكامل.",
  "subscription.guard.lockedBody": "خطتك الحالية ({plan}) لا تشمل هذه الميزة.",
  "subscription.guard.viewPlans": "عرض خطط الاشتراك",
} as const;
