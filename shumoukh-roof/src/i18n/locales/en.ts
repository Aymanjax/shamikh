// English dictionary — flat dotted keys (namespace.key)
// Plural values are objects { zero, one, two, few, many, other } selected by language rules
export const en = {
  // Identity
  "app.name": "Shumoukh ERP",
  "app.tagline": "Roof Tile Project Management",

  // Navigation
  "nav.home": "Home",
  "nav.calculator": "Material Calculator",
  "nav.projects": "Projects",
  "nav.invoices": "Invoices",
  "nav.workers": "Workers",
  "nav.subscription": "Subscription",
  "nav.settings": "Settings",
  "nav.admin": "Admin",
  "nav.logout": "Log out",

  // Common actions
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.add": "Add",
  "common.search": "Search",
  "common.close": "Close",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.loading": "Loading…",
  "common.language.ar": "العربية",
  "common.language.en": "English",

  // Appearance & settings
  "appearance.title": "Appearance",
  "appearance.subtitle": "Dark mode, font size, language",
  "appearance.darkMode": "Dark mode",
  "appearance.darkModeDesc": "Switch the app to a dark theme",
  "appearance.fontSize": "Font size",
  "appearance.fontSmall": "Small",
  "appearance.fontNormal": "Medium",
  "appearance.fontLarge": "Large",
  "appearance.language": "Language",
  "appearance.languageDesc": "Application interface language",

  // Auth
  "auth.email": "Email",
  "auth.password": "Password",

  // Plural & interpolation samples
  "common.itemsCount": { zero: "No items", one: "One item", other: "{n} items" },
  "common.greeting": "Hello {name}",
} as const;
