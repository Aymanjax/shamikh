import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(email, password, name);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-tr from-brand-600 to-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <i className="fa-solid fa-hotel text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black text-ink">إنشاء حساب جديد</h1>
          <p className="text-sm text-ink-muted">انضم إلى شامخ ERP</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">الاسم</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
            </div>
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
              إنشاء حساب
            </button>
          </form>

          <p className="text-center text-xs text-ink-muted mt-5">
            لديك حساب بالفعل؟
            <Link to="/login" className="text-brand-600 font-bold mr-1 hover:text-brand-700">تسجيل دخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
