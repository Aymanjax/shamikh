// @ts-nocheck
import { useState, useEffect } from "react";
import { X, Check, Info, AlertTriangle, RefreshCw, Wrench, AlertCircle } from "lucide-react";
import type { Announcement, AnnouncementType, AnnouncementPriority } from "../../types";

const TYPE_OPTIONS: { value: AnnouncementType; label: string; icon: any; color: string }[] = [
  { value: "info", label: "معلومة", icon: Info, color: "bg-ice-blue-600" },
  { value: "warning", label: "تنبيه", icon: AlertTriangle, color: "bg-amber-500" },
  { value: "update", label: "تحديث", icon: RefreshCw, color: "bg-emerald-500" },
  { value: "maintenance", label: "صيانة", icon: Wrench, color: "bg-red-500" },
];

const PRIORITY_OPTIONS: { value: AnnouncementPriority; label: string }[] = [
  { value: "low", label: "منخفضة" },
  { value: "normal", label: "متوسطة" },
  { value: "high", label: "عالية" },
];

type Props = {
  open: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onSave: (data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => Promise<void>;
};

export default function AnnouncementModal({ open, announcement, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AnnouncementType>("info");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setType(announcement.type);
      setPriority(announcement.priority);
      setPublished(announcement.published);
    } else {
      setTitle("");
      setContent("");
      setType("info");
      setPriority("normal");
      setPublished(false);
    }
    setSaveError("");
    setSaved(false);
  }, [announcement, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        published,
        createdBy: announcement?.createdBy || "",
        createdByDisplay: announcement?.createdByDisplay || "",
      });
      setSaved(true);
      setTimeout(() => onClose(), 600);
    } catch (e: any) {
      setSaveError(e?.message || "فشل الحفظ، يرجى المحاولة مرة أخرى");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-white rounded-2xl border-2 border-slate-200 shadow-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-ink-primary">
            {announcement ? "تعديل إعلان" : "إعلان جديد"}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink-secondary p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {saveError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              {saveError}
            </div>
          )}
          <div>
            <label className="text-xs font-black text-ink-muted block mb-2">العنوان</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الإعلان..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 px-4 text-ink-primary text-sm outline-none focus:border-ice-blue-500 transition font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-black text-ink-muted block mb-2">المحتوى</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="محتوى الإعلان..."
              rows={4}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 px-4 text-ink-primary text-sm outline-none focus:border-ice-blue-500 transition font-medium resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-black text-ink-muted block mb-2">النوع</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setType(o.value)}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    type === o.value
                      ? `${o.color} text-paper border-transparent`
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <o.icon className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-[10px] font-black">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-ink-muted block mb-2">الأولوية</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setPriority(o.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition border-2 ${
                    priority === o.value
                      ? "bg-ice-blue-600 text-paper border-ice-blue-600"
                      : "bg-white border-slate-200 text-ink-muted hover:border-slate-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <button
              onClick={() => setPublished(!published)}
              className={`relative w-12 h-7 rounded-full transition border-2 ${
                published ? "bg-emerald-500 border-emerald-500" : "bg-slate-200 border-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition ${
                  published ? "right-0.5" : "right-[1.35rem]"
                }`}
              />
            </button>
            <span className="text-sm font-black text-ink-primary">
              {published ? "منشور" : "مسودة"}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-50 text-ink-muted py-3 rounded-xl font-black text-sm transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim() || saving || saved}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 border-2 ${
                saved
                  ? "bg-emerald-500 border-emerald-500 text-paper"
                  : "bg-ice-blue-600 hover:bg-ice-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-paper border-ice-blue-600"
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {saved ? "تم الحفظ" : saving ? "جاري الحفظ..." : announcement ? "تحديث" : "إنشاء"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
