import { create } from "zustand";

// تبديل لون الواجهة: داكن (القمرة الهندسية) ↔ فاتح (الورق الدافئ الأصلي)
// محفوظ في localStorage حتى يبقى اختيار المستخدم بعد الإغلاق.
const KEY = "uiLight";

interface UiThemeState {
  light: boolean;
  toggle: () => void;
  setLight: (v: boolean) => void;
}

const read = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

const write = (v: boolean) => {
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* وضع خاص */ }
};

export const useUiTheme = create<UiThemeState>()((set) => ({
  light: read(),
  toggle: () => set((s) => { const v = !s.light; write(v); return { light: v }; }),
  setLight: (v) => { write(v); set({ light: v }); },
}));
