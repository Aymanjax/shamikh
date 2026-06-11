// لوحة القيادة الهندسية — عرض البيانات كأدوات قياس لا كبطاقات مكرّرة.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { FolderOpen, FileText, HardHat, ArrowUpLeft, PencilRuler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listDocuments } from "../../lib/firestoreService";
import { fetchProjects } from "../../services/projectService";
import { useAuthStore } from "../../store/authStore";
import { projectName, projectArea } from "../../utils/projectDisplay";
import type { SavedProject } from "../../utils/projectDisplay";
import { useT } from "../../i18n";

interface Invoice { id: string; client?: string; project?: string; status?: string; amount?: number }
interface Worker { id: string; days?: number; wage?: number }

const STATUS_TONE: Record<string, string> = {
  draft: "var(--ck-ink-mute)",
  sent: "var(--ck-laser)",
  approved: "var(--ck-warn)",
  in_progress: "var(--ck-laser-hot)",
  completed: "var(--ck-ok)",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// مسطرة قياس أفقية — شريط علامات هندسي
function Ruler({ ticks = 48 }: { ticks?: number }) {
  return (
    <div className="flex h-6 items-end gap-px overflow-hidden" aria-hidden>
      {Array.from({ length: ticks }).map((_, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: i % 5 === 0 ? "100%" : "45%",
            background: i % 5 === 0 ? "var(--ck-hair-strong)" : "var(--ck-hair)",
          }}
        />
      ))}
    </div>
  );
}

function Module({
  icon: Icon, label, value, unit, tone = "var(--ck-ink)", className = "", onClick,
}: {
  icon: typeof FolderOpen; label: string; value: string; unit?: string; tone?: string; className?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`ck-panel ck-panel--raised ck-tick group flex flex-col justify-between gap-3 p-4 text-start transition-colors ${className}`}
      style={{ minHeight: 116 }}
    >
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] font-bold tracking-[0.14em]" style={{ color: "var(--ck-ink-dim)" }}>
          {label}
        </span>
        <Icon className="h-4 w-4 transition-colors group-hover:opacity-100" style={{ color: "var(--ck-ink-mute)" }} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="mono text-3xl font-black leading-none tabular-nums" style={{ color: tone }}>{value}</span>
        {unit && <span className="mono text-[10px] font-bold" style={{ color: "var(--ck-ink-mute)" }}>{unit}</span>}
      </div>
    </button>
  );
}

