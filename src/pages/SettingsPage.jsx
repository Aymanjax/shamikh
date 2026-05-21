import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { changeUserPassword } from "../services/authService";

const PLAN_LABELS = {
  free: "مجاني",
  trial: "تجريبي",
  premium: "مميز",
  lifetime: "مدى الحياة",
};

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
  const [subscription, setSubscription] = useState(null);
  const [projectsCount, setProjectsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
      if (snap.exists()) {
        const d = snap.data();
        setProfile({ companyName: d.companyName || "", phone: d.phone || "" });
        if (d.prices) setPrices(d.prices);
        setSubscription(d.subscription || null);
      }
      const projSnap = await getDocs(collection(db, "users", user.uid, "projects"));
      setProjectsCount(projSnap.docs.length);
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
    useAuthStore.getState().setCompanyName(profile.companyName);
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

  const sub = subscription || {};
  const subExpiry = sub.expiresAt?.toDate?.();
  const isExpired = subExpiry && subExpiry < new Date();
  const planLabel = PLAN_LABELS[sub.plan] || "بدون اشتراك";

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink">الإعدادات</h1>
        <p className="text-sm text-ink-muted">الملف الشخصي وإعدادات البرنامج</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-user text-brand-600"></i> الملف الشخصي</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">اسم الشركة / المعلم</label>
            <input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">رقم الهاتف</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} dir="ltr"
              className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-bold text-ink-muted">البريد الإلكتروني</label>
            <input value={user.email} disabled
              className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2.5 px-4 text-ink-muted outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-shield-halved text-amber-600"></i> الحساب والاشتراك</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-alt rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-ink-muted">الاشتراك</p>
            <p className={`text-lg font-black mt-1 ${isExpired ? "text-red-600" : "text-emerald-600"}`}>{planLabel}</p>
          </div>
          <div className="bg-surface-alt rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-ink-muted">عدد المشاريع</p>
            <p className="text-lg font-black text-ink mt-1">{projectsCount}</p>
          </div>
          <div className="bg-surface-alt rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-ink-muted">طريقة الدخول</p>
            <p className="text-lg font-black text-ink mt-1">
              {user.providerData?.[0]?.providerId === "password" ? "بريد + كلمة سر" : "Google"}
            </p>
          </div>
        </div>
        {subExpiry && (
          <p className="text-xs text-ink-muted text-center">
            تاريخ الانتهاء: {subExpiry.toLocaleDateString("ar-JO")}
            {isExpired && " (منتهي)"}
          </p>
        )}
        <p className="text-xs text-ink-muted text-center">
          آخر دخول: {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString("ar-JO") : "-"}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-key text-red-600"></i> تغيير كلمة السر</h3>
        {pwMsg === "success" ? (
          <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl border border-emerald-200">تم تغيير كلمة السر بنجاح</div>
        ) : pwMsg ? (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200 break-words">{pwMsg}</div>
        ) : null}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">كلمة السر الحالية</label>
            <input type="password" value={pwForm.old} onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
              className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">كلمة السر الجديدة</label>
              <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">تأكيد كلمة السر</label>
              <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
            </div>
          </div>
          <button onClick={handleChangePassword}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition">
            تغيير كلمة السر
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-tags text-emerald-600"></i> أسعار المواد الافتراضية</h3>
        <p className="text-xs text-ink-muted">هذه الأسعار تستخدم في الحاسبة والفواتير كقيم افتراضية</p>
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
              <label className="text-[10px] font-bold text-ink-muted">{label}</label>
              <input type="number" value={prices[key]} onChange={(e) => handlePriceChange(key, e.target.value)} step="0.5"
                className="w-full bg-surface-input border border-gray-200 rounded-xl py-2 px-3 text-ink outline-none focus:border-brand-500 transition" />
            </div>
          ))}
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-ink-muted">نثريات ومصاريف إضافية (د.أ)</label>
            <input type="number" value={prices.nathrayat} onChange={(e) => handlePriceChange("nathrayat", e.target.value)} step="10"
              className="w-full bg-surface-input border border-gray-200 rounded-xl py-2 px-3 text-ink outline-none focus:border-brand-500 transition" />
          </div>
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow-md transition">
        {saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
      </button>
    </div>
  );
}
