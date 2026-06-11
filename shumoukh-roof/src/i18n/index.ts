// نظام الترجمة — عربي/إنجليزي مع تبديل الاتجاه RTL/LTR
// بدون مكتبات خارجية: قواميس مفاتيح + مخزن Zustand + دعم الجمع والتعويض {var}
import { useMemo } from "react";
import { create } from "zustand";
import { ar } from "./locales/ar";
import { en } from "./locales/en";

export type Lang = "ar" | "en";

type DictValue = string | Record<string, string>;
type Dict = Record<string, DictValue>;

const dicts: Record<Lang, Dict> = { ar: ar as Dict, en: en as Dict };

const STORAGE_KEY = "lang";

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch { /* بيئة بدون تخزين */ }
  return "ar";
}

export function applyLangToDocument(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()((set) => ({
  lang: detectInitialLang(),
  setLang: (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* تجاهل */ }
    applyLangToDocument(lang);
    set({ lang });
  },
}));

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

const pluralRulesCache: Partial<Record<Lang, Intl.PluralRules>> = {};
function pluralRules(lang: Lang): Intl.PluralRules {
  if (!pluralRulesCache[lang]) pluralRulesCache[lang] = new Intl.PluralRules(lang);
  return pluralRulesCache[lang]!;
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = dicts[lang][key] ?? dicts.ar[key];
  if (entry === undefined) return key;
  if (typeof entry === "string") return interpolate(entry, vars);
  // قيمة جمع: نختار الصيغة حسب قواعد اللغة (zero/one/two/few/many/other)
  const n = typeof vars?.n === "number" ? vars.n : 0;
  const category = n === 0 && entry.zero !== undefined ? "zero" : pluralRules(lang).select(n);
  const template = entry[category] ?? entry.other ?? Object.values(entry)[0] ?? key;
  return interpolate(template, vars);
}

// للاستخدام خارج React (خدمات، أدوات): يقرأ اللغة الحالية وقت الاستدعاء
export function t(key: string, vars?: Record<string, string | number>): string {
  return translate(useLangStore.getState().lang, key, vars);
}

export function getLang(): Lang {
  return useLangStore.getState().lang;
}

// داخل المكوّنات: يعيد دالة ترجمة تتجدد عند تغيير اللغة
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return useMemo(
    () => (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );
}

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return [lang, setLang];
}

// تاريخ منسّق حسب اللغة الحالية
export function formatDate(value: Date, opts?: Intl.DateTimeFormatOptions): string {
  const lang = getLang();
  return value.toLocaleDateString(lang === "ar" ? "ar-JO" : "en-GB", opts);
}
