import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Trash2, Eye, Search, Calculator, FileText, X, Check, HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { listDocuments, deleteDocument, addDocument } from "../../lib/firestoreService";
import GlassButton from "../../components/ui/GlassButton";

interface Project {
  id: string;
  name?: string;
  client?: { name?: string; phone?: string; address?: string };
  result?: { totalTiles?: number; actualArea?: number; flatArea?: number; totalCost?: number };
  input?: { slope?: number; numLegs?: number };
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Project | null>(null);
  const [invoiceCreated, setInvoiceCreated] = useState(false);

  const { data: projects = [], isLoading: loading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => listDocuments("projects") as Promise<Project[]>,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument("projects", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: { client: string; project: string; amount: number; status: string; projectId: string }) =>
      addDocument("invoices", data),
    onSuccess: () => {
      setInvoiceCreated(true);
      setTimeout(() => { setInvoiceCreated(false); setDetail(null); }, 2000);
    },
  });

  const filtered = projects.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback((id: string, name: string) => {
    if (!confirm(`حذف المشروع "${name}"؟`)) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleCreateInvoice = useCallback((p: Project) => {
    createInvoiceMutation.mutate({
      client: p.client?.name || "",
      project: p.name || "",
      amount: p.result?.totalCost || 0,
      status: "draft",
      projectId: p.id,
    });
  }, [createInvoiceMutation]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-black text-earth-800 mb-1">تعذر تحميل المشاريع</p>
        <p className="text-xs text-earth-500">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-amber-600 flex items-center justify-center border-l-3 border-amber-400">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-earth-900 tracking-tight">المشاريع</h1>
            <p className="text-sm text-earth-500">جميع المشاريع المحفوظة من الحاسبة</p>
          </div>
        </div>
        <Link to="/calculator">
          <GlassButton variant="primary" size="sm" icon={<Calculator className="w-4 h-4" />}>
            حساب جديد
          </GlassButton>
        </Link>
      </div>

      <div className="glass-card">
        <div className="p-4 border-b border-earth-200">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث عن مشروع..." dir="rtl"
              className="w-full bg-white border-2 border-earth-200 rounded-xl py-2 pr-10 pl-3 text-sm text-earth-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-earth-200 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-earth-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-black">لا توجد مشاريع</p>
            <p className="text-xs mt-1">احسب بضاعة جديدة واحفظها كمشروع</p>
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            {filtered.map((p) => (
              <div key={p.id} className="p-4 hover:bg-earth-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-sm bg-amber-100 border-l-2 border-amber-400 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5" style={{ color: "var(--accent-amber)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-earth-900 text-sm truncate">{p.name || "بدون اسم"}</p>
                    <p className="text-xs text-earth-500">
                      {p.result?.totalTiles || 0} حبة · {p.result?.actualArea?.toFixed(1) || "0"} م²
                      {p.result?.totalCost ? ` · ${p.result.totalCost} د.أ` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setDetail(p)}
                    className="p-2 text-earth-500 hover:text-olive-600 transition rounded-sm hover:bg-olive-50">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name || "")}
                    className="p-2 text-earth-500 hover:text-red-500 transition rounded-sm hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-sm border border-earth-200 p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-earth-900">{detail.name}</h3>
              <button onClick={() => setDetail(null)} className="text-earth-500 hover:text-earth-700 p-1 rounded-sm" aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-earth-50 border border-earth-200 rounded-sm p-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-earth-500 text-xs font-bold">المساحة</span>
                  <p className="font-black text-earth-900">{detail.result?.flatArea?.toFixed(1)} م²</p>
                </div>
                <div>
                  <span className="text-earth-500 text-xs font-bold">القرميد</span>
                  <p className="font-black text-earth-900">{detail.result?.totalTiles} حبة</p>
                </div>
                <div>
                  <span className="text-earth-500 text-xs font-bold">الميل</span>
                  <p className="font-black text-earth-900">{detail.input?.slope}%</p>
                </div>
                <div>
                  <span className="text-earth-500 text-xs font-bold">عدد الأرجل</span>
                  <p className="font-black text-earth-900">{detail.input?.numLegs}</p>
                </div>
              </div>
              {detail.result?.totalCost && (
                <div className="text-white rounded-sm p-3 flex justify-between font-black" style={{ backgroundColor: "var(--accent-amber)" }}>
                  <span>التكلفة التقديرية</span>
                  <span style={{ color: "var(--accent-amber-soft)" }}>{detail.result.totalCost} د.أ</span>
                </div>
              )}
              <div className="flex gap-2">
                <Link to="/calculator"
                  className="flex-1 bg-olive-700 hover:bg-olive-800 text-white font-black py-2.5 rounded-sm transition text-sm text-center border-r-3 border-olive-900">
                  فتح في الحاسبة
                </Link>
                <button onClick={() => handleCreateInvoice(detail)}
                  disabled={createInvoiceMutation.isPending}
                  className="flex-1 bg-olive-600 hover:bg-olive-700 text-white font-black py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-1 border-r-3 border-olive-800">
                  {invoiceCreated ? (
                    <><Check className="w-4 h-4" /> تم</>
                  ) : createInvoiceMutation.isPending ? (
                    "جارٍ..."
                  ) : (
                    <><FileText className="w-4 h-4" /> فاتورة</>
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
