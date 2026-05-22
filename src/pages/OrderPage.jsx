import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchProject, updateOrder, addPayment, deletePayment } from "../services/projectService";
import { ORDER_ITEMS } from "../utils/orderItems";
import { getProgramConfig } from "../services/adminService";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function OrderPage() {
  const { id } = useParams();
  const { user, companyName } = useAuthStore();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const fixedCount = ORDER_ITEMS.length;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const p = await fetchProject(user.uid, id);
      if (p) {
        setProject(p);
        const programConfig = await getProgramConfig();
        const profileSnap = await getDoc(doc(db, "users", user.uid, "profile", "main"));
        const userExtraItems = profileSnap.exists() ? (profileSnap.data().extraItems || []) : [];
        const allExtraItems = (programConfig?.extraItems || userExtraItems);
        const allItems = [
          ...ORDER_ITEMS,
          ...allExtraItems.map((ei, i) => ({ id: `extra_${i}`, name: ei.name, unit: ei.unit })),
        ];
        setOrder(p.order || allItems.map((i) => ({ ...i, quantity: 0, received: 0 })));
      }
      setLoading(false);
    };
    load();
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-ink-muted">المشروع غير موجود</div>;
  }

  const totalPayments = (project.payments || []).reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="print-only bg-surface text-black p-6 rounded-2xl mb-4 border-2 border-slate-900">
        <h1 className="text-2xl font-black text-center">طلب بضاعة</h1>
        <p className="text-center text-sm mt-1">{companyName || "شموخ ERP"}</p>
        <p className="text-center text-sm mt-1">العميل: {project.client?.name || "-"} | {project.client?.phone || "-"}</p>
        <p className="text-center text-[10px] mt-1">التاريخ: {new Date().toLocaleDateString("ar-JO")}</p>
        <hr className="my-2 border-slate-300" />
      </div>

      <div className="flex justify-between items-start no-print">
        <div>
          <Link to={`/projects/${id}`} className="text-sm text-ink-muted hover:text-ink transition flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-right"></i> العودة للمشروع
          </Link>
          <h1 className="text-2xl font-black">طلب بضاعة</h1>
          <p className="text-sm text-ink-muted">{project.client?.name || "بدون اسم"}</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 px-5 rounded-xl font-bold text-sm shadow-lg transition disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ الطلب"}
          </button>
          <button onClick={() => window.print()}
            className="bg-surface-subtle hover:bg-surface-input text-ink py-2.5 px-4 rounded-xl font-bold text-sm transition border border-line">
            <i className="fa-solid fa-print ml-1"></i> طباعة
          </button>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-3xl overflow-x-auto shadow-sm">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted text-[10px]">
              <th className="p-3 font-bold">#</th>
              <th className="p-3 font-bold text-right">الصنف</th>
              <th className="p-3 font-bold">الوحدة</th>
              <th className="p-3 font-bold">الكمية</th>
              <th className="p-3 font-bold">الواصل</th>
              <th className="p-3 font-bold">المتبقي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.map((item, idx) => {
              const remaining = Math.max(0, (item.quantity || 0) - (item.received || 0));
              const hasZero = !item.quantity && !item.received;
              const showSep = idx === fixedCount && fixedCount > 0 && order.length > fixedCount;
              return (
                <React.Fragment key={item.id}>
                  {showSep && (
                    <tr className="bg-amber-50/50">
                      <td colSpan={6} className="p-2 text-xs font-bold text-amber-700">
                        <i className="fa-solid fa-cubes ml-1"></i> مواد إضافية
                      </td>
                    </tr>
                  )}
                  <tr className={`hover:bg-surface-subtle transition ${hasZero ? 'print-hide-zero opacity-50 print:opacity-100' : ''}`}>
                    <td className="p-3 text-ink-muted">{idx + 1}</td>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3 text-ink-muted">{item.unit}</td>
                    <td className="p-3">
                      <input type="number" value={item.quantity || ""}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-20 bg-surface-input border border-line rounded-lg py-1.5 px-2 text-ink outline-none text-sm text-center focus:border-amber-500 transition" />
                    </td>
                    <td className="p-3">
                      <input type="number" value={item.received || ""}
                        onChange={(e) => updateItem(idx, "received", e.target.value)}
                        className="w-20 bg-surface-input border border-line rounded-lg py-1.5 px-2 text-ink outline-none text-sm text-center focus:border-emerald-500 transition" />
                    </td>
                    <td className={`p-3 font-bold text-sm ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {remaining}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-money-bill-wave text-emerald-600"></i> الدفعات</h3>
          <button onClick={() => setPayModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-bold text-sm transition flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> إضافة دفعة
          </button>
        </div>

        {(!project.payments || project.payments.length === 0) ? (
          <p className="text-sm text-ink-muted text-center py-4">لا توجد دفعات بعد</p>
        ) : (
          <div className="space-y-2">
            {project.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center bg-surface-subtle p-3 rounded-xl">
                <div>
                  <span className="font-bold text-emerald-600 text-lg">{payment.amount} د.أ</span>
                  {payment.note && <span className="mr-3 text-sm text-ink-muted">- {payment.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-ink-muted">{new Date(payment.date).toLocaleDateString("ar-JO")}</span>
                  <button onClick={() => handleDeletePayment(payment.id)}
                    className="text-red-500 hover:text-red-600 text-xs">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-bold">
          <span>إجمالي الدفعات:</span>
          <span className="text-emerald-600">{totalPayments.toFixed(1)} د.أ</span>
        </div>
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPayModal(false)}>
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">إضافة دفعة جديدة</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-ink-muted font-bold">المبلغ (د.أ)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-muted font-bold">ملاحظة (اختياري)</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPayModal(false)}
                className="flex-1 bg-surface-subtle hover:bg-surface-input text-ink py-2.5 rounded-xl font-bold text-sm border border-line">إلغاء</button>
              <button onClick={handleAddPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm">إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}