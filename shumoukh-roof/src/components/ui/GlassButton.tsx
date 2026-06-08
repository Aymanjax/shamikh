import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-olive-700 text-white " +
    "hover:bg-olive-800 active:bg-olive-900 " +
    "border-r-3 border-olive-900",
  secondary:
    "bg-white text-earth-700 border border-earth-300 " +
    "hover:bg-earth-50 hover:border-earth-400 " +
    "active:bg-earth-100",
  accent:
    "bg-terracotta-500 text-white " +
    "hover:bg-terracotta-600 active:bg-terracotta-700 " +
    "border-r-3 border-terracotta-700",
  ghost:
    "bg-transparent text-warm-gray-500 " +
    "hover:bg-earth-100 hover:text-warm-gray-700 " +
    "active:bg-earth-200",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded gap-1.5",
  md: "px-4 py-2.5 text-sm rounded gap-2",
  lg: "px-6 py-3 text-base rounded gap-2.5",
};

export default function GlassButton({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={[
        "relative inline-flex items-center justify-center font-bold",
        "transition-all duration-150 select-none",
        variantStyles[variant],
        sizeStyles[size],
        "disabled:opacity-40 disabled:pointer-events-none",
        "cursor-pointer",
        className,
      ].join(" ")}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}