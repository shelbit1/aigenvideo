import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  label,
  value,
  hint,
  icon,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5",
        "transition-colors hover:bg-surface-elevated",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground/70">{icon}</span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
