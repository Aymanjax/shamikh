// subscription namespace keys — subscription page, guard, and utils
export const subscription = {
  // Subscription type labels (Firestore-stored codes are unchanged)
  "subscription.type.freeTrial": "Free Trial",
  "subscription.type.limited": "Limited",
  "subscription.type.basic": "Basic",
  "subscription.type.advanced": "Advanced",
  "subscription.type.none": "No subscription",

  // Page header
  "subscription.page.subtitle": "Your current plan status and what each plan includes",

  // Status card
  "subscription.status.active": "Active",
  "subscription.cta.upgradeWhatsApp": "Upgrade plan via WhatsApp",
  "subscription.cta.renewWhatsApp": "Renew subscription via WhatsApp",
  "subscription.stats.daysRemaining": "Days remaining",
  "subscription.stats.dayUnit": { one: "day", other: "days" },
  "subscription.stats.endDate": "Expiry date",
  "subscription.stats.elapsed": "Time used",
  "subscription.stats.elapsedAria": "Percentage of subscription period used",
  "subscription.alert.expired": "Your subscription has expired. Renew now so you don't lose access to advanced features — your data is safe and will not be deleted.",
  "subscription.alert.expiringSoon": {
    one: "Your subscription expires in 1 day. Contact us to renew before features are interrupted.",
    other: "Your subscription expires in {n} days. Contact us to renew before features are interrupted.",
  },

  // Plans
  "subscription.plans.freeTrial.name": "Free Trial",
  "subscription.plans.freeTrial.note": "{months} months for every new account",
  "subscription.plans.basic.name": "Basic",
  "subscription.plans.basic.note": "For individual contractors",
  "subscription.plans.advanced.name": "Advanced",
  "subscription.plans.advanced.note": "For crews and companies",

  // Plan comparison table
  "subscription.table.title": "What each plan includes",
  "subscription.table.feature": "Feature",
  "subscription.table.currentPlan": "Your current plan",
  "subscription.table.available": "Available",

  // Features
  "subscription.feature.calc": "Tile and steel quantity calculation",
  "subscription.feature.saveProjects": "Save projects and reopen them in the calculator",
  "subscription.feature.invoices": "Invoices and price quotes",
  "subscription.feature.roof3d": "3D roof preview",
  "subscription.feature.workers": "Worker and wage management",
  "subscription.feature.nationalInvoice": "National e-invoice integration",

  // Free trial note
  "subscription.trial.title": "Every new account starts with a {months}-month free trial",
  "subscription.trial.body": "During the free trial all features are unlocked with no restrictions: the calculator, 3D preview, workers, and invoices. As the trial nears its end, contact us to choose the plan that fits your business.",
  "subscription.trial.settingsLink": "Account settings",

  // Subscription guard
  "subscription.guard.expiredTitle": "Your subscription has expired",
  "subscription.guard.lockedTitle": "This feature is not available on your plan",
  "subscription.guard.expiredBody": "Your data is safe — renew your subscription to restore full access.",
  "subscription.guard.lockedBody": "Your current plan ({plan}) does not include this feature.",
  "subscription.guard.viewPlans": "View subscription plans",
} as const;
