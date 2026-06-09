import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";
import { applyTokens } from "./applyTheme";
import { pageIdFromPath } from "./themeTypes";

/**
 * Applies the active page's theme on every route change:
 * resolves the page id, deep-merges its token overrides over the global tokens,
 * writes the CSS variables, and records the current page id (used by
 * ThemeBackgroundLayer to paint the page background).
 */
export function useApplyPageTheme(): void {
  const { pathname } = useLocation();
  const theme = useThemeStore((s) => s.theme);
  const setCurrentPageId = useThemeStore((s) => s.setCurrentPageId);

  useEffect(() => {
    const pageId = pageIdFromPath(pathname);
    setCurrentPageId(pageId);
    const pageTokens = theme.pages[pageId]?.tokens || {};
    applyTokens({ ...theme.tokens, ...pageTokens });
  }, [pathname, theme, setCurrentPageId]);
}
