// @ts-nocheck
import { useState, useEffect } from "react";
import {
  Bell, Plus, Edit2, Trash2, Info, AlertTriangle, RefreshCw, Wrench,
  Check, X, Search, AlertCircle
} from "lucide-react";
import {
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  subscribeAllAnnouncements,
} from "../../services/announcementService";
import { useAuthStore } from "../../store/authStore";
import AnnouncementModal from "./AnnouncementModal";
import type { Announcement } from "../../types";

const typeIcons: Record<string, any> = {
  info: Info, warning: AlertTriangle, update: RefreshCw, maintenance: Wrench,
};

const typeColors: Record<string, string> = {
  info: "text-ice-blue-600 bg-ice-blue-50 border-ice-blue-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  update: "text-emerald-600 bg-emerald-50 border-emerald-200",
  maintenance: "text-red-600 bg-red-50 border-red-200",
};

const typeLabels: Record<string, string> = {
  info: "معلومة", warning: "تنبيه", update: "تحديث", maintenance: "صيانة",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة", normal: "متوسطة", high: "عالية",
};

export default function AnnouncementsTab() {
  const user = useAuthStore((s: any) => s.user);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  useEffect(() => {
    const unsub = subscribeAllAnnouncements(
      (items) => { setAnnouncements(items); setLoading(false); },
      (err) => { setError("فشل تحميل الإعلانات: " + (err?.message || "")); setLoading(false); }
    );
    return unsub;
  }, []);

  const handleSave = async (data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editing) {
        await updateAnnouncement(editing.id!, data);
      } else {
        await createAnnouncement({ ...data, createdBy: user?.uid || "", createdByDisplay: user?.displayName || "" });
      }
    } catch (e: any) {
      throw new Error(e?.message || "فشل الحفظ في Firebase، تأكد من صلاحيات قاعدة البيانات");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    try {
      await deleteAnnouncement(id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const togglePublished = async (a: Announcement) => {
    try {
      await updateAnnouncement(a.id!, { published: !a.published });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = announcements.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AnnouncementModal
        open={modalOpen}
        announcement={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-ice-blue-600" />
            <span className="font-black text-ink-primary">{announcements.length}</span>
            <span className="text-sm text-ink-muted">إعلان</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في الإعلانات..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2 pr-9 pl-3 text-sm text-ink-primary outline-none focus:border-ice-blue-500 transition font-medium" />
            </div>
            <button onClick={() => { setEditing(null); setModalOpen(true); }}
              className="bg-ice-blue-600 hover:bg-ice-blue-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border-2 border-ice-blue-600 whitespace-nowrap">
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-muted">
          <div className="animate-spin w-6 h-6 border-2 border-ice-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-bold">جاري التحميل...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((a) => {
            const Icon = typeIcons[a.type] || Info;
            const colorClass = typeColors[a.type] || typeColors.info;
            return (
              <div key={a.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-black text-ink-primary">{a.title}</h3>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border-2 ${colorClass}`}>
                          {typeLabels[a.type]}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-slate-100 border-2 border-slate-200 text-slate-600">
                          {priorityLabels[a.priority]}
                        </span>
                        <button onClick={() => togglePublished(a)}
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg border-2 transition flex items-center gap-0.5 ${
                            a.published
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}>
                          {a.published ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {a.published ? "منشور" : "مسودة"}
                        </button>
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-2 mb-1">{a.content}</p>
                      <div className="flex items-center gap-3 text-[9px] text-ink-muted">
                        {a.createdByDisplay && <span>{a.createdByDisplay}</span>}
                        {a.createdAt && (
                          <span>{new Date(a.createdAt.seconds * 1000).toLocaleDateString("ar-JO")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditing(a); setModalOpen(true); }}
                      className="text-ice-blue-600 hover:bg-ice-blue-50 p-2 rounded-lg transition border-2 border-transparent hover:border-ice-blue-200">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => a.id && handleDelete(a.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition border-2 border-transparent hover:border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-black">لا توجد إعلانات</p>
          <p className="text-xs mt-1">أضف إعلاناً جديداً ليظهر للمستخدمين</p>
        </div>
      )}
    </div>
  );
}
