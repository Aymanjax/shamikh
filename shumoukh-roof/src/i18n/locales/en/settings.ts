// settings namespace keys — settings page and its tabs (profile, company, security, notifications, extra items)
export const settings = {
  // Main settings page
  "settings.subtitle": "Manage your account and work tools",
  "settings.backToSettings": "Back to settings",
  "settings.subscriptionLabel": "Subscription: {plan}",
  "settings.daysRemaining": { one: "1 day remaining", other: "{n} days remaining" },
  "settings.expiredRenew": "Expired — tap to renew",
  "settings.manageSubscription": "Manage subscription",
  "settings.group.account": "Account",
  "settings.group.tools": "Work Tools",
  "settings.group.app": "Application",
  "settings.appearance.desc": "Dark mode and font size",
  "settings.security.desc": "Password and account protection",
  "settings.extraItems.desc": "Extra items shown in the material calculator",
  "settings.notifications.desc": "In-app alerts",

  // Shared across tabs
  "settings.saving": "Saving...",
  "settings.done": "Done",
  "settings.notSignedIn": "You are not signed in",
  "settings.phoneLabel": "Phone number",
  "settings.errors.saveFailed": "Save failed, please try again",
  "settings.errors.network": "No internet connection, please try again",

  // Profile
  "settings.profile.title": "Profile",
  "settings.profile.subtitle": "Name, email, phone number",
  "settings.profile.signInPrompt": "Sign in to view your profile",
  "settings.profile.loadError": "Failed to load profile data",
  "settings.profile.nameLabel": "Name",
  "settings.profile.nameMax": "Maximum {n} characters",
  "settings.profile.nameRequired": "Name is required",
  "settings.profile.nameTooShort": "Name is too short",
  "settings.profile.phoneDigitsOnly": "Digits only",
  "settings.profile.emailLabel": "Email",
  "settings.profile.emailReadOnly": "Email cannot be changed",

  // Company
  "settings.company.title": "Company",
  "settings.company.subtitle": "Company name, address, logo",
  "settings.company.signInPrompt": "Sign in to view company settings",
  "settings.company.logo": "Company logo",
  "settings.company.logoHint": "jpg, png - appropriately sized",
  "settings.company.uploading": "Uploading...",
  "settings.company.nameLabel": "Company name",
  "settings.company.addressLabel": "Address",

  // Security
  "settings.security.title": "Security",
  "settings.security.subtitle": "Password, two-factor authentication",
  "settings.security.fillAllFields": "Please fill in all fields",
  "settings.security.newPasswordMinLength": "New password must be at least 6 characters",
  "settings.security.passwordMismatch": "New passwords do not match",
  "settings.security.wrongPassword": "Current password is incorrect",
  "settings.security.weakPassword": "Password is too weak - it must be at least 6 characters",
  "settings.security.genericError": "Something went wrong. Check your details and try again",
  "settings.security.passwordChanged": "Password changed successfully",
  "settings.security.currentPassword": "Current password",
  "settings.security.newPassword": "New password",
  "settings.security.confirmPassword": "Confirm new password",
  "settings.security.changePassword": "Change password",

  // Notifications
  "settings.notifications.title": "Notifications",
  "settings.notifications.subtitle": "Alert and notification settings",
  "settings.notifications.email": "Email alerts",
  "settings.notifications.emailDesc": "Receive project and invoice notifications by email",
  "settings.notifications.push": "App notifications",
  "settings.notifications.pushDesc": "Show notifications inside the app",
  "settings.notifications.invoices": "Invoice alerts",
  "settings.notifications.invoicesDesc": "Notify when an invoice is created or edited",
  "settings.notifications.announcements": "Announcement notifications",
  "settings.notifications.announcementsDesc": "Receive announcements and notifications from the admin",

  // Extra items
  "settings.extraItems.title": "Extra Materials",
  "settings.extraItems.subtitle": "Manage extra materials in the material calculator",
  "settings.extraItems.namePlaceholder": "Material name...",
  "settings.extraItems.maxItems": "Maximum of 100 items",
  "settings.extraItems.empty": "Add your first extra material",
} as const;
