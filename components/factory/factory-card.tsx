import Link from "next/link";
import { ArrowRight, CalendarClock, Film, Sparkles } from "lucide-react";
import type { FactoryProject } from "@prisma/client";
import { FactoryStatusPill } from "./factory-status-pill";
import { RelativeTime } from "@/components/dashboard/relative-time";

interface FactoryCardProps {
  factory: FactoryProject & { _count: { scenarios: number } };
}

export function FactoryCard({ factory }: FactoryCardProps) {
  return (
    <Link
      href={`/factory/${factory.id}`}
      className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-base font-medium tracking-tight">
            {factory.title}
          </h3>
          {factory.niche && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {factory.niche}
            </p>
          )}
        </div>
        <FactoryStatusPill status={factory.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat
          icon={<Film className="size-3" />}
          label="Видео/неделю"
          value={String(factory.videosPerWeek)}
        />
        <Stat
          icon={<Sparkles className="size-3" />}
          label="Длительность"
          value={`${factory.reelDuration} сек`}
        />
        <Stat
          icon={<CalendarClock className="size-3" />}
          label="Доставка"
          value={factory.deliveryTime}
        />
      </div>

      <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground">
        <RelativeTime date={factory.createdAt} />
        <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Открыть
          <ArrowRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
