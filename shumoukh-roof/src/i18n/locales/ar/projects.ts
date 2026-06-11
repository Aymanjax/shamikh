// مفاتيح قسم projects — صفحة المشاريع
export const projects = {
  // حالات المشروع (القيمة المخزنة بالإنجليزية، الترجمة للعرض فقط)
  "projects.status.draft": "مسودة",
  "projects.status.sent": "مُرسل",
  "projects.status.approved": "موافَق عليه",
  "projects.status.in_progress": "قيد التنفيذ",
  "projects.status.completed": "مكتمل",

  // رأس الصفحة
  "projects.title": "المشاريع",
  "projects.savedCount": "{n} مشروع محفوظ من الحاسبة",
  "projects.subtitle": "كل مشروع تحفظه من الحاسبة يظهر هنا",
  "projects.newCalculation": "حساب جديد",

  // خطأ التحميل
  "projects.loadError": "تعذر تحميل المشاريع",
  "projects.loadErrorHint": "تحقق من اتصالك بالإنترنت وحاول مرة أخرى",
  "projects.retry": "إعادة المحاولة",

  // البحث والتصفية
  "projects.searchPlaceholder": "ابحث بالاسم أو الهاتف أو العنوان",

  // الحالة الفارغة
  "projects.emptyTitle": "لا توجد مشاريع بعد",
  "projects.noSearchResults": "لا نتائج مطابقة للبحث",
  "projects.emptyHint": "ارسم السطح في الحاسبة واحفظه باسم العميل ليظهر هنا",
  "projects.startFirstCalculation": "ابدأ أول حساب",

  // صف المشروع
  "projects.areaValue": "{value} م²",
  "projects.noDrawing": "بدون رسم",
  "projects.tilesCount": "{n} حبة قرميد",
  "projects.deleteConfirm": "حذف مشروع \"{name}\"؟ لا يمكن التراجع عن الحذف.",
  "projects.openInCalculator": "فتح في الحاسبة",
  "projects.openInCalculatorAria": "فتح {name} في الحاسبة",
  "projects.deleteProject": "حذف المشروع",
  "projects.deleteAria": "حذف {name}",

  // تفاصيل المشروع
  "projects.area": "المساحة",
  "projects.tiles": "القرميد",
  "projects.tileUnit": "حبة",
  "projects.slope": "الميل",
  "projects.numLegs": "عدد الأرجل",
  "projects.estimatedCost": "التكلفة التقديرية",
  "projects.projectStatus": "حالة المشروع",
  "projects.createInvoice": "إنشاء فاتورة",
  "projects.invoiceCreated": "أُنشئت",
  "projects.creating": "جارٍ...",
} as const;
