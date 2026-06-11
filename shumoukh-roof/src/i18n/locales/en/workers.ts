// workers namespace keys — Workers page
export const workers = {
  // Roles (stored value stays in Arabic in Firestore, translated for display only)
  "workers.role.tiler": "Tiler",
  "workers.role.blacksmith": "Steel Fixer",
  "workers.role.assistant": "Assistant",
  "workers.role.laborer": "Laborer",
  "workers.role.supervisor": "Supervisor",
  "workers.role.driver": "Driver",

  // Page header
  "workers.title": "Workers",
  "workers.subtitle": "Manage workers and daily tasks",
  "workers.addWorker": "Add Worker",

  // Load error
  "workers.loadError": "Failed to load worker data",
  "workers.loadErrorHint": "Check your internet connection and try again",

  // Empty state
  "workers.emptyTitle": "No workers",
  "workers.emptyHint": "Add a new worker to get started",

  // Worker card
  "workers.deleteConfirm": "Delete worker \"{name}\"?",
  "workers.deleteAria": "Delete worker {name}",
  "workers.wagePerDay": "{wage} JOD/day",
  "workers.total": "Total",

  // Add modal
  "workers.name": "Name",
  "workers.role": "Role",
  "workers.phone": "Phone",
  "workers.project": "Project",
  "workers.wageLabel": "Wage (JOD/day)",
  "workers.daysLabel": "Days",
  "workers.adding": "Adding...",
} as const;
