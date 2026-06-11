import { t } from "../i18n";

export const SUBSCRIPTION_TYPES = {
  FREE_TRIAL: "free_trial",
  LIMITED: "limited",
  BASIC: "basic",
  ADVANCED: "advanced",
} as const;

export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[keyof typeof SUBSCRIPTION_TYPES];

export const PLAN_OPTIONS = [
  { value: SUBSCRIPTION_TYPES.FREE_TRIAL, label: "فترة مجانية", color: "amber" },
  { value: SUBSCRIPTION_TYPES.LIMITED, label: "محدودة", color: "gray" },
  { value: SUBSCRIPTION_TYPES.BASIC, label: "أساسية", color: "emerald" },
  { value: SUBSCRIPTION_TYPES.ADVANCED, label: "متقدمة", color: "amber" },
];

export const TRIAL_DURATION_MONTHS = 6;

export function toJsDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toMillis === "function") return new Date(value.toMillis());
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (value.seconds !== undefined) return new Date(value.seconds * 1000);
  return null;
}

export function getSubscriptionLabel(type?: string) {
  const keyMap: Record<string, string> = {
    free_trial: "subscription.type.freeTrial",
    limited: "subscription.type.limited",
    basic: "subscription.type.basic",
    advanced: "subscription.type.advanced",
  };
  return t(keyMap[type || ""] || "subscription.type.none");
}

export function getDaysRemaining(subscriptionEndDate: any): number {
  const end = toJsDate(subscriptionEndDate);
  if (!end) return 0;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialActive(trialStartDate: any): boolean {
  const endDate = toJsDate(trialStartDate);
  if (!endDate) return false;
  const end = new Date(endDate);
  end.setMonth(end.getMonth() + TRIAL_DURATION_MONTHS);
  return end.getTime() > Date.now();
}

export type Permissions = {
  canView3DRoof: boolean;
  canManageWorkers: boolean;
  canLinkNationalInvoice: boolean;
  subscriptionType: string;
  daysRemaining: number;
  isExpired: boolean;
};

export function checkPermissions(sub?: {
  subscriptionType?: string;
  trialStartDate?: any;
  subscriptionEndDate?: any;
}): Permissions {
  const type = sub?.subscriptionType || SUBSCRIPTION_TYPES.LIMITED;
  const trialActive = isTrialActive(sub?.trialStartDate);
  const effectiveType = trialActive && type === SUBSCRIPTION_TYPES.FREE_TRIAL
    ? SUBSCRIPTION_TYPES.FREE_TRIAL : type;
  const endDate = toJsDate(sub?.subscriptionEndDate);
  const isExpired = endDate ? endDate < new Date() : false;
  const allowed = (types: string[]) => types.includes(effectiveType) && !isExpired && effectiveType !== SUBSCRIPTION_TYPES.LIMITED;

  return {
    canView3DRoof: allowed([SUBSCRIPTION_TYPES.FREE_TRIAL, SUBSCRIPTION_TYPES.BASIC, SUBSCRIPTION_TYPES.ADVANCED]),
    canManageWorkers: allowed([SUBSCRIPTION_TYPES.FREE_TRIAL, SUBSCRIPTION_TYPES.ADVANCED]),
    canLinkNationalInvoice: allowed([SUBSCRIPTION_TYPES.FREE_TRIAL, SUBSCRIPTION_TYPES.ADVANCED]),
    subscriptionType: effectiveType,
    daysRemaining: getDaysRemaining(sub?.subscriptionEndDate),
    isExpired,
  };
}
