import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-earth-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-earth-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={[
              "w-full bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4",
              "text-sm text-earth-900 placeholder:text-earth-400",
              "transition-colors duration-200",
              "focus:outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100",
              "disabled:bg-earth-50 disabled:text-earth-500 disabled:cursor-not-allowed",
              icon && "pr-10",
              error && "border-red-300 focus:border-red-400 focus:ring-red-100",
              className,
            ].join(" ")}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11px] text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
