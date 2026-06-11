import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Download, Trash2, X, Check, Receipt, User, Hash, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { listDocuments, addDocument, deleteDocument, updateDocument } from "../../lib/firestoreService";
import { printInvoice } from "../../lib/printInvoice";
import { useAuthStore } from "../../store/authStore";
import GlassButton from "../../components/ui/GlassButton";
import { useT } from "../../i18n";

interface Invoice {
  id: string;
  client?: string;
  project?: string;
  amount?: number;
  status?: string;
  projectId?: string;
  createdAt?: unknown;
}

interface InvoiceForm {
  client: string;
  project: string;
  amount: number;
  status: string;
}

const defaultForm: InvoiceForm = { client: "", project: "", amount: 0, status: "draft" };

// القيمة المخزنة في Firestore تبقى بالإنجليزية؛ label مفتاح ترجمة للعرض فقط
const statusConfig: Record<string, { label: string; color: string; next: string }> = {
  paid: { label: "invoices.status.paid", color: "tag-olive", next: "draft" },
  pending: { label: "invoices.status.pending", color: "tag-amber", next: "paid" },
  draft: { label: "invoices.status.draft", color: "bg-earth-100 text-earth-700 border border-earth-300 rounded-[3px]", next: "pending" },
};

export default function InvoicesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(defaultForm);
  const [clientError, setClientError] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const { data: invoices = [], isLoading: loading, error } = useQuery<Invoice[]>({
    queryKey: ["invoices", uid],
    queryFn: () => listDocuments("invoices") as Promise<Invoice[]>,
    enabled: !!uid,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: InvoiceForm) => addDocument("invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", uid] });
      setModal(false);
      setForm(defaultForm);
      setClientError(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("invoices", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", uid] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateDocument("invoices", id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices", uid] }),
  });

  const handleCreate = useCallback(() => {
    if (!form.client.trim()) {
      setClientError(true);
      clientInputRef.current?.focus();
      return;
    }
    createMutation.mutate(form);
  }, [form, createMutation]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm(t("invoices.deleteConfirm"))) return;
    deleteMutation.mutate(id);
  }, [deleteMutation, t]);

  const handleStatusToggle = useCallback((inv: Invoice) => {
    const next = inv.status === "draft" ? "pending" : inv.status === "pending" ? "paid" : "draft";
    statusMutation.mutate({ id: inv.id, status: next });
  }, [statusMutation]);

  const filtered = invoices.filter((inv) =>
    !search || inv.client?.includes(search) || inv.project?.includes(search)
  );

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">{t("invoices.loadError")}</p>
        <p className="text-xs text-earth-500">{t("invoices.loadErrorHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-olive-600 flex items-center justify-center border-l-3 border-olive-400">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-earth-900 tracking-tight">{t("invoices.title")}</h1>
            <p className="text-xs text-earth-500 mt-0.5">{t("invoices.subtitle")}</p>
          </div>
        </div>
        <GlassButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setModal(true)}>
          {t("invoices.newInvoice")}
        </GlassButton>
      </div>

      {/* Document card */}
      <div className="glass-card overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-3.5 border-b border-earth-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("invoices.searchPlaceholder")}
              className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-9 pl-3 text-xs text-earth-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400"
            />
          </div>
          <div className="text-[10px] text-earth-500 font-mono">
            {t("invoices.count", { n: filtered.length })}
          </div>
        </div>

        {/* Document body */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-sm bg-earth-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-earth-100 border-2 border-earth-200 flex items-center justify-center">
              <FileText className="w-6 h-6 text-earth-400" />
            </div>
            <p className="text-sm font-black text-earth-700">{t("invoices.emptyTitle")}</p>
            <p className="text-[10px] text-earth-500 mt-1 max-w-xs mx-auto">
              {t("invoices.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            <AnimatePresence mode="popLayout">
              {filtered.map((inv, idx) => {
                const status = statusConfig[inv.status || "draft"] || statusConfig.draft;
                return (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-3.5 hover:bg-earth-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Invoice number */}
                      <div className="shrink-0 w-8 text-center">
                        <div className="text-[9px] font-mono text-earth-500">{String(idx + 1).padStart(2, "0")}</div>
                        <div className="w-full h-px bg-earth-200 mt-0.5" />
                      </div>

                      {/* Client & Project */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-earth-400 shrink-0" />
                          <span className="text-sm font-black text-earth-900 truncate">{inv.client}</span>
                        </div>
                        {inv.project && (
                          inv.projectId ? (
                            <Link to={`/calculator/${inv.projectId}`} className="flex items-center gap-1.5 mt-0.5 hover:text-terracotta-500 transition-colors w-fit" title={t("invoices.openProjectInCalculator")}>
                              <Hash className="w-2.5 h-2.5 text-earth-400 shrink-0" />
                              <span className="text-[10px] text-earth-500 truncate underline underline-offset-2 decoration-earth-300">{inv.project}</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Hash className="w-2.5 h-2.5 text-earth-400 shrink-0" />
                              <span className="text-[10px] text-earth-500 truncate">{inv.project}</span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 text-left" dir="ltr">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-earth-400" />
                          <span className="text-sm font-black font-mono text-earth-900">
                            {inv.amount}
                          </span>
                        </div>
                        <span className="text-[9px] text-earth-500 font-mono">JOD</span>
                      </div>

                      {/* Status */}
                      <button
                        onClick={() => handleStatusToggle(inv)}
                        className={`shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-[3px] border cursor-pointer transition ${status.color}`}
                        title={t("invoices.changeStatusTo", { status: t(statusConfig[status.next].label) })}
                      >
                        {t(status.label)}
                      </button>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => printInvoice(inv)}
                          className="p-1.5 text-earth-500 hover:text-olive-600 transition cursor-pointer rounded-sm"
                          title={t("invoices.downloadInvoice")}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-earth-500 hover:text-red-500 transition cursor-pointer rounded-sm"
                          title={t("invoices.deleteInvoice")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========== CREATE MODAL ========== */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white border border-earth-200 rounded-sm p-5 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-earth-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4" style={{ color: "var(--accent-terracotta)" }} />
                  {t("invoices.newInvoice")}
                </h3>
                <button
                  onClick={() => { setModal(false); setClientError(false); }}
                  className="text-earth-500 hover:text-earth-700 transition p-1 cursor-pointer rounded-sm"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="invoice-client" className="block text-xs font-black text-earth-700">
                    {t("invoices.client")}
                  </label>
                  <input
                    id="invoice-client"
                    ref={clientInputRef}
                    value={form.client}
                    onChange={(e) => { setForm((p) => ({ ...p, client: e.target.value })); setClientError(false); }}
                    placeholder={t("invoices.clientPlaceholder")}
                    className={`w-full bg-white border-2 rounded-xl py-2.5 px-4 text-sm text-earth-900 outline-none transition placeholder:text-earth-400 ${
                      clientError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-earth-200 focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100"
                    }`}
                  />
                  {clientError && (
                    <p className="text-[11px] text-red-500 font-medium">{t("invoices.clientRequired")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="invoice-project" className="block text-xs font-black text-earth-700">
                    {t("invoices.project")}
                  </label>
                  <input
                    id="invoice-project"
                    value={form.project}
                    onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                    placeholder={t("invoices.projectPlaceholder")}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="invoice-amount" className="block text-xs font-black text-earth-700">
                    {t("invoices.amountLabel")}
                  </label>
                  <input
                    id="invoice-amount"
                    type="number"
                    value={form.amount || ""}
                    onChange={(e) => setForm((p) => ({ ...p, amount: +e.target.value }))}
                    placeholder={t("invoices.amountPlaceholder")}
                    className="w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900 font-mono font-black outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100 transition placeholder:text-earth-400"
                  />
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    className="w-full bg-olive-700 hover:bg-olive-800 active:bg-olive-900 text-white font-bold py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none border-r-3 border-olive-900"
                  >
                    {createMutation.isPending ? t("invoices.creating") : <><Check className="w-4 h-4" /> {t("invoices.create")}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
