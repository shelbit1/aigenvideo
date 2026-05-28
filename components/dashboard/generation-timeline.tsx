import { Check, Loader2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { RelativeTime } from "./relative-time";
import type { Generation, GenerationStatus, GenerationType } from "@prisma/client";

const TYPE_LABELS: Record<GenerationType, string> = {
  IDENTITY: "Идентичность продукта",
  SCRIPT: "Скрипт и сцены",
  START_FRAME: "Стартовый кадр",
  VIDEO: "Видео-движение",
  RENDER: "Финальный рендер",
  DELIVERY: "Доставка в Telegram",
};

const STATUS_ICONS: Record<GenerationStatus, React.ReactNode> = {
  PENDING: <Clock className="size-4" />,
  RUNNING: <Loader2 className="size-4 animate-spin" />,
  SUCCEEDED: <Check className="size-4" />,
  FAILED: <AlertTriangle className="size-4" />,
};

interface GenerationTimelineProps {
  generations: Generation[];
}

export function GenerationTimeline({ generations }: GenerationTimelineProps) {
  if (generations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Этапы появятся, как только запустится генерация.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-3 border-l border-border pl-5">
      {generations.map((g) => (
        <li key={g.id} className="relative">
          <span
            className={cn(
              "absolute -left-[27px] top-0 flex size-5 items-center justify-center rounded-full ring-4 ring-background",
              g.status === "SUCCEEDED" &&
                "bg-[hsl(var(--success))] text-background",
              g.status === "RUNNING" &&
                "bg-[hsl(var(--accent))] text-background",
              g.status === "FAILED" &&
                "bg-[hsl(var(--destructive))] text-destructive-foreground",
              g.status === "PENDING" && "bg-muted text-muted-foreground"
            )}
          >
            {STATUS_ICONS[g.status]}
          </span>
          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{TYPE_LABELS[g.type]}</span>
              <RelativeTime
                date={g.createdAt}
                className="text-[11px] text-muted-foreground"
              />
            </div>
            {g.errorMessage && (
              <p className="mt-1 text-xs text-[hsl(var(--destructive))]">
                {g.errorMessage}
              </p>
            )}
            {g.outputUrl && (
              <a
                href={g.outputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Открыть результат
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
