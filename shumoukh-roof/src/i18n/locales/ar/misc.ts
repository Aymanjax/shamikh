// مفاتيح قسم misc — شريط الأوامر، الإشعارات، الحالات الفارغة، حدود الخطأ، عرض المشروع
export const misc = {
  // شريط الأوامر العائم
  "misc.nav.openMenu": "فتح القائمة",
  "misc.nav.logoutShort": "خروج",
  "misc.nav.collapseShort": "طي",

  // جرس الإشعارات
  "misc.notifications.title": "الإشعارات",
  "misc.notifications.unread": "{n} غير مقروءة",
  "misc.notifications.empty": "لا توجد إشعارات",

  // حالة المشاريع الفارغة
  "misc.roofEmpty.title": "لا توجد مشاريع بعد",
  "misc.roofEmpty.subtitle": "ابدأ بحساب البضاعة وسيظهر المشروع هنا تلقائياً",
  "misc.roofEmpty.cta": "احسب البضاعة الآن",

  // حدود الخطأ
  "misc.errorBoundary.title": "حدث خطأ غير متوقع",
  "misc.errorBoundary.message": "تعذر تحميل الصفحة. يرجى المحاولة مرة أخرى.",
  "misc.errorBoundary.reload": "إعادة تحميل",

  // عرض المشروع — حالات المشروع واسمه
  "misc.projectStatus.draft": "مسودة",
  "misc.projectStatus.sent": "مُرسل",
  "misc.projectStatus.approved": "موافَق عليه",
  "misc.projectStatus.in_progress": "قيد التنفيذ",
  "misc.projectStatus.completed": "مكتمل",
  "misc.project.unnamed": "مشروع بدون اسم",
} as const;
