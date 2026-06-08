import { Calculator } from "lucide-react";
import { Link } from "react-router-dom";

const roofPaths = [
  "M40 60 L80 20 L120 60",
  "M60 20 L60 60 M100 20 L100 60",
  "M40 60 L80 40 L120 60",
  "M60 40 L80 60 L100 40",
  "M80 40 L80 20",
];

export default function RoofEmptyState() {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      <svg
        viewBox="0 0 160 90"
        className="w-32 h-18 mb-4 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {roofPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#c2703e"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.35}
          />
        ))}
      </svg>
      <p className="text-sm font-black text-earth-700 mb-1">لا توجد مشاريع بعد</p>
      <p className="text-xs text-earth-500 mb-4">ابدأ بحساب البضاعة وسيظهر المشروع هنا تلقائياً</p>
      <Link
        to="/calculator"
        className="text-xs font-bold text-terracotta-500 hover:text-terracotta-600 transition-colors flex items-center gap-1.5"
      >
        <Calculator className="w-3.5 h-3.5" />
        احسب البضاعة الآن
      </Link>
    </div>
  );
}
