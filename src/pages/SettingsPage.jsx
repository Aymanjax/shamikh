import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { changeUserPassword, updateProfileDisplayName } from "../services/authService";
import { getProgramConfig } from "../services/adminService";

const PLAN_LABELS = { trial: "تجريبي", premium: "مميز", lifetime: "مدى الحياة" };
const PLAN_COLORS = { trial: "text-amber-600 bg-amber-50 border-amber-200", premium: "text-emerald-600 bg-emerald-50 border-emerald-200", lifetime: "text-purple-600 bg-purple-50 border-purple-200" };

const DEFAULT_EXTRA_ITEMS = [
  { name: "زيت حار", unit: "جلن" }, { name: "فرنيش", unit: "جلن" },
  { name: "رول دهان", unit: "حبة" }, { name: "فرش", unit: "حبة" },
  { name: "مسامير فرد", unit: "كغم" }, { name: "مسامير فرد بولاد", unit: "كغم" },
  { name: "مسامير 4سم", unit: "كغم" }, { name: "مسامير بولاد", unit: "كغم" },
  { name: "مبروم حديد", unit: "ربطة" }, { name: "فيبر قص حديد", unit: "حبة" },
  { name: "اسلاك لحام", unit: "كغم" }, { name: "اسمنت", unit: "كيس" },
  { name: "بودرة", unit: "كيس" }, { name: "روف جارد", unit: "5ك" },
];

