import Link from "next/link";
import { Download, ExternalLink, Film } from "lucide-react";

interface CompletedReelsProps {
  reels: Array<{
    scenarioId: string;
    scenarioTitle: string;
    day: number;
    projectId: string;
    thumbnailUrl: string | null;
    deliveredAt: Date | null;
  }>;
}

/**
 * Сетка готовых reels из фабрики с кнопками Preview и Download MP4
 * (см. context4.md → WEBSITE DOWNLOAD FEATURE).
 */
export function CompletedReels({ reels }: CompletedReelsProps) {
  if (reels.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium tracking-tight">
          Готовые ролики
        </h2>
        <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground ring-1 ring-border">
          {reels.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {reels.map((r) => (
          <div
            key={r.scenarioId}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3"
          >
            <Link
              href={`/projects/${r.projectId}`}
              className="relative block aspect-[9/16] overflow-hidden rounded-lg border border-border bg-muted"
            >
              {r.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.thumbnailUrl}
                  alt={r.scenarioTitle}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Film className="size-8" />
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground">
                День {r.day}
              </span>
            </Link>
            <div className="min-w-0">
              <div className="line-clamp-1 text-sm font-medium leading-tight">
                {r.scenarioTitle}
              </div>
              {r.deliveredAt && (
                <div className="text-[10px] text-muted-foreground">
                  Доставлено в Telegram
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <Link
                href={`/projects/${r.projectId}`}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border bg-surface-elevated px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-hover transition-colors"
              >
                <ExternalLink className="size-3" />
                Preview
              </Link>
              <a
                href={`/api/projects/${r.projectId}/download`}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border bg-surface-elevated px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-hover transition-colors"
              >
                <Download className="size-3" />
                MP4
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
