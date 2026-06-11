// admin namespace keys — admin panel: users, projects, invoices, suppliers, workers, announcements, config, audit log
export const admin = {
  // Main heading
  "admin.title": "Admin Panel",
  "admin.subtitle": "Manage the system, users, and subscriptions",

  // Tabs (the rest are reused from nav.*)
  "admin.tabs.dashboard": "Overview",
  "admin.tabs.users": "Users",
  "admin.tabs.suppliers": "Suppliers",
  "admin.tabs.announcements": "Announcements",
  "admin.tabs.audit": "Logs",

  // Shared elements across tabs
  "admin.loading": "Loading...",
  "admin.savingProgress": "Saving...",
  "admin.refresh": "Refresh",
  "admin.ban": "Ban",
  "admin.unban": "Unban",
  "admin.banned": "Banned",
  "admin.unnamed": "Unnamed",
  "admin.daysCount": "Number of days",
  "admin.searchByClient": "Search by client name...",

  // Project and invoice statuses
  "admin.status.draft": "Draft",
  "admin.status.pending": "Pending",
  "admin.status.paid": "Paid",
  "admin.status.sent": "Sent",
  "admin.status.approved": "Approved",
  "admin.status.in_progress": "In progress",
  "admin.status.completed": "Completed",

  // Subscription plans (translated at display time; stored values never change)
  "admin.plan.free_trial": "Free trial",
  "admin.plan.limited": "Limited",
  "admin.plan.basic": "Basic",
  "admin.plan.advanced": "Advanced",
  "admin.plan.none": "No subscription",

  // Users tab
  "admin.users.countLabel": "users",
  "admin.users.searchPlaceholder": "Search by name, email, or company",
  "admin.users.refreshList": "Refresh list",
  "admin.users.filter.active": "Active",
  "admin.users.filter.banned": "Banned",
  "admin.users.filter.admins": "Admins",
  "admin.users.bulkLabel": "Bulk subscription:",
  "admin.users.applying": "Applying...",
  "admin.users.applyToAll": "Apply to all",
  "admin.users.bulkConfirm": "Apply the \"{plan}\" subscription for {days} days to {count} users?",
  "admin.users.noName": "No name",
  "admin.users.role.admin": "Admin",
  "admin.users.role.user": "User",
  "admin.users.promote": "Promote",
  "admin.users.demote": "Demote",
  "admin.users.subscription": "Subscription",
  "admin.users.empty": "No matching users",

  // Overview tab
  "admin.dash.retry": "Retry",
  "admin.dash.paid": "Paid",
  "admin.dash.pending": "Outstanding",
  "admin.dash.onlineNow": "Online now",
  "admin.dash.todayLogins": "Today's logins",
  "admin.dash.invoiceStatus": "Invoice status",
  "admin.dash.financialSummary": "Financial summary",
  "admin.dash.totalRevenue": "Total revenue",
  "admin.dash.moreDetails": "More details",
  "admin.dash.suppliersCount": "Suppliers",
  "admin.dash.announcementsCount": "Announcements",
  "admin.dash.activeOffers": "Active offers",
  "admin.dash.paidInvoices": "Paid invoices",
  "admin.dash.online": "Online",

  // Projects tab
  "admin.projects.countLabel": "projects",
  "admin.projects.deleteConfirm": "Are you sure you want to delete the project \"{name}\"?",
  "admin.projects.itemsLabel": "Items:",
  "admin.projects.empty": "No projects",

  // Invoices tab
  "admin.invoices.countLabel": "invoices",
  "admin.invoices.due": "Outstanding",
  "admin.invoices.deleteConfirm": "Are you sure you want to delete the invoice \"{name}\"?",
  "admin.invoices.markPending": "Mark pending",
  "admin.invoices.markPaid": "Mark paid",
  "admin.invoices.empty": "No invoices",

  // Workers tab
  "admin.workers.countLabel": "workers",
  "admin.workers.searchPlaceholder": "Search by name or role...",
  "admin.workers.total": "Total workers",
  "admin.workers.totalWages": "Total wages",
  "admin.workers.totalDays": "Total days",
  "admin.workers.noPhone": "No phone",
  "admin.workers.projectLabel": "Project:",
  "admin.workers.empty": "No workers",

  // Suppliers tab
  "admin.suppliers.countLabel": "suppliers",
  "admin.suppliers.searchPlaceholder": "Search by name or area...",
  "admin.suppliers.approved": "Approved",
  "admin.suppliers.pending": "Pending",
  "admin.suppliers.approve": "Approve",
  "admin.suppliers.empty": "No suppliers",

  // Announcement types and priorities
  "admin.annType.info": "Info",
  "admin.annType.warning": "Warning",
  "admin.annType.update": "Update",
  "admin.annType.maintenance": "Maintenance",
  "admin.annPriority.low": "Low",
  "admin.annPriority.normal": "Normal",
  "admin.annPriority.high": "High",

  // Announcements tab
  "admin.ann.countLabel": "announcements",
  "admin.ann.searchPlaceholder": "Search announcements...",
  "admin.ann.loadFailed": "Failed to load announcements: {error}",
  "admin.ann.saveFailedFirebase": "Failed to save to Firebase — check the database permissions",
  "admin.ann.deleteConfirm": "Are you sure you want to delete this announcement?",
  "admin.ann.published": "Published",
  "admin.ann.empty": "No announcements",
  "admin.ann.emptyHint": "Add a new announcement to show it to users",

  // Announcement modal
  "admin.annModal.editTitle": "Edit announcement",
  "admin.annModal.newTitle": "New announcement",
  "admin.annModal.titleLabel": "Title",
  "admin.annModal.titlePlaceholder": "Announcement title...",
  "admin.annModal.contentLabel": "Content",
  "admin.annModal.contentPlaceholder": "Announcement content...",
  "admin.annModal.typeLabel": "Type",
  "admin.annModal.priorityLabel": "Priority",
  "admin.annModal.saveFailed": "Save failed, please try again",
  "admin.annModal.saved": "Saved",
  "admin.annModal.update": "Update",
  "admin.annModal.create": "Create",

  // Audit log tab (action labels are translated at display time; stored codes never change)
  "admin.audit.countLabel": "log entries",
  "admin.audit.searchPlaceholder": "Search the log...",
  "admin.audit.action.update_config": "Settings updated",
  "admin.audit.action.update_role": "Role changed",
  "admin.audit.action.toggle_ban": "Ban toggled",
  "admin.audit.action.set_subscription": "Subscription changed",
  "admin.audit.filter.ban": "Ban/unban",
  "admin.audit.filter.subscriptions": "Subscriptions",
  "admin.audit.filter.config": "Settings",
  "admin.audit.empty": "No log entries",

  // System config tab
  "admin.config.tabs.tiles": "Tile catalog",
  "admin.config.tabs.lengths": "Market lengths",
  "admin.config.tabs.orders": "Order items",
  "admin.config.tabs.extras": "Extra items",
  "admin.config.saveSuccess": "Settings saved successfully",
  "admin.config.tileUnit": "tiles",
  "admin.config.lengthUnit": "lengths",
  "admin.config.itemUnit": "items",
  "admin.config.extraUnit": "extra items",
  "admin.config.meterUnit": "m",
  "admin.config.origin": "Origin",
  "admin.config.countPerM": "Count/m",
  "admin.config.width": "Width",
  "admin.config.length": "Length",
  "admin.config.id": "ID",
  "admin.config.name": "Name",
  "admin.config.unit": "Unit",

  // Subscription modal
  "admin.subModal.planLabel": "Subscription plan",
  "admin.subModal.modeLabel": "Duration method",
  "admin.subModal.byDays": "By number of days",
  "admin.subModal.byDate": "By specific date",
  "admin.subModal.daysSuffix": "days",
  "admin.subModal.expectedExpiry": "Expected expiry date",
  "admin.subModal.save": "Save subscription",

  // Service messages
  "admin.api.requestFailed": "Request failed: {status}",
  "admin.api.updateFailed": "Update failed: {status}",
  "admin.api.actionFailed": "Operation failed: {status}",
  "admin.api.deleteFailed": "Delete failed: {status}",
  "admin.api.todayLoginsFailed": "Failed to fetch today's logins",
} as const;
