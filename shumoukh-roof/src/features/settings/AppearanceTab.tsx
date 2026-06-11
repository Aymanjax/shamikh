import { useState, useEffect } from "react";
import { Palette, Sun, Moon, ArrowRight, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { useT, useLang, type Lang } from "../../i18n";

export default function AppearanceTab() {
  const t = useT();
  const [lang, setLang] = useLang();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("fontSize") || "normal");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const sizes: Record<string, string> = { small: "14px", normal: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizes[fontSize] || "16px";
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-terracotta-500 flex items-center justify-center shadow-lg shadow-terracotta-500/30">
            <Palette className="w-6 h-6 text-paper" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-ink-primary tracking-tight">{t("appearance.title")}</h1>
            <p className="text-sm text-ink-muted">{t("appearance.subtitle")}</p>
          </div>
        </div>
        <Link to="/settings" className="text-ink-muted hover:text-ink-secondary transition p-2 touch-target">
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="earth-card p-5 space-y-6">
        <div className="flex items-center justify-between gap-3 min-h-[48px]">
          <div className="flex items-center gap-3 min-w-0">
            {darkMode ? <Moon className="w-5 h-5 shrink-0 text-ink-secondary" /> : <Sun className="w-5 h-5 shrink-0 text-ink-secondary" />}
            <div className="min-w-0">
              <h3 className="text-sm font-black text-ink-primary">{t("appearance.darkMode")}</h3>
              <p className="text-xs text-ink-muted">{t("appearance.darkModeDesc")}</p>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)}
            className={`relative shrink-0 w-14 h-8 rounded-sm transition border-2 ${darkMode ? "bg-terracotta-500 border-terracotta-500" : "bg-earth-200 border-earth-300"}`}>
            <span className={`absolute top-0.5 w-7 h-7 bg-white rounded-full shadow transition ${darkMode ? "right-0.5" : "right-[1.35rem]"}`} />
          </button>
        </div>

        <div className="border-t-2 border-earth-200 pt-6">
          <h3 className="text-sm font-black text-ink-primary mb-3">{t("appearance.fontSize")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "small", label: t("appearance.fontSmall"), size: "14px" },
              { key: "normal", label: t("appearance.fontNormal"), size: "16px" },
              { key: "large", label: t("appearance.fontLarge"), size: "18px" },
            ].map((opt) => (
              <button key={opt.key} onClick={() => setFontSize(opt.key)}
                className={`py-3 px-4 rounded-sm border-2 text-sm font-black transition min-h-[48px] ${
                  fontSize === opt.key
                    ? "border-terracotta-400 bg-terracotta-100 text-terracotta-500"
                    : "border-earth-200 bg-white text-ink-muted hover:border-earth-300"
                }`}
                style={{ fontSize: opt.size }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-earth-200 pt-6">
          <div className="flex items-center gap-3 mb-3">
            <Languages className="w-5 h-5 shrink-0 text-ink-secondary" />
            <div className="min-w-0">
              <h3 className="text-sm font-black text-ink-primary">{t("appearance.language")}</h3>
              <p className="text-xs text-ink-muted">{t("appearance.languageDesc")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "ar", label: t("common.language.ar") },
              { key: "en", label: t("common.language.en") },
            ] as { key: Lang; label: string }[]).map((opt) => (
              <button key={opt.key} onClick={() => setLang(opt.key)}
                className={`py-3 px-4 rounded-sm border-2 text-sm font-black transition min-h-[48px] ${
                  lang === opt.key
                    ? "border-terracotta-400 bg-terracotta-100 text-terracotta-500"
                    : "border-earth-200 bg-white text-ink-muted hover:border-earth-300"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
