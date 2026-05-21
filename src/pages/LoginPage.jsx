import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../services/authService";

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
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-white/5 rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-tr from-brand-600 to-amber-500 p-3 rounded-2xl inline-flex shadow-lg shadow-brand-600/30 mb-4">
            <i className="fa-solid fa-hotel text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black">شامخ ERP</h1>
          <p className="text-slate-400 text-sm mt-1">تسجيل الدخول إلى النظام</p>
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
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold block">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>

          <button type="submit"
            className="w-full bg-gradient-to-r from-brand-600 to-amber-500 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition">
            دخول
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0f172a] px-4 text-slate-400 font-bold">أو</span>
          </div>
        </div>

        <button onClick={handleGoogle}
          className="w-full bg-white hover:bg-slate-100 text-slate-800 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
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
  );
}
