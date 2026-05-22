import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

const MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];

export default function WorkerDetailPage() {
  const { user } = useAuthStore();
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0], note: "" });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", dailyWage: 0, phone: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user || !workerId) return;
    loadWorkerData();
  }, [user, workerId, viewMonth, viewYear]);

  const loadWorkerData = async () => {
    setLoading(true);
    try {
      const wSnap = await getDoc(doc(db, "users", user.uid, "workers", workerId));
      if (!wSnap.exists()) { navigate("/workers"); return; }
      const wData = { id: wSnap.id, ...wSnap.data() };
      setWorker(wData);
      setEditForm({ name: wData.name || "", dailyWage: wData.dailyWage || 0, phone: wData.phone || "" });

      const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
      const aSnap = await getDocs(collection(db, "users", user.uid, "attendance"));
      const aMap = {};
      aSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.workerId === workerId && data.date?.startsWith(prefix)) aMap[data.date] = data;
      });
      setAttendance(aMap);

      const snapA = await getDocs(collection(db, "users", user.uid, "advances"));
      setAdvances(snapA.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => a.workerId === workerId)
        .sort((a, b) => (a.date || "").localeCompare(b.date || "")));

      const snapP = await getDocs(collection(db, "users", user.uid, "payments"));
      setPayments(snapP.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.workerId === workerId)
        .sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    } catch (e) { console.error(e); setError(e.message); }
    setLoading(false);
  };

  const toggleAttendance = async (date) => {
    if (date > today) return;
    const docId = `${workerId}_${date}`;
    const ref = doc(db, "users", user.uid, "attendance", docId);
    if (attendance[date]) {
      await deleteDoc(ref);
      setAttendance((prev) => { const n = { ...prev }; delete n[date]; return n; });
    } else {
      await setDoc(ref, { workerId, date, present: true });
      setAttendance((prev) => ({ ...prev, [date]: { workerId, date, present: true } }));
    }
  };

  const addAdvance = async () => {
    if (!advanceForm.amount || Number(advanceForm.amount) <= 0) return;
    const ref = doc(collection(db, "users", user.uid, "advances"));
    const data = { workerId, amount: Number(advanceForm.amount), date: advanceForm.date, note: advanceForm.note || "" };
    await setDoc(ref, data);
    setAdvances((prev) => [...prev, { id: ref.id, ...data }].sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    setShowAdvanceModal(false);
    setAdvanceForm({ amount: "", date: today, note: "" });
  };

  const deleteAdvance = async (advId) => {
    if (!confirm("حذف هذه السلفة؟")) return;
    await deleteDoc(doc(db, "users", user.uid, "advances", advId));
    setAdvances((prev) => prev.filter((a) => a.id !== advId));
  };

  const addPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return;
    const ref = doc(collection(db, "users", user.uid, "payments"));
    const data = { workerId, amount: Number(paymentForm.amount), date: paymentForm.date, note: paymentForm.note || "" };
    await setDoc(ref, data);
    setPayments((prev) => [...prev, { id: ref.id, ...data }].sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    setShowPaymentModal(false);
    setPaymentForm({ amount: "", date: today, note: "" });
  };

  const deletePayment = async (payId) => {
    if (!confirm("حذف هذه الدفعة؟")) return;
    await deleteDoc(doc(db, "users", user.uid, "payments", payId));
    setPayments((prev) => prev.filter((p) => p.id !== payId));
  };

  const settleAccount = async () => {
    if (!confirm(`تأكيد إسكات حساب العامل ${worker?.name}؟\nسيتم تصفير الرصيد وتحديد الحساب كمسكت.`)) return;
    await setDoc(doc(db, "users", user.uid, "workers", workerId), { settled: true, settledAt: Timestamp.now() }, { merge: true });
    setWorker((prev) => ({ ...prev, settled: true }));
  };

  const unSettleAccount = async () => {
    await setDoc(doc(db, "users", user.uid, "workers", workerId), { settled: false, settledAt: null }, { merge: true });
    setWorker((prev) => ({ ...prev, settled: false }));
  };

  const saveWorker = async () => {
    if (!editForm.name.trim()) return;
    await setDoc(doc(db, "users", user.uid, "workers", workerId), { name: editForm.name.trim(), dailyWage: Number(editForm.dailyWage), phone: editForm.phone }, { merge: true });
    setWorker((prev) => ({ ...prev, name: editForm.name.trim(), dailyWage: Number(editForm.dailyWage), phone: editForm.phone }));
    setEditing(false);
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  let workDays = 0, absentDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (ds > today) continue;
    if (attendance[ds]) workDays++;
    else absentDays++;
  }

  const totalAdvances = advances.reduce((s, a) => s + a.amount, 0);
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalReceived = totalAdvances + totalPayments;
  const grossSalary = workDays * (worker?.dailyWage || 0);
  const netBalance = grossSalary - totalReceived;

  if (loading) {
    return <div className="flex justify-center py-12"><i className="fa-solid fa-spinner fa-spin text-2xl text-brand-600"></i></div>;
  }
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/workers")} className="flex items-center gap-2 text-ink-muted hover:text-ink text-sm font-bold mb-6">
          <i className="fa-solid fa-arrow-right"></i> العودة للعمال
        </button>
        <div className="bg-surface border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <i className="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-3"></i>
          <p className="font-bold text-red-700 mb-1">حدث خطأ</p>
          <p className="text-sm text-ink-muted mb-4">{error}</p>
          <button onClick={() => { setError(""); setLoading(true); loadWorkerData(); }}
            className="bg-brand-600 text-white py-2 px-5 rounded-xl font-bold text-sm transition">إعادة المحاولة</button>
        </div>
      </div>
    );
  }
  if (!worker) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate("/workers")} className="flex items-center gap-2 text-ink-muted hover:text-ink text-sm font-bold">
        <i className="fa-solid fa-arrow-right"></i> العودة للعمال
      </button>

      <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {(worker.name || "?")[0]}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-lg py-1.5 px-3 text-sm text-ink outline-none focus:border-brand-500" />
                <div className="flex gap-2">
                  <input type="number" value={editForm.dailyWage} onChange={(e) => setEditForm((f) => ({ ...f, dailyWage: e.target.value }))}
                    className="w-24 bg-surface border border-line rounded-lg py-1.5 px-3 text-sm text-ink outline-none focus:border-brand-500" />
                  <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-36 bg-surface border border-line rounded-lg py-1.5 px-3 text-sm text-ink outline-none focus:border-brand-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveWorker} className="text-xs bg-brand-600 text-white py-1 px-3 rounded-lg font-bold">حفظ</button>
                  <button onClick={() => setEditing(false)} className="text-xs bg-surface-subtle text-ink-muted py-1 px-3 rounded-lg font-bold">إلغاء</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-ink">{worker.name}</h2>
                  {worker.settled && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold py-0.5 px-2 rounded-lg">مسكت</span>
                  )}
                </div>
                <p className="text-sm text-ink-muted">{worker.dailyWage} د.أ / يوم{worker.phone ? ` • ${worker.phone}` : ""}</p>
              </>
            )}
          </div>
          {!editing && (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-ink text-sm">
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
              <button onClick={async () => {
                if (confirm(`حذف العامل ${worker.name} نهائياً؟`)) {
                  await deleteDoc(doc(db, "users", user.uid, "workers", workerId));
                  navigate("/workers");
                }
              }} className="text-red-500 hover:text-red-600 text-sm">
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-ink-muted font-bold">أيام العمل</p>
          <p className="text-lg font-black text-ink">{workDays}</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-ink-muted font-bold">الأجر اليومي</p>
          <p className="text-lg font-black text-ink">{worker.dailyWage}</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-ink-muted font-bold">الإجمالي</p>
          <p className="text-lg font-black text-emerald-600">{grossSalary}</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-[10px] text-ink-muted font-bold">مسحوبات</p>
          <p className="text-lg font-black text-red-500">{totalReceived}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${netBalance >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
          <p className="text-[10px] font-bold">الرصيد</p>
          <p className={`text-lg font-black ${netBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>{netBalance}</p>
        </div>
      </div>

      {!worker.settled && netBalance <= 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-amber-800 text-sm">⚠ الحساب جاهز للإسكات</p>
            <p className="text-xs text-amber-600">الرصيد صفر أو سالب، يمكنك إسكات الحساب</p>
          </div>
          <button onClick={settleAccount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-xl font-bold text-sm transition">
            <i className="fa-solid fa-check-circle ml-1"></i> إسكات الحساب
          </button>
        </div>
      )}

      {worker.settled && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-emerald-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600"></i> الحساب مسكت
            </p>
            <p className="text-xs text-emerald-600">تمت تسوية الحساب بالكامل</p>
          </div>
          <button onClick={unSettleAccount}
            className="bg-surface-subtle hover:bg-surface-input text-ink-muted py-2 px-4 rounded-xl font-bold text-xs transition">
            فتح الحساب
          </button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <i className="fa-solid fa-calendar-check text-emerald-500"></i> تسجيل الحضور
          </h3>
          <div className="flex items-center gap-2">
            <select value={viewYear} onChange={(e) => { setViewYear(Number(e.target.value)); setViewMonth(0); }}
              className="bg-surface border border-line rounded-lg py-1 px-2 text-xs text-ink outline-none">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}
              className="bg-surface border border-line rounded-lg py-1 px-2 text-xs text-ink outline-none">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-ink-muted py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isFuture = ds > today;
            const isPresent = attendance[ds];
            return (
              <button key={day} onClick={() => toggleAttendance(ds)} disabled={isFuture}
                className={`aspect-square rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  isFuture ? "bg-surface-subtle text-gray-200" :
                  isPresent ? "bg-emerald-100 text-emerald-700 shadow-sm" :
                  "bg-red-50 text-red-500 hover:bg-emerald-100 hover:text-emerald-700"
                }`}>{day}</button>
            );
          })}
        </div>
        <div className="flex gap-4 text-xs bg-surface rounded-xl p-3">
          <div><span className="text-emerald-600 font-bold">{workDays}</span> <span className="text-ink-muted">أيام عمل</span></div>
          <div><span className="text-red-500 font-bold">{absentDays}</span> <span className="text-ink-muted">غياب</span></div>
          <div><span className="text-ink font-bold">{daysInMonth}</span> <span className="text-ink-muted">الشهر</span></div>
          <div><span className="text-ink font-bold">{daysInMonth ? Math.round(workDays / (workDays + absentDays) * 100) : 0}%</span> <span className="text-ink-muted">حضور</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <i className="fa-solid fa-hand-holding-dollar text-amber-500"></i> السلف
            </h3>
            <button onClick={() => setShowAdvanceModal(true)}
              className="text-xs bg-brand-600 text-white py-1.5 px-3 rounded-lg font-bold hover:bg-brand-700 transition flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة
            </button>
          </div>
          {advances.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4">لا توجد سلف</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {advances.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl border border-line">
                  <div>
                    <p className="text-xs text-ink-muted">{a.date}</p>
                    <p className="text-xs text-ink-muted">{a.note || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-500">{a.amount} د.أ</span>
                    <button onClick={() => deleteAdvance(a.id)} className="text-red-300 hover:text-red-500 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-line font-bold text-ink text-sm">
                <span>الإجمالي</span>
                <span className="text-red-500">{totalAdvances} د.أ</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <i className="fa-solid fa-money-bill-wave text-emerald-500"></i> الدفعات
            </h3>
            <button onClick={() => setShowPaymentModal(true)}
              className="text-xs bg-emerald-600 text-white py-1.5 px-3 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center gap-1">
              <i className="fa-solid fa-plus"></i> إضافة
            </button>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-4">لا توجد دفعات</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-surface rounded-xl border border-line">
                  <div>
                    <p className="text-xs text-ink-muted">{p.date}</p>
                    <p className="text-xs text-ink-muted">{p.note || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600">{p.amount} د.أ</span>
                    <button onClick={() => deletePayment(p.id)} className="text-red-300 hover:text-red-500 text-xs"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-line font-bold text-ink text-sm">
                <span>الإجمالي</span>
                <span className="text-emerald-600">{totalPayments} د.أ</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
          <i className="fa-solid fa-file-invoice text-blue-500"></i> كشف المحاسبة الشامل
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-line">
            <span className="text-ink">إجمالي الأيام (هذا الشهر)</span>
            <span className="font-bold text-ink">{workDays} يوم</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-line">
            <span className="text-ink">الأجر الإجمالي</span>
            <span className="font-bold text-emerald-600">{grossSalary} د.أ</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-line">
            <span className="text-ink">السلف</span>
            <span className="font-bold text-red-500">- {totalAdvances} د.أ</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-line">
            <span className="text-ink">الدفعات</span>
            <span className="font-bold text-emerald-600">- {totalPayments} د.أ</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-line">
            <span className="text-ink">إجمالي المسحوبات</span>
            <span className="font-bold text-red-500">{totalReceived} د.أ</span>
          </div>
          <div className={`flex justify-between items-center py-3 ${netBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            <span className="font-bold text-lg">الرصيد النهائي</span>
            <span className="font-black text-xl">{netBalance >= 0 ? "" : "-"}{Math.abs(netBalance)} د.أ</span>
          </div>
        </div>
      </div>

      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdvanceModal(false)}>
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-ink mb-4">إضافة سلفة</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">المبلغ (د.أ)</label>
                <input type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">التاريخ</label>
                <input type="date" value={advanceForm.date} onChange={(e) => setAdvanceForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">ملاحظة</label>
                <input value={advanceForm.note} onChange={(e) => setAdvanceForm((f) => ({ ...f, note: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" placeholder="سبب السلفة" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addAdvance} className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 transition">إضافة</button>
              <button onClick={() => setShowAdvanceModal(false)} className="flex-1 bg-surface-subtle text-ink-muted py-2.5 rounded-xl font-bold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-ink mb-4">إضافة دفعة</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">المبلغ (د.أ)</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">التاريخ</label>
                <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted font-bold block mb-1">ملاحظة</label>
                <input value={paymentForm.note} onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-xl py-2.5 px-3 text-ink outline-none focus:border-brand-500 text-sm" placeholder="مثلاً: دفعة أولى من الراتب" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addPayment} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition">إضافة</button>
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-surface-subtle text-ink-muted py-2.5 rounded-xl font-bold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
