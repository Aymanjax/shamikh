// @ts-nocheck
import { useState, useEffect } from "react";
import {
  Palette, Save, AlertCircle, Check, RotateCcw, Image as ImageIcon,
  Layers, SlidersHorizontal, Trash2, Upload,
} from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { fetchPublicTheme, saveTheme } from "../theme/themeService";
import { applyTokens, computeBackgroundStyle } from "../theme/applyTheme";
import { DEFAULT_TOKENS } from "../theme/defaultTheme";
import { TOKEN_GROUPS } from "../theme/colorTokenMeta";
import { PAGES, PRESET_PATTERNS } from "../theme/themeTypes";
import { compressImageToDataUrl, dataUrlSizeKb, isTooLarge } from "../theme/imageCompress";

type SubTab = "global" | "backgrounds" | "overrides";

const SUB_TABS: { key: SubTab; label: string; icon: any }[] = [
  { key: "global", label: "الألوان العامة", icon: Palette },
  { key: "backgrounds", label: "خلفيات الصفحات", icon: ImageIcon },
  { key: "overrides", label: "تجاوزات الصفحة", icon: SlidersHorizontal },
];

const BG_TYPES: { key: string; label: string }[] = [
  { key: "none", label: "بدون" },
  { key: "color", label: "لون" },
  { key: "gradient", label: "تدرج" },
  { key: "image", label: "صورة" },
  { key: "pattern", label: "نمط" },
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #161b22 0%, #1f2630 100%)",
  "linear-gradient(135deg, #b5773a 0%, #c79111 100%)",
  "linear-gradient(135deg, #2f6f6a 0%, #161b22 100%)",
  "linear-gradient(180deg, #eef1f4 0%, #dce1e7 100%)",
  "radial-gradient(circle at 30% 20%, #1f2630 0%, #0f141c 100%)",
];

