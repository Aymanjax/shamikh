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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-sm border border-earth-200 shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-sm bg-terracotta-500 border-l-2 border-terracotta-300 flex items-center justify-center text-earth-100 font-black text-sm">
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="font-black text-earth-900 text-sm truncate" title={user.displayName || ""}>{user.displayName || "بدون اسم"}</p>
              <p className="text-xs text-earth-500 truncate" dir="ltr" title={user.email || ""}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm hover:bg-earth-100 transition cursor-pointer" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-earth-600 block mb-2">نوع الاشتراك</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setPlan(o.value)}
                  className={`p-3 rounded-sm border-2 text-center transition-all cursor-pointer ${
                    plan === o.value
                      ? "border-terracotta-400 bg-terracotta-50"
                      : "border-earth-200 hover:border-earth-300 bg-white"
                  }`}>
                  <p className={`text-xs font-black ${plan === o.value ? "text-terracotta-600" : "text-earth-600"}`}>{o.label}</p>
                </button>
              ))}
            </div>
          </div>

          {plan !== SUBSCRIPTION_TYPES.ADVANCED && (
            <div>
              <label className="text-xs font-black text-earth-600 block mb-2">طريقة التحديد</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setMode("days")}
                  className={`flex-1 py-2 rounded-sm text-xs font-black transition border cursor-pointer ${mode === "days" ? "bg-earth-800 text-earth-100 border-earth-800" : "bg-white border-earth-200 text-earth-600 hover:border-earth-300"}`}>
                  <Clock className="w-3 h-3 inline ml-1" />بعدد الأيام
                </button>
                <button onClick={() => setMode("date")}
                  className={`flex-1 py-2 rounded-sm text-xs font-black transition border cursor-pointer ${mode === "date" ? "bg-earth-800 text-earth-100 border-earth-800" : "bg-white border-earth-200 text-earth-600 hover:border-earth-300"}`}>
                  <Calendar className="w-3 h-3 inline ml-1" />بتاريخ محدد
                </button>
              </div>
              {mode === "days" ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min="1"
                    className="flex-1 bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-earth-900 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-mono font-black" placeholder="عدد الأيام" />
                  <span className="text-xs text-earth-600 font-black">يوماً</span>
                </div>
              ) : (
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-earth-900 text-sm outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition font-mono" />
              )}
            </div>
          )}

          {plan !== SUBSCRIPTION_TYPES.ADVANCED && !isNaN(futureDate.getTime()) && (
            <div className="bg-earth-50 border border-earth-200 rounded-sm p-3 text-center">
              <span className="text-xs text-earth-500 font-black">تاريخ الانتهاء المتوقع</span>
              <p className="text-sm font-black font-mono text-earth-900 mt-0.5">{futureDate.toLocaleDateString("ar-JO")}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 bg-white border border-earth-300 hover:bg-earth-50 text-earth-700 py-3 rounded-sm font-black text-sm transition cursor-pointer">
              إلغاء
            </button>
            <button onClick={() => onSave(user.uid, plan, mode === "days" ? { days } : { expiryDate })} disabled={!canSave}
              className="flex-1 bg-olive-700 hover:bg-olive-800 active:bg-olive-900 disabled:opacity-40 disabled:cursor-not-allowed text-earth-100 py-3 rounded-sm font-black text-sm transition flex items-center justify-center gap-2 border-r-3 border-olive-900 cursor-pointer">
              <Check className="w-4 h-4" /> حفظ الاشتراك
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
