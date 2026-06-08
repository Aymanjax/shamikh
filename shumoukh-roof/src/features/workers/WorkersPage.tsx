import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Phone, MapPin, Calendar, X, Trash2, HardHat } from "lucide-react";
import { listDocumentsByUser, addDocument, deleteDocument } from "../../lib/firestoreService";
import { useAuthStore } from "../../store/authStore";
import SubscriptionGuard from "../../components/SubscriptionGuard";
import GlassButton from "../../components/ui/GlassButton";

interface Worker {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  project?: string;
  wage?: number;
  days?: number;
}

interface WorkerForm {
  name: string;
  role: string;
  phone: string;
  project: string;
  wage: number;
  days: number;
}

const defaultForm: WorkerForm = { name: "", role: "مبلط", phone: "", project: "", wage: 25, days: 1 };
const roles = ["مبلط", "حداد", "مساعد", "عامل", "مشرف", "سائق"];

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<WorkerForm>(defaultForm);

  const { data: workers = [], isLoading: loading, error } = useQuery<Worker[]>({
    queryKey: ["workers", user?.uid],
    queryFn: () => listDocumentsByUser("workers", user!.uid) as Promise<Worker[]>,
    staleTime: 30_000,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: WorkerForm) => addDocument("workers", { ...data, userId: user!.uid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      setModal(false);
      setForm(defaultForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("workers", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  const handleCreate = useCallback(() => {
    if (!form.name.trim()) return;
    createMutation.mutate(form);
  }, [form, createMutation]);

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`حذف العامل "${name}"؟`)) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل بيانات العمال</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-red-600 flex items-center justify-center border-l-3 border-red-400">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-earth-900 tracking-tight">العمال</h1>
            <p className="text-sm text-earth-500">إدارة العمال والمهام اليومية</p>
          </div>
        </div>
        <GlassButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setModal(true)}>
          إضافة عامل
        </GlassButton>
      </div>

      <SubscriptionGuard permission="canManageWorkers">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-earth-200 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="glass-card py-16 text-center text-earth-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-black">لا يوجد عمال</p>
            <p className="text-xs mt-1">أضف عامل جديد للبدء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div key={w.id} className="glass-card p-4 transition-all duration-150 hover:shadow-card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-sm bg-red-600 flex items-center justify-center text-white font-black text-sm">
                    {w.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-earth-900 text-sm truncate">{w.name}</h3>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">{w.role}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(w.id, w.name || "")}
                    className="text-earth-500 hover:text-red-500 transition cursor-pointer p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                    aria-label={`حذف العامل ${w.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-earth-500">
                  {w.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-earth-400" /> {w.phone}
                    </div>
                  )}
                  {w.project && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-earth-400" /> {w.project}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-earth-400" /> {w.days} يوم · {w.wage} د.أ/يوم
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-earth-200 flex justify-between text-xs font-black">
                  <span className="text-earth-500">الإجمالي</span>
                  <span className="text-olive-600">{(w.days ?? 0) * (w.wage ?? 0)} د.أ</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SubscriptionGuard>

      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div
            className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-earth-900">إضافة عامل</h3>
              <button onClick={() => setModal(false)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm" aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-earth-700">الاسم</label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-earth-700">المهنة</label>
                  <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition">
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">الهاتف</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-earth-700">المشروع</label>
                <input value={form.project} onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-earth-700">الأجر (د.أ/يوم)</label>
                  <input type="number" value={form.wage} onChange={(e) => setForm((p) => ({ ...p, wage: +e.target.value }))}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-earth-700">عدد الأيام</label>
                  <input type="number" value={form.days} onChange={(e) => setForm((p) => ({ ...p, days: +e.target.value }))}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-mono" min={1} />
                </div>
              </div>
              <button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}
                className="w-full bg-olive-700 hover:bg-olive-800 disabled:opacity-40 text-white font-black py-2.5 rounded-sm transition text-sm border-r-3 border-olive-900">
                {createMutation.isPending ? "جارٍ الإضافة..." : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
