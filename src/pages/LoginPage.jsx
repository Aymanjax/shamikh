import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle, resetPassword, confirmResetPassword } from "../services/authService";

const FEATURES = [
  { icon: "fa-calculator", title: "حاسبة القرميد", desc: "احسب كميات الورشة كاملة بضغطة زر — قرميد، حديد، خشب، عزل، تكاليف" },
  { icon: "fa-folder-open", title: "إدارة المشاريع", desc: "تتبع كامل لكل مشروع مع حالته وتفاصيله وطلبياته ودفعاته" },
  { icon: "fa-file-invoice", title: "فواتير وعروض سعر", desc: "إصدار كشوف مواد وفواتير PDF احترافية جاهزة للطباعة" },
  { icon: "fa-users-gear", title: "شؤون العمال", desc: "تسجيل حضور يومي وحساب الأجور والرواتب بشكل تلقائي" },
  { icon: "fa-truck", title: "الموردين", desc: "إدارة الموردين والمقارنة بين عروض الأسعار" },
  { icon: "fa-chart-line", title: "تقارير وأرباح", desc: "تقارير مالية شاملة ورسوم بيانية لمتابعة أدائك" },
  { icon: "fa-boxes-stacked", title: "المواد الإضافية", desc: "إدارة المواد الاستهلاكية — زيت، فرنيش، مسامير، وغيرها" },
  { icon: "fa-mobile-screen-button", title: "متوافق مع الجوال", desc: "صمم ليشتغل على كل الشاشات — جوال، تابلت، لابتوب" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [urlReset, setUrlReset] = useState(false);
  const [oobCode, setOobCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [urlResetDone, setUrlResetDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    const mode = params.get("mode");
    if (mode === "resetPassword" && code) {
      setOobCode(code);
      setUrlReset(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password, remember);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSent(false);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(err.message);
    }
  };

  const handleUrlReset = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await confirmResetPassword(oobCode, newPassword);
      setUrlResetDone(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 lg:hidden">
            <img src="/logo.png" alt="شموخ" className="w-14 h-14 mx-auto mb-3 object-contain" />
            <h1 className="text-xl font-black text-ink">شموخ ERP</h1>
            <p className="text-xs text-ink-muted">نظام إدارة مشاريع القرميد</p>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-sm">
            {urlReset ? (
              <>
                <h2 className="text-xl font-black text-ink mb-1">إعادة تعيين كلمة السر</h2>
                <p className="text-sm text-ink-muted mb-6">أدخل كلمة السر الجديدة</p>

                {urlResetDone ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-xl flex items-center gap-2">
                      <i className="fa-solid fa-check-circle"></i>
                      تم تغيير كلمة السر بنجاح
                    </div>
                    <Link to="/login"
                      className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition">
                      تسجيل الدخول
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleUrlReset} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-muted">كلمة السر الجديدة</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                        className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
                    </div>
                    <button type="submit"
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition">
                      تغيير كلمة السر
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-ink mb-1">تسجيل الدخول</h2>
                <p className="text-sm text-ink-muted mb-6">أهلاً بعودتك</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink-muted">البريد الإلكتروني</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required
                      className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink-muted">كلمة السر</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                      className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-line text-brand-600 focus:ring-brand-500 cursor-pointer" />
                      <span className="text-xs text-ink-muted">تذكرني</span>
                    </label>
                    <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); }}
                      className="text-xs text-brand-600 hover:text-brand-700 font-bold">
                      نسيت كلمة السر؟
                    </button>
                  </div>
                  <button type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition">
                    دخول
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-ink-muted">أو</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <button onClick={handleGoogle}
                  className="w-full bg-surface border border-gray-300 hover:bg-surface-subtle text-ink font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  <i className="fa-brands fa-google text-red-500"></i>
                  تسجيل الدخول بـ Google
                </button>

                <div className="flex items-center justify-center gap-3 mt-5 text-xs">
                  <p className="text-ink-muted">ليس لديك حساب؟</p>
                  <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700">إنشاء حساب</Link>
                  <span className="text-ink-muted">·</span>
                  <Link to="/plans" className="text-brand-600 font-bold hover:text-brand-700">خطط الأسعار</Link>
                </div>
                <div className="mt-4 pt-4 border-t border-line text-center">
                  <Link to="/supplier/register"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                    <i className="fa-solid fa-store"></i> تسجيل كمورد — أضف متجرك إلى دليل الموردين
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-brand-600/5 to-amber-500/5 p-6 md:p-10 order-1 lg:order-2 overflow-hidden">
        <div className="max-w-xl mx-auto">
          <div className="hidden lg:flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="شموخ" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-3xl font-black text-ink">شموخ ERP</h1>
              <p className="text-ink-muted">نظام إدارة مشاريع القرميد</p>
            </div>
          </div>

          <div className="lg:hidden mb-4">
            <h2 className="text-lg font-black text-ink mb-1 flex items-center gap-2">
              <i className="fa-solid fa-star text-amber-500 text-sm"></i>
              مميزات النظام
            </h2>
            <p className="text-xs text-ink-muted">كل ما تحتاجه لإدارة مشاريع القرميد</p>
          </div>

          <div className="hidden lg:block mb-6">
            <p className="text-lg font-bold text-ink flex items-center gap-2">
              <i className="fa-solid fa-bolt text-amber-500"></i>
              احسب كميات ورشتك <span className="text-brand-600">بضغطة زر</span>
            </p>
            <p className="text-sm text-ink-muted mt-1">كل ما تحتاجه لإدارة مشاريع القرميد في مكان واحد</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className={`bg-surface border border-line rounded-2xl p-4 hover:shadow-md hover:border-brand-300 transition cursor-default ${i === 0 ? "md:col-span-2 bg-gradient-to-r from-brand-600/5 to-amber-500/5 border-brand-200" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${i === 0 ? "bg-gradient-to-br from-brand-500 to-amber-500" : "bg-gradient-to-br from-brand-500/10 to-amber-500/10"}`}>
                    <i className={`fa-solid ${f.icon} ${i === 0 ? "text-white" : "text-brand-600"}`}></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm ${i === 0 ? "text-brand-700" : "text-ink"}`}>{f.title}</h3>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-surface border border-dashed border-brand-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-ink-muted">
              <span className="font-black text-brand-600">15 يوم تجريبي</span> — جرب النظام كامل بدون أي التزام
            </p>
          </div>
        </div>
      </div>

      {showReset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowReset(false)}>
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-ink mb-1">استعادة كلمة السر</h3>
            <p className="text-xs text-ink-muted mb-4">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة السر</p>

            {resetSent ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-xl flex items-center gap-2">
                  <i className="fa-solid fa-check-circle"></i>
                  تم إرسال رابط استعادة كلمة السر إلى {resetEmail}
                </div>
                <button onClick={() => setShowReset(false)}
                  className="w-full bg-surface-subtle hover:bg-surface-input text-ink py-2.5 rounded-xl font-bold text-sm border border-line transition">
                  تم
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{resetError}</div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-muted">البريد الإلكتروني</label>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} dir="ltr" required
                    className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
                </div>
                <button type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition">
                  إرسال رابط الاستعادة
                </button>
                <button type="button" onClick={() => setShowReset(false)}
                  className="w-full text-xs text-ink-muted hover:text-ink py-1 transition">
                  إلغاء
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
