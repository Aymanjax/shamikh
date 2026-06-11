// projects namespace keys — Projects page
export const projects = {
  // Project statuses (stored value stays in English, translated for display only)
  "projects.status.draft": "Draft",
  "projects.status.sent": "Sent",
  "projects.status.approved": "Approved",
  "projects.status.in_progress": "In progress",
  "projects.status.completed": "Completed",

  // Page header
  "projects.title": "Projects",
  "projects.savedCount": { one: "1 project saved from the calculator", other: "{n} projects saved from the calculator" },
  "projects.subtitle": "Every project you save from the calculator appears here",
  "projects.newCalculation": "New Calculation",

  // Load error
  "projects.loadError": "Failed to load projects",
  "projects.loadErrorHint": "Check your internet connection and try again",
  "projects.retry": "Retry",

  // Search and filter
  "projects.searchPlaceholder": "Search by name, phone, or address",

  // Empty state
  "projects.emptyTitle": "No projects yet",
  "projects.noSearchResults": "No results match your search",
  "projects.emptyHint": "Draw the roof in the calculator and save it under the client's name to see it here",
  "projects.startFirstCalculation": "Start your first calculation",

  // Project row
  "projects.areaValue": "{value} m²",
  "projects.noDrawing": "No drawing",
  "projects.tilesCount": { one: "1 roof tile", other: "{n} roof tiles" },
  "projects.deleteConfirm": "Delete project \"{name}\"? This cannot be undone.",
  "projects.openInCalculator": "Open in calculator",
  "projects.openInCalculatorAria": "Open {name} in the calculator",
  "projects.deleteProject": "Delete project",
  "projects.deleteAria": "Delete {name}",

  // Project details
  "projects.area": "Area",
  "projects.tiles": "Roof Tiles",
  "projects.tileUnit": "tiles",
  "projects.slope": "Slope",
  "projects.numLegs": "Legs",
  "projects.estimatedCost": "Estimated Cost",
  "projects.projectStatus": "Project Status",
  "projects.createInvoice": "Create Invoice",
  "projects.invoiceCreated": "Created",
  "projects.creating": "Creating...",
} as const;
