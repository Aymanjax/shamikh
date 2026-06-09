import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calculator, FileText, Users, FolderOpen, Trash2, TrendingUp, DollarSign, ArrowLeft, BarChart3, HardHat, Plus, CalendarCheck, Wallet, Bell, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { listDocuments, deleteDocument } from "../../lib/firestoreService";
import { useAuthStore } from "../../store/authStore";
import { listLedger, aggregateOwed, todayStats, type LedgerEntry } from "../workers/workerLedgerService";
import { listPayments, totalReceivable, reminders, type Payment } from "../projects/paymentsService";

import DepthHero from "../../components/ui/DepthHero";
import CountUp from "../../components/ui/CountUp";
import RoofEmptyState from "../../components/ui/RoofEmptyState";

/* ── Firestore Document Shapes ── */
interface DocBase { id: string; [key: string]: unknown; }
interface Invoice extends DocBase { status?: string; amount?: number; }
interface Worker extends DocBase { days?: number; wage?: number; }
interface Project extends DocBase { client?: { name?: string }; name?: string; result?: { totalTiles?: number; actualArea?: number; totalCost?: number; }; }

type Accent = "terracotta" | "olive" | "amber" | "red";

/* ── Accent Color Config (CSS Variables) ── */
const accent = {
  terracotta: { c: "var(--accent-terracotta)", bg: "var(--accent-terracotta-soft)" },
  olive:      { c: "var(--accent-olive)",      bg: "var(--accent-olive-soft)" },
  amber:      { c: "var(--accent-amber)",      bg: "var(--accent-amber-soft)" },
  red:        { c: "var(--accent-red)",        bg: "var(--accent-red-soft)" },
} satisfies Record<Accent, { c: string; bg: string }>;

