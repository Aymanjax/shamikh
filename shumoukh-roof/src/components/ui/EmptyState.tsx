import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-14 rounded-full bg-earth-100 border-2 border-earth-200 flex items-center justify-center mb-4">
        <Icon className="size-6 text-earth-400" />
      </div>
      <h3 className="text-sm font-black text-earth-700 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-earth-400 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
