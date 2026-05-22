import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSupplier } from "../services/supplierService";

export default function SupplierLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await loginSupplier(email, password);
      navigate("/supplier/dashboard");
    } catch (err) {
      setError(err.code === "auth/invalid-credential" ? "البريد أو كلمة السر خطأ" : err.code === "auth/user-not-found" ? "المستخدم غير موجود" : err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/30">
            <i className="fa-solid fa-truck text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-black text-ink">دخول الموردين</h1>
          <p className="text-xs text-ink-muted mt-1">تسجيل الدخول للوحة تحكم الموردين</p>
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">كلمة السر</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition">
              {loading ? "جاري..." : "دخول"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-ink-muted space-y-2">
            <p>ليس لديك حساب؟ <Link to="/supplier/register" className="text-emerald-600 font-bold hover:text-emerald-700">تسجيل جديد</Link></p>
            <p><Link to="/login" className="text-brand-600 font-bold hover:text-brand-700">تسجيل دخول المستخدمين</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
