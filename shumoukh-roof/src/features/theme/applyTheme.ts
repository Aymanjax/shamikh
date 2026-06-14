import type { CSSProperties } from "react";
import type { PageBackground, ThemeTokens } from "./themeTypes";
import { getPattern } from "./themeTypes";

// Token key → CSS custom property name (the vars live in src/styles/theme.css).
export const TOKEN_TO_CSSVAR: Record<keyof ThemeTokens, string> = {
  surfaceBg: "--surface-bg",
  surfaceCard: "--surface-card",
  surfaceCardBorder: "--surface-card-border",
  surfaceElevated: "--surface-elevated",
  surfaceSidebar: "--surface-sidebar",
  surfaceNav: "--surface-nav",

  inkPrimary: "--ink-primary",
  inkSecondary: "--ink-secondary",
  inkMuted: "--ink-muted",
  inkInverse: "--ink-inverse",

  accentTerracotta: "--accent-terracotta",
  accentTerracottaSoft: "--accent-terracotta-soft",
  accentTerracottaBorder: "--accent-terracotta-border",
  accentTerracottaGlow: "--accent-terracotta-glow",

  accentOlive: "--accent-olive",
  accentOliveSoft: "--accent-olive-soft",
  accentOliveBorder: "--accent-olive-border",
  accentOliveGlow: "--accent-olive-glow",

  accentAmber: "--accent-amber",
  accentAmberSoft: "--accent-amber-soft",
  accentAmberBorder: "--accent-amber-border",
  accentAmberGlow: "--accent-amber-glow",

  accentRed: "--accent-red",
  accentRedSoft: "--accent-red-soft",
  accentRedBorder: "--accent-red-border",

  fontSans: "--font-sans",
  fontMono: "--font-mono",
};

/**
 * Set theme tokens as CSS variables on the given element (default <html>).
 * Idempotent — safe to call repeatedly (e.g. StrictMode double-invoke).
 */
export function applyTokens(
  tokens: Partial<ThemeTokens>,
  el: HTMLElement = document.documentElement
): void {
  (Object.keys(tokens) as (keyof ThemeTokens)[]).forEach((key) => {
    const cssVar = TOKEN_TO_CSSVAR[key];
    const value = tokens[key];
    if (cssVar && value != null) el.style.setProperty(cssVar, value);
  });
  // الواجهة الهندسية (القمرة) ذات أسطح ثابتة، لكنها تشتقّ ضوء الأداة من
  // لون الأكسنت الذي يختاره المستخدم. نمرّره عبر متغيّر مستقل لا تلمسه القمرة.
  if (tokens.accentTerracotta != null) {
    el.style.setProperty("--ck-accent", tokens.accentTerracotta);
  }
}

/**
 * Compute the inline style for a page background layer.
 * Returns null when there is no custom background (fall back to --surface-bg).
 */
export function computeBackgroundStyle(bg?: PageBackground): CSSProperties | null {
  if (!bg || bg.type === "none") return null;

  const opacity = bg.opacity ?? 1;

  if (bg.type === "color" && bg.color) {
    return { background: bg.color, opacity };
  }

  if (bg.type === "gradient" && bg.gradient) {
    return { background: bg.gradient, opacity };
  }

  if (bg.type === "image" && bg.imageDataUrl) {
    const repeat = bg.size === "repeat";
    return {
      backgroundImage: `url(${bg.imageDataUrl})`,
      backgroundSize: repeat ? "auto" : bg.size || "cover",
      backgroundPosition: "center",
      backgroundRepeat: repeat ? "repeat" : "no-repeat",
      opacity,
    };
  }

  if (bg.type === "pattern") {
    const pat = getPattern(bg.patternId);
    if (pat) {
      return {
        backgroundImage: pat.backgroundImage,
        backgroundSize: pat.backgroundSize,
        opacity,
      };
    }
  }

  return null;
}
