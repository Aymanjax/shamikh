import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard, Check, Minus, MessageCircle, Gift,
  CalendarClock, ShieldAlert, Box, Users, FileText, Calculator, Receipt,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  checkPermissions,
  getSubscriptionLabel,
  getDaysRemaining,
  toJsDate,
  TRIAL_DURATION_MONTHS,
} from "../../utils/subscriptionUtils";

const WHATSAPP_URL = "https://wa.me/962788859723";

type PlanKey = "free_trial" | "basic" | "advanced";

const PLANS: { key: PlanKey; name: string; note: string }[] = [
  { key: "free_trial", name: "الفترة المجانية", note: `${TRIAL_DURATION_MONTHS} أشهر لكل حساب جديد` },
  { key: "basic", name: "الأساسية", note: "للمقاول الفردي" },
  { key: "advanced", name: "المتقدمة", note: "للورش والشركات" },
];

const FEATURES: { icon: typeof Calculator; label: string; plans: Record<PlanKey, boolean> }[] = [
  { icon: Calculator, label: "حساب كميات القرميد والحديد", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: FileText,   label: "حفظ المشاريع وفتحها في الحاسبة", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: Receipt,    label: "الفواتير وعروض الأسعار", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: Box,        label: "معاينة السطح ثلاثي الأبعاد", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: Users,      label: "إدارة العمال والأجور", plans: { free_trial: true, basic: false, advanced: true } },
  { icon: CreditCard, label: "الربط مع الفاتورة الوطنية", plans: { free_trial: true, basic: false, advanced: true } },
];

function formatDate(value: unknown): string {
  const d = toJsDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" });
}

