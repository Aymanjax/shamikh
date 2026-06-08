import { type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-earth-700">{label}</label>
      )}
      <div className="relative">
        <select
          className={[
            "w-full appearance-none bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 pr-10",
            "text-sm text-earth-900 transition-colors duration-200",
            "focus:outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100",
            "disabled:bg-earth-50 disabled:text-earth-500",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            className,
          ].join(" ")}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-earth-400 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
