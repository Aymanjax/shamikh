interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-terracotta-200",
          checked ? "bg-terracotta-500" : "bg-earth-200",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0",
            "transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      {label && <span className="text-sm font-bold text-earth-700 select-none">{label}</span>}
    </label>
  );
}
