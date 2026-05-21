import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchProject, updateProject, deleteProject, updateProjectStatus, projectStatuses } from "../services/projectService";
import { downloadMaterialList, downloadQuotation } from "../services/pdfService";
import { TILES_CATALOG, STATUS_COLORS, STATUS_LABELS } from "../utils/constants";
import { calcAll, calcCosts } from "../utils/calculations";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchProject(user.uid, id);
      setProject(data);
      setForm(data?.client || {});
      setLoading(false);
    };
    load();
  }, [user, id]);

  const tile = TILES_CATALOG[0];
  const prices = { iron4x8: 12, iron10x10: 22, tile: 0.95, decor: 5, besh: 1.5, sharshef: 4, nathrayat: 150 };

  const calcResult = useMemo(() => {
    if (!project?.roof) return null;
    return calcAll({
      segments: project.roof.segments || [{ length: 0, width: 0 }],
      slopePercent: project.roof.slope || 0,
      facadeLength: project.settings?.facadeLength || 0,
      numLegs: project.settings?.numLegs || 0,
      legHeight: project.settings?.legHeight || 0,
      withDecor: project.settings?.withDecor ?? true,
      enableInsulation: project.settings?.enableInsulation ?? false,
      tile,
    });
  }, [project, tile]);

  const costResult = useMemo(() => {
    return calcResult ? calcCosts(calcResult, prices, prices.nathrayat) : null;
  }, [calcResult, prices]);

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;
    await deleteProject(user.uid, id);
    navigate("/projects");
  };

  const handleStatusChange = async (status) => {
    await updateProjectStatus(user.uid, id, status);
    setProject((p) => ({ ...p, status }));
  };

  const handleSaveClient = async () => {
    await updateProject(user.uid, id, { client: form });
    setEditing(false);
    setProject((p) => ({ ...p, client: form }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12 text-slate-400">المشروع غير موجود</div>;
  }

  const segs = project.roof?.segments || [];
  const flatArea = segs.reduce((sum, s) => sum + (s.length || 0) * (s.width || 0), 0);
  const slopeMultiplier = 1 + ((project.roof?.slope || 0) / 100);
  const actualArea = flatArea * slopeMultiplier;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link to="/projects" className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1 mb-2">
            <i className="fa-solid fa-arrow-right"></i> العودة للمشاريع
          </Link>
          <h1 className="text-2xl font-black">{project.client?.name || "بدون اسم"}</h1>
          <p className="text-sm text-slate-400">{project.client?.phone} {project.client?.address ? `| ${project.client.address}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={project.status} onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${STATUS_COLORS[project.status] || STATUS_COLORS.draft} bg-transparent`}>
            {projectStatuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button onClick={handleDelete} className="text-red-400 hover:text-red-300 transition p-2" title="حذف المشروع">
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-slate-400">المساحة الأرضية</p>
          <p className="text-2xl font-black mt-1">{flatArea.toFixed(2)} م²</p>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-slate-400">المساحة مع الميل ({project.roof?.slope || 0}%)</p>
          <p className="text-2xl font-black mt-1">{actualArea.toFixed(2)} م²</p>
        </div>
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-slate-400">تاريخ الإنشاء</p>
          <p className="text-lg font-bold mt-1">{new Date(project.createdAt).toLocaleDateString("ar-JO")}</p>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-user text-brand-500"></i> بيانات العميل</h3>
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-brand-500 hover:text-brand-400 transition font-bold">
            <i className={`fa-solid ${editing ? "fa-times" : "fa-pen"} ml-1`}></i>
            {editing ? "إلغاء" : "تعديل"}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="اسم العميل" className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-4 text-white outline-none focus:border-brand-500" />
            <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="رقم الهاتف" className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-4 text-white outline-none focus:border-brand-500" />
            <button onClick={handleSaveClient}
              className="bg-brand-600 hover:bg-brand-700 py-2 px-5 rounded-xl font-bold text-sm transition">
              حفظ التعديلات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">الاسم:</span> {project.client?.name || "-"}</div>
            <div><span className="text-slate-400">الهاتف:</span> {project.client?.phone || "-"}</div>
            <div className="col-span-2"><span className="text-slate-400">العنوان:</span> {project.client?.address || "-"}</div>
          </div>
        )}
      </div>

      <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-ruler-combined text-brand-500"></i> القياسات والحسابات</h3>
        <div className="space-y-2">
          {segs.map((seg, i) => (
            <div key={i} className="flex justify-between bg-slate-900/40 p-3 rounded-xl text-sm">
              <span>مقطع {i + 1}:</span>
              <span>{seg.length} × {seg.width} م = {(seg.length * seg.width).toFixed(2)} م²</span>
            </div>
          ))}
          <div className="flex justify-between bg-brand-500/10 p-3 rounded-xl text-sm font-bold">
            <span>المساحة الفعلية (بعد الميل):</span>
            <span className="text-brand-500">{actualArea.toFixed(2)} م²</span>
          </div>
        </div>
      </div>

      {calcResult && (
        <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-3">
          <h3 className="font-bold flex items-center gap-2 text-sm"><i className="fa-solid fa-calculator text-brand-500"></i> كشف المواد التقديري</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-900/40 p-3 rounded-xl flex justify-between">
              <span className="text-slate-400">حديد 4×8:</span>
              <span className="font-bold">{calcResult.iron4x8} تيوب</span>
            </div>
            <div className="bg-slate-900/40 p-3 rounded-xl flex justify-between">
              <span className="text-slate-400">حديد 10×10:</span>
              <span className="font-bold">{calcResult.iron10x10.total} تيوب</span>
            </div>
            <div className="bg-slate-900/40 p-3 rounded-xl flex justify-between">
              <span className="text-slate-400">ديكور:</span>
              <span className="font-bold">{calcResult.decor.bundles > 0 ? `${calcResult.decor.bundles} ربطة` : "بدون"}</span>
            </div>
            <div className="bg-slate-900/40 p-3 rounded-xl flex justify-between">
              <span className="text-slate-400">البيش:</span>
              <span className="font-bold">{calcResult.beshQty.toFixed(1)} وحدة</span>
            </div>
            <div className="bg-slate-900/40 p-3 rounded-xl flex justify-between">
              <span className="text-slate-400">شراشف:</span>
              <span className="font-bold">{calcResult.borders.total.toFixed(1)} م</span>
            </div>
            <div className="bg-slate-900/40 p-3 rounded-xl flex justify-between">
              <span className="text-slate-400">مشمع:</span>
              <span className="font-bold">{calcResult.tarpaulin.text}</span>
            </div>
          </div>
          <div className="bg-brand-500/10 p-3 rounded-xl flex justify-between text-sm font-bold">
            <span>القرميد:</span>
            <span className="text-brand-500">{calcResult.totalTiles} حبة</span>
          </div>
          {costResult && (
            <div className="bg-emerald-500/10 p-3 rounded-xl flex justify-between text-sm font-bold">
              <span>التكلفة التقديرية:</span>
              <span className="text-emerald-400">{costResult.totalWithNathrayat.toFixed(1)} د.أ</span>
            </div>
          )}
        </div>
      )}

      {project.payments && project.payments.length > 0 && (
        <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 space-y-3">
          <h3 className="font-bold flex items-center gap-2 text-sm"><i className="fa-solid fa-money-bill-wave text-emerald-500"></i> الدفعات</h3>
          {project.payments.map((payment) => (
            <div key={payment.id} className="flex justify-between bg-slate-900/40 p-3 rounded-xl text-sm">
              <span className="font-bold text-emerald-400">{payment.amount} د.أ</span>
              <span className="text-slate-400">{payment.note && `${payment.note} - `}{new Date(payment.date).toLocaleDateString("ar-JO")}</span>
            </div>
          ))}
          <div className="flex justify-between bg-emerald-500/10 p-3 rounded-xl font-bold text-sm">
            <span>الإجمالي:</span>
            <span className="text-emerald-400">{project.payments.reduce((s, p) => s + (p.amount || 0), 0).toFixed(1)} د.أ</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Link to={`/projects/${id}/order`}
          className="bg-slate-800 hover:bg-brand-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm">
          <i className="fa-solid fa-clipboard-list text-brand-400"></i> طلب بضاعة
        </Link>
        <button onClick={() => downloadMaterialList(calcResult, tile, project)}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm">
          <i className="fa-solid fa-file-pdf text-red-400"></i> كشف مواد PDF
        </button>
        <button onClick={() => costResult && downloadQuotation(calcResult, costResult, tile, prices, project)}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm">
          <i className="fa-solid fa-file-invoice text-amber-400"></i> عرض سعر PDF
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={() => handleStatusChange("completed")}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-bold text-sm transition">
          <i className="fa-solid fa-check ml-1"></i> تعيين منجز
        </button>
        <button
          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
          <i className="fa-brands fa-whatsapp"></i> إرسال للعميل
        </button>
      </div>
    </div>
  );
}
