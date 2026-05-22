import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { createProject } from "../services/projectService";

export default function NewProjectPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: "", clientPhone: "", clientAddress: "",
    roofType: "simple", segments: [{ length: 5, width: 4 }],
    slope: 20, facadeLength: 13, numLegs: 6, legHeight: 2.7,
    withDecor: true, enableInsulation: false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSegmentChange = (index, field, value) => {
    const segs = [...form.segments];
    segs[index] = { ...segs[index], [field]: Number(value) };
    setForm((f) => ({ ...f, segments: segs }));
  };

  const addSegment = () => {
    setForm((f) => ({ ...f, segments: [...f.segments, { length: 0, width: 0 }] }));
  };

  const removeSegment = (index) => {
    if (form.segments.length <= 1) return;
    setForm((f) => ({ ...f, segments: f.segments.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createProject(user.uid, {
        client: { name: form.clientName, phone: form.clientPhone, address: form.clientAddress },
        roof: { type: form.roofType, segments: form.segments, slope: Number(form.slope) },
        settings: { facadeLength: Number(form.facadeLength), numLegs: Number(form.numLegs), legHeight: Number(form.legHeight), withDecor: form.withDecor, enableInsulation: form.enableInsulation },
      });
      navigate("/projects");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">مشروع جديد</h1>
        <p className="text-sm text-ink-muted">أدخل بيانات العميل وقياسات الورشة لحساب المواد والتكلفة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-user text-amber-600"></i> بيانات العميل</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-ink-muted font-bold">اسم العميل</label>
              <input name="clientName" value={form.clientName} onChange={handleChange} required
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-bold">رقم الهاتف</label>
              <input name="clientPhone" value={form.clientPhone} onChange={handleChange} dir="ltr"
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-bold">العنوان</label>
              <input name="clientAddress" value={form.clientAddress} onChange={handleChange}
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-ruler-combined text-amber-600"></i> قياسات الورشة</h3>
            <button type="button" onClick={addSegment}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-3 rounded-lg font-bold transition">
              <i className="fa-solid fa-plus ml-1"></i> مقطع إضافي
            </button>
          </div>

          {form.segments.map((seg, i) => (
            <div key={i} className="flex gap-3 items-end bg-surface-subtle p-3 rounded-2xl border border-line">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-ink-muted font-bold">الطول (م)</label>
                <input type="number" value={seg.length} onChange={(e) => handleSegmentChange(i, "length", e.target.value)} step="0.1"
                  className="w-full bg-surface border border-line rounded-xl py-2 px-3 text-ink outline-none focus:border-amber-500 transition" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-ink-muted font-bold">العرض (م)</label>
                <input type="number" value={seg.width} onChange={(e) => handleSegmentChange(i, "width", e.target.value)} step="0.1"
                  className="w-full bg-surface border border-line rounded-xl py-2 px-3 text-ink outline-none focus:border-amber-500 transition" />
              </div>
              {form.segments.length > 1 && (
                <button type="button" onClick={() => removeSegment(i)}
                  className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition">
                  <i className="fa-solid fa-trash"></i>
                </button>
              )}
            </div>
          ))}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-bold">الميل (%)</label>
              <select name="slope" value={form.slope} onChange={handleChange}
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition">
                <option value="0">0%</option><option value="10">10%</option>
                <option value="20">20%</option><option value="30">30%</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-bold">أطوال الواجهات (م)</label>
              <input type="number" name="facadeLength" value={form.facadeLength} onChange={handleChange} step="0.1"
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-muted font-bold">عدد الأرجل</label>
              <input type="number" name="numLegs" value={form.numLegs} onChange={handleChange}
                className="w-full bg-surface-input border border-line rounded-xl py-2.5 px-4 text-ink outline-none focus:border-amber-500 transition" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold flex items-center gap-2"><i className="fa-solid fa-palette text-amber-600"></i> خيارات التشطيب</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-surface-subtle border border-line rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-sm">ديكور خشبي</div>
                <div className="text-[10px] text-ink-muted">البيش يزيد مع الديكور</div>
              </div>
              <div className="relative">
                <input type="checkbox" name="withDecor" checked={form.withDecor} onChange={handleChange} className="sr-only peer" />
                <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-amber-500 transition"></div>
                <div className="absolute w-5 h-5 bg-surface rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
              </div>
            </label>
            <label className="flex items-center justify-between p-3 bg-surface-subtle border border-line rounded-2xl cursor-pointer">
              <div>
                <div className="font-bold text-sm">عزل مائي</div>
                <div className="text-[10px] text-ink-muted">زفتة + لاتي + مساطير</div>
              </div>
              <div className="relative">
                <input type="checkbox" name="enableInsulation" checked={form.enableInsulation} onChange={handleChange} className="sr-only peer" />
                <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 transition"></div>
                <div className="absolute w-5 h-5 bg-surface rounded-full top-1 right-1 transition peer-checked:translate-x-[-20px]"></div>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition disabled:opacity-50">
          {saving ? "جاري الحفظ..." : "حفظ المشروع"}
        </button>
      </form>
    </div>
  );
}