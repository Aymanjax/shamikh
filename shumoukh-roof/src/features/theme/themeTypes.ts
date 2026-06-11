// Shared theme/branding shape — mirrors api/src/types/index.ts.

export interface ThemeTokens {
  surfaceBg: string;
  surfaceCard: string;
  surfaceCardBorder: string;
  surfaceElevated: string;
  surfaceSidebar: string;
  surfaceNav: string;

  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  inkInverse: string;

  accentTerracotta: string;
  accentTerracottaSoft: string;
  accentTerracottaBorder: string;
  accentTerracottaGlow: string;

  accentOlive: string;
  accentOliveSoft: string;
  accentOliveBorder: string;
  accentOliveGlow: string;

  accentAmber: string;
  accentAmberSoft: string;
  accentAmberBorder: string;
  accentAmberGlow: string;

  accentRed: string;
  accentRedSoft: string;
  accentRedBorder: string;

  fontSans: string;
  fontMono: string;
}

export type BackgroundType = "none" | "color" | "gradient" | "image" | "pattern";

export interface PageBackground {
  type: BackgroundType;
  color?: string;
  gradient?: string;
  imageDataUrl?: string;
  patternId?: string;
  size?: "cover" | "contain" | "repeat" | "auto";
  opacity?: number;
}

export interface PageThemeOverride {
  background?: PageBackground;
  tokens?: Partial<ThemeTokens>;
}

export interface ThemeConfig {
  version: number;
  tokens: ThemeTokens;
  pages: Record<string, PageThemeOverride>;
  updatedAt?: string;
}

// ── Pages that can be themed individually ──
export interface PageMeta {
  id: string;
  labelAr: string;
  /** route pathname used to resolve the active page */
  path: string;
}

export const PAGES: PageMeta[] = [
  { id: "login", labelAr: "تسجيل الدخول", path: "/login" },
  { id: "register", labelAr: "إنشاء حساب", path: "/register" },
  { id: "dashboard", labelAr: "الرئيسية", path: "/" },
  { id: "calculator", labelAr: "حساب البضاعة", path: "/calculator" },
  { id: "projects", labelAr: "المشاريع", path: "/projects" },
  { id: "invoices", labelAr: "الفواتير", path: "/invoices" },
  { id: "workers", labelAr: "العمال", path: "/workers" },
  { id: "settings", labelAr: "الإعدادات", path: "/settings" },
  { id: "admin", labelAr: "لوحة التحكم", path: "/admin" },
];

/** Resolve a route pathname to a page id. */
export function pageIdFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "dashboard";
  const seg = "/" + pathname.split("/").filter(Boolean)[0];
  const match = PAGES.find((p) => p.path === seg);
  return match ? match.id : "dashboard";
}

// ── Preset background patterns (CSS-only, theme-aware where possible) ──
export interface PatternDef {
  id: string;
  labelAr: string;
  /** CSS background-image value */
  backgroundImage: string;
  backgroundSize?: string;
}

export const PRESET_PATTERNS: PatternDef[] = [
  {
    id: "ambient-grid",
    labelAr: "شبكة هندسية",
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(21,32,43,0.04) 47px, rgba(21,32,43,0.04) 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(21,32,43,0.04) 47px, rgba(21,32,43,0.04) 48px)",
  },
  {
    id: "blueprint",
    labelAr: "مخطط هندسي",
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(47,111,106,0.08) 9px, rgba(47,111,106,0.08) 10px), repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(47,111,106,0.08) 9px, rgba(47,111,106,0.08) 10px), repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(47,111,106,0.16) 49px, rgba(47,111,106,0.16) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(47,111,106,0.16) 49px, rgba(47,111,106,0.16) 50px)",
  },
  {
    id: "diagonal-hatch",
    labelAr: "خطوط مائلة",
    backgroundImage:
      "repeating-linear-gradient(45deg, rgba(181,119,58,0.07) 0, rgba(181,119,58,0.07) 1px, transparent 1px, transparent 12px)",
  },
  {
    id: "dots",
    labelAr: "نقاط",
    backgroundImage: "radial-gradient(rgba(21,32,43,0.10) 1.4px, transparent 1.4px)",
    backgroundSize: "20px 20px",
  },
  {
    id: "topo",
    labelAr: "تضاريس",
    backgroundImage:
      "radial-gradient(120% 120% at 0% 0%, rgba(47,111,106,0.10) 0%, transparent 45%), radial-gradient(120% 120% at 100% 0%, rgba(181,119,58,0.10) 0%, transparent 45%), radial-gradient(140% 140% at 50% 100%, rgba(199,145,17,0.08) 0%, transparent 50%)",
  },
];

export function getPattern(id?: string): PatternDef | undefined {
  return PRESET_PATTERNS.find((p) => p.id === id);
}
