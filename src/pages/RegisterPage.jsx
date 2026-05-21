import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await registerUser(form.email, form.password, form.name);
      await setDoc(doc(db, "users", user.uid, "profile", "main"), {
        companyName: form.name,
        phone: form.phone,
        email: form.email,
        role: "user",
        createdAt: new Date().toISOString(),
      });
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
            <i className="fa-solid fa-user-plus text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black">حساب جديد</h1>
          <p className="text-slate-400 text-sm mt-1">أنشئ حسابك لإدارة مشاريع القرميد</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold block">الاسم / اسم الشركة</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold block">رقم الهاتف</label>
            <input name="phone" value={form.phone} onChange={handleChange} required dir="ltr"
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold block">البريد الإلكتروني</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold block">كلمة المرور</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>

          <button type="submit"
            className="w-full bg-gradient-to-r from-brand-600 to-amber-500 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition">
            إنشاء الحساب
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          عندك حساب؟{" "}
          <Link to="/login" className="text-brand-500 font-bold hover:underline">
            سجل دخول
          </Link>
        </p>
      </div>
    </div>
  );
}
