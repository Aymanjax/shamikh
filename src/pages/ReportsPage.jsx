export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">التقارير</h1>
        <p className="text-sm text-slate-400">تقارير الأرباح الشهرية واستهلاك المواد</p>
      </div>
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-12 text-center">
        <i className="fa-solid fa-file-alt text-5xl text-slate-600 mb-4"></i>
        <h2 className="text-lg font-bold">قريباً</h2>
        <p className="text-slate-400 text-sm mt-1">لوحة تقارير متقدمة مع رسوم بيانية</p>
      </div>
    </div>
  );
}
