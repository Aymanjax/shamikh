import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../services/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const defaultItems = [
  { name: "حديد 4×8", unit: "تيوب", minAlert: 5 },
  { name: "حديد 10×10", unit: "تيوب", minAlert: 3 },
  { name: "قرميد بلانيوم", unit: "حبة", minAlert: 50 },
  { name: "قرميد فيسيوم", unit: "حبة", minAlert: 50 },
  { name: "خشب ديكور", unit: "ربطة", minAlert: 10 },
  { name: "بيش خشب", unit: "وحدة", minAlert: 20 },
  { name: "مشمع", unit: "رول", minAlert: 2 },
  { name: "زفتة عازلة", unit: "رول", minAlert: 2 },
  { name: "لاتي ساند", unit: "لوح", minAlert: 5 },
];

export default function InventoryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: 0, unit: "", minAlert: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "inventory"));
      if (snap.empty) {
        const initial = defaultItems.map((item) => ({ ...item, quantity: 0, id: crypto.randomUUID() }));
        setItems(initial);
        for (const item of initial) {
          await setDoc(doc(db, "users", user.uid, "inventory", item.id), item);
        }
      } else {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    };
    load();
  }, [user]);

  const handleSave = async (item) => {
    const ref = doc(db, "users", user.uid, "inventory", item.id);
    await setDoc(ref, item);
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "inventory", id));
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = async () => {
    const newItem = { name: "مادة جديدة", quantity: 0, unit: "قطعة", minAlert: 5, id: crypto.randomUUID() };
    await setDoc(doc(db, "users", user.uid, "inventory", newItem.id), newItem);
    setItems((prev) => [...prev, newItem]);
  };

  const totalItems = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const lowStock = items.filter((i) => (i.quantity || 0) <= (i.minAlert || 0));

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">المخزون</h1>
          <p className="text-sm text-slate-400">{items.length} صنف | {totalItems} قطعة | {lowStock.length} أصناف منخفضة</p>
        </div>
        <button onClick={addItem}
          className="bg-brand-600 hover:bg-brand-700 py-2.5 px-5 rounded-xl font-bold text-sm transition flex items-center gap-2">
          <i className="fa-solid fa-plus"></i> إضافة صنف
        </button>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-400 text-xs">
              <th className="p-4 font-bold">الصنف</th>
              <th className="p-4 font-bold">الكمية</th>
              <th className="p-4 font-bold">الوحدة</th>
              <th className="p-4 font-bold">حد التنبيه</th>
              <th className="p-4 font-bold">الحالة</th>
              <th className="p-4 font-bold">التحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition">
                {editing === item.id ? (
                  <>
                    <td className="p-3">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-[#1e293b] border border-white/10 rounded-lg py-1.5 px-2 text-white outline-none text-sm" />
                    </td>
                    <td className="p-3">
                      <input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                        className="w-20 bg-[#1e293b] border border-white/10 rounded-lg py-1.5 px-2 text-white outline-none text-sm" />
                    </td>
                    <td className="p-3">
                      <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        className="w-20 bg-[#1e293b] border border-white/10 rounded-lg py-1.5 px-2 text-white outline-none text-sm" />
                    </td>
                    <td className="p-3">
                      <input type="number" value={editForm.minAlert} onChange={(e) => setEditForm({ ...editForm, minAlert: Number(e.target.value) })}
                        className="w-20 bg-[#1e293b] border border-white/10 rounded-lg py-1.5 px-2 text-white outline-none text-sm" />
                    </td>
                    <td className="p-3">-</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleSave({ ...item, ...editForm })}
                        className="bg-emerald-600 text-white text-xs py-1 px-3 rounded-lg font-bold">حفظ</button>
                      <button onClick={() => setEditing(null)}
                        className="bg-slate-600 text-white text-xs py-1 px-3 rounded-lg font-bold">إلغاء</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3 font-bold text-lg">{item.quantity || 0}</td>
                    <td className="p-3 text-slate-400">{item.unit}</td>
                    <td className="p-3 text-slate-400">{item.minAlert}</td>
                    <td className="p-3">
                      {(item.quantity || 0) <= (item.minAlert || 0) ? (
                        <span className="text-red-400 bg-red-500/10 text-xs font-bold px-2 py-1 rounded-lg">منخفض</span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-500/10 text-xs font-bold px-2 py-1 rounded-lg">متوفر</span>
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditing(item.id); setEditForm({ name: item.name, quantity: item.quantity || 0, unit: item.unit || "", minAlert: item.minAlert || 0 }); }}
                        className="text-brand-500 hover:text-brand-400 text-xs"><i className="fa-solid fa-pen"></i></button>
                      <button onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs"><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
