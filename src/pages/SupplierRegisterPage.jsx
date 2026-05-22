import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSupplier } from "../services/supplierService";

const ACTIVITIES = [
  "قرميد", "حديد", "خشب", "عزل", "مواد إضافية", "دهانات", "سباكة", "كهرباء", "أخرى",
];

export default function SupplierRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", businessName: "", phone: "", area: "", activity: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await createSupplier(form.email, form.password, form);
      setDone(true);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("البريد الإلكتروني مستخدم مسبقاً");
      else if (err.code === "auth/weak-password") setError("كلمة السر ضعيفة (6 أحرف على الأقل)");
      else setError(err.message);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
        <div className="bg-surface border border-line rounded-3xl p-8 max-w-sm w-full shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-check text-emerald-600 text-3xl"></i>
          </div>
          <h2 className="text-xl font-black text-ink mb-2">تم التسجيل بنجاح</h2>
          <p className="text-sm text-ink-muted mb-6">بانتظار موافقة الإدارة. سيتم تفعيل حسابك قريباً.</p>
          <Link to="/supplier/login"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition">
            دخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/30">
            <i className="fa-solid fa-store text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-black text-ink">تسجيل مورد جديد</h1>
          <p className="text-xs text-ink-muted mt-1">أضف متجرك إلى دليل الموردين</p>
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">اسم المتجر <span className="text-red-500">*</span></label>
              <input value={form.businessName} onChange={set("businessName")} required
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={set("email")} dir="ltr" required
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">كلمة السر <span className="text-red-500">*</span></label>
                <input type="password" value={form.password} onChange={set("password")} required minLength={6}
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">رقم الجوال</label>
                <input type="tel" value={form.phone} onChange={set("phone")} dir="ltr"
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-muted">المنطقة</label>
                <input value={form.area} onChange={set("area")}
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 transition" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">النشاط</label>
              <select value={form.activity} onChange={set("activity")}
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 transition">
                <option value="">اختر النشاط</option>
                {ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">وصف (اختياري)</label>
              <textarea value={form.description} onChange={set("description")} rows={2}
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-emerald-500 transition resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition">
              {loading ? "جاري..." : "تسجيل"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-ink-muted">
            لديك حساب؟ <Link to="/supplier/login" className="text-emerald-600 font-bold hover:text-emerald-700">دخول</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
