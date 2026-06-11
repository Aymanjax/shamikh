// مفاتيح قسم invoices — صفحة الفواتير
export const invoices = {
  // حالات الفاتورة (القيمة المخزنة بالإنجليزية، الترجمة للعرض فقط)
  "invoices.status.paid": "مدفوعة",
  "invoices.status.pending": "قيد الانتظار",
  "invoices.status.draft": "مسودة",

  // رأس الصفحة
  "invoices.title": "الفواتير",
  "invoices.subtitle": "إدارة الفواتير وعروض الأسعار",
  "invoices.newInvoice": "فاتورة جديدة",

  // خطأ التحميل
  "invoices.loadError": "تعذر تحميل الفواتير",
  "invoices.loadErrorHint": "تحقق من اتصالك بالإنترنت وحاول مرة أخرى",

  // البحث والعداد
  "invoices.searchPlaceholder": "ابحث باسم العميل أو المشروع",
  "invoices.count": { zero: "لا توجد فواتير", one: "فاتورة واحدة", two: "فاتورتان", few: "{n} فواتير", many: "{n} فاتورة", other: "{n} فاتورة" },

  // الحالة الفارغة
  "invoices.emptyTitle": "لا توجد فواتير",
  "invoices.emptyHint": "ابدأ بتسجيل أول فاتورة لتتبع مدفوعات مشاريعك",

  // صف الفاتورة
  "invoices.openProjectInCalculator": "فتح المشروع في الحاسبة",
  "invoices.changeStatusTo": "تغيير الحالة إلى {status}",
  "invoices.downloadInvoice": "تحميل الفاتورة",
  "invoices.deleteInvoice": "حذف الفاتورة",
  "invoices.deleteConfirm": "حذف هذه الفاتورة؟ لا يمكن التراجع عن الحذف.",

  // نافذة الإنشاء
  "invoices.client": "العميل",
  "invoices.clientPlaceholder": "اسم العميل",
  "invoices.clientRequired": "اسم العميل مطلوب",
  "invoices.project": "المشروع",
  "invoices.projectPlaceholder": "اختياري — اسم المشروع",
  "invoices.amountLabel": "المبلغ (د.أ)",
  "invoices.amountPlaceholder": "٠",
  "invoices.create": "إنشاء الفاتورة",
  "invoices.creating": "جارٍ الإنشاء...",
} as const;
