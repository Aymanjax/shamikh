// @ts-nocheck
import { Lock, Crown } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { checkPermissions } from "../utils/subscriptionUtils";
import { getSubscriptionLabel } from "../utils/subscriptionUtils";
import type { ReactNode } from "react";

type Props = {
  permission: "canView3DRoof" | "canManageWorkers" | "canLinkNationalInvoice";
  children: ReactNode;
  fallback?: ReactNode;
};

export default function SubscriptionGuard({ permission, children, fallback }: Props) {
  const subscription = useAuthStore((s) => s.subscription);
  const perms = checkPermissions(subscription);
  const allowed = perms[permission];

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const planLabel = getSubscriptionLabel(perms.subscriptionType);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-slate-100/95 z-10 flex items-center justify-center rounded-2xl">
        <div className="text-center p-6 max-w-xs">
          <div className="w-14 h-14 rounded-xl bg-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-600/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-sm font-black text-ink-primary mb-1">هذه الميزة مقفولة</h3>
          <p className="text-xs text-ink-muted mb-3 font-medium">
            خطتك الحالية ({planLabel}) لا تدعم هذه الميزة. رقّي خطتك للاستفادة.
          </p>
          <a href="https://wa.me/962788859723" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition border-2 border-amber-600">
            <Crown className="w-4 h-4" /> ترقية الاشتراك
          </a>
        </div>
      </div>
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
    </div>
  );
}
