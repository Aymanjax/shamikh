import { collections } from "./firestore";
import type { ThemeConfig, ThemeTokens } from "../types";

// ── Default "Shamikh" identity (graphite + bronze) ──
const DEFAULT_TOKENS: ThemeTokens = {
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
  tokens: DEFAULT_TOKENS,
  pages: {},
};

export async function getTheme(): Promise<ThemeConfig> {
  const snap = await collections.theme.get();
  if (snap.exists) {
    const stored = snap.data() as Partial<ThemeConfig>;
    // Merge over defaults so newly-added tokens always have a value.
    return {
      version: stored.version ?? DEFAULT_THEME.version,
      tokens: { ...DEFAULT_TOKENS, ...(stored.tokens || {}) },
      pages: stored.pages || {},
      updatedAt: stored.updatedAt,
    };
  }
  return DEFAULT_THEME;
}

export async function saveTheme(data: Partial<ThemeConfig>): Promise<void> {
  // Full overwrite (the admin UI always sends the complete theme). This avoids
  // stale page keys lingering after an override is removed — a deep merge would
  // keep them. "Remove background" is expressed as { type: "none" }, not key deletion.
  const merged: ThemeConfig = {
    version: data.version ?? DEFAULT_THEME.version,
    tokens: { ...DEFAULT_TOKENS, ...(data.tokens || {}) },
    pages: data.pages || {},
    updatedAt: new Date().toISOString(),
  };
  await collections.theme.set(merged);
}
