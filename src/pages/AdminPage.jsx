import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuthStore } from "../store/authStore";
import { getProgramConfig, saveProgramConfig, getDefaultConfig } from "../services/adminService";
import { getAllSuppliers, updateSupplier, getSupplierProducts, getSupplierRatings } from "../services/supplierService";

const PLAN_OPTIONS = [
  { value: "trial", label: "تجريبي" },
  { value: "basic", label: "أساسي" },
  { value: "premium", label: "مميز" },
  { value: "lifetime", label: "مدى الحياة" },
];
const PLAN_COLORS = {
  trial: "text-amber-700 bg-amber-50 border-amber-200",
  basic: "text-emerald-700 bg-emerald-50 border-emerald-200",
  premium: "text-amber-700 bg-amber-50 border-amber-200",
  lifetime: "text-purple-700 bg-purple-50 border-purple-200",
};
const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "النشطاء" },
  { key: "expired", label: "منتهي" },
  { key: "banned", label: "محظورين" },
  { key: "admins", label: "المديرين" },
];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  const c = type === "success" ? "bg-emerald-600" : "bg-red-600";
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${c} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2`}>
      <i className={`fa-solid ${type === "success" ? "fa-check-circle" : "fa-circle-exclamation"}`}></i>
      {msg}
    </div>
  );
}

function UserAvatar({ name }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const colors = ["bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500", "bg-cyan-500"];
  const c = colors[name ? name.charCodeAt(0) % colors.length : 0];
  return (
    <div className={`w-8 h-8 rounded-full ${c} text-white flex items-center justify-center text-xs font-black shrink-0`}>
      {initial}
    </div>
  );
}

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [supProducts, setSupProducts] = useState({});
  const [ratingsData, setRatingsData] = useState({});

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const list = await getAllSuppliers();
      setSuppliers(list);
      const pmap = {};
      for (const s of list) {
        try { pmap[s.uid] = await getSupplierProducts(s.uid); } catch { pmap[s.uid] = []; }
        try {
          const r = await getSupplierRatings(s.uid);
          const avg = r.length > 0 ? r.reduce((a, b) => a + (b.rating || 0), 0) / r.length : 0;
          ratingsData[s.uid] = { avg, count: r.length };
        } catch {}
      }
      setSupProducts(pmap);
      setRatingsData({ ...ratingsData });
    } catch {}
    setLoading(false);
  };

  const toggleApprove = async (s, approved) => {
    await updateSupplier(s.uid, { approved });
    setSuppliers((prev) => prev.map((x) => (x.uid === s.uid ? { ...x, approved } : x)));
    showToast(approved ? "تمت الموافقة" : "تم إلغاء الموافقة");
  };

  const toggleFeatured = async (s, featured) => {
    await updateSupplier(s.uid, { featured });
    setSuppliers((prev) => prev.map((x) => (x.uid === s.uid ? { ...x, featured } : x)));
    showToast(featured ? "تم التمييز" : "إلغاء التمييز");
  };

  const toggleBan = async (s, banned) => {
    await updateSupplier(s.uid, { banned });
    setSuppliers((prev) => prev.map((x) => (x.uid === s.uid ? { ...x, banned } : x)));
    showToast(banned ? "تم الحظر" : "تم رفع الحظر");
  };

  const [expandedProducts, setExpandedProducts] = useState(null);

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {loading ? (
        <div className="text-center py-8 text-ink-muted">
          <i className="fa-solid fa-spinner fa-spin text-xl mb-2"></i>
          <p className="text-sm">جاري التحميل...</p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-truck text-emerald-600"></i>
            <span className="font-bold text-ink">{suppliers.length}</span>
            <span className="text-sm text-ink-muted">مورد</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-muted border-b border-line text-[10px]">
                  <th className="text-right py-2 px-2">المتجر</th>
                  <th className="text-right py-2 px-2">النشاط</th>
                  <th className="text-center py-2 px-2">منتجات</th>
                  <th className="text-center py-2 px-2">تقييم</th>
                  <th className="text-center py-2 px-2">موافقة</th>
                  <th className="text-center py-2 px-2">تمييز</th>
                  <th className="text-center py-2 px-2">حظر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {suppliers.map((s) => (
                  <tr key={s.uid} className="hover:bg-surface-subtle transition">
                    <td className="py-2 px-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ink">{s.businessName || "-"}</span>
                        <span className="text-[9px] text-ink-muted">{s.email}</span>
                        {s.phone && <span className="text-[9px] text-ink-muted">{s.phone}</span>}
                        {s.area && <span className="text-[9px] text-ink-muted">{s.area}</span>}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-xs text-ink-muted">{s.activity || "-"}</td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => setExpandedProducts(expandedProducts === s.uid ? null : s.uid)}
                        className="text-xs font-bold text-ink hover:text-brand-600 transition">
                        {(supProducts[s.uid] || []).length}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-[10px] font-bold ${ratingsData[s.uid]?.count > 0 ? "text-amber-600" : "text-gray-400"}`}>
                        {ratingsData[s.uid]?.count > 0 ? `${ratingsData[s.uid].avg.toFixed(1)} ★` : "-"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => toggleApprove(s, !s.approved)}
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg transition ${s.approved ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>
                        {s.approved ? "مقبول" : "انتظار"}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => toggleFeatured(s, !s.featured)}
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg transition ${s.featured ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"}`}>
                        {s.featured ? "مميز" : "عادي"}
                      </button>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => toggleBan(s, !s.banned)}
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg transition ${s.banned ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"}`}>
                        {s.banned ? "محظور" : "فعال"}
                      </button>
                    </td>
                  </tr>
                ))}
                {expandedProducts && supProducts[expandedProducts] && supProducts[expandedProducts].length > 0 && (
                  <tr>
                    <td colSpan={7} className="py-3 px-2">
                      <div className="bg-surface-subtle rounded-xl p-3">
                        <p className="text-xs font-bold text-ink mb-2">منتجات المورد:</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="text-ink-muted border-b border-line">
                                <th className="text-right py-1 px-2">المنتج</th>
                                <th className="text-center py-1 px-2">السعر</th>
                                <th className="text-center py-1 px-2">الوحدة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {supProducts[expandedProducts].map((p) => (
                                <tr key={p.id}>
                                  <td className="py-1 px-2 font-bold text-ink">{p.name}</td>
                                  <td className="py-1 px-2 text-center">{p.price}</td>
                                  <td className="py-1 px-2 text-center text-ink-muted">{p.unit}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {suppliers.length === 0 && <p className="text-sm text-ink-muted py-6 text-center">لا يوجد موردين</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [subForm, setSubForm] = useState({ plan: "trial", expiryDays: 14 });
  const [orderDragIdx, setOrderDragIdx] = useState(null);
  const [extraDragIdx, setExtraDragIdx] = useState(null);

  const [subEdits, setSubEdits] = useState({});

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    getDoc(doc(db, "users", user.uid, "profile", "main")).then((s) => {
      if (s.exists()) setUserRole(s.data().role || "user");
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab]);

  const initSubEdit = (u) => {
    if (subEdits[u.uid]) return;
    setSubEdits((prev) => ({
      ...prev, [u.uid]: {
        plan: u.subscription?.plan || "trial",
        days: u.subscription?.plan === "trial" ? 14 : u.subscription?.plan === "basic" ? 30 : u.subscription?.plan === "premium" ? 365 : 0,
        expiryDate: u.subExpiry ? u.subExpiry.toISOString().split("T")[0] : "",
        mode: "days",
      }
    }));
  };

  const loadUsers = async () => {
    setLoading(true); setError("");
    try {
      const s = await getDocs(collection(db, "users-public"));
      const list = s.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const enriched = await Promise.all(list.map(async (u) => {
        try {
          const prof = await getDoc(doc(db, "users", u.uid, "profile", "main"));
          const data = prof.exists() ? prof.data() : {};
          const pSnap = await getDocs(collection(db, "users", u.uid, "projects"));
          const sub = data.subscription || {};
          const exp = sub.expiresAt?.toDate?.();
          return { ...u, role: data.role || "user", subscription: sub, banned: data.banned === true, projectsCount: pSnap.docs.length, subExpiry: exp, isExpired: exp && exp < new Date() };
        } catch { return { ...u, projectsCount: 0 }; }
      }));
      setUsers(enriched);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "program") {
      setLoading(true); setError("");
      getProgramConfig().then((data) => {
        setConfig(data || getDefaultConfig()); setLoading(false);
      }).catch((e) => { setError(e.message); setConfig(getDefaultConfig()); setLoading(false); });
    }
  }, [tab]);

  const handleSaveConfig = async () => {
    await saveProgramConfig(config);
    setSaved(true);
    showToast("تم حفظ إعدادات البرنامج");
    setTimeout(() => setSaved(false), 2000);
  };

  const setRole = async (uid, role) => {
    try {
      await setDoc(doc(db, "users", uid, "profile", "main"), { role }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      showToast("تم تغيير الصلاحية");
    } catch (e) { showToast(e.message, "error"); }
  };

  const toggleBan = async (uid, currentlyBanned) => {
    try {
      await setDoc(doc(db, "users", uid, "profile", "main"), { banned: !currentlyBanned }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, banned: !currentlyBanned } : u)));
      showToast(currentlyBanned ? "تم رفع الحظر" : "تم الحظر");
    } catch (e) { showToast(e.message, "error"); }
  };

  const setSubscription = async (uid, plan, customDays) => {
    try {
      const now = new Date();
      const days = customDays || (plan === "trial" ? 14 : plan === "basic" ? 30 : plan === "premium" ? 365 : 0);
      let expiresAt = null;
      if (plan === "trial" || plan === "basic" || plan === "premium") expiresAt = new Date(now.getTime() + days * 86400000);
      const sub = { plan, expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null };
      await setDoc(doc(db, "users", uid, "profile", "main"), { subscription: sub }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, subscription: sub, subExpiry: expiresAt, isExpired: expiresAt && expiresAt < now } : u)));
      showToast("تم تحديث الاشتراك");
    } catch (e) { showToast("خطأ في تحديث الاشتراك: تأكد من قواعد Firebase", "error"); }
  };

  const setSubscriptionCustomDate = async (uid, plan, expiryDate) => {
    try {
      const expiresAt = expiryDate ? new Date(expiryDate) : null;
      const sub = { plan, expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null };
      await setDoc(doc(db, "users", uid, "profile", "main"), { subscription: sub }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, subscription: sub, subExpiry: expiresAt, isExpired: expiresAt && expiresAt < new Date() } : u)));
      showToast("تم تحديث الاشتراك");
    } catch (e) { showToast("خطأ في تحديث الاشتراك: تأكد من قواعد Firebase", "error"); }
  };

  const applySubscriptionToAll = async (plan) => {
    const nonAdmins = users.filter((u) => u.role !== "admin");
    if (!confirm(`تطبيق "${PLAN_OPTIONS.find(p => p.value === plan)?.label}" على ${nonAdmins.length} مستخدم؟`)) return;
    setLoading(true);
    for (const u of nonAdmins) await setSubscription(u.uid, plan, subForm.expiryDays);
    setLoading(false);
    showToast(`تم تطبيق الاشتراك على ${nonAdmins.length} مستخدم`);
  };

  const claimAdmin = async () => {
    await setDoc(doc(db, "users", user.uid, "profile", "main"), { role: "admin" }, { merge: true });
    setUserRole("admin"); useAuthStore.getState().refreshProfile(user.uid); loadUsers();
  };

  if (!user) return null;

  const stats = {
    total: users.length,
    active: users.filter((u) => u.subscription?.plan && !u.isExpired && !u.banned).length,
    expired: users.filter((u) => u.isExpired).length,
    banned: users.filter((u) => u.banned).length,
    totalProjects: users.reduce((s, u) => s + (u.projectsCount || 0), 0),
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "active") return u.subscription?.plan && !u.isExpired && !u.banned;
    if (filter === "expired") return u.isExpired;
    if (filter === "banned") return u.banned;
    if (filter === "admins") return u.role === "admin";
    return true;
  }).filter((u) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (u.displayName?.toLowerCase() || "").includes(q) || (u.email?.toLowerCase() || "").includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-3">
            <i className="fa-solid fa-shield-halved text-red-600"></i> لوحة التحكم
          </h1>
          <p className="text-sm text-ink-muted">صلاحيتك: <span className={`font-bold ${userRole === "admin" ? "text-brand-600" : "text-ink-muted"}`}>{userRole === "admin" ? "مدير" : "مستخدم"}</span></p>
        </div>
        {userRole !== "admin" && (
          <button onClick={async () => { if (confirm("تأكيد تعيين حسابك كمدير؟")) await claimAdmin(); }}
            className="bg-gradient-to-l from-amber-600 to-amber-500 py-2.5 px-5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition text-white flex items-center gap-2">
            <i className="fa-solid fa-crown"></i> تعيين كمدير
          </button>
        )}
      </div>

      {userRole === "admin" && users.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "إجمالي المستخدمين", value: stats.total, icon: "fa-users", color: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "النشطاء", value: stats.active, icon: "fa-check-circle", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "منتهي الاشتراك", value: stats.expired, icon: "fa-clock", color: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "محظورين", value: stats.banned, icon: "fa-ban", color: "text-red-600 bg-red-50 border-red-200" },
            { label: "إجمالي المشاريع", value: stats.totalProjects, icon: "fa-folder", color: "text-purple-600 bg-purple-50 border-purple-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 text-center border ${s.color}`}>
              <i className={`fa-solid ${s.icon} text-lg`}></i>
              <p className="text-lg font-black mt-0.5">{s.value}</p>
              <p className="text-[9px] font-bold opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-line pb-2 overflow-x-auto">
        {["users", "suppliers", "program"].map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${tab === s ? "bg-brand-600 text-white shadow-lg" : "text-ink-muted hover:text-ink hover:bg-surface-subtle"}`}>
            <i className={`fa-solid ${s === "users" ? "fa-users" : s === "suppliers" ? "fa-truck" : "fa-sliders"}`}></i>
            {s === "users" ? "المستخدمين" : s === "suppliers" ? "الموردين" : "إعدادات البرنامج"}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-4 rounded-2xl">{error}</div>}

      {loading && (
        <div className="text-center py-8 text-ink-muted">
          <i className="fa-solid fa-spinner fa-spin text-xl mb-2"></i>
          <p className="text-sm">جاري التحميل...</p>
        </div>
      )}

      {tab === "users" && !loading && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-users text-brand-600"></i>
                <span className="font-bold text-ink">{users.length}</span>
                <span className="text-sm text-ink-muted">مستخدم</span>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs"></i>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث..."
                    className="w-full bg-surface-input border border-line rounded-xl py-2 pr-8 pl-3 text-xs text-ink outline-none focus:border-brand-500 transition" />
                </div>
                <button onClick={loadUsers} className="text-ink-muted hover:text-ink p-2"><i className="fa-solid fa-rotate"></i></button>
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap mb-4">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filter === f.key ? "bg-brand-600 text-white" : "bg-surface-subtle text-ink-muted hover:text-ink"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-muted border-b border-line text-[10px]">
                    <th className="text-right py-2 px-2">المستخدم</th>
                    <th className="text-right py-2 px-2">البريد</th>
                    <th className="text-center py-2 px-2">مشاريع</th>
                    <th className="text-center py-2 px-2">الصلاحية</th>
                    <th className="text-center py-2 px-2">الاشتراك</th>
                    <th className="text-center py-2 px-2">الحظر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredUsers.map((u) => {
                    const planLabel = PLAN_OPTIONS.find((p) => p.value === u.subscription?.plan)?.label;
                    const planColor = PLAN_COLORS[u.subscription?.plan] || "text-slate-600 bg-slate-50 border-slate-200";
                    const remainingDays = u.subExpiry ? Math.max(0, Math.ceil((u.subExpiry - new Date()) / 86400000)) : 0;
                    const totalDays = u.subscription?.plan === "trial" ? 14 : u.subscription?.plan === "premium" ? 365 : 0;
                    const pct = totalDays > 0 ? Math.min(100, Math.round((remainingDays / totalDays) * 100)) : 0;
                    return (
                      <tr key={u.uid} className="hover:bg-surface-subtle transition">
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={u.displayName} />
                            <span className="text-xs font-bold text-ink">{u.displayName || "-"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-xs text-ink-muted dir-ltr">{u.email}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-xs font-bold text-ink">{u.projectsCount || 0}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <select value={u.role || "user"} onChange={(e) => setRole(u.uid, e.target.value)}
                            className="bg-surface border border-line rounded-lg py-1 px-1.5 text-[10px] text-ink outline-none cursor-pointer">
                            <option value="user">مستخدم</option>
                            <option value="admin">مدير</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2 text-center" onClick={() => initSubEdit(u)}>
                          {subEdits[u.uid] ? (
                            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <select value={subEdits[u.uid].plan} onChange={(e) => setSubEdits((prev) => ({ ...prev, [u.uid]: { ...prev[u.uid], plan: e.target.value } }))}
                                className="bg-surface border border-line rounded-lg py-1 px-1.5 text-[10px] text-ink outline-none cursor-pointer w-full">
                                {PLAN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                              </select>
                              {subEdits[u.uid].plan !== "lifetime" && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setSubEdits((prev) => ({ ...prev, [u.uid]: { ...prev[u.uid], mode: "days" } }))}
                                    className={`text-[9px] px-1.5 py-0.5 rounded ${subEdits[u.uid].mode === "days" ? "bg-brand-600 text-white" : "text-ink-muted"}`}>أيام</button>
                                  <button onClick={() => setSubEdits((prev) => ({ ...prev, [u.uid]: { ...prev[u.uid], mode: "date" } }))}
                                    className={`text-[9px] px-1.5 py-0.5 rounded ${subEdits[u.uid].mode === "date" ? "bg-brand-600 text-white" : "text-ink-muted"}`}>تاريخ</button>
                                </div>
                              )}
                              {subEdits[u.uid].plan !== "lifetime" && subEdits[u.uid].mode === "days" && (
                                <input type="number" value={subEdits[u.uid].days} onChange={(e) => setSubEdits((prev) => ({ ...prev, [u.uid]: { ...prev[u.uid], days: Number(e.target.value) } }))} min="1"
                                  className="bg-surface border border-line rounded-lg py-1 px-1.5 text-[10px] text-ink outline-none w-full text-center" placeholder="أيام" />
                              )}
                              {subEdits[u.uid].plan !== "lifetime" && subEdits[u.uid].mode === "date" && (
                                <input type="date" value={subEdits[u.uid].expiryDate} onChange={(e) => setSubEdits((prev) => ({ ...prev, [u.uid]: { ...prev[u.uid], expiryDate: e.target.value } }))}
                                  className="bg-surface border border-line rounded-lg py-1 px-1.5 text-[10px] text-ink outline-none w-full" />
                              )}
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  const ed = subEdits[u.uid];
                                  if (ed.plan === "lifetime") setSubscriptionCustomDate(u.uid, ed.plan, null);
                                  else if (ed.mode === "days") setSubscription(u.uid, ed.plan, ed.days);
                                  else setSubscriptionCustomDate(u.uid, ed.plan, ed.expiryDate);
                                }}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1 rounded-lg text-[9px] font-bold transition">
                                  <i className="fa-solid fa-check ml-0.5"></i> حفظ
                                </button>
                                <button onClick={() => setSubEdits((prev) => { const c = { ...prev }; delete c[u.uid]; return c; })}
                                  className="text-red-400 hover:text-red-600 text-[9px] px-1.5"><i className="fa-solid fa-xmark"></i></button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 cursor-pointer" title="اضغط للتعديل">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block border ${planColor}`}>{planLabel || "بدون اشتراك"}</span>
                              {u.subscription?.plan !== "lifetime" && u.subExpiry && (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${u.isExpired ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${u.isExpired ? 0 : pct}%` }}></div>
                                  </div>
                                  <span className={`text-[9px] ${u.isExpired ? "text-red-500" : "text-emerald-600"}`}>{u.isExpired ? "منتهي" : `${remainingDays}d`}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button onClick={() => toggleBan(u.uid, u.banned)}
                            className={`text-[10px] font-bold py-1 px-2.5 rounded-lg transition ${u.banned ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>
                            <i className={`fa-solid ${u.banned ? "fa-check" : "fa-ban"} ml-1`}></i>
                            {u.banned ? "رفع" : "حظر"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <p className="text-sm text-ink-muted py-6 text-center">لا يوجد مستخدمين</p>}
            </div>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <h4 className="font-bold text-ink flex items-center gap-2 mb-4">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i> إدارة جماعية للاشتراكات
            </h4>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-ink-muted font-bold">نوع الاشتراك</label>
                <select value={subForm.plan} onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                  className="bg-surface border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none cursor-pointer">
                  {PLAN_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-ink-muted font-bold">عدد الأيام (للمؤقت)</label>
                <input type="number" value={subForm.expiryDays} onChange={(e) => setSubForm({ ...subForm, expiryDays: Number(e.target.value) })}
                  className="bg-surface border border-line rounded-xl py-2 px-3 text-xs text-ink outline-none w-20 text-center" />
              </div>
              <button onClick={() => applySubscriptionToAll(subForm.plan)}
                className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-5 rounded-xl text-xs font-bold transition">
                تطبيق على الجميع ({users.filter(u => u.role !== "admin").length})
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "suppliers" && !loading && <SuppliersTab />}

      {tab === "program" && config && !loading && (
        <div className="space-y-5">
          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <i className="fa-solid fa-table-cells text-emerald-500"></i> كتالوج القرميد
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-muted border-b border-line text-[10px]">
                    <th className="text-right py-2 px-2">#</th>
                    <th className="text-right py-2 px-2">الاسم</th>
                    <th className="text-right py-2 px-2">المنشأ</th>
                    <th className="text-center py-2 px-2">عدد (حبة/م²)</th>
                    <th className="text-left py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {config.tileCatalog.map((tile, i) => (
                    <tr key={i} className="hover:bg-surface-subtle transition">
                      <td className="py-2 px-2 text-xs text-ink-muted">{i + 1}</td>
                      <td className="py-2 px-2">
                        <input value={tile.name} onChange={(e) => { const c = { ...config }; c.tileCatalog[i] = { ...c.tileCatalog[i], name: e.target.value }; setConfig(c); }}
                          className="w-full bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-emerald-500 transition" />
                      </td>
                      <td className="py-2 px-2">
                        <input value={tile.origin} onChange={(e) => { const c = { ...config }; c.tileCatalog[i] = { ...c.tileCatalog[i], origin: e.target.value }; setConfig(c); }}
                          className="w-24 bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-emerald-500 transition" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="number" value={tile.count} onChange={(e) => { const c = { ...config }; c.tileCatalog[i] = { ...c.tileCatalog[i], count: Number(e.target.value) }; setConfig(c); }} step="0.5"
                          className="w-16 bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-emerald-500 transition text-center" />
                      </td>
                      <td className="py-2 px-2 text-left">
                        <button onClick={() => { setConfig({ ...config, tileCatalog: config.tileCatalog.filter((_, idx) => idx !== i) }); }}
                          className="text-red-400 hover:text-red-600 text-xs p-1"><i className="fa-solid fa-trash-can"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => { setConfig({ ...config, tileCatalog: [...config.tileCatalog, { name: "", origin: "", count: 11 }] }); }}
              className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة نوع قرميد
            </button>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <i className="fa-solid fa-ruler text-blue-500"></i> أطوال الحديد المتوفرة (م)
            </h3>
            <div className="flex flex-wrap gap-2">
              {config.marketLengths.map((len, i) => (
                <div key={i} className="flex items-center gap-1 bg-surface border border-line rounded-xl py-1.5 px-3 hover:border-amber-300 transition">
                  <input type="number" value={len} onChange={(e) => {
                    const c = { ...config };
                    c.marketLengths[i] = Number(e.target.value);
                    setConfig(c);
                  }} step="0.1" className="w-14 bg-transparent text-xs text-ink outline-none text-center font-bold" />
                  <span className="text-[9px] text-ink-muted">م</span>
                  <button onClick={() => { setConfig({ ...config, marketLengths: config.marketLengths.filter((_, idx) => idx !== i) }); }}
                    className="text-red-400 hover:text-red-600 text-xs mr-1"><i className="fa-solid fa-xmark"></i></button>
                </div>
              ))}
              <button onClick={() => { setConfig({ ...config, marketLengths: [...config.marketLengths, 6] }); }}
                className="bg-surface border-2 border-dashed border-line rounded-xl py-1.5 px-3 text-xs text-ink-muted hover:text-ink hover:border-amber-300 transition flex items-center gap-1">
                <i className="fa-solid fa-plus"></i> إضافة
              </button>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <i className="fa-solid fa-clipboard-list text-amber-500"></i> أصناف الطلبية
            </h3>
            <p className="text-xs text-ink-muted mb-4">اسحب وأفلت لترتيب الأصناف — تظهر في نموذج الطلب بنفس الترتيب</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-muted border-b border-line text-[10px]">
                    <th className="text-right py-2 px-2 w-6"></th>
                    <th className="text-right py-2 px-2">#</th>
                    <th className="text-right py-2 px-2">الاسم</th>
                    <th className="text-right py-2 px-2">الوحدة</th>
                    <th className="text-left py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {config.orderItems.map((item, i) => (
                    <tr key={item.id} draggable
                      onDragStart={() => setOrderDragIdx(i)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => {
                        if (orderDragIdx === null || orderDragIdx === i) return;
                        const c = [...config.orderItems];
                        const [m] = c.splice(orderDragIdx, 1);
                        c.splice(i, 0, m);
                        setConfig({ ...config, orderItems: c });
                        setOrderDragIdx(null);
                      }}
                      onDragEnd={() => setOrderDragIdx(null)}
                      className={`hover:bg-surface-subtle transition ${orderDragIdx === i ? "opacity-40" : ""}`}>
                      <td className="py-2 px-2 text-ink-muted cursor-grab text-xs"><i className="fa-solid fa-grip-lines"></i></td>
                      <td className="py-2 px-2 text-xs text-ink-muted">{i + 1}</td>
                      <td className="py-2 px-2">
                        <input value={item.name} onChange={(e) => {
                          const c = { ...config };
                          c.orderItems[i] = { ...c.orderItems[i], name: e.target.value };
                          setConfig(c);
                        }} className="w-full bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-amber-500 transition" />
                      </td>
                      <td className="py-2 px-2">
                        <input value={item.unit} onChange={(e) => {
                          const c = { ...config };
                          c.orderItems[i] = { ...c.orderItems[i], unit: e.target.value };
                          setConfig(c);
                        }} className="w-16 bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-amber-500 transition text-center" />
                      </td>
                      <td className="py-2 px-2 text-left">
                        <button onClick={() => { setConfig({ ...config, orderItems: config.orderItems.filter((_, idx) => idx !== i) }); }}
                          className="text-red-400 hover:text-red-600 text-xs p-1"><i className="fa-solid fa-trash-can"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => { setConfig({ ...config, orderItems: [...config.orderItems, { id: "new" + Date.now(), name: "", unit: "" }] }); }}
              className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة صنف
            </button>
          </div>

          <div className="bg-surface border border-line rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-ink flex items-center gap-2 mb-4">
              <i className="fa-solid fa-cubes text-purple-500"></i> مواد إضافية للطلب
            </h3>
            <p className="text-xs text-ink-muted mb-4">مواد استهلاكية إضافية تظهر في نموذج الطلب بعد الأصناف الأساسية</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-muted border-b border-line text-[10px]">
                    <th className="text-right py-2 px-2 w-6"></th>
                    <th className="text-right py-2 px-2">#</th>
                    <th className="text-right py-2 px-2">الاسم</th>
                    <th className="text-right py-2 px-2">الوحدة</th>
                    <th className="text-left py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {config.extraItems.map((item, i) => (
                    <tr key={i} draggable
                      onDragStart={() => setExtraDragIdx(i)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => {
                        if (extraDragIdx === null || extraDragIdx === i) return;
                        const c = [...config.extraItems];
                        const [m] = c.splice(extraDragIdx, 1);
                        c.splice(i, 0, m);
                        setConfig({ ...config, extraItems: c });
                        setExtraDragIdx(null);
                      }}
                      onDragEnd={() => setExtraDragIdx(null)}
                      className={`hover:bg-surface-subtle transition ${extraDragIdx === i ? "opacity-40" : ""}`}>
                      <td className="py-2 px-2 text-ink-muted cursor-grab text-xs"><i className="fa-solid fa-grip-lines"></i></td>
                      <td className="py-2 px-2 text-xs text-ink-muted">{i + 1}</td>
                      <td className="py-2 px-2">
                        <input value={item.name} onChange={(e) => {
                          const c = { ...config };
                          c.extraItems[i] = { ...c.extraItems[i], name: e.target.value };
                          setConfig(c);
                        }} className="w-full bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-purple-500 transition" />
                      </td>
                      <td className="py-2 px-2">
                        <input value={item.unit} onChange={(e) => {
                          const c = { ...config };
                          c.extraItems[i] = { ...c.extraItems[i], unit: e.target.value };
                          setConfig(c);
                        }} className="w-16 bg-surface-input border border-line rounded-lg py-1.5 px-2 text-xs text-ink outline-none focus:border-purple-500 transition text-center" />
                      </td>
                      <td className="py-2 px-2 text-left">
                        <button onClick={() => { setConfig({ ...config, extraItems: config.extraItems.filter((_, idx) => idx !== i) }); }}
                          className="text-red-400 hover:text-red-600 text-xs p-1"><i className="fa-solid fa-trash-can"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => { setConfig({ ...config, extraItems: [...config.extraItems, { name: "", unit: "" }] }); }}
              className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة مادة
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSaveConfig}
              className="bg-gradient-to-l from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white py-2.5 px-6 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center gap-2">
              <i className="fa-solid fa-floppy-disk"></i> {saved ? "✓ تم الحفظ" : "حفظ إعدادات البرنامج"}
            </button>
            <button onClick={() => { if (confirm("استعادة الإعدادات الافتراضية؟")) setConfig(getDefaultConfig()); }}
              className="bg-surface-subtle hover:bg-surface-input py-2.5 px-4 rounded-xl font-bold text-xs text-ink-muted transition">
              استعادة الافتراضية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
