import type { ThemeConfig } from "./themeTypes";
import { DEFAULT_THEME } from "./defaultTheme";

const API = "/api/v1";
const token = () => localStorage.getItem("token") || "";

/** Public read — no auth header — so the theme applies before login. */
export async function fetchPublicTheme(): Promise<ThemeConfig> {
  const res = await fetch(`${API}/theme`);
  if (!res.ok) throw new Error(`فشل تحميل المظهر: ${res.status}`);
  const data = (await res.json()) as Partial<ThemeConfig>;
  return {
    version: data.version ?? DEFAULT_THEME.version,
    tokens: { ...DEFAULT_THEME.tokens, ...(data.tokens || {}) },
    pages: data.pages || {},
    updatedAt: data.updatedAt,
  };
}

/** Admin write — requires the auth token. */
export async function saveTheme(theme: ThemeConfig): Promise<void> {
  const res = await fetch(`${API}/admin/theme`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(theme),
  });
  if (!res.ok) throw new Error(`فشل حفظ المظهر: ${res.status}`);
}