const TABS = [
  { key: "profile", icon: "fa-user", label: "الملف الشخصي" },
  { key: "security", icon: "fa-lock", label: "الأمان" },
  { key: "prices", icon: "fa-tags", label: "الأسعار" },
  { key: "extra", icon: "fa-cubes", label: "مواد إضافية" },
];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: "bg-emerald-600", error: "bg-red-600" };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${colors[type] || "bg-gray-800"} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-fade-in`}>
      <i className={`fa-solid ${type === "success" ? "fa-check-circle" : "fa-circle-exclamation"}`}></i>
      {msg}
    </div>
  );
}

function getPasswordStrength(pw) {
  if (!pw) return { label: "", width: "0%", color: "bg-gray-200" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "ضعيفة", width: "25%", color: "bg-red-500" };
  if (score <= 2) return { label: "متوسطة", width: "50%", color: "bg-amber-500" };
  if (score <= 3) return { label: "جيدة", width: "75%", color: "bg-emerald-500" };
  return { label: "قوية جداً", width: "100%", color: "bg-emerald-600" };
}

const PRICE_FIELDS = [
  { key: "iron4x8", label: "حديد 4×8 (تيوب)" },
  { key: "iron10x10", label: "حديد 10×10 (تيوب)" },
  { key: "tile", label: "القرميد (حبة)" },
  { key: "decor", label: "الديكور (م²)" },
  { key: "besh", label: "البيش (وحدة)" },
  { key: "sharshef", label: "الشراشف (م)" },
  { key: "tileStarts", label: "بداية قرميد (حبة)" },
  { key: "tarpaulin", label: "مشمع (رول)" },
  { key: "zafta", label: "زفتة (رول)" },
  { key: "latiSheets", label: "الواح لاتي (لوح)" },
  { key: "woodBases", label: "أسس خشب (قطعة)" },
  { key: "tarabeesh", label: "طرابيش (حبة)" },
];

export default function SettingsPage() {
  const { user, setCompanyName } = useAuthStore();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({ displayName: "", companyName: "", phone: "" });
  const [prices, setPrices] = useState({ iron4x8: 12, iron10x10: 22, tile: 0.95, decor: 5, besh: 1.5, sharshef: 4, nathrayat: 150, tileStarts: 0, tarpaulin: 0, zafta: 0, latiSheets: 0, woodBases: 0, tarabeesh: 0 });
  const [pwForm, setPwForm] = useState({ old: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [toast, setToast] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [projectsCount, setProjectsCount] = useState(0);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
      if (snap.exists()) {
        const d = snap.data();
        setProfile({ displayName: d.displayName || user?.displayName || "", companyName: d.companyName || "", phone: d.phone || "" });
        if (d.prices) setPrices((prev) => ({ ...prev, ...d.prices }));
        setSubscription(d.subscription || null);
      }
      const prog = await getProgramConfig();
      const adminExtras = prog?.extraItems || [];
      if (snap.exists() && snap.data().extraItems) {
        setProfile((prev) => ({ ...prev, extraItems: snap.data().extraItems }));
      } else if (adminExtras.length > 0) {
        setProfile((prev) => ({ ...prev, extraItems: adminExtras }));
      } else {
        setProfile((prev) => ({ ...prev, extraItems: DEFAULT_EXTRA_ITEMS }));
      }
      const pSnap = await getDocs(collection(db, "users", user.uid, "projects"));
      setProjectsCount(pSnap.docs.length);
    })();
  }, [user]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handleSave = async () => {
    await setDoc(doc(db, "users", user.uid, "profile", "main"), {
      displayName: profile.displayName, companyName: profile.companyName, phone: profile.phone, email: user.email,
      prices, extraItems: profile.extraItems || [],
    }, { merge: true });
    if (profile.displayName) await updateProfileDisplayName(profile.displayName);
    setCompanyName(profile.companyName);
    showToast("تم حفظ الإعدادات بنجاح");
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
  const planColor = PLAN_COLORS[sub.plan] || "text-gray-600 bg-gray-50 border-gray-200";

  if (!user) return null;

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-ink flex items-center gap-2 mb-4"><i className="fa-solid fa-user text-brand-600"></i> الملف الشخصي</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">اسم العرض</label>
            <input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">اسم الشركة / المعلم</label>
            <input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">رقم الهاتف</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} dir="ltr"
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">البريد الإلكتروني</label>
            <input value={user.email} disabled
              className="w-full bg-gray-100 border border-line rounded-xl py-2.5 px-4 text-ink-muted outline-none cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-ink flex items-center gap-2 mb-4"><i className="fa-solid fa-shield-halved text-amber-600"></i> الحساب والاشتراك</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-xl p-4 text-center border ${planColor}`}>
            <p className="text-[10px] font-bold text-ink-muted">الاشتراك</p>
            <p className={`text-lg font-black mt-1 ${isExpired ? "text-red-600" : ""}`}>{planLabel}</p>
          </div>
          <div className="bg-surface-subtle rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-ink-muted">عدد المشاريع</p>
            <p className="text-lg font-black text-ink mt-1">{projectsCount}</p>
          </div>
          <div className="bg-surface-subtle rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-ink-muted">طريقة الدخول</p>
            <p className="text-lg font-black text-ink mt-1">
              {user.providerData?.[0]?.providerId === "password" ? "بريد + كلمة سر" : "Google"}
            </p>
          </div>
        </div>
        {subExpiry && (
          <p className="text-xs text-ink-muted text-center mt-3">
            تاريخ الانتهاء: {subExpiry.toLocaleDateString("ar-JO")}
            {isExpired && " (منتهي)"}
          </p>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-key text-red-600"></i> تغيير كلمة السر</h3>
      {pwMsg === "success" ? (
        <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl border border-emerald-200">تم تغيير كلمة السر بنجاح</div>
      ) : pwMsg ? (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200 break-words">{pwMsg}</div>
      ) : null}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-ink-muted">كلمة السر الحالية</label>
          <input type="password" value={pwForm.old} onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
            className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">كلمة السر الجديدة</label>
            <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-muted">تأكيد كلمة السر</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
          </div>
        </div>
        {pwForm.newPw && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${getPasswordStrength(pwForm.newPw).color}`} style={{ width: getPasswordStrength(pwForm.newPw).width }}></div>
          </div>
        )}
        <button onClick={handleChangePassword}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition w-full">
          تغيير كلمة السر
        </button>
      </div>
    </div>
  );

  const renderPrices = () => (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-tags text-brand-600"></i> أسعار المواد الافتراضية</h3>
      <p className="text-xs text-ink-muted">هذه الأسعار تستخدم في الحاسبة والفواتير كقيم افتراضية</p>
      <div className="grid grid-cols-2 gap-4">
        {PRICE_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <label className="text-[10px] font-bold text-ink-muted">{label}</label>
            <input type="number" value={prices[key] ?? 0} onChange={(e) => handlePriceChange(key, e.target.value)} step="0.5"
              className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 transition" />
          </div>
        ))}
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-ink-muted">نثريات ومصاريف إضافية (د.أ)</label>
          <input type="number" value={prices.nathrayat} onChange={(e) => handlePriceChange("nathrayat", e.target.value)} step="10"
            className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 transition" />
        </div>
      </div>
    </div>
  );

  const renderExtra = () => (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-ink flex items-center gap-2"><i className="fa-solid fa-cubes text-orange-600"></i> مواد إضافية</h3>
      <p className="text-xs text-ink-muted">هذه المواد تظهر تلقائياً في الحاسبة وفي الفواتير. يمكنك سحب وترتيب العناصر.</p>
      <div className="space-y-1">
        {(profile.extraItems || []).map((item, i) => (
          <div key={i} draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => {
              if (dragIdx === null || dragIdx === i) return;
              const arr = [...(profile.extraItems || [])];
              const [moved] = arr.splice(dragIdx, 1);
              arr.splice(i, 0, moved);
              setProfile({ ...profile, extraItems: arr });
              setDragIdx(null);
            }}
            onDragEnd={() => setDragIdx(null)}
            className={`flex items-center gap-2 p-2 rounded-xl transition ${dragIdx === i ? "opacity-40" : ""}`}>
            <span className="text-ink-muted cursor-grab text-xs"><i className="fa-solid fa-grip-lines"></i></span>
            <input placeholder="اسم المادة" value={item.name} onChange={(e) => {
              const arr = [...(profile.extraItems || [])];
              arr[i] = { ...arr[i], name: e.target.value };
              setProfile({ ...profile, extraItems: arr });
            }} className="flex-1 bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-brand-500 transition" />
            <input placeholder="وحدة" value={item.unit || ""} onChange={(e) => {
              const arr = [...(profile.extraItems || [])];
              arr[i] = { ...arr[i], unit: e.target.value };
              setProfile({ ...profile, extraItems: arr });
            }} className="w-20 bg-surface-input border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none focus:border-brand-500 transition text-center" />
            <button onClick={() => setProfile({ ...profile, extraItems: (profile.extraItems || []).filter((_, idx) => idx !== i) })}
              className="text-red-400 hover:text-red-600 text-xs p-1.5">
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => setProfile({ ...profile, extraItems: [...(profile.extraItems || []), { name: "", unit: "" }] })}
        className="w-full border border-dashed border-line rounded-xl py-3 text-xs text-ink-muted hover:text-ink hover:border-slate-300 transition flex items-center justify-center gap-1">
        <i className="fa-solid fa-plus"></i> إضافة مادة
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">الإعدادات</h1>
        <p className="text-sm text-ink-muted">الملف الشخصي وإعدادات البرنامج</p>
      </div>

      <div className="flex gap-1 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === t.key
                ? "bg-gradient-to-r from-brand-600 to-amber-500 text-white shadow-lg"
                : "bg-surface border border-line text-ink-muted hover:text-ink"
            }`}>
            <i className={`fa-solid ${t.icon}`}></i>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "profile" && renderProfile()}
      {tab === "security" && renderSecurity()}
      {tab === "prices" && renderPrices()}
      {tab === "extra" && renderExtra()}

      <button onClick={handleSave}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow-md transition mt-6">
        حفظ الإعدادات
      </button>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}