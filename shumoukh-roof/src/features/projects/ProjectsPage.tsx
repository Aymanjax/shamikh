import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderOpen, Trash2, Search, Calculator, FileText, X, Check,
  Phone, MapPin, PencilRuler, ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { fetchProjects, deleteProject, updateProjectStatus, projectStatuses } from "../../services/projectService";
import { addDocument } from "../../lib/firestoreService";
import {
  projectStatusInfo, projectName, projectArea, projectDate,
} from "../../utils/projectDisplay";
import type { SavedProject } from "../../utils/projectDisplay";
import GlassButton from "../../components/ui/GlassButton";
import { useT } from "../../i18n";

export default function ProjectsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<SavedProject | null>(null);
  const [invoiceCreated, setInvoiceCreated] = useState(false);

  const { data: projects = [], isLoading: loading, error } = useQuery<SavedProject[]>({
    queryKey: ["projects", uid],
    queryFn: () => fetchProjects(uid) as Promise<SavedProject[]>,
    enabled: !!uid,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(uid, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", uid] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateProjectStatus(uid, id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", uid] }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: { client: string; project: string; amount: number; status: string; projectId: string }) =>
      addDocument("invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", uid] });
      setInvoiceCreated(true);
      setTimeout(() => {
        setInvoiceCreated(false);
        setDetail(null);
        navigate("/invoices");
      }, 1200);
    },
  });

  const filtered = useMemo(() => projects
    .filter((p) => statusFilter === "all" || (p.status || "draft") === statusFilter)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return projectName(p).toLowerCase().includes(q)
        || (p.client?.phone || "").includes(q)
        || (p.client?.address || "").toLowerCase().includes(q);
    }), [projects, search, statusFilter]);

  const handleDelete = useCallback((p: SavedProject) => {
    if (!confirm(t("projects.deleteConfirm", { name: projectName(p) }))) return;
    deleteMutation.mutate(p.id);
    setDetail(null);
  }, [deleteMutation, t]);

  const handleCreateInvoice = useCallback((p: SavedProject) => {
    createInvoiceMutation.mutate({
      client: p.client?.name || "",
      project: projectName(p),
      amount: p.summary?.totalCost || 0,
      status: "draft",
      projectId: p.id,
    });
  }, [createInvoiceMutation]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">{t("projects.loadError")}</p>
        <p className="text-xs text-earth-500 mb-4">{t("projects.loadErrorHint")}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["projects", uid] })}
          className="bg-earth-700 text-earth-100 hover:bg-earth-800 rounded-sm px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-r-2 border-earth-900"
        >
          {t("projects.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-600 flex items-center justify-center border-l-3 border-amber-400 shrink-0">
            <FolderOpen className="w-6 h-6 text-paper" />
          </div>
          <div>
            <h1 className="text-xl font-black text-earth-900 tracking-tight">{t("projects.title")}</h1>
            <p className="text-sm text-earth-500">
              {projects.length > 0 ? t("projects.savedCount", { n: projects.length }) : t("projects.subtitle")}
            </p>
          </div>
        </div>
        <Link to="/calculator">
          <GlassButton variant="primary" size="sm" icon={<Calculator className="w-4 h-4" />}>
            {t("projects.newCalculation")}
          </GlassButton>
        </Link>
      </div>

      <div className="earth-card overflow-hidden">
        {/* البحث والتصفية */}
        <div className="p-4 border-b border-earth-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("projects.searchPlaceholder")}
              dir="rtl"
              className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-10 pl-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{ key: "all", label: t("common.all") }, ...projectStatuses.map((s: string) => ({ key: s, label: projectStatusInfo(s).label }))].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`text-[10px] font-black px-2.5 py-1.5 rounded-sm border transition cursor-pointer ${
                  statusFilter === f.key
                    ? "bg-earth-800 text-earth-100 border-earth-800"
                    : "bg-white text-earth-600 border-earth-200 hover:border-earth-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-sm shimmer-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-earth-500">
            <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-earth-100 border-2 border-earth-200 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-earth-400" />
            </div>
            <p className="font-black text-earth-700">
              {projects.length === 0 ? t("projects.emptyTitle") : t("projects.noSearchResults")}
            </p>
            {projects.length === 0 && (
              <>
                <p className="text-xs mt-1 mb-4">{t("projects.emptyHint")}</p>
                <Link
                  to="/calculator"
                  className="inline-flex items-center gap-2 bg-olive-700 hover:bg-olive-800 text-earth-100 text-xs font-bold px-4 py-2.5 rounded-sm border-r-3 border-olive-900 transition-colors"
                >
                  <PencilRuler className="w-4 h-4" />
                  {t("projects.startFirstCalculation")}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            {filtered.map((p) => {
              const status = projectStatusInfo(p.status);
              const area = projectArea(p);
              return (
                <div key={p.id} className="p-4 hover:bg-earth-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setDetail(p)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-right cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-sm bg-amber-100 border-l-2 border-amber-400 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-5 h-5" style={{ color: "var(--accent-amber)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-earth-900 text-sm truncate">{projectName(p)}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-[3px] border ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-earth-500 font-mono mt-0.5" dir="rtl">
                          {area > 0 ? t("projects.areaValue", { value: area.toFixed(1) }) : t("projects.noDrawing")}
                          {p.summary?.totalTiles ? ` · ${t("projects.tilesCount", { n: p.summary.totalTiles })}` : ""}
                          {p.summary?.totalCost ? ` · ${p.summary.totalCost} ${t("common.currency")}` : ""}
                          {projectDate(p) ? ` · ${projectDate(p)}` : ""}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        to={`/calculator/${p.id}`}
                        className="p-2 text-earth-500 hover:text-olive-600 transition rounded-sm hover:bg-olive-50"
                        title={t("projects.openInCalculator")}
                        aria-label={t("projects.openInCalculatorAria", { name: projectName(p) })}
                      >
                        <Calculator className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-2 text-earth-500 hover:text-red-500 transition rounded-sm hover:bg-red-50 cursor-pointer"
                        title={t("projects.deleteProject")}
                        aria-label={t("projects.deleteAria", { name: projectName(p) })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* تفاصيل المشروع */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-black text-earth-900">{projectName(detail)}</h3>
              <button onClick={() => setDetail(null)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm cursor-pointer" aria-label={t("common.close")}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-earth-500 mb-4 flex-wrap">
              {detail.client?.phone && (
                <a href={`tel:${detail.client.phone}`} className="flex items-center gap-1 hover:text-terracotta-500 transition" dir="ltr">
                  <Phone className="w-3 h-3" /> {detail.client.phone}
                </a>
              )}
              {detail.client?.address && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {detail.client.address}</span>
              )}
              {projectDate(detail) && <span>{projectDate(detail)}</span>}
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-earth-50 border border-earth-200 rounded-sm p-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-earth-500 text-xs font-bold">{t("projects.area")}</span>
                  <p className="font-black font-mono text-earth-900">{t("projects.areaValue", { value: projectArea(detail).toFixed(1) })}</p>
                </div>
                <div>
                  <span className="text-earth-500 text-xs font-bold">{t("projects.tiles")}</span>
                  <p className="font-black font-mono text-earth-900">{detail.summary?.totalTiles || "—"} {detail.summary?.totalTiles ? t("projects.tileUnit") : ""}</p>
                </div>
                <div>
                  <span className="text-earth-500 text-xs font-bold">{t("projects.slope")}</span>
                  <p className="font-black font-mono text-earth-900">{detail.roof?.slope ?? "—"}%</p>
                </div>
                <div>
                  <span className="text-earth-500 text-xs font-bold">{t("projects.numLegs")}</span>
                  <p className="font-black font-mono text-earth-900">{detail.settings?.numLegs ?? "—"}</p>
                </div>
              </div>

              {detail.summary?.totalCost ? (
                <div className="text-paper rounded-sm p-3 flex justify-between font-black" style={{ backgroundColor: "var(--accent-amber)" }}>
                  <span>{t("projects.estimatedCost")}</span>
                  <span className="font-mono" style={{ color: "var(--accent-amber-soft)" }}>{detail.summary.totalCost} {t("common.currency")}</span>
                </div>
              ) : null}

              {/* حالة المشروع */}
              <div className="space-y-1.5">
                <label htmlFor="project-status" className="text-xs font-bold text-earth-700 block">{t("projects.projectStatus")}</label>
                <div className="relative">
                  <select
                    id="project-status"
                    value={detail.status || "draft"}
                    onChange={(e) => {
                      const status = e.target.value;
                      statusMutation.mutate({ id: detail.id, status });
                      setDetail({ ...detail, status });
                    }}
                    className="w-full appearance-none bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition cursor-pointer"
                  >
                    {projectStatuses.map((s: string) => (
                      <option key={s} value={s}>{projectStatusInfo(s).label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/calculator/${detail.id}`}
                  className="flex-1 bg-olive-700 hover:bg-olive-800 text-earth-100 font-black py-2.5 rounded-sm transition text-sm text-center border-r-3 border-olive-900 flex items-center justify-center gap-1.5"
                >
                  <Calculator className="w-4 h-4" /> {t("projects.openInCalculator")}
                </Link>
                <button
                  onClick={() => handleCreateInvoice(detail)}
                  disabled={createInvoiceMutation.isPending}
                  className="flex-1 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-earth-100 font-black py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-1.5 border-r-3 border-terracotta-700 cursor-pointer"
                >
                  {invoiceCreated ? (
                    <><Check className="w-4 h-4" /> {t("projects.invoiceCreated")}</>
                  ) : createInvoiceMutation.isPending ? (
                    t("projects.creating")
                  ) : (
                    <><FileText className="w-4 h-4" /> {t("projects.createInvoice")}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
