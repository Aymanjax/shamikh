import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { changeUserPassword } from "../services/authService";
import { Link } from "react-router-dom";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState({ companyName: "", phone: "" });
  const [prices, setPrices] = useState({
    iron4x8: 12, iron10x10: 22, tile: 0.95, decor: 5,
    besh: 1.5, sharshef: 4, nathrayat: 150
  });
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
      if (snap.exists()) {
        const d = snap.data();
        setProfile({ companyName: d.companyName || "", phone: d.phone || "" });
        if (d.prices) setPrices(d.prices);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    await setDoc(doc(db, "users", user.uid, "profile", "main"), {
      companyName: profile.companyName,
      phone: profile.phone,
      email: user.email,
      prices,
    }, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPwMsg("");
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg("كلمة المرور الجديدة غير متطابقة");
    if (pwForm.newPw.length < 6) return setPwMsg("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    try {
      await changeUserPassword(pwForm.old, pwForm.newPw);
      setPwMsg("success");
      setPwForm({ old: "", newPw: "", confirm: "" });
    } catch (err) {
      setPwMsg(err.message);
    }
  };

  const handlePriceChange = (key, val) => setPrices((f) => ({ ...f, [key]: Number(val) }));

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">الإعدادات</h1>
        <p className="text-sm text-slate-400">الملف الشخصي وأسعار المواد الافتراضية</p>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-user text-brand-500"></i> الملف الشخصي</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold">اسم الشركة / المعلم</label>
            <input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold">رقم الهاتف</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} dir="ltr"
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-slate-400 font-bold">البريد الإلكتروني</label>
            <input value={user.email} disabled
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-slate-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-key text-amber-500"></i> تغيير كلمة السر</h3>
        {pwMsg === "success" ? (
          <div className="bg-emerald-500/10 text-emerald-400 text-sm p-3 rounded-xl">تم تغيير كلمة السر بنجاح</div>
        ) : pwMsg ? (
          <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl break-words">{pwMsg}</div>
        ) : null}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold">كلمة السر الحالية</label>
            <input type="password" value={pwForm.old} onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">كلمة السر الجديدة</label>
              <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold">تأكيد كلمة السر</label>
              <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
            </div>
          </div>
          <button onClick={handleChangePassword}
            className="bg-amber-600 hover:bg-amber-700 py-2.5 rounded-xl font-bold text-sm transition">
            تغيير كلمة السر
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-tags text-emerald-500"></i> أسعار المواد الافتراضية</h3>
        <p className="text-xs text-slate-400">هذه الأسعار تستخدم في الحاسبة والفواتير كقيم افتراضية</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "iron4x8", label: "حديد 4×8 (تيوب)" },
            { key: "iron10x10", label: "حديد 10×10 (تيوب)" },
            { key: "tile", label: "القرميد (حبة)" },
            { key: "decor", label: "الديكور (م²)" },
            { key: "besh", label: "البيش (وحدة)" },
            { key: "sharshef", label: "الشراشف (م)" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">{label}</label>
              <input type="number" value={prices[key]} onChange={(e) => handlePriceChange(key, e.target.value)} step="0.5"
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
            </div>
          ))}
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] text-slate-400 font-bold">نثريات ومصاريف إضافية (د.أ)</label>
            <input type="number" value={prices.nathrayat} onChange={(e) => handlePriceChange("nathrayat", e.target.value)} step="10"
              className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-white outline-none focus:border-brand-500" />
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-shield-halved text-red-500"></i> حسابي</h3>
        <p className="text-xs text-slate-400">نوع الحساب: {user.providerData?.[0]?.providerId === "password" ? "بريد إلكتروني وكلمة سر" : "Google"}</p>
        <p className="text-xs text-slate-400">آخر دخول: {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString("ar-JO") : "-"}</p>
      </div>

      <button onClick={handleSave}
        className="w-full bg-gradient-to-r from-brand-600 to-amber-500 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition">
        {saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
      </button>
    </div>
  );
}
