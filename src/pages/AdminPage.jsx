import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuthStore } from "../store/authStore";
import { getProgramConfig, saveProgramConfig, getDefaultConfig } from "../services/adminService";

const PLAN_OPTIONS = [
  { value: "free", label: "مجاني" },
  { value: "trial", label: "تجريبي" },
  { value: "premium", label: "مميز" },
  { value: "lifetime", label: "مدى الحياة" },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subForm, setSubForm] = useState({ uid: "", plan: "free", expiryDays: 14 });

  useEffect(() => {
    getDoc(doc(db, "users", user.uid, "profile", "main")).then((s) => {
      if (s.exists()) setUserRole(s.data().role || "user");
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tab === "users") {
      loadUsers();
    }
  }, [tab]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const s = await getDocs(collection(db, "users-public"));
      const list = s.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const enriched = await Promise.all(list.map(async (u) => {
        try {
          const prof = await getDoc(doc(db, "users", u.uid, "profile", "main"));
          const data = prof.exists() ? prof.data() : {};
          const projSnap = await getDocs(collection(db, "users", u.uid, "projects"));
          return {
            ...u,
            role: data.role || "user",
            subscription: data.subscription || null,
            banned: data.banned === true,
            projectsCount: projSnap.docs.length,
          };
        } catch { return { ...u, projectsCount: 0 }; }
      }));
      setUsers(enriched);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "program") {
      setLoading(true);
      setError("");
      getProgramConfig().then((data) => {
        setConfig(data || getDefaultConfig());
        setLoading(false);
      }).catch((e) => {
        setError(e.message);
        setConfig(getDefaultConfig());
        setLoading(false);
      });
    }
  }, [tab]);

  const handleSaveConfig = async () => {
    await saveProgramConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTile = () => {
    setConfig({ ...config, tileCatalog: [...config.tileCatalog, { name: "", origin: "", count: 11 }] });
  };

  const removeTile = (i) => {
    setConfig({ ...config, tileCatalog: config.tileCatalog.filter((_, idx) => idx !== i) });
  };

  const addMarketLength = () => {
    setConfig({ ...config, marketLengths: [...config.marketLengths, 6] });
  };

  const removeMarketLength = (i) => {
    setConfig({ ...config, marketLengths: config.marketLengths.filter((_, idx) => idx !== i) });
  };

  const setRole = async (uid, role) => {
    try {
      await setDoc(doc(db, "users", uid, "profile", "main"), { role }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    } catch (e) {
      alert("خطأ في تغيير الصلاحية: " + e.message);
    }
  };

  const toggleBan = async (uid, currentlyBanned) => {
    try {
      await setDoc(doc(db, "users", uid, "profile", "main"), { banned: !currentlyBanned }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, banned: !currentlyBanned } : u)));
    } catch (e) {
      alert("خطأ في الحظر: " + e.message);
    }
  };

  const setSubscription = async (uid, plan, customDays) => {
    try {
      const now = new Date();
      let expiresAt = null;
      const days = customDays || (plan === "trial" ? 14 : plan === "premium" ? 365 : 0);
      if (plan === "trial" || plan === "premium") {
        expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      }
      const sub = { plan, expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null };
      await setDoc(doc(db, "users", uid, "profile", "main"), { subscription: sub }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, subscription: sub } : u)));
    } catch (e) {
      alert("خطأ في تحديث الاشتراك: " + e.message + "\n\nتأكد من تحديث قواعد Firestore Database في Firebase Console.");
    }
  };

  const applySubscriptionToAll = async (plan) => {
    if (!confirm(`تطبيق الاشتراك "${PLAN_OPTIONS.find(p => p.value === plan)?.label}" على جميع المستخدمين؟`)) return;
    setLoading(true);
    for (const u of users) {
      await setSubscription(u.uid, plan, subForm.expiryDays);
    }
    setLoading(false);
  };

  const claimAdmin = async () => {
    await setDoc(doc(db, "users", user.uid, "profile", "main"), { role: "admin" }, { merge: true });
    setUserRole("admin");
    useAuthStore.getState().refreshProfile(user.uid);
    loadUsers();
  };

  if (!user) return null;

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (u.displayName?.toLowerCase() || "").includes(q) || (u.email?.toLowerCase() || "").includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-3 text-ink">
          <i className="fa-solid fa-shield-halved text-red-600"></i>
          لوحة التحكم
        </h1>
        <p className="text-sm text-slate-400">
          صلاحيتك: <span className={`font-bold ${userRole === "admin" ? "text-amber-400" : "text-slate-400"}`}>
            {userRole === "admin" ? "مدير" : "مستخدم"}
          </span>
        </p>
      </div>

      {userRole !== "admin" && (
        <div className="bg-gradient-to-r from-amber-600/10 to-red-600/10 border border-amber-500/20 rounded-3xl p-6 text-center space-y-3">
          <i className="fa-solid fa-crown text-4xl text-amber-500"></i>
          <h3 className="font-bold text-lg">لست مديراً بعد</h3>
          <p className="text-sm text-slate-400">اضغط الزر عشان تصير مدير وتتحكم بكل شيء في البرنامج</p>
          <button onClick={async () => {
            if (confirm("تأكيد تعيين حسابك كمدير للبرنامج؟")) {
              await claimAdmin();
            }
          }}
            className="bg-gradient-to-r from-amber-600 to-amber-500 py-3 px-8 rounded-xl font-bold shadow-lg hover:shadow-xl transition inline-flex items-center gap-2">
            <i className="fa-solid fa-crown"></i>
            تعيين كمدير
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {["users", "program"].map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              tab === s ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>
            {s === "users" ? "المستخدمين" : "إعدادات البرنامج"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-2xl break-words">{error}</div>
      )}

      {loading && (
        <div className="text-center py-8 text-slate-400">
          <i className="fa-solid fa-spinner fa-spin text-xl mb-2"></i>
          <p className="text-sm">جاري التحميل...</p>
        </div>
      )}

      {tab === "users" && !loading && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="font-bold flex items-center gap-2">
                <i className="fa-solid fa-users text-brand-500"></i> جميع المستخدمين ({users.length})
              </h3>
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو البريد..."
                className="bg-[#1e293b] border border-white/10 rounded-xl py-2 px-4 text-xs text-white outline-none focus:border-brand-500 w-full md:w-64" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-white/5 text-xs">
                    <th className="text-right py-2 px-2">الاسم</th>
                    <th className="text-right py-2 px-2">البريد</th>
                    <th className="text-right py-2 px-2">مشاريع</th>
                    <th className="text-right py-2 px-2">الصلاحية</th>
                    <th className="text-right py-2 px-2">الاشتراك</th>
                    <th className="text-right py-2 px-2">الحظر</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const sub = u.subscription || {};
                    const subExpiry = sub.expiresAt?.toDate?.();
                    const isExpired = subExpiry && subExpiry < new Date();
                    return (
                      <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-2 text-xs">{u.displayName || "-"}</td>
                        <td className="py-2 px-2 text-xs text-slate-400 dir-ltr">{u.email}</td>
                        <td className="py-2 px-2 text-xs text-center">{u.projectsCount || 0}</td>
                        <td className="py-2 px-2">
                          <select value={u.role || "user"} onChange={(e) => setRole(u.uid, e.target.value)}
                            className="bg-[#1e293b] border border-white/10 rounded-lg py-1 px-1.5 text-[10px] text-white outline-none cursor-pointer">
                            <option value="user">مستخدم</option>
                            <option value="admin">مدير</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select value={sub.plan || "free"} onChange={(e) => setSubscription(u.uid, e.target.value, subForm.expiryDays)}
                            className="bg-[#1e293b] border border-white/10 rounded-lg py-1 px-1.5 text-[10px] text-white outline-none cursor-pointer">
                            {PLAN_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          {subExpiry && (
                            <span className={`text-[10px] block ${isExpired ? "text-red-400" : "text-emerald-400"}`}>
                              {isExpired ? "منتهي" : subExpiry.toLocaleDateString("ar-JO")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <button onClick={() => toggleBan(u.uid, u.banned)}
                            className={`text-[10px] font-bold py-1 px-2 rounded-lg transition whitespace-nowrap ${
                              u.banned
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            }`}>
                            {u.banned ? "رفع الحظر" : "حظر"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <p className="text-sm text-slate-500 py-4 text-center">لا يوجد مستخدمين</p>}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i> إدارة جماعية للاشتراكات
            </h4>
            <p className="text-xs text-slate-400">تطبيق اشتراك على جميع المستخدمين دفعة واحدة</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">نوع الاشتراك</label>
                <select value={subForm.plan} onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                  className="bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none cursor-pointer">
                  {PLAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">عدد الأيام (للمؤقت)</label>
                <input type="number" value={subForm.expiryDays} onChange={(e) => setSubForm({ ...subForm, expiryDays: Number(e.target.value) })}
                  className="bg-[#1e293b] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none w-20 text-center" />
              </div>
              <button onClick={() => applySubscriptionToAll(subForm.plan)}
                className="bg-amber-600 hover:bg-amber-700 py-2 px-5 rounded-xl text-xs font-bold transition">
                تطبيق على الجميع
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "program" && config && !loading && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <i className="fa-solid fa-table-cells text-emerald-500"></i> كتالوج القرميد
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-white/5 text-xs">
                    <th className="text-right py-2 px-2">#</th>
                    <th className="text-right py-2 px-2">الاسم</th>
                    <th className="text-right py-2 px-2">المنشأ</th>
                    <th className="text-right py-2 px-2">عدد (حبة/م²)</th>
                    <th className="text-left py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {config.tileCatalog.map((tile, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-1.5 px-2 text-xs text-slate-500">{i + 1}</td>
                      <td className="py-1.5 px-2">
                        <input value={tile.name} onChange={(e) => { const c = { ...config }; c.tileCatalog[i].name = e.target.value; setConfig(c); }}
                          className="w-full bg-[#1e293b] border border-white/10 rounded-lg py-1 px-2 text-xs text-white outline-none focus:border-brand-500" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={tile.origin} onChange={(e) => { const c = { ...config }; c.tileCatalog[i].origin = e.target.value; setConfig(c); }}
                          className="w-24 bg-[#1e293b] border border-white/10 rounded-lg py-1 px-2 text-xs text-white outline-none focus:border-brand-500" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" value={tile.count} onChange={(e) => { const c = { ...config }; c.tileCatalog[i].count = Number(e.target.value); setConfig(c); }} step="0.5"
                          className="w-16 bg-[#1e293b] border border-white/10 rounded-lg py-1 px-2 text-xs text-white outline-none focus:border-brand-500" />
                      </td>
                      <td className="py-1.5 px-2 text-left">
                        <button onClick={() => removeTile(i)} className="text-red-400 hover:text-red-300 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addTile} className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة نوع قرميد
            </button>
          </div>

          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <i className="fa-solid fa-ruler text-blue-500"></i> أطوال الحديد المتوفرة (م)
            </h3>
            <div className="flex flex-wrap gap-2">
              {config.marketLengths.map((len, i) => (
                <div key={i} className="flex items-center gap-1 bg-[#1e293b] border border-white/10 rounded-xl py-1.5 px-3">
                  <input type="number" value={len} onChange={(e) => { const c = { ...config }; c.marketLengths[i] = Number(e.target.value); setConfig(c); }} step="0.1"
                    className="w-14 bg-transparent text-xs text-white outline-none text-center" />
                  <button onClick={() => removeMarketLength(i)} className="text-red-400 hover:text-red-300 text-xs"><i className="fa-solid fa-xmark"></i></button>
                </div>
              ))}
              <button onClick={addMarketLength} className="bg-[#1e293b] border border-dashed border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-400 hover:text-white">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <i className="fa-solid fa-clipboard-list text-amber-500"></i> أصناف الطلبية
            </h3>
            <p className="text-xs text-slate-400">تعديل أسماء ووحدات الأصناف التي تظهر في صفحة الطلبية</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-white/5 text-xs">
                    <th className="text-right py-2 px-2">#</th>
                    <th className="text-right py-2 px-2">المعرف</th>
                    <th className="text-right py-2 px-2">الاسم</th>
                    <th className="text-right py-2 px-2">الوحدة</th>
                    <th className="text-left py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {config.orderItems.map((item, i) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="py-1.5 px-2 text-xs text-slate-500">{i + 1}</td>
                      <td className="py-1.5 px-2 text-xs text-slate-500 font-mono">{item.id}</td>
                      <td className="py-1.5 px-2">
                        <input value={item.name} onChange={(e) => { const c = { ...config }; c.orderItems[i].name = e.target.value; setConfig(c); }}
                          className="w-full bg-[#1e293b] border border-white/10 rounded-lg py-1 px-2 text-xs text-white outline-none focus:border-brand-500" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={item.unit} onChange={(e) => { const c = { ...config }; c.orderItems[i].unit = e.target.value; setConfig(c); }}
                          className="w-16 bg-[#1e293b] border border-white/10 rounded-lg py-1 px-2 text-xs text-white outline-none focus:border-brand-500" />
                      </td>
                      <td className="py-1.5 px-2 text-left">
                        <button onClick={() => { const c = { ...config }; c.orderItems = c.orderItems.filter((_, idx) => idx !== i); setConfig(c); }}
                          className="text-red-400 hover:text-red-300 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => { const c = { ...config }; c.orderItems = [...c.orderItems, { id: "new" + Date.now(), name: "", unit: "" }]; setConfig(c); }}
              className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة صنف
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSaveConfig}
              className="bg-gradient-to-r from-brand-600 to-amber-500 py-2.5 px-6 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition">
              {saved ? "✓ تم الحفظ" : "حفظ إعدادات البرنامج"}
            </button>
            <button onClick={() => { if (confirm("استعادة الإعدادات الافتراضية؟")) setConfig(getDefaultConfig()); }}
              className="bg-white/5 hover:bg-white/10 py-2.5 px-4 rounded-xl font-bold text-xs text-slate-400 transition">
              استعادة الافتراضية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
