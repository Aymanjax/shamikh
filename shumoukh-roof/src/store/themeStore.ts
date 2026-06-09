import { create } from "zustand";
import type {
  ThemeConfig,
  ThemeTokens,
  PageThemeOverride,
} from "../features/theme/themeTypes";
import { DEFAULT_THEME } from "../features/theme/defaultTheme";

interface ThemeState {
  theme: ThemeConfig;
  loaded: boolean;
  /** page id whose override is currently applied to the document */
  currentPageId: string;

  setTheme: (theme: ThemeConfig) => void;
  setCurrentPageId: (id: string) => void;
  updateTokens: (patch: Partial<ThemeTokens>) => void;
  updatePage: (pageId: string, patch: PageThemeOverride) => void;
  reset: () => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: DEFAULT_THEME,
  loaded: false,
  currentPageId: "dashboard",

  setTheme: (theme) => set({ theme, loaded: true }),
  setCurrentPageId: (id) => set({ currentPageId: id }),

  updateTokens: (patch) =>
    set((s) => ({ theme: { ...s.theme, tokens: { ...s.theme.tokens, ...patch } } })),

  updatePage: (pageId, patch) =>
    set((s) => ({
      theme: {
        ...s.theme,
        pages: {
          ...s.theme.pages,
          [pageId]: { ...s.theme.pages[pageId], ...patch },
        },
      },
    })),

  reset: () => set({ theme: { ...DEFAULT_THEME, pages: {} } }),
}));
