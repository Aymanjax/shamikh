import { type HTMLAttributes, type ReactNode } from "react";

type BadgeTone = "terracotta" | "olive" | "amber" | "red" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: ReactNode;
}

// Angular 3px chip — soft fill + matching border. Never pill-shaped.
const toneClasses: Record<BadgeTone, string> = {
  terracotta:
    "bg-[var(--accent-terracotta-soft)] text-[var(--accent-terracotta)] border-[var(--accent-terracotta-border)]",
  olive: "bg-[var(--accent-olive-soft)] text-[var(--accent-olive)] border-[var(--accent-olive-border)]",
  amber: "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] border-[var(--accent-amber-border)]",
  red: "bg-[var(--accent-red-soft)] text-[var(--accent-red)] border-[var(--accent-red-border)]",
  neutral: "bg-earth-100 text-earth-700 border-earth-300",
};

function Badge({ tone = "neutral", icon, className = "", children, ...rest }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border",
        "text-[11px] font-bold leading-none",
        toneClasses[tone],
        className,
      ].join(" ")}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export default Badge;
