import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard, Check, Minus, MessageCircle, Gift,
  CalendarClock, ShieldAlert, Box, Users, FileText, Calculator, Receipt,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useT, formatDate as i18nFormatDate } from "../../i18n";
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
  { key: "free_trial", name: "subscription.plans.freeTrial.name", note: "subscription.plans.freeTrial.note" },
  { key: "basic", name: "subscription.plans.basic.name", note: "subscription.plans.basic.note" },
  { key: "advanced", name: "subscription.plans.advanced.name", note: "subscription.plans.advanced.note" },
];

const FEATURES: { icon: typeof Calculator; label: string; plans: Record<PlanKey, boolean> }[] = [
  { icon: Calculator, label: "subscription.feature.calc", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: FileText,   label: "subscription.feature.saveProjects", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: Receipt,    label: "subscription.feature.invoices", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: Box,        label: "subscription.feature.roof3d", plans: { free_trial: true, basic: true, advanced: true } },
  { icon: Users,      label: "subscription.feature.workers", plans: { free_trial: true, basic: false, advanced: true } },
  { icon: CreditCard, label: "subscription.feature.nationalInvoice", plans: { free_trial: true, basic: false, advanced: true } },
];

function formatDate(value: unknown): string {
  const d = toJsDate(value);
  if (!d) return "—";
  return i18nFormatDate(d, { year: "numeric", month: "long", day: "numeric" });
}

export default function SubscriptionPage() {
  const t = useT();
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
          <h1 className="text-xl font-black text-earth-900 tracking-tight text-balance">{t("nav.subscription")}</h1>
          <p className="text-sm text-earth-500">{t("subscription.page.subtitle")}</p>
        </div>
      </div>

      {/* بطاقة الحالة: سجل القراءة السريعة */}
      <div className="earth-card overflow-hidden">
        <div className="px-5 py-4 border-b border-earth-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-black px-2.5 py-1 rounded-[3px] border ${
              active ? "tag-olive" : "bg-red-50 text-red-600 border-red-200"
            }`}>
              {active ? t("subscription.status.active") : t("common.expired")}
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
            {active ? t("subscription.cta.upgradeWhatsApp") : t("subscription.cta.renewWhatsApp")}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-earth-100">
          <div className="p-5">
            <p className="text-[10px] font-bold text-earth-500 mb-1">{t("subscription.stats.daysRemaining")}</p>
            <p className={`text-3xl font-black font-mono ${daysRemaining <= 7 ? "text-red-600" : "text-earth-900"}`}>
              {daysRemaining}
              <span className="text-xs text-earth-500 font-bold mr-1.5">{t("subscription.stats.dayUnit", { n: daysRemaining })}</span>
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-earth-500 mb-1">{t("subscription.stats.endDate")}</p>
            <p className="text-sm font-black text-earth-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-earth-400 shrink-0" />
              {formatDate(subscription?.subscriptionEndDate)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold text-earth-500 mb-2">{t("subscription.stats.elapsed")}</p>
            <div
              className="w-full h-2 bg-earth-100 rounded-[3px] overflow-hidden"
              role="progressbar"
              aria-valuenow={elapsedPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("subscription.stats.elapsedAria")}
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
              ? t("subscription.alert.expired")
              : t("subscription.alert.expiringSoon", { n: daysRemaining })}
          </div>
        )}
      </div>

      {/* جدول مقارنة الخطط — مسطّر مثل دفتر الكميات */}
      <div className="earth-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-earth-200">
          <h2 className="text-sm font-black text-earth-900">{t("subscription.table.title")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b-2 border-earth-200">
                <th className="px-5 py-3 text-[11px] font-bold text-earth-500 w-2/5">{t("subscription.table.feature")}</th>
                {PLANS.map((p) => (
                  <th key={p.key} className={`px-4 py-3 text-center ${currentKey === p.key ? "bg-terracotta-50" : ""}`}>
                    <span className="block text-xs font-black text-earth-900">{t(p.name)}</span>
                    <span className="block text-[9px] font-bold text-earth-500 mt-0.5">{t(p.note, { months: TRIAL_DURATION_MONTHS })}</span>
                    {currentKey === p.key && (
                      <span className="inline-block mt-1 text-[9px] font-black text-terracotta-500 bg-white border border-terracotta-200 px-1.5 py-0.5 rounded-[3px]">
                        {t("subscription.table.currentPlan")}
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
                      {t(f.label)}
                    </span>
                  </td>
                  {PLANS.map((p) => (
                    <td key={p.key} className={`px-4 py-3 text-center ${currentKey === p.key ? "bg-terracotta-50/60" : ""}`}>
                      {f.plans[p.key] ? (
                        <Check className="w-4 h-4 text-olive-600 inline" aria-label={t("subscription.table.available")} />
                      ) : (
                        <Minus className="w-4 h-4 text-earth-300 inline" aria-label={t("common.notAvailable")} />
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
          <p className="text-sm font-black text-olive-800">{t("subscription.trial.title", { months: TRIAL_DURATION_MONTHS })}</p>
          <p className="text-xs text-olive-700 mt-0.5 leading-relaxed">
            {t("subscription.trial.body")}
          </p>
          <Link to="/settings" className="inline-block text-xs font-black text-olive-800 underline underline-offset-4 mt-2 hover:text-olive-900 transition-colors">
            {t("subscription.trial.settingsLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
