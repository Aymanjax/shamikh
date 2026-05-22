import { useRef, useEffect } from "react";

export default function SideEditor({ sides, onUpdate, onAdd, onRemove }) {
  const lastRef = useRef(null);

  useEffect(() => {
    if (lastRef.current) lastRef.current.focus();
  }, [sides.length]);

  const totalFacade = sides.filter((s) => s.hasFacade).reduce((sum, s) => sum + s.length, 0);

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-sm text-ink mb-2 flex items-center gap-2">
          <i className="fa-solid fa-ruler-combined text-amber-500"></i>
          قياس جميع الأضلاع
        </h3>
        <p className="text-[10px] text-ink-muted mb-3">أدخل كل ضلع من أضلاع السقف. فعّل "واجهة" للأضلاع اللي عليها شراشف.</p>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-ink-muted text-[10px]">
                <th className="py-1.5 px-2 font-bold text-center w-8">#</th>
                <th className="py-1.5 px-2 font-bold text-right">الطول (م)</th>
                <th className="py-1.5 px-2 font-bold text-center">واجهة</th>
                <th className="py-1.5 px-2 font-bold text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sides.map((side, i) => (
                <tr key={i} className="hover:bg-surface-subtle transition">
                  <td className="py-1.5 px-2 text-center text-ink-muted text-xs">{i + 1}</td>
                  <td className="py-1.5 px-2">
                    <input
                      ref={i === sides.length - 1 ? lastRef : undefined}
                      type="number" value={side.length} min="0.1" step="0.1"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v > 0) onUpdate(i, "length", v);
                      }}
                      className="w-full bg-surface-input border border-line rounded-lg py-1.5 px-2 text-ink text-xs outline-none focus:border-amber-500 transition text-center"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <button onClick={() => onUpdate(i, "hasFacade", !side.hasFacade)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border transition ${
                        side.hasFacade
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-surface border-line text-ink-muted"
                      }`}>
                      {side.hasFacade ? "✅" : "❌"}
                    </button>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {sides.length > 3 && (
                      <button onClick={() => onRemove(i)}
                        className="text-red-300 hover:text-red-500 transition text-xs p-1">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={onAdd}
          className="w-full mt-2 py-2 border border-dashed border-line rounded-xl text-xs text-ink-muted hover:text-ink hover:border-amber-300 transition flex items-center justify-center gap-1">
          <i className="fa-solid fa-plus"></i> إضافة ضلع
        </button>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-subtle rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-ink-muted font-bold">عدد الأضلاع</p>
            <p className="font-black text-ink">{sides.length}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-200">
            <p className="text-[9px] text-amber-700 font-bold">مجموع أطوال الواجهات</p>
            <p className="font-black text-amber-800">{totalFacade.toFixed(2)} م</p>
          </div>
        </div>
      </div>
    </div>
  );
}