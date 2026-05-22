import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function WorkersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [newWorker, setNewWorker] = useState({ name: "", dailyWage: 15, phone: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const wSnap = await getDocs(collection(db, "users", user.uid, "workers"));
      const wList = wSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      wList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const aSnap = await getDocs(collection(db, "users", user.uid, "attendance"));
      const aMap = {};
      aSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.date?.startsWith(curMonth)) {
          if (!aMap[data.workerId]) aMap[data.workerId] = {};
          aMap[data.workerId][data.date] = data;
        }
      });
      setAttendance(aMap);

      const advSnap = await getDocs(collection(db, "users", user.uid, "advances"));
      const advMap = {};
      advSnap.docs.forEach((d) => {
        const data = d.data();
        if (!advMap[data.workerId]) advMap[data.workerId] = [];
        advMap[data.workerId].push(data.amount);
      });
      setAdvances(advMap);

      const paySnap = await getDocs(collection(db, "users", user.uid, "payments"));
      const payMap = {};
      paySnap.docs.forEach((d) => {
        const data = d.data();
        if (!payMap[data.workerId]) payMap[data.workerId] = [];
        payMap[data.workerId].push(data.amount);
      });
      setPayments(payMap);

      setWorkers(wList);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addWorker = async () => {
    if (!newWorker.name.trim()) return;
    const ref = doc(collection(db, "users", user.uid, "workers"));
    const data = { name: newWorker.name.trim(), dailyWage: Number(newWorker.dailyWage), phone: newWorker.phone, createdAt: Timestamp.now(), settled: false };
    await setDoc(ref, data);
    setWorkers((prev) => [...prev, { id: ref.id, ...data }].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
    setNewWorker({ name: "", dailyWage: 15, phone: "" });
    setShowAdd(false);
  };

  const deleteWorker = async (id) => {
    if (!confirm("حذف هذا العامل نهائياً؟")) return;
    await deleteDoc(doc(db, "users", user.uid, "workers", id));
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  };

  const workerStats = (w) => {
    const a = attendance[w.id] || {};
    let workDays = 0;
    for (const key in a) { if (a[key]) workDays++; }
    const totalAdv = advances[w.id]?.reduce((s, v) => s + v, 0) || 0;
    const totalPay = payments[w.id]?.reduce((s, v) => s + v, 0) || 0;
    const salary = workDays * w.dailyWage;
    return { workDays, totalAdv, totalPay, salary, totalReceived: totalAdv + totalPay, net: salary - totalAdv - totalPay };
  };

  const totalWorkers = workers.length;
  const totalDaysWorked = workers.reduce((s, w) => s + workerStats(w).workDays, 0);
  const totalSalaries = workers.reduce((s, w) => s + workerStats(w).salary, 0);
  const totalAdvancesSum = workers.reduce((s, w) => s + workerStats(w).totalAdv, 0);
  const totalPaymentsSum = workers.reduce((s, w) => s + workerStats(w).totalPay, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <i className="fa-solid fa-users-gear text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black">العمال والرواتب</h1>
            <p className="text-sm text-ink-muted">إدارة العمال، الحضور، السلف، والدفعات</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-brand-600 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-brand-700 transition flex items-center gap-2 shadow-lg shadow-brand-600/20">
          <i className="fa-solid fa-plus"></i> إضافة عامل
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-ink-muted font-bold">العمال</p>
          <p className="text-2xl font-black text-ink">{totalWorkers}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-ink-muted font-bold">أيام العمل</p>
          <p className="text-2xl font-black text-ink">{totalDaysWorked}</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-ink-muted font-bold">الرواتب</p>
          <p className="text-2xl font-black text-emerald-600">{totalSalaries} د.أ</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-ink-muted font-bold">السلف</p>
          <p className="text-2xl font-black text-red-500">{totalAdvancesSum} د.أ</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-ink-muted font-bold">الدفعات</p>
          <p className="text-2xl font-black text-emerald-600">{totalPaymentsSum} د.أ</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><i className="fa-solid fa-spinner fa-spin text-2xl text-brand-600"></i></div>
      ) : workers.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center shadow-sm">
          <i className="fa-solid fa-users-slash text-4xl text-ink-muted mb-3"></i>
          <p className="text-ink-muted font-bold">لا يوجد عمال بعد</p>
          <p className="text-xs text-ink-muted mt-1">أضف عامل جديد للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((w) => {
            const s = workerStats(w);
            return (
              <div key={w.id} className={`bg-surface border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${w.settled ? "border-emerald-200" : "border-line"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-amber-500 flex items-center justify-center text-white text-lg font-black shadow-md">
                    {(w.name || "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-ink truncate">{w.name}</h3>
                      {w.settled && <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">مسكت</span>}
                    </div>
                    <p className="text-xs text-ink-muted">{w.dailyWage} د.أ/يوم{w.phone ? ` • ${w.phone}` : ""}</p>
                  </div>
                  <div className="text-left flex items-center gap-1">
                    <button onClick={() => navigate(`/workers/${w.id}`)}
                      className="text-xs bg-surface border border-line text-ink py-1.5 px-3 rounded-lg font-bold hover:border-amber-500 transition">
                      <i className="fa-solid fa-eye ml-1"></i> عرض
                    </button>
                    <button onClick={() => deleteWorker(w.id)}
                      className="text-xs text-red-500 hover:text-red-600 py-1.5 px-2 rounded-lg transition" title="حذف">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-line">
                  <div className="text-center">
                    <p className="text-sm font-black text-ink">{s.workDays}</p>
                    <p className="text-[10px] text-ink-muted">أيام</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-emerald-600">{s.salary}</p>
                    <p className="text-[10px] text-ink-muted">راتب</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-black ${s.totalAdv > 0 ? "text-red-500" : "text-ink-muted"}`}>{s.totalAdv}</p>
                    <p className="text-[10px] text-ink-muted">سلف</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-black ${s.net > 0 ? "text-amber-600" : s.net < 0 ? "text-red-500" : "text-ink-muted"}`}>{s.net}</p>
                    <p className="text-[10px] text-ink-muted">رصيد</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-ink mb-4">إضافة عامل جديد</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">الاسم</label>
                <input value={newWorker.name} onChange={(e) => setNewWorker((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">الأجر اليومي (د.أ)</label>
                <input type="number" value={newWorker.dailyWage} onChange={(e) => setNewWorker((f) => ({ ...f, dailyWage: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">رقم الهاتف (اختياري)</label>
                <input value={newWorker.phone} onChange={(e) => setNewWorker((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addWorker} className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 transition">إضافة</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-surface-subtle text-ink-muted py-2.5 rounded-xl font-bold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