/* ── Static Navigation Cards ── */
const cards: { to: string; icon: typeof Calculator; label: string; desc: string; accent: Accent }[] = [
  { to: "/calculator", icon: Calculator, label: "حساب البضاعة", desc: "حساب كميات القرميد والحديد", accent: "terracotta" },
  { to: "/projects",  icon: FolderOpen, label: "المشاريع",     desc: "عرض المشاريع المحفوظة",        accent: "olive" },
  { to: "/invoices",  icon: FileText,   label: "الفواتير",     desc: "إدارة الفواتير وعروض السعر",   accent: "amber" },
  { to: "/workers",   icon: Users,      label: "العمال",       desc: "إدارة العمال والمهام",         accent: "red" },
];

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  /* ── Parallel Firestore Queries via React Query ── */
  const { data: projects = [], isLoading: pLoad } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => listDocuments("projects") as Promise<Project[]>,
    staleTime: 30_000,
  });

  const { data: invoices = [], isLoading: iLoad } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => listDocuments("invoices") as Promise<Invoice[]>,
    staleTime: 30_000,
  });

  const { data: workers = [], isLoading: wLoad, error } = useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: () => listDocuments("workers") as Promise<Worker[]>,
    staleTime: 30_000,
  });

  const { data: ledger = [] } = useQuery<LedgerEntry[]>({
    queryKey: ["workerLedger", user?.uid],
    queryFn: () => listLedger(user!.uid),
    staleTime: 15_000,
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["projectPayments", user?.uid],
    queryFn: () => listPayments(user!.uid),
    staleTime: 15_000,
    enabled: !!user,
  });

  /* ── Delete Mutation ── */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("projects", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleDeleteProject = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const loading = pLoad || iLoad || wLoad;

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const workerCost = workers.reduce((s, w) => s + (w.days ?? 0) * (w.wage ?? 0), 0);

  /* ── Today summary + receivables ── */
  const { presentToday, advancesToday } = todayStats(ledger);
  const dueSoon = reminders(payments, 3);
  const receivable = totalReceivable(payments);
  const owedToWorkers = aggregateOwed(ledger);

  const stats = [
    { icon: FolderOpen,  label: "المشاريع",     count: projects.length,                        accent: "amber" as const },
    { icon: FileText,    label: "الفواتير",     count: invoices.length,                        accent: "terracotta" as const },
    { icon: DollarSign,  label: "المدفوع",      count: totalRevenue,      suffix: " د.أ",      accent: "olive" as const },
    { icon: TrendingUp,  label: "قيد الانتظار",  count: pendingRevenue,    suffix: " د.أ",      accent: "amber" as const },
    { icon: Users,       label: "العمال",       count: workers.length,                         accent: "red" as const },
    { icon: Calculator,  label: "تكلفة العمال",  count: workerCost,        suffix: " د.أ",      accent: "olive" as const },
  ];

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 md:h-28 rounded-sm shimmer-skeleton" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 rounded-sm shimmer-skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 rounded-sm shimmer-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-sm bg-red-100 border-l-3 border-red-500 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 font-black text-lg">!</span>
        </div>
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل البيانات</p>
        <p className="text-xs text-earth-500 mb-4">تحقق من اتصالك بالإنترنت ثم أعد المحاولة</p>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="bg-earth-700 text-white hover:bg-earth-800 active:bg-earth-900 rounded-sm px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-r-2 border-earth-900"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* ── Welcome Hero ── */}
      <DepthHero className="earth-card depth-hero-accent p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="depth-hero-icon-glow w-12 h-12 rounded-sm bg-terracotta-500 flex items-center justify-center border-l-3 border-terracotta-300 shrink-0">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-earth-900 tracking-tight text-balance">
                  مرحباً {user?.displayName || "بك"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-olive-600 font-bold bg-olive-100 px-2 py-0.5 rounded-sm border border-olive-200">
                  <span className="depth-hero-badge-dot w-1.5 h-1.5 rounded-full bg-olive-600" />
                  متصل
                </span>
              </div>
              <p className="text-sm text-earth-500 mt-1">ادِر مشاريع القرميد: حساب الكميات، العمال، والفواتير</p>
            </div>
          </div>
          <Link
            to="/calculator"
            className="shrink-0 bg-olive-700 text-white hover:bg-olive-800 active:bg-olive-900 rounded-sm px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors border-r-3 border-olive-900"
          >
            <Plus className="w-4 h-4" />
            حساب جديد
          </Link>
        </div>
      </DepthHero>

      {/* ── ملخص اليوم + الذمم ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ملخص اليوم */}
        <div className="lg:col-span-2 bg-white border border-earth-200 rounded-sm p-4" style={{ borderRight: "3px solid var(--accent-terracotta)" }}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4" style={{ color: "var(--accent-terracotta)" }} />
            <h2 className="text-xs font-black text-earth-900">ملخص اليوم</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/workers" className="bg-earth-50 rounded-sm p-3 text-center hover:bg-earth-100 transition">
              <div className="flex items-center justify-center gap-1 mb-1"><Users className="w-3.5 h-3.5 text-olive-600" /></div>
              <p className="text-xl font-black font-mono text-earth-900"><CountUp to={presentToday} /></p>
              <p className="text-[10px] text-earth-500 font-bold">حاضر اليوم</p>
            </Link>
            <Link to="/workers" className="bg-earth-50 rounded-sm p-3 text-center hover:bg-earth-100 transition">
              <div className="flex items-center justify-center gap-1 mb-1"><Wallet className="w-3.5 h-3.5 text-amber-600" /></div>
              <p className="text-xl font-black font-mono text-amber-600"><CountUp to={advancesToday} /></p>
              <p className="text-[10px] text-earth-500 font-bold">سلف اليوم (د.أ)</p>
            </Link>
            <Link to="/projects" className="bg-earth-50 rounded-sm p-3 text-center hover:bg-earth-100 transition">
              <div className="flex items-center justify-center gap-1 mb-1"><Bell className="w-3.5 h-3.5 text-red-500" /></div>
              <p className="text-xl font-black font-mono text-earth-900"><CountUp to={dueSoon.length} /></p>
              <p className="text-[10px] text-earth-500 font-bold">دفعات مستحقة</p>
            </Link>
          </div>
          {dueSoon.length > 0 && (
            <p className="text-[11px] text-earth-600 mt-3 flex items-center gap-1.5">
              <Bell className="w-3 h-3 text-amber-600 shrink-0" />
              {dueSoon[0].label} لمشروع {dueSoon[0].projectName} — {dueSoon[0].amount} د.أ
            </p>
          )}
        </div>

        {/* معك بالسوق */}
        <div className="bg-white border border-earth-200 rounded-sm p-4" style={{ borderRight: "3px solid var(--accent-olive)" }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4" style={{ color: "var(--accent-olive)" }} />
            <h2 className="text-xs font-black text-earth-900">معك بالسوق</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-olive-50 rounded-sm px-3 py-2">
              <span className="text-[11px] font-bold text-earth-600 flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5 text-olive-600" /> اللي إلك (زباين)</span>
              <span className="text-base font-black font-mono text-olive-700">{receivable} <span className="text-[10px]">د.أ</span></span>
            </div>
            <div className="flex items-center justify-between bg-amber-50 rounded-sm px-3 py-2">
              <span className="text-[11px] font-bold text-earth-600 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-amber-600" /> اللي عليك (عمال)</span>
              <span className="text-base font-black font-mono text-amber-700">{owedToWorkers} <span className="text-[10px]">د.أ</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-earth-200 rounded-sm p-3 transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5"
            style={{ borderRight: `3px solid ${accent[s.accent].c}` }}
          >
            <div
              className="w-8 h-8 rounded-sm border-l-2 flex items-center justify-center mb-2"
              style={{ backgroundColor: accent[s.accent].bg, borderLeftColor: accent[s.accent].c }}
            >
              <s.icon className="w-4 h-4" style={{ color: accent[s.accent].c }} />
            </div>
            <p className="text-lg font-black font-mono text-earth-900">
              <CountUp to={s.count} />
              {s.suffix}
            </p>
            <p className="text-[10px] text-earth-500 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-white border border-earth-200 rounded-sm p-5 block hover:border-earth-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150"
            style={{ borderRight: `3px solid ${accent[card.accent].c}` }}
          >
            <div
              className="w-10 h-10 rounded-sm flex items-center justify-center mb-3 border-l-3"
              style={{
                backgroundColor: accent[card.accent].bg,
                borderLeftColor: accent[card.accent].c,
              }}
            >
              <card.icon className="w-5 h-5" style={{ color: accent[card.accent].c }} />
            </div>
            <h3 className="font-black text-earth-900 mb-1 text-sm">{card.label}</h3>
            <p className="text-[10px] text-earth-500 font-medium">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Recent Projects ── */}
      <div className="bg-white border border-earth-200 rounded-sm overflow-hidden" style={{ borderRight: "3px solid var(--accent-amber)" }}>
        <div className="px-5 py-3.5 border-b border-earth-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: "var(--accent-amber)" }} />
            <h2 className="text-xs font-black text-earth-900">آخر المشاريع</h2>
          </div>
          <Link
            to="/projects"
            className="text-[10px] font-bold flex items-center gap-1 transition-colors hover:opacity-80 group"
            style={{ color: "var(--accent-olive)" }}
          >
            عرض الكل <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <RoofEmptyState />
        ) : (
          <div className="divide-y divide-earth-100">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="px-5 py-3 flex items-center justify-between transition-colors hover:bg-earth-50 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-earth-900 truncate">
                    {(p.client && typeof p.client === "object" && "name" in p.client
                      ? (p.client as { name?: string }).name
                      : p.name) || "مشروع"}
                  </p>
                  <p className="text-[10px] text-earth-500 font-mono mt-0.5">
                    {p.result?.totalTiles || 0} tiles · {p.result?.actualArea?.toFixed(1) || "?"} م²
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition shrink-0">
                  {p.result?.totalCost && (
                    <span className="text-[10px] font-black font-mono" style={{ color: "var(--accent-olive)" }}>
                      {p.result.totalCost} د.أ
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="text-earth-500 hover:text-red-500 transition cursor-pointer p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400"
                    aria-label="حذف المشروع"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
