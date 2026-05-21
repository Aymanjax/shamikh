import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchProject, updateOrder, addPayment, deletePayment } from "../services/projectService";
import { ORDER_ITEMS } from "../utils/orderItems";

export default function OrderPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchProject(user.uid, id).then((p) => {
      if (p) {
        setProject(p);
        setOrder(p.order || ORDER_ITEMS.map((i) => ({ ...i, quantity: 0, received: 0 })));
      }
      setLoading(false);
    });
  }, [user, id]);

  const updateItem = (idx, field, value) => {
    setOrder((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: Math.max(0, Number(value) || 0) };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await updateOrder(user.uid, id, order);
    setSaving(false);
  };

  const handleAddPayment = async () => {
    if (!user || !payAmount) return;
    await addPayment(user.uid, id, { amount: Number(payAmount), note: payNote || "" });
    const p = await fetchProject(user.uid, id);
    setProject(p);
    setPayModal(false);
    setPayAmount("");
    setPayNote("");
  };

  const handleDeletePayment = async (paymentId) => {
    if (!user) return;
    await deletePayment(user.uid, id, paymentId);
    const p = await fetchProject(user.uid, id);
    setProject(p);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-slate-400">المشروع غير موجود</div>;
  }

  const totalPayments = (project.payments || []).reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="print-only bg-white text-black p-6 rounded-2xl mb-4 border-2 border-slate-900">
        <h1 className="text-2xl font-black text-center">طلب بضاعة</h1>
        <p className="text-center text-sm mt-1">العميل: {project.client?.name || "-"} | {project.client?.phone || "-"}</p>
        <p className="text-center text-[10px] mt-1">التاريخ: {new Date().toLocaleDateString("ar-JO")}</p>
        <hr className="my-2 border-slate-300" />
      </div>

      <div className="flex justify-between items-start no-print">
        <div>
          <Link to={`/projects/${id}`} className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-right"></i> العودة للمشروع
          </Link>
          <h1 className="text-2xl font-black">طلب بضاعة</h1>
          <p className="text-sm text-slate-400">{project.client?.name || "بدون اسم"}</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-brand-600 to-amber-500 py-2.5 px-5 rounded-xl font-bold text-sm shadow-lg transition disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ الطلب"}
          </button>
          <button onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 py-2.5 px-4 rounded-xl font-bold text-sm transition">
            <i className="fa-solid fa-print ml-1"></i> طباعة
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-400 text-[10px]">
              <th className="p-3 font-bold">#</th>
              <th className="p-3 font-bold text-right">الصنف</th>
              <th className="p-3 font-bold">الوحدة</th>
              <th className="p-3 font-bold">الكمية</th>
              <th className="p-3 font-bold">الواصل</th>
              <th className="p-3 font-bold">المتبقي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {order.map((item, idx) => {
              const remaining = Math.max(0, (item.quantity || 0) - (item.received || 0));
              const hasZero = !item.quantity && !item.received;
              return (
                <tr key={item.id} className={`hover:bg-white/5 transition ${hasZero ? 'print-hide-zero opacity-50 print:opacity-100' : ''}`}>
                  <td className="p-3 text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-bold">{item.name}</td>
                  <td className="p-3 text-slate-400">{item.unit}</td>
                  <td className="p-3">
                    <input type="number" value={item.quantity || ""}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="w-20 bg-[#1e293b] border border-white/10 rounded-lg py-1.5 px-2 text-white outline-none text-sm text-center focus:border-brand-500" />
                  </td>
                  <td className="p-3">
                    <input type="number" value={item.received || ""}
                      onChange={(e) => updateItem(idx, "received", e.target.value)}
                      className="w-20 bg-[#1e293b] border border-white/10 rounded-lg py-1.5 px-2 text-white outline-none text-sm text-center focus:border-emerald-500" />
                  </td>
                  <td className={`p-3 font-bold text-sm ${remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {remaining}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-money-bill-wave text-emerald-500"></i> الدفعات</h3>
          <button onClick={() => setPayModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 py-2 px-4 rounded-xl font-bold text-sm transition flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> إضافة دفعة
          </button>
        </div>

        {(!project.payments || project.payments.length === 0) ? (
          <p className="text-sm text-slate-400 text-center py-4">لا توجد دفعات بعد</p>
        ) : (
          <div className="space-y-2">
            {project.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl">
                <div>
                  <span className="font-bold text-emerald-400 text-lg">{payment.amount} د.أ</span>
                  {payment.note && <span className="mr-3 text-sm text-slate-400">- {payment.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">{new Date(payment.date).toLocaleDateString("ar-JO")}</span>
                  <button onClick={() => handleDeletePayment(payment.id)}
                    className="text-red-400 hover:text-red-300 text-xs">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between bg-emerald-500/10 p-3 rounded-xl font-bold">
          <span>إجمالي الدفعات:</span>
          <span className="text-emerald-400">{totalPayments.toFixed(1)} د.أ</span>
        </div>
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPayModal(false)}>
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">إضافة دفعة جديدة</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">المبلغ (د.أ)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">ملاحظة (اختياري)</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2.5 px-4 text-white outline-none focus:border-brand-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPayModal(false)}
                className="flex-1 bg-slate-800 py-2.5 rounded-xl font-bold text-sm">إلغاء</button>
              <button onClick={handleAddPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl font-bold text-sm">إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
