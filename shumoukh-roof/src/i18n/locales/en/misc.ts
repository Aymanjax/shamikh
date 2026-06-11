// misc namespace keys — command bar, notifications, empty states, error boundary, project display
export const misc = {
  // Floating command bar
  "misc.nav.openMenu": "Open menu",
  "misc.nav.logoutShort": "Logout",
  "misc.nav.collapseShort": "Hide",

  // Notification bell
  "misc.notifications.title": "Notifications",
  "misc.notifications.unread": "{n} unread",
  "misc.notifications.empty": "No notifications",

  // Empty projects state
  "misc.roofEmpty.title": "No projects yet",
  "misc.roofEmpty.subtitle": "Start with a material calculation and your project will appear here automatically",
  "misc.roofEmpty.cta": "Calculate materials now",

  // Error boundary
  "misc.errorBoundary.title": "An unexpected error occurred",
  "misc.errorBoundary.message": "The page could not be loaded. Please try again.",
  "misc.errorBoundary.reload": "Reload",

  // Project display — project statuses and name
  "misc.projectStatus.draft": "Draft",
  "misc.projectStatus.sent": "Sent",
  "misc.projectStatus.approved": "Approved",
  "misc.projectStatus.in_progress": "In Progress",
  "misc.projectStatus.completed": "Completed",
  "misc.project.unnamed": "Unnamed project",
} as const;
