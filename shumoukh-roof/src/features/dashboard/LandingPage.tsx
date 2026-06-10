import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calculator, FileText, Users, FolderOpen, TrendingUp, DollarSign,
  ArrowLeft, HardHat, Plus, PencilRuler, Receipt, ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { listDocuments } from "../../lib/firestoreService";
import { fetchProjects } from "../../services/projectService";
import { useAuthStore } from "../../store/authStore";
import { checkPermissions } from "../../utils/subscriptionUtils";
import { projectStatusInfo, projectName, projectArea, projectDate } from "../../utils/projectDisplay";
import type { SavedProject } from "../../utils/projectDisplay";

import DepthHero from "../../components/ui/DepthHero";
import CountUp from "../../components/ui/CountUp";
import RoofEmptyState from "../../components/ui/RoofEmptyState";

interface Invoice { id: string; client?: string; project?: string; status?: string; amount?: number; }
interface Worker { id: string; days?: number; wage?: number; }

type Accent = "terracotta" | "olive" | "amber" | "red";

const accent = {
  terracotta: { c: "var(--accent-terracotta)", bg: "var(--accent-terracotta-soft)" },
  olive:      { c: "var(--accent-olive)",      bg: "var(--accent-olive-soft)" },
  amber:      { c: "var(--accent-amber)",      bg: "var(--accent-amber-soft)" },
  red:        { c: "var(--accent-red)",        bg: "var(--accent-red-soft)" },
} satisfies Record<Accent, { c: string; bg: string }>;

