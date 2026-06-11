import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  icon?: ReactNode;
  /** Required for accessibility — used as aria-label and title. */
  label: string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={[
          "inline-flex items-center justify-center w-9 h-9 rounded-[4px]",
          "text-earth-700 hover:bg-earth-100 active:bg-earth-200",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--accent-terracotta-glow)]",
          "disabled:opacity-40 disabled:pointer-events-none",
          className,
        ].join(" ")}
        {...props}
      >
        {icon ?? children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
export default IconButton;
