import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, Timestamp } from "firebase/firestore";

const MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];

export default function WorkersPage() {
  const { user } = useAuthStore();
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [newWorker, setNewWorker] = useState({ name: "", dailyWage: 15 });
  const [showAdd, setShowAdd] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const workerSnap = await getDocs(collection(db, "users", user.uid, "workers"));
    const list = workerSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setWorkers(list);

    const attSnap = await getDocs(collection(db, "users", user.uid, "attendance"));
    const attMap = {};
    attSnap.docs.forEach((d) => {
      attMap[d.id] = d.data();
    });
    setAttendance(attMap);
    setLoading(false);
  };

  const addWorker = async () => {
    if (!newWorker.name.trim()) return;
    const id = "w_" + Date.now();
    const data = { name: newWorker.name.trim(), dailyWage: Number(newWorker.dailyWage), createdAt: Timestamp.now() };
    await setDoc(doc(db, "users", user.uid, "workers", id), data);
    setWorkers([...workers, { id, ...data }]);
    setNewWorker({ name: "", dailyWage: 15 });
    setShowAdd(false);
  };

  const deleteWorker = async (id) => {
    if (!confirm("حذف هذا العامل؟")) return;
    await deleteDoc(doc(db, "users", user.uid, "workers", id));
    setWorkers(workers.filter((w) => w.id !== id));
  };

  const toggleAttendance = async (workerId, date) => {
    const attId = `${workerId}_${date}`;
    const existing = attendance[attId];
    if (existing) {
      await deleteDoc(doc(db, "users", user.uid, "attendance", attId));
      const a = { ...attendance };
      delete a[attId];
      setAttendance(a);
    } else {
      const data = { workerId, date, timestamp: Timestamp.now() };
      await setDoc(doc(db, "users", user.uid, "attendance", attId), data);
      setAttendance({ ...attendance, [attId]: data });
    }
  };

  const getWorkerAttendance = (workerId) => {
    return Object.values(attendance).filter((a) => a.workerId === workerId);
  };

  const getWorkerAttendanceInMonth = (workerId, month, year) => {
    return Object.values(attendance).filter((a) => {
      if (a.workerId !== workerId) return false;
      const d = new Date(a.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("ar-JO", { weekday: "short", day: "numeric" });
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDates = (month, year) => {
    const days = getDaysInMonth(month, year);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().split("T")[0];
    });
  };

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const monthDates = getMonthDates(viewMonth, viewYear);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">شؤون العمال والرواتب</h1>
          <p className="text-sm text-ink-muted">تسجيل الحضور اليومي وحساب الأجور</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-2 text-sm">
          <i className="fa-solid fa-plus"></i> إضافة عامل
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-ink text-sm">إضافة عامل جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">اسم العامل</label>
              <input value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink-muted">الأجر اليومي (د.أ)</label>
              <input type="number" value={newWorker.dailyWage} onChange={(e) => setNewWorker({ ...newWorker, dailyWage: Number(e.target.value) })}
                className="w-full bg-surface-input border border-gray-200 rounded-xl py-2.5 px-4 text-ink outline-none focus:border-brand-500 transition" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={addWorker}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm">
                حفظ
              </button>
              <button onClick={() => setShowAdd(false)}
                className="bg-gray-100 hover:bg-gray-200 text-ink-muted py-2.5 px-5 rounded-xl transition text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
              <i className="fa-solid fa-calendar-day text-brand-600"></i> تسجيل الحضور اليومي
            </h3>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-bold text-ink-muted">اختر التاريخ</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-surface-input border border-gray-200 rounded-xl py-2 px-4 text-ink outline-none focus:border-brand-500 transition" />
            </div>
            {workers.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">لا يوجد عمال. أضف عامل أولاً.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workers.map((w) => {
                  const attId = `${w.id}_${selectedDate}`;
                  const present = !!attendance[attId];
                  return (
                    <div key={w.id} className="flex items-center justify-between bg-surface-alt border border-gray-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{w.name}</p>
                        <p className="text-[10px] text-ink-muted">{w.dailyWage} د.أ/يوم</p>
                      </div>
                      <button onClick={() => toggleAttendance(w.id, selectedDate)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          present
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                        }`}>
                        {present ? "حاضر ✓" : "تسجيل"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink flex items-center gap-2">
                <i className="fa-solid fa-chart-simple text-emerald-600"></i> كشف الرواتب الشهري
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }}
                  className="bg-surface-input border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-ink hover:bg-gray-200 transition">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
                <span className="text-sm font-bold text-ink w-28 text-center">{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }}
                  className="bg-surface-input border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-ink hover:bg-gray-200 transition">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-alt border-b border-gray-200">
                    <th className="text-right py-2.5 px-3 text-xs font-bold text-ink-muted">العامل</th>
                    <th className="text-center py-2.5 px-3 text-xs font-bold text-ink-muted">أيام العمل</th>
                    <th className="text-center py-2.5 px-3 text-xs font-bold text-ink-muted">أيام الغياب</th>
                    <th className="text-center py-2.5 px-3 text-xs font-bold text-ink-muted">الأجر اليومي</th>
                    <th className="text-center py-2.5 px-3 text-xs font-bold text-ink-muted">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => {
                    const monthAtt = getWorkerAttendanceInMonth(w.id, viewMonth, viewYear);
                    const workDays = monthAtt.length;
                    const absentDays = daysInMonth - workDays;
                    const total = workDays * w.dailyWage;
                    return (
                      <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 font-bold text-ink">{w.name}</td>
                        <td className="py-3 px-3 text-center text-emerald-700 font-bold">{workDays}</td>
                        <td className="py-3 px-3 text-center text-red-600">{absentDays}</td>
                        <td className="py-3 px-3 text-center text-ink">{w.dailyWage} د.أ</td>
                        <td className="py-3 px-3 text-center font-black text-ink">{total.toFixed(1)} د.أ</td>
                      </tr>
                    );
                  })}
                  {workers.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-ink-muted text-sm">لا يوجد عمال</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