export default function ThemeBrandingTab() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const updateTokens = useThemeStore((s) => s.updateTokens);
  const updatePage = useThemeStore((s) => s.updatePage);
  const reset = useThemeStore((s) => s.reset);

  const [subTab, setSubTab] = useState<SubTab>("global");
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Refresh from server on mount (store is already populated at boot).
  useEffect(() => {
    fetchPublicTheme()
      .then((t) => { setTheme(t); applyTokens(t.tokens); })
      .catch(() => { /* keep current */ });
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await saveTheme(useThemeStore.getState().theme);
      setSuccess("تم حفظ المظهر بنجاح");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const handleReset = () => {
    reset();
    applyTokens(DEFAULT_TOKENS);
    setSuccess("تمت الإعادة للافتراضي (لم يُحفظ بعد)");
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── Global token editing (live preview on app chrome) ──
  const setToken = (key: string, value: string) => {
    updateTokens({ [key]: value });
    applyTokens({ [key]: value });
  };

  // ── Per-page background ──
  const pageOverride = theme.pages[selectedPage] || {};
  const bg = pageOverride.background || { type: "none" };
  const setBackground = (next: any) => updatePage(selectedPage, { background: next });

  const handleImageUpload = async (file: File) => {
    setError("");
    try {
      const dataUrl = await compressImageToDataUrl(file);
      if (isTooLarge(dataUrl)) {
        setError(`الصورة كبيرة جداً (${dataUrlSizeKb(dataUrl)}KB) ولا تتسع في الحد. جرّب صورة أصغر أو بأبعاد أقل.`);
        return;
      }
      setBackground({ type: "image", imageDataUrl: dataUrl, size: "cover", opacity: 1 });
    } catch {
      setError("تعذّر معالجة الصورة");
    }
  };

  // ── Per-page token overrides ──
  const overrides = pageOverride.tokens || {};
  const setPageTokens = (tokens: any) => updatePage(selectedPage, { tokens });
  const toggleOverride = (key: string, enabled: boolean) => {
    const next = { ...overrides };
    if (enabled) next[key] = theme.tokens[key];
    else delete next[key];
    setPageTokens(next);
  };
  const setOverride = (key: string, value: string) => setPageTokens({ ...overrides, [key]: value });

  return (
    <div className="space-y-4">
      {/* Header: sub-tabs + actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {SUB_TABS.map((t) => (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`text-xs font-black px-3 py-1.5 rounded-lg transition border-2 flex items-center gap-1.5 ${
                subTab === t.key ? "bg-terracotta-500 text-white border-terracotta-500" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleReset}
            className="bg-white hover:bg-slate-50 text-ink-secondary py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border-2 border-slate-200">
            <RotateCcw className="w-4 h-4" /> إعادة تعيين
          </button>
          <button onClick={handleSave} disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border-2 border-emerald-600 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-600 font-bold text-sm p-4 rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5" /> {success}
        </div>
      )}

      {/* تنبيه: الواجهة الهندسية النشطة (القمرة) أسطحها ثابتة، ويسري منها لون الأكسنت فقط */}
      <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 text-xs font-bold p-3 rounded-xl flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          الواجهة الحالية هندسية داكنة بأسطح ثابتة. يسري منها <span className="underline">لون «التيراكوتا/الأكسنت»</span> فقط
          كـ«ضوء الأداة» في كل البرنامج — جرّب تغييره وستراه فورًا. أما الأسطح والخلفيات فمثبّتة في هذا المظهر.
        </span>
      </div>

      {/* ── Global colors ── */}
      {subTab === "global" && (
        <div className="space-y-4">
          {TOKEN_GROUPS.map((group) => (
            <div key={group.titleAr} className="glass-card p-4">
              <h3 className="text-sm font-black text-ink-primary mb-3">{group.titleAr}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.fields.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <label className="text-xs font-bold text-ink-secondary w-24 shrink-0">{f.labelAr}</label>
                    {f.type === "color" ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input type="color" value={theme.tokens[f.key]}
                          onChange={(e) => setToken(f.key, e.target.value)}
                          className="w-8 h-8 rounded border-2 border-slate-200 cursor-pointer p-0 shrink-0" />
                        <input value={theme.tokens[f.key]}
                          onChange={(e) => setToken(f.key, e.target.value)}
                          className="flex-1 min-w-0 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-terracotta-400 font-mono" dir="ltr" />
                      </div>
                    ) : (
                      <input value={theme.tokens[f.key]}
                        onChange={(e) => setToken(f.key, e.target.value)}
                        className="flex-1 min-w-0 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-terracotta-400 font-mono" dir="ltr" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Page backgrounds ── */}
      {subTab === "backgrounds" && (
        <div className="space-y-4">
          <PageSelector selectedPage={selectedPage} setSelectedPage={setSelectedPage} />

          <div className="glass-card p-4 space-y-4">
            {/* type chooser */}
            <div className="flex gap-1.5 flex-wrap">
              {BG_TYPES.map((t) => (
                <button key={t.key}
                  onClick={() => setBackground(t.key === "none" ? { type: "none" } : { ...bg, type: t.key })}
                  className={`text-xs font-black px-3 py-1.5 rounded-lg transition border-2 ${
                    bg.type === t.key ? "bg-olive-500 text-white border-olive-500" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {bg.type === "color" && (
              <div className="flex items-center gap-2">
                <input type="color" value={bg.color || "#eef1f4"}
                  onChange={(e) => setBackground({ type: "color", color: e.target.value, opacity: bg.opacity ?? 1 })}
                  className="w-10 h-10 rounded border-2 border-slate-200 cursor-pointer p-0" />
                <input value={bg.color || "#eef1f4"}
                  onChange={(e) => setBackground({ type: "color", color: e.target.value, opacity: bg.opacity ?? 1 })}
                  className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-terracotta-400 font-mono" dir="ltr" />
              </div>
            )}

            {bg.type === "gradient" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {GRADIENT_PRESETS.map((g) => (
                    <button key={g} onClick={() => setBackground({ type: "gradient", gradient: g, opacity: bg.opacity ?? 1 })}
                      style={{ background: g }}
                      className={`h-10 rounded-lg border-2 ${bg.gradient === g ? "border-terracotta-500" : "border-slate-200"}`} />
                  ))}
                </div>
                <input value={bg.gradient || ""} placeholder="linear-gradient(...)"
                  onChange={(e) => setBackground({ type: "gradient", gradient: e.target.value, opacity: bg.opacity ?? 1 })}
                  className="w-full bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-terracotta-400 font-mono" dir="ltr" />
              </div>
            )}

            {bg.type === "image" && (
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-xs font-black text-terracotta-600 bg-terracotta-50 hover:bg-terracotta-100 py-2 px-3 rounded-lg transition border-2 border-terracotta-200 cursor-pointer w-fit">
                  <Upload className="w-4 h-4" /> رفع صورة
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
                {bg.imageDataUrl && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <img src={bg.imageDataUrl} alt="" className="w-24 h-16 object-cover rounded-lg border-2 border-slate-200" />
                    <select value={bg.size || "cover"}
                      onChange={(e) => setBackground({ ...bg, size: e.target.value })}
                      className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none cursor-pointer font-medium">
                      <option value="cover">تغطية</option>
                      <option value="contain">احتواء</option>
                      <option value="repeat">تكرار</option>
                    </select>
                    <button onClick={() => setBackground({ type: "image", size: bg.size, opacity: bg.opacity })}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition border-2 border-transparent hover:border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {bg.type === "pattern" && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PRESET_PATTERNS.map((p) => (
                  <button key={p.id} onClick={() => setBackground({ type: "pattern", patternId: p.id, opacity: bg.opacity ?? 1 })}
                    className={`rounded-lg border-2 p-1.5 flex flex-col items-center gap-1 ${bg.patternId === p.id ? "border-terracotta-500" : "border-slate-200"}`}>
                    <span className="w-full h-10 rounded"
                      style={{ backgroundColor: "#eef1f4", backgroundImage: p.backgroundImage, backgroundSize: p.backgroundSize }} />
                    <span className="text-[10px] font-bold text-ink-muted">{p.labelAr}</span>
                  </button>
                ))}
              </div>
            )}

            {(bg.type === "image" || bg.type === "pattern") && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-ink-secondary w-20 shrink-0">الشفافية</label>
                <input type="range" min="0.05" max="1" step="0.05" value={bg.opacity ?? 1}
                  onChange={(e) => setBackground({ ...bg, opacity: parseFloat(e.target.value) })}
                  className="flex-1" />
                <span className="text-xs font-mono text-ink-muted w-10">{Math.round((bg.opacity ?? 1) * 100)}%</span>
              </div>
            )}

            {/* live preview */}
            <div>
              <span className="text-xs font-bold text-ink-muted">معاينة</span>
              <div className="mt-1 h-28 rounded-lg border-2 border-slate-200 overflow-hidden relative"
                style={{ background: "var(--surface-bg)" }}>
                <div style={{ position: "absolute", inset: 0, ...(computeBackgroundStyle(bg) || {}) }} />
                <div className="relative z-10 p-3">
                  <div className="glass-card p-3 inline-block">
                    <span className="text-xs font-black text-ink-primary">بطاقة نموذجية</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Per-page overrides ── */}
      {subTab === "overrides" && (
        <div className="space-y-4">
          <PageSelector selectedPage={selectedPage} setSelectedPage={setSelectedPage} />
          <p className="text-xs text-ink-muted flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> فعّل التخصيص لأي لون لتجاوز القيمة العامة في هذه الصفحة فقط.
          </p>
          {TOKEN_GROUPS.filter((g) => g.titleAr !== "الخطوط").map((group) => (
            <div key={group.titleAr} className="glass-card p-4">
              <h3 className="text-sm font-black text-ink-primary mb-3">{group.titleAr}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.fields.map((f) => {
                  const active = f.key in overrides;
                  return (
                    <div key={f.key} className="flex items-center gap-2">
                      <input type="checkbox" checked={active}
                        onChange={(e) => toggleOverride(f.key, e.target.checked)}
                        className="w-4 h-4 shrink-0 cursor-pointer accent-terracotta-500" />
                      <label className="text-xs font-bold text-ink-secondary w-24 shrink-0">{f.labelAr}</label>
                      {active && (f.type === "color" ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input type="color" value={overrides[f.key]}
                            onChange={(e) => setOverride(f.key, e.target.value)}
                            className="w-8 h-8 rounded border-2 border-slate-200 cursor-pointer p-0 shrink-0" />
                          <input value={overrides[f.key]}
                            onChange={(e) => setOverride(f.key, e.target.value)}
                            className="flex-1 min-w-0 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-terracotta-400 font-mono" dir="ltr" />
                        </div>
                      ) : (
                        <input value={overrides[f.key]}
                          onChange={(e) => setOverride(f.key, e.target.value)}
                          className="flex-1 min-w-0 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-terracotta-400 font-mono" dir="ltr" />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageSelector({ selectedPage, setSelectedPage }: any) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-black text-ink-secondary">الصفحة:</label>
      <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)}
        className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-3 text-xs text-ink-primary outline-none cursor-pointer font-bold">
        {PAGES.map((p) => (<option key={p.id} value={p.id}>{p.labelAr}</option>))}
      </select>
    </div>
  );
}
