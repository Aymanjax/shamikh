import { type HTMLAttributes, type ReactNode } from "react";

type StatAccent = "terracotta" | "olive" | "amber" | "red";

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  value: ReactNode;
  label: ReactNode;
  suffix?: string;
  accent?: StatAccent;
}

const accentMap: Record<StatAccent, { c: string; bg: string }> = {
  terracotta: { c: "var(--accent-terracotta)", bg: "var(--accent-terracotta-soft)" },
  olive: { c: "var(--accent-olive)", bg: "var(--accent-olive-soft)" },
  amber: { c: "var(--accent-amber)", bg: "var(--accent-amber-soft)" },
  red: { c: "var(--accent-red)", bg: "var(--accent-red-soft)" },
};

// A stat tile: numbers lead (mono, weight-900), unit/label follow.
function StatCard({
  icon,
  value,
  label,
  suffix = "",
  accent = "terracotta",
  className = "",
  style,
  ...rest
}: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={["earth-card p-4 flex flex-col gap-2", className].filter(Boolean).join(" ")}
      style={{ borderRightColor: a.c, ...style }}
      {...rest}
    >
      {icon && (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-[4px]"
          style={{ background: a.bg, color: a.c }}
        >
          {icon}
        </div>
      )}
      <div
        className="text-2xl font-black text-earth-900 leading-none"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
        {suffix && <span className="text-[0.7em] font-bold"> {suffix}</span>}
      </div>
      <div className="text-xs font-bold text-earth-600">{label}</div>
    </div>
  );
}

export default StatCard;
