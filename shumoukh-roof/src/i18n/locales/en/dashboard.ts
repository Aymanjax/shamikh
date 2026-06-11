// dashboard namespace keys — landing page (dashboard)
export const dashboard = {
  // Invoice status
  "dashboard.invoiceStatus.paid": "Paid",
  "dashboard.invoiceStatus.pending": "Pending",
  "dashboard.invoiceStatus.draft": "Draft",

  // Stats
  "dashboard.stats.paid": "Paid",
  "dashboard.stats.pending": "Pending",
  "dashboard.stats.workerCost": "Labor Cost",

  // Load error
  "dashboard.error.title": "Failed to load data",
  "dashboard.error.subtitle": "Check your internet connection and try again",
  "dashboard.error.retry": "Try Again",

  // Subscription alert
  "dashboard.subscription.expired": "Your subscription has expired — your data is safe. Renew now to restore all features.",
  "dashboard.subscription.expiring": { one: "Your subscription expires in 1 day.", other: "Your subscription expires in {n} days." },
  "dashboard.subscription.details": "Details",

  // Hero
  "dashboard.hero.welcomeNamed": "Welcome, {name}",
  "dashboard.hero.welcome": "Welcome",
  "dashboard.hero.online": "Online",
  "dashboard.hero.subtitle": "Your ledger today: projects, workers, and invoices in one place",
  "dashboard.hero.newCalculation": "New Calculation",

  // Recent projects and invoices
  "dashboard.recentProjects": "Recent Projects",
  "dashboard.recentInvoices": "Recent Invoices",
  "dashboard.viewAll": "View all",
  "dashboard.areaSqm": "{area} m²",
  "dashboard.noDrawing": "No drawing",
  "dashboard.tilesCount": { one: "{n} tile", other: "{n} tiles" },
  "dashboard.noInvoices.title": "No invoices yet",
  "dashboard.noInvoices.subtitle": "Create an invoice from the Invoices page or from any project's details",
  "dashboard.unnamedClient": "Unnamed",
} as const;