const invoiceStatus: Record<string, { label: string; className: string }> = {
  paid:    { label: "مدفوعة",      className: "tag-olive" },
  pending: { label: "قيد الانتظار", className: "tag-amber" },
  draft:   { label: "مسودة",       className: "bg-earth-100 text-earth-700 border border-earth-300 rounded-[3px]" },
};

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const subscription = useAuthStore((s) => s.subscription);
  const uid = user?.uid;
  const queryClient = useQueryClient();

  const perms = useMemo(() => checkPermissions(subscription ?? undefined), [subscription]);
  const showSubscriptionAlert = perms.isExpired || (perms.daysRemaining > 0 && perms.daysRemaining <= 30);

  const { data: projects = [], isLoading: pLoad } = useQuery<SavedProject[]>({
    queryKey: ["projects", uid],
    queryFn: () => fetchProjects(uid) as Promise<SavedProject[]>,
    enabled: !!uid,
    staleTime: 30_000,
  });

  const { data: invoices = [], isLoading: iLoad } = useQuery<Invoice[]>({
    queryKey: ["invoices", uid],
    queryFn: () => listDocuments("invoices") as Promise<Invoice[]>,
    enabled: !!uid,
    staleTime: 30_000,
  });

  const { data: workers = [], isLoading: wLoad, error } = useQuery<Worker[]>({
    queryKey: ["workers", uid],
    queryFn: () => listDocuments("workers") as Promise<Worker[]>,
    enabled: !!uid,
    staleTime: 30_000,
  });

  const loading = pLoad || iLoad || wLoad;

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + (i.amount ?? 0), 0);

  const workerCost = workers.reduce((s, w) => s + (w.days ?? 0) * (w.wage ?? 0), 0);

  const stats: { icon: typeof FolderOpen; label: string; count: number; suffix?: string; accent: Accent; to: string }[] = [
    { icon: FolderOpen,  label: "المشاريع",     count: projects.length,                   accent: "amber",      to: "/projects" },
    { icon: FileText,    label: "الفواتير",     count: invoices.length,                   accent: "terracotta", to: "/invoices" },
    { icon: DollarSign,  label: "المدفوع",      count: totalRevenue,   suffix: " د.أ",    accent: "olive",      to: "/invoices" },
    { icon: TrendingUp,  label: "قيد الانتظار",  count: pendingRevenue, suffix: " د.أ",    accent: "amber",      to: "/invoices" },
    { icon: Users,       label: "العمال",       count: workers.length,                    accent: "red",        to: "/workers" },
    { icon: Calculator,  label: "تكلفة العمال",  count: workerCost,     suffix: " د.أ",    accent: "olive",      to: "/workers" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 md:h-28 rounded-sm shimmer-skeleton" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 rounded-sm shimmer-skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="h-64 rounded-sm shimmer-skeleton" />
          ))}
        </div>
      </div>
    );
  }

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

  const recentInvoices = invoices.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* تنبيه الاشتراك */}
      {showSubscriptionAlert && (
        <Link
          to="/subscription"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-sm border transition-colors ${
            perms.isExpired
              ? "bg-red-50 border-red-200 hover:bg-red-100"
              : "bg-amber-50 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <span className={`flex items-center gap-2 text-xs font-bold ${perms.isExpired ? "text-red-700" : "text-amber-800"}`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {perms.isExpired
              ? "انتهى اشتراكك، بياناتك محفوظة. جدد الآن لاستعادة كل الميزات."
              : `اشتراكك ينتهي خلال ${perms.daysRemaining} يوم.`}
          </span>
          <span className={`text-[10px] font-black inline-flex items-center gap-1 shrink-0 ${perms.isExpired ? "text-red-700" : "text-amber-800"}`}>
            التفاصيل <ArrowLeft className="w-3 h-3" />
          </span>
        </Link>
      )}

      {/* الترحيب */}
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
              <p className="text-sm text-earth-500 mt-1">
                {new Date().toLocaleDateString("ar-JO", { weekday: "long", day: "numeric", month: "long" })}
                {" — "}دفترك اليوم: المشاريع، العمال، والفواتير في مكان واحد
              </p>
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

      {/* الإحصائيات — كل رقم يفتح صفحته */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="bg-white border border-earth-200 rounded-sm p-3 transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-earth-300 block"
            style={{ borderRight: `3px solid ${accent[s.accent].c}` }}
            aria-label={`${s.label}: ${s.count}${s.suffix || ""}`}
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
          </Link>
        ))}
      </div>

      {/* سجلا العمل: المشاريع والفواتير جنباً إلى جنب */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* آخر المشاريع */}
        <div className="bg-white border border-earth-200 rounded-sm overflow-hidden" style={{ borderRight: "3px solid var(--accent-amber)" }}>
          <div className="px-5 py-3.5 border-b border-earth-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" style={{ color: "var(--accent-amber)" }} />
              <h2 className="text-xs font-black text-earth-900">آخر المشاريع</h2>
            </div>
            <Link
              to="/projects"
              className="text-[10px] font-bold flex items-center gap-1 transition-colors hover:opacity-80 group"
              style={{ color: "var(--accent-olive)" }}
            >
              عرض الكل <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <RoofEmptyState />
          ) : (
            <div className="divide-y divide-earth-100">
              {projects.slice(0, 5).map((p) => {
                const status = projectStatusInfo(p.status);
                const area = projectArea(p);
                return (
                  <Link
                    key={p.id}
                    to={`/calculator/${p.id}`}
                    className="px-5 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-earth-50 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-earth-900 truncate">{projectName(p)}</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border shrink-0 ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-earth-500 font-mono mt-0.5">
                        {area > 0 ? `${area.toFixed(1)} م²` : "بدون رسم"}
                        {p.summary?.totalTiles ? ` · ${p.summary.totalTiles} حبة` : ""}
                        {projectDate(p) ? ` · ${projectDate(p)}` : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-earth-400 group-hover:text-olive-600 transition-colors">
                      {p.summary?.totalCost ? (
                        <span className="font-black font-mono" style={{ color: "var(--accent-olive)" }}>
                          {p.summary.totalCost} د.أ
                        </span>
                      ) : null}
                      <PencilRuler className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* آخر الفواتير */}
        <div className="bg-white border border-earth-200 rounded-sm overflow-hidden" style={{ borderRight: "3px solid var(--accent-terracotta)" }}>
          <div className="px-5 py-3.5 border-b border-earth-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4" style={{ color: "var(--accent-terracotta)" }} />
              <h2 className="text-xs font-black text-earth-900">آخر الفواتير</h2>
            </div>
            <Link
              to="/invoices"
              className="text-[10px] font-bold flex items-center gap-1 transition-colors hover:opacity-80 group"
              style={{ color: "var(--accent-olive)" }}
            >
              عرض الكل <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-sm bg-earth-100 border-2 border-earth-200 flex items-center justify-center">
                <FileText className="w-5 h-5 text-earth-400" />
              </div>
              <p className="text-xs font-black text-earth-700">لا توجد فواتير بعد</p>
              <p className="text-[10px] text-earth-500 mt-1">أنشئ فاتورة من صفحة الفواتير أو من تفاصيل أي مشروع</p>
            </div>
          ) : (
            <div className="divide-y divide-earth-100">
              {recentInvoices.map((inv) => {
                const st = invoiceStatus[inv.status || "draft"] || invoiceStatus.draft;
                return (
                  <Link
                    key={inv.id}
                    to="/invoices"
                    className="px-5 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-earth-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-earth-900 truncate">{inv.client || "بدون اسم"}</p>
                      {inv.project && <p className="text-[10px] text-earth-500 truncate mt-0.5">{inv.project}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black font-mono text-earth-900" dir="ltr">{inv.amount ?? 0} JOD</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-[3px] border ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
