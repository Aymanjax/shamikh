// مفاتيح قسم dashboard — الصفحة الرئيسية (لوحة المعلومات)
export const dashboard = {
  // حالة الفاتورة
  "dashboard.invoiceStatus.paid": "مدفوعة",
  "dashboard.invoiceStatus.pending": "قيد الانتظار",
  "dashboard.invoiceStatus.draft": "مسودة",

  // الإحصائيات
  "dashboard.stats.paid": "المدفوع",
  "dashboard.stats.pending": "قيد الانتظار",
  "dashboard.stats.workerCost": "تكلفة العمال",

  // خطأ التحميل
  "dashboard.error.title": "تعذر تحميل البيانات",
  "dashboard.error.subtitle": "تحقق من اتصالك بالإنترنت ثم أعد المحاولة",
  "dashboard.error.retry": "إعادة المحاولة",

  // تنبيه الاشتراك
  "dashboard.subscription.expired": "انتهى اشتراكك، بياناتك محفوظة. جدد الآن لاستعادة كل الميزات.",
  "dashboard.subscription.expiring": "اشتراكك ينتهي خلال {n} يوم.",
  "dashboard.subscription.details": "التفاصيل",

  // الترحيب
  "dashboard.hero.welcomeNamed": "مرحباً {name}",
  "dashboard.hero.welcome": "مرحباً بك",
  "dashboard.hero.online": "متصل",
  "dashboard.hero.subtitle": "دفترك اليوم: المشاريع، العمال، والفواتير في مكان واحد",
  "dashboard.hero.newCalculation": "حساب جديد",

  // سجلا المشاريع والفواتير
  "dashboard.recentProjects": "آخر المشاريع",
  "dashboard.recentInvoices": "آخر الفواتير",
  "dashboard.viewAll": "عرض الكل",
  "dashboard.areaSqm": "{area} م²",
  "dashboard.noDrawing": "بدون رسم",
  "dashboard.tilesCount": "{n} حبة",
  "dashboard.noInvoices.title": "لا توجد فواتير بعد",
  "dashboard.noInvoices.subtitle": "أنشئ فاتورة من صفحة الفواتير أو من تفاصيل أي مشروع",
  "dashboard.unnamedClient": "بدون اسم",
} as const;
