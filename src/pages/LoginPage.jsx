import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../services/authService";

const FEATURES = [
  { icon: "fa-calculator", title: "حاسبة ذكية", desc: "حساب دقيق لكميات القرميد والحديد والأخشاب مع تقليل الهدر" },
  { icon: "fa-folder-open", title: "إدارة المشاريع", desc: "تتبع كامل للمشاريع مع حالة كل مشروع وتفاصيله" },
  { icon: "fa-file-invoice", title: "عروض سعر PDF", desc: "إصدار كشوف مواد وعروض سعر احترافية قابلة للطباعة" },
  { icon: "fa-warehouse", title: "المخزون", desc: "متابعة المخزون والمواد مع تنبيهات عند انخفاض الكمية" },
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
    <div className="min-h-screen bg-[#020617] flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600/10 to-amber-500/5"></div>
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-gradient-to-tr from-brand-600 to-amber-500 p-3 rounded-2xl shadow-lg shadow-brand-600/30">
              <i className="fa-solid fa-hotel text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black">شامخ ERP</h1>
              <p className="text-slate-400">نظام إدارة مشاريع القرميد</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 max-w-xl">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition cursor-default">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center mb-3 shadow-lg">
                  <i className={`fa-solid ${f.icon} text-white`}></i>
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[440px] flex items-center justify-center p-6">
        <div className="w-full bg-[#0f172a] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="lg:hidden bg-gradient-to-tr from-brand-600 to-amber-500 p-3 rounded-2xl inline-flex shadow-lg shadow-brand-600/30 mb-4">
              <i className="fa-solid fa-hotel text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-black">تسجيل الدخول</h1>
            <p className="text-slate-400 text-sm mt-1">أهلاً بك في شامخ ERP</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl break-words">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold block">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500 transition" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold block">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500 transition" />
            </div>

            <button type="submit"
              className="w-full bg-gradient-to-r from-brand-600 to-amber-500 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm">
              دخول
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0f172a] px-4 text-slate-400 font-bold">أو</span>
            </div>
          </div>

          <button onClick={handleGoogle}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 text-sm">
            <i className="fa-brands fa-google text-lg"></i>
            تسجيل الدخول بحساب Google
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            ما عندك حساب؟{" "}
            <Link to="/register" className="text-brand-500 font-bold hover:underline">
              سجل الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
