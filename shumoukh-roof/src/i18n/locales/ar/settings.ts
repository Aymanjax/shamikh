// مفاتيح قسم settings — صفحة الإعدادات وألسنتها (الملف الشخصي، الشركة، الأمان، الإشعارات، المواد الإضافية)
export const settings = {
  // صفحة الإعدادات الرئيسية
  "settings.subtitle": "إدارة حسابك وأدوات عملك",
  "settings.backToSettings": "رجوع إلى الإعدادات",
  "settings.subscriptionLabel": "الاشتراك: {plan}",
  "settings.daysRemaining": "متبقي {n} يوم",
  "settings.expiredRenew": "منتهي — اضغط للتجديد",
  "settings.manageSubscription": "إدارة الاشتراك",
  "settings.group.account": "الحساب",
  "settings.group.tools": "أدوات العمل",
  "settings.group.app": "التطبيق",
  "settings.appearance.desc": "الوضع الليلي وحجم الخط",
  "settings.security.desc": "كلمة السر وحماية الحساب",
  "settings.extraItems.desc": "بنود إضافية تظهر في حاسبة البضاعة",
  "settings.notifications.desc": "التنبيهات داخل التطبيق",

  // مشترك بين الألسنة
  "settings.saving": "جارٍ الحفظ...",
  "settings.done": "تم",
  "settings.notSignedIn": "لم يتم تسجيل الدخول",
  "settings.phoneLabel": "رقم الهاتف",
  "settings.errors.saveFailed": "فشل الحفظ، حاول مرة أخرى",
  "settings.errors.network": "لا يوجد اتصال بالإنترنت، حاول مرة أخرى",

  // الملف الشخصي
  "settings.profile.title": "الملف الشخصي",
  "settings.profile.subtitle": "الاسم، البريد الإلكتروني، رقم الهاتف",
  "settings.profile.signInPrompt": "سجل الدخول لعرض الملف الشخصي",
  "settings.profile.loadError": "فشل تحميل بيانات الملف الشخصي",
  "settings.profile.nameLabel": "الاسم",
  "settings.profile.nameMax": "الحد الأقصى {n} حرف",
  "settings.profile.nameRequired": "الاسم مطلوب",
  "settings.profile.nameTooShort": "الاسم قصير جداً",
  "settings.profile.phoneDigitsOnly": "أرقام فقط",
  "settings.profile.emailLabel": "البريد الإلكتروني",
  "settings.profile.emailReadOnly": "لا يمكن تغيير البريد الإلكتروني",

  // الشركة
  "settings.company.title": "الشركة",
  "settings.company.subtitle": "اسم الشركة، العنوان، الشعار",
  "settings.company.signInPrompt": "سجل الدخول لعرض إعدادات الشركة",
  "settings.company.logo": "شعار الشركة",
  "settings.company.logoHint": "jpg, png - مقاس مناسب",
  "settings.company.uploading": "جاري الرفع...",
  "settings.company.nameLabel": "اسم الشركة",
  "settings.company.addressLabel": "العنوان",

  // الأمان
  "settings.security.title": "الأمان",
  "settings.security.subtitle": "كلمة السر، المصادقة الثنائية",
  "settings.security.fillAllFields": "يرجى تعبئة جميع الحقول",
  "settings.security.newPasswordMinLength": "كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل",
  "settings.security.passwordMismatch": "كلمة السر الجديدة غير متطابقة",
  "settings.security.wrongPassword": "كلمة السر الحالية غير صحيحة",
  "settings.security.weakPassword": "كلمة السر ضعيفة - يجب أن تكون 6 أحرف على الأقل",
  "settings.security.genericError": "حدث خطأ. تأكد من صحة البيانات وحاول مجدداً",
  "settings.security.passwordChanged": "تم تغيير كلمة السر بنجاح",
  "settings.security.currentPassword": "كلمة السر الحالية",
  "settings.security.newPassword": "كلمة السر الجديدة",
  "settings.security.confirmPassword": "تأكيد كلمة السر الجديدة",
  "settings.security.changePassword": "تغيير كلمة السر",

  // الإشعارات
  "settings.notifications.title": "الإشعارات",
  "settings.notifications.subtitle": "إعدادات التنبيهات والإشعارات",
  "settings.notifications.email": "التنبيهات عبر البريد",
  "settings.notifications.emailDesc": "استلام إشعارات المشاريع والفواتير على البريد",
  "settings.notifications.push": "إشعارات التطبيق",
  "settings.notifications.pushDesc": "إظهار إشعارات داخل التطبيق",
  "settings.notifications.invoices": "تنبيهات الفواتير",
  "settings.notifications.invoicesDesc": "إشعار عند إنشاء أو تعديل فاتورة",
  "settings.notifications.announcements": "إشعارات الإعلانات",
  "settings.notifications.announcementsDesc": "استلام إعلانات وإشعارات من الإدارة",

  // المواد الإضافية
  "settings.extraItems.title": "المواد الإضافية",
  "settings.extraItems.subtitle": "إدارة المواد الإضافية في حساب البضاعة",
  "settings.extraItems.namePlaceholder": "اسم المادة...",
  "settings.extraItems.maxItems": "الحد الأقصى 100 مادة",
  "settings.extraItems.empty": "أضف أول مادة إضافية",
} as const;
