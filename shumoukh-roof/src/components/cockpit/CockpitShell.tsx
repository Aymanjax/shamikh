// قشرة الواجهة الهندسية: خلفية مخطط، شريط أدوات علوي، والقائمة الدائرية.
// معزولة تحت .cockpit-root فلا تؤثر على بقية التطبيق.
import { useEffect, useState, type ReactNode } from "react";
import { useT } from "../../i18n";
import RadialCommandMenu from "./RadialCommandMenu";
import "../../styles/cockpit.css";

function clock(lang: "ar" | "en") {
  const d = new Date();
  const time = d.toLocaleTimeString(lang === "ar" ? "ar-JO" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString(lang === "ar" ? "ar-JO" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { time, date };
}

export default function CockpitShell({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  const t = useT();
  const lang = (document.documentElement.lang as "ar" | "en") || "ar";
  const [now, setNow] = useState(() => clock(lang));

  useEffect(() => {
    const id = setInterval(() => setNow(clock(lang)), 30_000);
    return () => clearInterval(id);
  }, [lang]);

  return (
    <div className="cockpit-root">
      <div className="cockpit-grid" />

      {/* شريط الأدوات العلوي */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-2.5 md:px-7"
        style={{ background: "rgba(14,17,22,0.85)", borderColor: "var(--ck-hair)", backdropFilter: "blur(8px)", zIndex: 20 }}
      >
        <div className="flex items-center gap-3">
          <span className="ck-live-dot" />
          <span className="mono text-[11px] font-bold tracking-[0.22em]" style={{ color: "var(--ck-ink)" }}>
            {t("cockpit.systemLabel")}
          </span>
          <span className="mono hidden text-[10px] font-bold tracking-[0.18em] sm:inline" style={{ color: "var(--ck-ok)" }}>
            ● {t("cockpit.online")}
          </span>
        </div>
        <div className="mono flex items-center gap-3 text-[11px] tabular-nums" style={{ color: "var(--ck-ink-dim)" }}>
          <span>{now.time}</span>
          <span style={{ color: "var(--ck-ink-mute)" }}>/</span>
          <span>{now.date}</span>
        </div>
      </header>

      {/* اللوحة المركزية (Interactive Canvas) */}
      <main
        className="relative z-[1] mx-auto w-full max-w-6xl px-4 pb-40 pt-6 md:px-7"
        style={{ zIndex: 1 }}
      >
        {children}
      </main>

      <RadialCommandMenu isAdmin={isAdmin} />
    </div>
  );
}