// لوحة القيادة — تُعرض داخل قشرة AppLayout (CockpitShell)
export default function CockpitConsole() {
  const t = useT();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const uid = useAuthStore((s) => s.user?.uid);

  const { data: projects = [] } = useQuery<SavedProject[]>({
    queryKey: ["projects", uid], queryFn: () => fetchProjects(uid) as Promise<SavedProject[]>, enabled: !!uid, staleTime: 30_000,
  });
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices", uid], queryFn: () => listDocuments("invoices") as Promise<Invoice[]>, enabled: !!uid, staleTime: 30_000,
  });
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["workers", uid], queryFn: () => listDocuments("workers") as Promise<Worker[]>, enabled: !!uid, staleTime: 30_000,
  });

  const m = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
    const pending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount || 0), 0);
    const wages = workers.reduce((s, w) => s + (w.days || 0) * (w.wage || 0), 0);
    const active = projects.filter((p) => p.status === "in_progress" || p.status === "approved").length;
    const total = paid + pending || 1;
    return { paid, pending, wages, active, paidPct: Math.round((paid / total) * 100) };
  }, [invoices, workers, projects]);

  const reveal = (i: number) => ({
    initial: reduce ? {} : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: reduce ? 0 : 0.06 * i, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="space-y-5">
      {/* ترويسة القسم */}
      <motion.div {...reveal(0)} className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--ck-ink)" }}>{t("cockpit.title")}</h1>
          <div className="mono mt-1 flex items-center gap-2 text-[10px] tracking-[0.14em]" style={{ color: "var(--ck-ink-mute)" }}>
            <span>SHMK</span><span style={{ color: "var(--ck-laser)" }}>—</span><span>{t("cockpit.modules").toUpperCase?.() ?? t("cockpit.modules")}</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/calculator")}
          className="mono group flex items-center gap-2 border px-3.5 py-2.5 text-[11px] font-bold tracking-wide transition-colors"
          style={{ borderRadius: 2, borderColor: "var(--ck-laser)", color: "var(--ck-laser-hot)", background: "var(--ck-laser-film)" }}
        >
          <PencilRuler className="h-4 w-4" />
          {t("cockpit.newEstimate")}
        </button>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {/* القراءة الأساسية — أداة قياس كبرى */}
        <motion.section {...reveal(1)} className="ck-panel ck-tick relative overflow-hidden p-5">
          {/* خط مسح متحرك */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
            <div className="ck-laserline h-full w-1/3" style={{ animation: "ck-scan 3.5s var(--ck-ease) infinite" }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] font-bold tracking-[0.16em]" style={{ color: "var(--ck-ink-dim)" }}>
              {t("cockpit.primaryReadout")}
            </span>
            <span className="mono text-[10px] font-bold" style={{ color: "var(--ck-ok)" }}>+{m.paidPct}%</span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="mono text-5xl font-black leading-none tabular-nums md:text-6xl" style={{ color: "var(--ck-ink)" }}>
              {fmt(m.paid)}
            </span>
            <span className="mono text-sm font-bold" style={{ color: "var(--ck-laser)" }}>{t("cockpit.unit")}</span>
          </div>

          <div className="mt-4" style={{ color: "var(--ck-laser-deep)" }}><Ruler /></div>

          {/* شريط المدفوع/المعلّق */}
          <div className="mt-5 space-y-2">
            <div className="flex h-2.5 overflow-hidden" style={{ borderRadius: 1, background: "var(--ck-graphite)" }}>
              <div style={{ width: `${m.paidPct}%`, background: "var(--ck-ok)", boxShadow: "0 0 10px var(--ck-ok-glow)" }} />
              <div style={{ width: `${100 - m.paidPct}%`, background: "var(--ck-warn)" }} />
            </div>
            <div className="mono flex items-center justify-between text-[11px] tabular-nums">
              <span style={{ color: "var(--ck-ink-dim)" }}>
                {t("cockpit.outstanding")}: <span style={{ color: "var(--ck-warn)" }}>{fmt(m.pending)}</span> {t("cockpit.unit")}
              </span>
            </div>
          </div>
        </motion.section>

        {/* الوحدات */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div {...reveal(2)}>
            <Module icon={FolderOpen} label={t("cockpit.activeProjects")} value={fmt(m.active)} tone="var(--ck-laser-hot)" onClick={() => navigate("/projects")} className="h-full" />
          </motion.div>
          <motion.div {...reveal(3)}>
            <Module icon={FileText} label={t("cockpit.invoicesPending")} value={fmt(m.pending)} unit={t("cockpit.unit")} tone="var(--ck-warn)" onClick={() => navigate("/invoices")} className="h-full" />
          </motion.div>
          <motion.div {...reveal(4)} className="col-span-2">
            <Module icon={HardHat} label={t("cockpit.workforceCost")} value={fmt(m.wages)} unit={t("cockpit.unit")} tone="var(--ck-ink)" onClick={() => navigate("/workers")} />
          </motion.div>
        </div>
      </div>

      {/* سجل العمليات — مشاريع حديثة */}
      <motion.section {...reveal(5)} className="ck-panel">
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--ck-hair)" }}>
          <span className="mono text-[10px] font-bold tracking-[0.16em]" style={{ color: "var(--ck-ink-dim)" }}>
            {t("cockpit.recentProjects")}
          </span>
          <span className="mono text-[10px] tabular-nums" style={{ color: "var(--ck-ink-mute)" }}>{fmt(projects.length)}</span>
        </div>

        {projects.length === 0 ? (
          <div className="mono px-5 py-10 text-center text-[11px]" style={{ color: "var(--ck-ink-mute)" }}>{t("cockpit.noData")}</div>
        ) : (
          <ul>
            {projects.slice(0, 5).map((p, i) => {
              const status = p.status && STATUS_TONE[p.status] ? p.status : "draft";
              const area = projectArea(p);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => navigate(`/calculator/${p.id}`)}
                    className="group flex w-full items-center justify-between gap-3 border-b px-5 py-3 text-start transition-colors hover:bg-[var(--ck-steel-hi)]"
                    style={{ borderColor: i === Math.min(projects.length, 5) - 1 ? "transparent" : "var(--ck-hair)" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="mono text-[10px] tabular-nums" style={{ color: "var(--ck-ink-mute)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="w-1.5 self-stretch" style={{ background: STATUS_TONE[status] }} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold" style={{ color: "var(--ck-ink)" }}>{projectName(p)}</p>
                        <p className="mono mt-0.5 text-[10px] tabular-nums" style={{ color: "var(--ck-ink-mute)" }}>
                          {area > 0 ? t("cockpit.area", { area: area.toFixed(1) }) : "—"}
                          {p.summary?.totalTiles ? ` · ${t("cockpit.tiles", { n: p.summary.totalTiles })}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="mono text-[9px] font-bold tracking-wider" style={{ color: STATUS_TONE[status] }}>
                        {t(`cockpit.status.${status}`)}
                      </span>
                      {p.summary?.totalCost ? (
                        <span className="mono text-[13px] font-black tabular-nums" style={{ color: "var(--ck-ink)" }}>
                          {fmt(p.summary.totalCost)}
                        </span>
                      ) : <span className="mono text-[13px]" style={{ color: "var(--ck-ink-mute)" }}>—</span>}
                      <ArrowUpLeft className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--ck-laser)" }} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}
