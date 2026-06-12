import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Check, Printer, Plus, Trash2, RefreshCcw, ScrollText } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { printContract } from "../../lib/printContract";
import {
  getContractForProject, saveContract, seedContract, defaultClauses,
  type Contract, type ContractSeed,
} from "./contractsService";

type Draft = Omit<Contract, "id" | "userId">;

/**
 * محرّر اتفاقية العمل: صيغة جاهزة لتوريد وتركيب القرميد بالنظام الأردني،
 * تتعبأ من بيانات المشروع، وكل بند قابل للتعديل أو الحذف مع إمكانية إضافة بنود.
 */
export default function ContractModal({ seed, onClose }: { seed: ContractSeed; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const companyName = useAuthStore((s) => s.companyName);
  const companyProfile = useAuthStore((s) => s.companyProfile);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [existingId, setExistingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // تحميل اتفاقية المشروع إن وُجدت، وإلا توليد مسودة معبّأة من بياناته
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = user ? await getContractForProject(user.uid, seed.projectId) : null;
        if (cancelled) return;
        if (existing) {
          const { id, ...rest } = existing;
          delete (rest as { userId?: string }).userId;
          setExistingId(id);
          setDraft(rest);
        } else {
          setDraft(seedContract(seed));
        }
      } catch {
        if (!cancelled) { setLoadError(true); setDraft(seedContract(seed)); }
      }
    })();
    return () => { cancelled = true; };
  }, [user, seed]);

  const set = useCallback(<K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d)), []);

  const setClause = (i: number, v: string) =>
    setDraft((d) => (d ? { ...d, clauses: d.clauses.map((c, j) => (j === i ? v : c)) } : d));
  const addClause = () =>
    setDraft((d) => (d ? { ...d, clauses: [...d.clauses, ""] } : d));
  const removeClause = (i: number) =>
    setDraft((d) => (d ? { ...d, clauses: d.clauses.filter((_, j) => j !== i) } : d));

  // إعادة توليد البنود من قيم الحقول الحالية (يستبدل تعديلات البنود)
  const regenerate = () => {
    if (!draft) return;
    if (!confirm("إعادة توليد البنود من الحقول الحالية ستستبدل تعديلاتك على البنود. متابعة؟")) return;
    set("clauses", defaultClauses(draft));
  };

  const handleSave = async () => {
    if (!draft || !user) return;
    setSaving(true);
    try {
      await saveContract(user.uid, draft, existingId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* الحفظ الأوفلاين يُزامن لاحقًا */ }
    setSaving(false);
  };

  const handlePrint = () => {
    if (!draft) return;
    printContract(draft, {
      name: companyName || draft.partyAName,
      logoURL: companyProfile?.logoURL,
      phone: companyProfile?.phone,
      address: companyProfile?.address,
    });
  };

  const inputCls = "w-full bg-white border-2 border-earth-200 rounded-sm py-2 px-3 text-xs text-earth-900 outline-none focus:border-amber-400 transition placeholder:text-earth-400";
  const labelCls = "block text-[10px] font-black text-earth-600 mb-1";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }} transition={{ duration: 0.2 }}
        className="bg-white border border-earth-200 rounded-sm p-5 max-w-3xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-earth-900 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-600" />
            اتفاقية عمل — توريد وتركيب قرميد
            <span className="text-[9px] font-bold text-earth-500 bg-earth-100 border border-earth-200 rounded-sm px-1.5 py-0.5">النظام الأردني</span>
          </h3>
          <button onClick={onClose} className="text-earth-500 hover:text-earth-700 p-1" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!draft ? (
          <div className="py-12 text-center text-xs text-earth-500">جارٍ التحميل…</div>
        ) : (
          <div className="space-y-4">
            {loadError && (
              <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                تعذّر جلب اتفاقية محفوظة — هذه مسودة جديدة معبّأة من بيانات المشروع.
              </p>
            )}

            {/* الفريقان */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border-2 border-earth-200 rounded-sm p-3 space-y-2">
                <p className="text-[10px] font-black text-terracotta-600">الفريق الأول — المقاول</p>
                <div><label className={labelCls}>الاسم</label>
                  <input value={draft.partyAName} onChange={(e) => set("partyAName", e.target.value)} className={inputCls} placeholder="اسم المقاول / المؤسسة" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>رقم وطني / سجل</label>
                    <input value={draft.partyANationalId || ""} onChange={(e) => set("partyANationalId", e.target.value)} className={inputCls} dir="ltr" /></div>
                  <div><label className={labelCls}>هاتف</label>
                    <input value={draft.partyAPhone || ""} onChange={(e) => set("partyAPhone", e.target.value)} className={inputCls} dir="ltr" /></div>
                </div>
              </div>
              <div className="border-2 border-earth-200 rounded-sm p-3 space-y-2">
                <p className="text-[10px] font-black text-terracotta-600">الفريق الثاني — صاحب العمل</p>
                <div><label className={labelCls}>الاسم</label>
                  <input value={draft.partyBName} onChange={(e) => set("partyBName", e.target.value)} className={inputCls} placeholder="اسم العميل" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>رقم وطني</label>
                    <input value={draft.partyBNationalId || ""} onChange={(e) => set("partyBNationalId", e.target.value)} className={inputCls} dir="ltr" /></div>
                  <div><label className={labelCls}>هاتف</label>
                    <input value={draft.partyBPhone || ""} onChange={(e) => set("partyBPhone", e.target.value)} className={inputCls} dir="ltr" /></div>
                </div>
                <div><label className={labelCls}>العنوان</label>
                  <input value={draft.partyBAddress || ""} onChange={(e) => set("partyBAddress", e.target.value)} className={inputCls} /></div>
              </div>
            </div>

            {/* موضوع الاتفاقية وشروطها */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="col-span-2 sm:col-span-3"><label className={labelCls}>موضوع الاتفاقية (وصف الأعمال)</label>
                <input value={draft.subject} onChange={(e) => set("subject", e.target.value)} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>موقع العمل</label>
                <input value={draft.location} onChange={(e) => set("location", e.target.value)} className={inputCls} placeholder="مثال: عمّان — ماركا الشمالية، حي…" /></div>
              <div><label className={labelCls}>القيمة الإجمالية (د.أ)</label>
                <input type="number" min="0" value={draft.totalAmount || ""} onChange={(e) => set("totalAmount", +e.target.value)} className={`${inputCls} font-mono`} /></div>
              <div><label className={labelCls}>مدة التنفيذ (يوم عمل)</label>
                <input type="number" min="1" value={draft.durationDays || ""} onChange={(e) => set("durationDays", +e.target.value)} className={`${inputCls} font-mono`} /></div>
              <div><label className={labelCls}>تاريخ المباشرة</label>
                <input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>الضمان (سنوات)</label>
                <input type="number" min="0" value={draft.warrantyYears || ""} onChange={(e) => set("warrantyYears", +e.target.value)} className={`${inputCls} font-mono`} /></div>
              <div className="col-span-2 sm:col-span-1"><label className={labelCls}>مدينة الاختصاص القضائي</label>
                <input value={draft.city} onChange={(e) => set("city", e.target.value)} className={inputCls} /></div>
            </div>

            {/* جدول الدفعات */}
            <div>
              <label className={labelCls}>جدول الدفعات (يظهر في الاتفاقية كما هو)</label>
              <textarea value={draft.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} rows={3}
                className={`${inputCls} resize-y font-mono leading-relaxed`} />
            </div>

            {/* البنود */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-earth-600">بنود الاتفاقية — عدّل أو احذف أو أضف</label>
                <button onClick={regenerate}
                  className="text-[10px] font-bold text-earth-500 hover:text-amber-700 flex items-center gap-1 transition"
                  title="إعادة توليد البنود من الحقول أعلاه">
                  <RefreshCcw className="w-3 h-3" /> إعادة توليد من الحقول
                </button>
              </div>
              <div className="space-y-1.5">
                {draft.clauses.map((cl, i) => (
                  <div key={i} className="flex gap-1.5 group">
                    <span className="shrink-0 w-6 h-6 mt-1 rounded-sm bg-earth-100 border border-earth-200 text-[10px] font-black text-earth-600 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <textarea
                      value={cl}
                      onChange={(e) => setClause(i, e.target.value)}
                      rows={2}
                      className={`${inputCls} resize-y leading-relaxed flex-1`}
                      placeholder={`نص البند ${i + 1}…`}
                    />
                    <button onClick={() => removeClause(i)}
                      className="shrink-0 p-1 mt-1 text-earth-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      title="حذف البند">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addClause}
                className="w-full mt-1.5 py-1.5 rounded-sm text-[11px] font-black text-amber-700 border border-dashed border-amber-300 hover:bg-amber-50 transition flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> إضافة بند جديد
              </button>
            </div>

            {/* أزرار */}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving || !draft.partyBName.trim()}
                className="flex-1 bg-olive-700 hover:bg-olive-800 text-earth-100 font-bold py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2 disabled:opacity-40 border-r-3 border-olive-900">
                {saving ? "جارٍ الحفظ…" : saved ? <><Check className="w-4 h-4" /> تم الحفظ</> : <><Check className="w-4 h-4" /> حفظ الاتفاقية</>}
              </button>
              <button onClick={handlePrint}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-earth-100 font-bold py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> طباعة الاتفاقية
              </button>
            </div>
            <p className="text-[9px] text-earth-400 text-center">
              تُطبع من نسختين — نسخة لكل فريق، مع خانة شاهد. عدّل أي بند بما يناسب اتفاقك قبل الطباعة.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
