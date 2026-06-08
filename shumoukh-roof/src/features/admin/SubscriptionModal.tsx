// @ts-nocheck
import { useState, useEffect } from "react";
import { X, Calendar, Clock, Check } from "lucide-react";
import { SUBSCRIPTION_TYPES, PLAN_OPTIONS } from "../../utils/subscriptionUtils";
import type { UserProfile } from "./adminUserService";

type Props = {
  open: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onSave: (uid: string, plan: string, opts: { days?: number; expiryDate?: string }) => void;
};

export default function SubscriptionModal({ open, user, onClose, onSave }: Props) {
  const [plan, setPlan] = useState(SUBSCRIPTION_TYPES.FREE_TRIAL);
  const [mode, setMode] = useState<"days" | "date">("days");
  const [days, setDays] = useState(180);
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    if (user) {
      const currentPlan = user.subscription?.subscriptionType || SUBSCRIPTION_TYPES.FREE_TRIAL;
      setPlan(currentPlan);
      const d = currentPlan === "free_trial" ? 180 : currentPlan === "basic" ? 30 : currentPlan === "advanced" ? 30 : 180;
      setDays(d);
      if (user.subExpiry) {
        const d2 = new Date(user.subExpiry);
        if (!isNaN(d2.getTime())) setExpiryDate(d2.toISOString().split("T")[0]);
        else setExpiryDate("");
      } else setExpiryDate("");
    }
  }, [user]);

  if (!open || !user) return null;

  const today = new Date();
  const futureDate = mode === "days" ? new Date(today.getTime() + days * 86400000) : new Date(expiryDate);
  const canSave = plan === SUBSCRIPTION_TYPES.ADVANCED || (mode === "days" ? days > 0 : !!expiryDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white rounded-2xl border-2 border-slate-200 shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-ice-blue-600 flex items-center justify-center text-white font-black text-sm">
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="font-black text-ink-primary text-sm truncate" title={user.displayName || ""}>{user.displayName || "بدون اسم"}</p>
              <p className="text-xs text-ink-muted truncate" dir="ltr" title={user.email || ""}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-secondary p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-ink-muted block mb-2">نوع الاشتراك</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setPlan(o.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    plan === o.value
                      ? "border-ice-blue-500 bg-ice-blue-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}>
                  <p className={`text-xs font-black ${plan === o.value ? "text-ice-blue-700" : "text-ink-muted"}`}>{o.label}</p>
                </button>
              ))}
            </div>
          </div>

          {plan !== SUBSCRIPTION_TYPES.ADVANCED && (
            <div>
              <label className="text-xs font-black text-ink-muted block mb-2">طريقة التحديد</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setMode("days")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition border-2 ${mode === "days" ? "bg-ice-blue-600 text-white border-ice-blue-600" : "bg-white border-slate-200 text-ink-muted"}`}>
                  <Clock className="w-3 h-3 inline ml-1" />بعدد الأيام
                </button>
                <button onClick={() => setMode("date")}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition border-2 ${mode === "date" ? "bg-ice-blue-600 text-white border-ice-blue-600" : "bg-white border-slate-200 text-ink-muted"}`}>
                  <Calendar className="w-3 h-3 inline ml-1" />بتاريخ محدد
                </button>
              </div>
              {mode === "days" ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min="1"
                    className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 px-4 text-ink-primary text-sm outline-none focus:border-ice-blue-500 transition font-medium" placeholder="عدد الأيام" />
                  <span className="text-xs text-ink-muted font-black">يوماً</span>
                </div>
              ) : (
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 px-4 text-ink-primary text-sm outline-none focus:border-ice-blue-500 transition font-medium" />
              )}
            </div>
          )}

          {plan !== SUBSCRIPTION_TYPES.ADVANCED && !isNaN(futureDate.getTime()) && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-center">
              <span className="text-xs text-ink-muted font-black">تاريخ الانتهاء المتوقع</span>
              <p className="text-sm font-black text-ink-primary mt-0.5">{futureDate.toLocaleDateString("ar-JO")}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-50 text-ink-muted py-3 rounded-xl font-black text-sm transition">إلغاء</button>
            <button onClick={() => onSave(user.uid, plan, mode === "days" ? { days } : { expiryDate })} disabled={!canSave}
              className="flex-1 bg-ice-blue-600 hover:bg-ice-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 border-2 border-ice-blue-600">
              <Check className="w-4 h-4" /> حفظ الاشتراك
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
