import { cn } from "@/lib/utils";
import {
  FACTORY_STATUS_LABELS,
  SCENARIO_STATUS_LABELS,
  type FactoryStatus,
  type ScenarioStatus,
} from "@/lib/factory/types";

const FACTORY_STYLES: Record<FactoryStatus, string> = {
  DRAFT: "bg-muted/40 text-muted-foreground ring-border",
  PLANNING: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  AWAITING_APPROVAL: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
  GENERATING: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  SCHEDULED: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  COMPLETED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  FAILED: "bg-red-500/15 text-red-300 ring-red-500/30",
};

const SCENARIO_STYLES: Record<ScenarioStatus, string> = {
  DRAFT: "bg-muted/40 text-muted-foreground ring-border",
  APPROVED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  REGENERATING: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  QUEUED: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  GENERATING: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  READY: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  FAILED: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export function FactoryStatusPill({ status }: { status: FactoryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        FACTORY_STYLES[status]
      )}
    >
      {FACTORY_STATUS_LABELS[status]}
    </span>
  );
}

export function ScenarioStatusPill({ status }: { status: ScenarioStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 uppercase tracking-wider",
        SCENARIO_STYLES[status]
      )}
    >
      {SCENARIO_STATUS_LABELS[status]}
    </span>
  );
}
