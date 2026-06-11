import { doc, getDoc, setDoc } from "firebase/firestore";
import type { ThemeConfig } from "./themeTypes";
import { DEFAULT_THEME } from "./defaultTheme";
import { db, auth } from "../../services/firebase";

const API = "/api/v1";
const THEME_DOC = ["config", "theme"] as const;

function mergeDefaults(data: Partial<ThemeConfig>): ThemeConfig {
  return {
    version: data.version ?? DEFAULT_THEME.version,
    tokens: { ...DEFAULT_THEME.tokens, ...(data.tokens || {}) },
    pages: data.pages || {},
    updatedAt: data.updatedAt,
  };
}

// Read directly from Firestore via the client SDK (works for any signed-in user;
// no backend deploy required). Rules: config/{document} read = authenticated.
async function fetchFromFirestore(): Promise<ThemeConfig | null> {
  try {
    const snap = await getDoc(doc(db, ...THEME_DOC));
    if (!snap.exists()) return null;
    return mergeDefaults(snap.data() as Partial<ThemeConfig>);
  } catch {
    return null;
  }
}

// Public, unauthenticated read via the API — only path available before login
// (Firestore rules require auth). Returns null if the endpoint isn't deployed.
async function fetchFromApi(): Promise<ThemeConfig | null> {
  try {
    const res = await fetch(`${API}/theme`);
    if (!res.ok) return null;
    return mergeDefaults((await res.json()) as Partial<ThemeConfig>);
  } catch {
    return null;
  }
}

/**
 * Load the active theme. Prefers Firestore when the user is signed in (no
 * backend dependency); falls back to the public API (pre-login) and finally to
 * the baked-in Shamikh defaults. Never throws.
 */
export async function loadTheme(): Promise<ThemeConfig> {
  if (auth.currentUser) {
    const fromDb = await fetchFromFirestore();
    if (fromDb) return fromDb;
  }
  const fromApi = await fetchFromApi();
  if (fromApi) return fromApi;
  const fromDbLate = await fetchFromFirestore();
  return fromDbLate || DEFAULT_THEME;
}

/** Alias kept for the boot path in main.tsx. */
export const fetchPublicTheme = loadTheme;

/**
 * Persist the theme. Writes directly to Firestore via the client SDK — admins
 * are allowed by the config/{document} write rule, so no backend redeploy is
 * needed for the control panel to work.
 */
export async function saveTheme(theme: ThemeConfig): Promise<void> {
  await setDoc(doc(db, ...THEME_DOC), {
    ...theme,
    updatedAt: new Date().toISOString(),
  });
}
