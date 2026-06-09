import type { ThemeConfig, ThemeTokens } from "./themeTypes";

// Default "Shamikh" identity (graphite + bronze). Kept in sync with the values
// baked into src/styles/theme.css :root and api/src/services/themeService.ts.
export const DEFAULT_TOKENS: ThemeTokens = {
  surfaceBg: "#eef1f4",
  surfaceCard: "#ffffff",
  surfaceCardBorder: "1px solid #dce1e7",
  surfaceElevated: "#ffffff",
  surfaceSidebar: "#161b22",
  surfaceNav: "#1f2630",

  inkPrimary: "#15202b",
  inkSecondary: "#44505e",
  inkMuted: "#6b7682",
  inkInverse: "#f5f7fa",

  accentTerracotta: "#b5773a",
  accentTerracottaSoft: "#f6ecdd",
  accentTerracottaBorder: "#c98e4f",
  accentTerracottaGlow: "rgba(181, 119, 58, 0.14)",

  accentOlive: "#2f6f6a",
  accentOliveSoft: "#d9ecea",
  accentOliveBorder: "#3c8a83",
  accentOliveGlow: "rgba(47, 111, 106, 0.14)",

  accentAmber: "#c79111",
  accentAmberSoft: "#faf0cf",
  accentAmberBorder: "#dca81f",
  accentAmberGlow: "rgba(199, 145, 17, 0.14)",

  accentRed: "#c2362b",
  accentRedSoft: "#fae3e0",
  accentRedBorder: "#d4564a",

  fontSans: "'Noto Kufi Arabic', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
};

export const DEFAULT_THEME: ThemeConfig = {
  version: 1,
  tokens: { ...DEFAULT_TOKENS },
  pages: {},
};
