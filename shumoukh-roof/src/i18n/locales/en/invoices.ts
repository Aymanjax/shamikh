// invoices namespace keys — Invoices page
export const invoices = {
  // Invoice statuses (stored value stays in English, translated for display only)
  "invoices.status.paid": "Paid",
  "invoices.status.pending": "Pending",
  "invoices.status.draft": "Draft",

  // Page header
  "invoices.title": "Invoices",
  "invoices.subtitle": "Manage invoices and quotations",
  "invoices.newInvoice": "New Invoice",

  // Load error
  "invoices.loadError": "Failed to load invoices",
  "invoices.loadErrorHint": "Check your internet connection and try again",

  // Search and counter
  "invoices.searchPlaceholder": "Search by client or project name",
  "invoices.count": { zero: "No invoices", one: "1 invoice", other: "{n} invoices" },

  // Empty state
  "invoices.emptyTitle": "No invoices",
  "invoices.emptyHint": "Record your first invoice to track your project payments",

  // Invoice row
  "invoices.openProjectInCalculator": "Open project in calculator",
  "invoices.changeStatusTo": "Change status to {status}",
  "invoices.downloadInvoice": "Download invoice",
  "invoices.deleteInvoice": "Delete invoice",
  "invoices.deleteConfirm": "Delete this invoice? This cannot be undone.",

  // Create modal
  "invoices.client": "Client",
  "invoices.clientPlaceholder": "Client name",
  "invoices.clientRequired": "Client name is required",
  "invoices.project": "Project",
  "invoices.projectPlaceholder": "Optional — project name",
  "invoices.amountLabel": "Amount (JOD)",
  "invoices.amountPlaceholder": "0",
  "invoices.create": "Create Invoice",
  "invoices.creating": "Creating...",
} as const;
