import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
}

// olive carries the "go" signal · terracotta is the loud CTA accent
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-olive-600 text-white hover:bg-olive-700 active:bg-olive-800",
  accent: "bg-terracotta-400 text-white hover:bg-terracotta-500 active:bg-terracotta-600",
  secondary:
    "bg-earth-100 text-earth-800 border border-earth-200 hover:bg-earth-200 active:bg-earth-300",
  ghost: "bg-transparent text-earth-700 hover:bg-earth-100 active:bg-earth-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-5 py-3 gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", icon, type = "button", className = "", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          "inline-flex items-center justify-center font-bold rounded-[4px]",
          "shadow-[var(--shadow-button)] transition-colors duration-150",
          "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--accent-terracotta-glow)]",
          "disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