export default function SubscriptionPage() {
  const subscription = useAuthStore((s) => s.subscription);
  const perms = useMemo(() => checkPermissions(subscription ?? undefined), [subscription]);

  const daysRemaining = getDaysRemaining(subscription?.subscriptionEndDate);
  const start = toJsDate(subscription?.trialStartDate) ?? toJsDate(subscription?.subscriptionEndDate);
  const end = toJsDate(subscription?.subscriptionEndDate);
  const totalDays = start && end
    ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
    : 180;
  const elapsedPct = Math.min(100, Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100)));

  const planLabel = getSubscriptionLabel(perms.subscriptionType);
  const active = !perms.isExpired && perms.subscriptionType !== "limited";
  const expiringSoon = active && daysRemaining > 0 && daysRemaining <= 30;
  const currentKey = perms.subscriptionType as PlanKey;

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-sm bg-terracotta-500 flex items-center justify-center border-l-3 border-terracotta-300 shrink-0">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-earth-900 tracking-tight text-balance">الاشتراك</h1>
          <p className="text-sm text-earth-500">حالة خطتك الحالية وما تشمله كل خطة</p>
        </div>
      </div>

      {/* بطاقة الحالة: سجل القراءة السريعة */}
      <div className="earth-card overflow-hidden">
        <div className="px-5 py-4 border-b border-earth-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black px-2.5 py-1 rounded-[3px] border ${
              active ? "tag-olive" : "bg-red-50 text-red-600 border-red-200"
            }`}>
              {active ? "نشط" : "منتهي"}
            </span>
            <h2 className="text-sm font-black text-earth-900">{planLabel}</h2>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-olive-700 hover:bg-olive-800 active:bg-olive-900 text-white text-xs font-bold px-4 py-2 rounded-sm border-r-3 border-olive-900 transition-colors inline-flex items-center gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {active ? "ترقية الخطة عبر واتساب" : "تجديد الاشتراك عبر واتساب"}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-earth-100">
          <div className="p-5">
            <p className="text-[10px] font-bold text-earth-500 mb-1">الأيام المتبقية</p>
            <p className={`text-3xl font-black font-mono ${daysRemaining <= 7 ? "text-red-600" : "text-earth-900"}`}>
              {daysRemaining}
              <span className="text-xs text-earth-500 font-bold mr-1.5">يوم</span>
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-earth-500 mb-1">تاريخ الانتهاء</p>
            <p className="text-sm font-black text-earth-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-earth-400 shrink-0" />
              {formatDate(subscription?.subscriptionEndDate)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-earth-500 mb-2">المدة المستهلكة</p>
            <div
              className="w-full h-2 bg-earth-100 rounded-[3px] overflow-hidden"
              role="progressbar"
              aria-valuenow={elapsedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="نسبة المدة المستهلكة من الاشتراك"
            >
              <div
                className={`h-full transition-all duration-300 ${perms.isExpired ? "bg-red-400" : elapsedPct > 85 ? "bg-amber-500" : "bg-olive-500"}`}
                style={{ width: `${elapsedPct}%` }}
              />
            </div>
            <p className="text-[10px] font-mono font-black text-earth-500 mt-1.5">{elapsedPct}%</p>
          </div>
        </div>

        {(perms.isExpired || expiringSoon) && (
          <div className={`px-5 py-3 border-t flex items-center gap-2 text-xs font-bold ${
            perms.isExpired
              ? "bg-red-50 border-red-100 text-red-700"
              : "bg-amber-50 border-amber-100 text-amber-800"
          }`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {perms.isExpired
              ? "انتهى اشتراكك. جدد الآن حتى لا تفقد الوصول للميزات المتقدمة، بياناتك محفوظة ولن تُحذف."
              : `اشتراكك ينتهي خلال ${daysRemaining} يوم. تواصل معنا للتجديد قبل انقطاع الميزات.`}
          </div>
        )}
      </div>

      {/* جدول مقارنة الخطط — مسطّر مثل دفتر الكميات */}
      <div className="earth-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-earth-200">
          <h2 className="text-sm font-black text-earth-900">ماذا تشمل كل خطة</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b-2 border-earth-200">
                <th className="px-5 py-3 text-[11px] font-bold text-earth-500 w-2/5">الميزة</th>
                {PLANS.map((p) => (
                  <th key={p.key} className={`px-4 py-3 text-center ${currentKey === p.key ? "bg-terracotta-50" : ""}`}>
                    <span className="block text-xs font-black text-earth-900">{p.name}</span>
                    <span className="block text-[9px] font-bold text-earth-500 mt-0.5">{p.note}</span>
                    {currentKey === p.key && (
                      <span className="inline-block mt-1 text-[9px] font-black text-terracotta-500 bg-white border border-terracotta-200 px-1.5 py-0.5 rounded-[3px]">
                        خطتك الحالية
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {FEATURES.map((f) => (
                <tr key={f.label} className="hover:bg-earth-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5 text-xs font-bold text-earth-800">
                      <f.icon className="w-4 h-4 text-earth-400 shrink-0" />
                      {f.label}
                    </span>
                  </td>
                  {PLANS.map((p) => (
                    <td key={p.key} className={`px-4 py-3 text-center ${currentKey === p.key ? "bg-terracotta-50/60" : ""}`}>
                      {f.plans[p.key] ? (
                        <Check className="w-4 h-4 text-olive-600 inline" aria-label="متوفر" />
                      ) : (
                        <Minus className="w-4 h-4 text-earth-300 inline" aria-label="غير متوفر" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ملاحظة الفترة المجانية */}
      <div className="bg-olive-100 border border-olive-200 rounded-sm px-5 py-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-sm bg-olive-600 border-l-2 border-olive-400 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-olive-800">كل حساب جديد يبدأ بفترة مجانية {TRIAL_DURATION_MONTHS} أشهر</p>
          <p className="text-xs text-olive-700 mt-0.5 leading-relaxed">
            خلال الفترة المجانية كل الميزات مفتوحة بدون قيود: الحاسبة، المعاينة ثلاثية الأبعاد، العمال، والفواتير.
            عند الاقتراب من الانتهاء تواصل معنا لاختيار الخطة المناسبة لعملك.
          </p>
          <Link to="/settings" className="inline-block text-xs font-black text-olive-800 underline underline-offset-4 mt-2 hover:text-olive-900 transition-colors">
            إعدادات الحساب
          </Link>
        </div>
      </div>
    </div>
  );
}
