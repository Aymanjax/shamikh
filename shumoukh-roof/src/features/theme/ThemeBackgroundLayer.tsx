import { useThemeStore } from "../../store/themeStore";
import { computeBackgroundStyle } from "./applyTheme";

/**
 * Full-viewport fixed layer that paints the active page's background.
 * Sits behind all content (z-index 0; app content is positioned above it).
 * Falls back to --surface-bg when the page has no custom background, so the
 * default look is unchanged.
 */
export default function ThemeBackgroundLayer() {
  const theme = useThemeStore((s) => s.theme);
  const pageId = useThemeStore((s) => s.currentPageId);

  const bg = theme.pages[pageId]?.background;
  const custom = computeBackgroundStyle(bg);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor: "var(--surface-bg)",
        ...(custom || {}),
      }}
    />
  );
}
