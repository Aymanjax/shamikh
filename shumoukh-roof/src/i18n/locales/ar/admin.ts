// مفاتيح قسم admin — لوحة التحكم: المستخدمون، المشاريع، الفواتير، الموردون، العمال، الإعلانات، الإعدادات، السجل
export const admin = {
  // العنوان الرئيسي
  "admin.title": "لوحة التحكم",
  "admin.subtitle": "إدارة النظام والمستخدمين والاشتراكات",

  // التبويبات (الباقي يعاد استخدامه من nav.*)
  "admin.tabs.dashboard": "لوحة",
  "admin.tabs.users": "المستخدمين",
  "admin.tabs.suppliers": "الموردين",
  "admin.tabs.announcements": "الإعلانات",
  "admin.tabs.audit": "السجل",

  // عناصر مشتركة بين التبويبات
  "admin.loading": "جاري التحميل...",
  "admin.savingProgress": "جاري الحفظ...",
  "admin.refresh": "تحديث",
  "admin.ban": "حظر",
  "admin.unban": "رفع الحظر",
  "admin.banned": "محظور",
  "admin.unnamed": "بدون اسم",
  "admin.daysCount": "عدد الأيام",
  "admin.searchByClient": "ابحث باسم العميل...",

  // حالات المشاريع والفواتير
  "admin.status.draft": "مسودة",
  "admin.status.pending": "قيد الانتظار",
  "admin.status.paid": "مدفوعة",
  "admin.status.sent": "مرسل",
  "admin.status.approved": "موافق",
  "admin.status.in_progress": "قيد التنفيذ",
  "admin.status.completed": "مكتمل",

  // خطط الاشتراك (تُعرض وقت العرض، القيم المخزنة لا تتغير)
  "admin.plan.free_trial": "فترة مجانية",
  "admin.plan.limited": "محدودة",
  "admin.plan.basic": "أساسية",
  "admin.plan.advanced": "متقدمة",
  "admin.plan.none": "بدون اشتراك",

  // تبويب المستخدمين
  "admin.users.countLabel": "مستخدم",
  "admin.users.searchPlaceholder": "ابحث بالاسم أو البريد أو الشركة",
  "admin.users.refreshList": "تحديث القائمة",
  "admin.users.filter.active": "نشطاء",
  "admin.users.filter.banned": "محظورين",
  "admin.users.filter.admins": "مديرين",
  "admin.users.bulkLabel": "اشتراك جماعي:",
  "admin.users.applying": "جارٍ التطبيق...",
  "admin.users.applyToAll": "تطبيق على الكل",
  "admin.users.bulkConfirm": "تطبيق اشتراك \"{plan}\" لمدة {days} يوم على {count} مستخدم؟",
  "admin.users.noName": "بلا اسم",
  "admin.users.role.admin": "مدير",
  "admin.users.role.user": "مستخدم",
  "admin.users.promote": "ترقية",
  "admin.users.demote": "تخفيض",
  "admin.users.subscription": "اشتراك",
  "admin.users.empty": "لا يوجد مستخدمين مطابقين",

  // تبويب لوحة الإحصاءات
  "admin.dash.retry": "إعادة المحاولة",
  "admin.dash.paid": "المدفوع",
  "admin.dash.pending": "المستحق",
  "admin.dash.onlineNow": "متصلون الآن",
  "admin.dash.todayLogins": "تسجيلات اليوم",
  "admin.dash.invoiceStatus": "حالة الفواتير",
  "admin.dash.financialSummary": "ملخص مالي",
  "admin.dash.totalRevenue": "إجمالي الإيرادات",
  "admin.dash.moreDetails": "تفاصيل إضافية",
  "admin.dash.suppliersCount": "موردين",
  "admin.dash.announcementsCount": "إعلانات",
  "admin.dash.activeOffers": "عروض نشطة",
  "admin.dash.paidInvoices": "فواتير مدفوعة",
  "admin.dash.online": "متصلون",

  // تبويب المشاريع
  "admin.projects.countLabel": "مشروع",
  "admin.projects.deleteConfirm": "هل أنت متأكد من حذف مشروع \"{name}\"؟",
  "admin.projects.itemsLabel": "البنود:",
  "admin.projects.empty": "لا توجد مشاريع",

  // تبويب الفواتير
  "admin.invoices.countLabel": "فاتورة",
  "admin.invoices.due": "مستحقة",
  "admin.invoices.deleteConfirm": "هل أنت متأكد من حذف فاتورة \"{name}\"؟",
  "admin.invoices.markPending": "تعليق",
  "admin.invoices.markPaid": "دفع",
  "admin.invoices.empty": "لا توجد فواتير",

  // تبويب العمال
  "admin.workers.countLabel": "عامل",
  "admin.workers.searchPlaceholder": "ابحث باسم أو دور...",
  "admin.workers.total": "إجمالي العمال",
  "admin.workers.totalWages": "إجمالي الرواتب",
  "admin.workers.totalDays": "إجمالي الأيام",
  "admin.workers.noPhone": "بدون هاتف",
  "admin.workers.projectLabel": "مشروع:",
  "admin.workers.empty": "لا يوجد عمال",

  // تبويب الموردين
  "admin.suppliers.countLabel": "مورد",
  "admin.suppliers.searchPlaceholder": "ابحث باسم أو منطقة...",
  "admin.suppliers.approved": "مقبول",
  "admin.suppliers.pending": "معلق",
  "admin.suppliers.approve": "قبول",
  "admin.suppliers.empty": "لا يوجد موردين",

  // أنواع وأولويات الإعلانات
  "admin.annType.info": "معلومة",
  "admin.annType.warning": "تنبيه",
  "admin.annType.update": "تحديث",
  "admin.annType.maintenance": "صيانة",
  "admin.annPriority.low": "منخفضة",
  "admin.annPriority.normal": "متوسطة",
  "admin.annPriority.high": "عالية",

  // تبويب الإعلانات
  "admin.ann.countLabel": "إعلان",
  "admin.ann.searchPlaceholder": "ابحث في الإعلانات...",
  "admin.ann.loadFailed": "فشل تحميل الإعلانات: {error}",
  "admin.ann.saveFailedFirebase": "فشل الحفظ في Firebase، تأكد من صلاحيات قاعدة البيانات",
  "admin.ann.deleteConfirm": "هل أنت متأكد من حذف هذا الإعلان؟",
  "admin.ann.published": "منشور",
  "admin.ann.empty": "لا توجد إعلانات",
  "admin.ann.emptyHint": "أضف إعلاناً جديداً ليظهر للمستخدمين",

  // نافذة الإعلان
  "admin.annModal.editTitle": "تعديل إعلان",
  "admin.annModal.newTitle": "إعلان جديد",
  "admin.annModal.titleLabel": "العنوان",
  "admin.annModal.titlePlaceholder": "عنوان الإعلان...",
  "admin.annModal.contentLabel": "المحتوى",
  "admin.annModal.contentPlaceholder": "محتوى الإعلان...",
  "admin.annModal.typeLabel": "النوع",
  "admin.annModal.priorityLabel": "الأولوية",
  "admin.annModal.saveFailed": "فشل الحفظ، يرجى المحاولة مرة أخرى",
  "admin.annModal.saved": "تم الحفظ",
  "admin.annModal.update": "تحديث",
  "admin.annModal.create": "إنشاء",

  // تبويب سجل التدقيق (تُترجم تسميات الإجراءات وقت العرض، الرموز المخزنة لا تتغير)
  "admin.audit.countLabel": "سجل",
  "admin.audit.searchPlaceholder": "ابحث في السجل...",
  "admin.audit.action.update_config": "تحديث الإعدادات",
  "admin.audit.action.update_role": "تغيير صلاحية",
  "admin.audit.action.toggle_ban": "تبديل حظر",
  "admin.audit.action.set_subscription": "تعديل اشتراك",
  "admin.audit.filter.ban": "حظر/رفع",
  "admin.audit.filter.subscriptions": "اشتراكات",
  "admin.audit.filter.config": "إعدادات",
  "admin.audit.empty": "لا يوجد سجلات",

  // تبويب إعدادات النظام
  "admin.config.tabs.tiles": "كتالوج القرميد",
  "admin.config.tabs.lengths": "أطوال السوق",
  "admin.config.tabs.orders": "بنود الطلبات",
  "admin.config.tabs.extras": "بنود إضافية",
  "admin.config.saveSuccess": "تم حفظ الإعدادات بنجاح",
  "admin.config.tileUnit": "بلاطة",
  "admin.config.lengthUnit": "طول",
  "admin.config.itemUnit": "بند",
  "admin.config.extraUnit": "بند إضافي",
  "admin.config.meterUnit": "م",
  "admin.config.origin": "المنشأ",
  "admin.config.countPerM": "العدد/م",
  "admin.config.width": "العرض",
  "admin.config.length": "الطول",
  "admin.config.id": "المعرف",
  "admin.config.name": "الاسم",
  "admin.config.unit": "الوحدة",

  // نافذة الاشتراك
  "admin.subModal.planLabel": "نوع الاشتراك",
  "admin.subModal.modeLabel": "طريقة التحديد",
  "admin.subModal.byDays": "بعدد الأيام",
  "admin.subModal.byDate": "بتاريخ محدد",
  "admin.subModal.daysSuffix": "يوماً",
  "admin.subModal.expectedExpiry": "تاريخ الانتهاء المتوقع",
  "admin.subModal.save": "حفظ الاشتراك",

  // رسائل خدمات الواجهة
  "admin.api.requestFailed": "فشل الطلب: {status}",
  "admin.api.updateFailed": "فشل التحديث: {status}",
  "admin.api.actionFailed": "فشل التنفيذ: {status}",
  "admin.api.deleteFailed": "فشل الحذف: {status}",
  "admin.api.todayLoginsFailed": "فشل جلب سجل دخول اليوم",
} as const;
