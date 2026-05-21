import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../services/authService";

const FEATURES = [
  { icon: "fa-calculator", title: "حاسبة ذكية", desc: "حساب دقيق لكميات القرميد والحديد والأخشاب مع تقليل الهدر" },
  { icon: "fa-folder-open", title: "إدارة المشاريع", desc: "تتبع كامل للمشاريع مع حالة كل مشروع وتفاصيله" },
  { icon: "fa-file-invoice", title: "عروض سعر PDF", desc: "إصدار كشوف مواد وعروض سعر احترافية قابلة للطباعة" },
  { icon: "fa-users-gear", title: "شؤون العمال", desc: "تسجيل الحضور اليومي وحساب الأجور والرواتب" },
  { icon: "fa-truck", title: "الموردين", desc: "إدارة الموردين وعروض الأسعار والمقارنة بينهم" },
  { icon: "fa-chart-line", title: "تقارير وأرباح", desc: "تقارير مالية ورسوم بيانية لمتابعة أداء العمل" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
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

  return (
    <div className="min-h-screen bg-surface-alt flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative overflow-hidden bg-gradient-to-br from-brand-600/5 to-amber-500/5">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-gradient-to-tr from-brand-600 to-amber-500 p-3 rounded-2xl shadow-lg shadow-brand-600/30">
              <i className="fa-solid fa-hotel text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black text-ink">شامخ ERP</h1>
              <p className="text-ink-muted">نظام إدارة مشاريع القرميد</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 max-w-xl">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-brand-300 transition cursor-default">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center mb-3 shadow-lg">
                  <i className={`fa-solid ${f.icon} text-white`}></i>
                </div>
                <h3 className="font-bold text-sm text-ink mb-1">{f.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="bg-gradient-to-tr from-brand-600 to-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
              <i className="fa-solid fa-hotel text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-black text-ink">شامخ ERP</h1>
            <p className="text-sm text-ink-muted">نظام إدارة مشاريع القرميد</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
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
                  className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">كلمة السر</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
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
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-ink font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
              <i className="fa-brands fa-google text-red-500"></i>
              تسجيل الدخول بـ Google
            </button>

            <p className="text-center text-xs text-ink-muted mt-5">
              ليس لديك حساب؟
              <Link to="/register" className="text-brand-600 font-bold mr-1 hover:text-brand-700">إنشاء حساب</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
