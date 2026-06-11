import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { checkPermissions, getSubscriptionLabel } from "../utils/subscriptionUtils";
import { useT } from "../i18n";
import type { ReactNode } from "react";

type Props = {
  permission: "canView3DRoof" | "canManageWorkers" | "canLinkNationalInvoice";
  children: ReactNode;
  fallback?: ReactNode;
};

export default function SubscriptionGuard({ permission, children, fallback }: Props) {
  const t = useT();
  const subscription = useAuthStore((s) => s.subscription);
  const perms = checkPermissions(subscription ?? undefined);
  const allowed = perms[permission];

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const planLabel = getSubscriptionLabel(perms.subscriptionType);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-earth-100/95 z-10 flex items-center justify-center rounded-sm border border-earth-200">
        <div className="text-center p-6 max-w-xs">
          <div className="w-12 h-12 rounded-sm bg-terracotta-500 border-l-3 border-terracotta-300 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-paper" />
          </div>
          <h3 className="text-sm font-black text-earth-900 mb-1">
            {perms.isExpired ? t("subscription.guard.expiredTitle") : t("subscription.guard.lockedTitle")}
          </h3>
          <p className="text-xs text-earth-600 mb-4 leading-relaxed">
            {perms.isExpired
              ? t("subscription.guard.expiredBody")
              : t("subscription.guard.lockedBody", { plan: planLabel })}
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1.5 bg-olive-700 hover:bg-olive-800 active:bg-olive-900 text-earth-100 text-xs font-bold px-4 py-2.5 rounded-sm border-r-3 border-olive-900 transition-colors"
          >
            {t("subscription.guard.viewPlans")}
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      <div className="opacity-30 pointer-events-none select-none" aria-hidden="true">{children}</div>
    </div>
  );
}
