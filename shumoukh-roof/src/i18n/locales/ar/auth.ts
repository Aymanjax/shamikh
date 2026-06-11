// مفاتيح قسم auth — صفحات تسجيل الدخول وإنشاء الحساب
export const auth = {
  // تسجيل الدخول
  "auth.loginTitle": "تسجيل الدخول",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة السر",
  "auth.loginButton": "دخول",
  "auth.loggingIn": "جارٍ تسجيل الدخول...",
  "auth.or": "أو",
  "auth.google": "قوقل",
  "auth.noAccount": "ليس لديك حساب؟",

  // إنشاء حساب
  "auth.createAccount": "إنشاء حساب",
  "auth.registerSubtitle": "انضم إلى شموخ ERP",
  "auth.freeTrialBanner": "اشتراك مجاني كامل الميزات لمدة 6 أشهر",
  "auth.name": "الاسم",
  "auth.namePlaceholder": "محمد أحمد",
  "auth.creatingAccount": "جارٍ إنشاء الحساب...",
  "auth.haveAccount": "لديك حساب؟",
  "auth.loginLink": "تسجيل دخول",

  // رسائل الأخطاء
  "auth.error.userNotFound": "البريد الإلكتروني غير مسجل",
  "auth.error.wrongPassword": "كلمة السر خطأ",
  "auth.error.invalidCredential": "البريد أو كلمة السر خطأ",
  "auth.error.invalidEmail": "البريد الإلكتروني غير صالح",
  "auth.error.tooManyRequests": "محاولات كثيرة جداً، حاول لاحقاً",
  "auth.error.loginFailed": "فشل تسجيل الدخول",
  "auth.error.googleLoginFailed": "فشل تسجيل الدخول بقوقل",
  "auth.error.nameRequired": "يرجى إدخال الاسم",
  "auth.error.passwordTooShort": "كلمة السر يجب أن تكون 6 أحرف على الأقل",
  "auth.error.registerFailed": "فشل إنشاء الحساب",
} as const;
