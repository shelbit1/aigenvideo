import type { WeeklyStrategy } from "@/lib/factory/types";

interface StrategyCardProps {
  strategy: WeeklyStrategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  const isEmpty =
    !strategy.contentStyle &&
    !strategy.audiencePsychology &&
    !strategy.visualDirection &&
    strategy.viralHooks.length === 0;
  if (isEmpty) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        Стратегия недели
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Block label="Content style" text={strategy.contentStyle} />
        <Block label="Audience psychology" text={strategy.audiencePsychology} />
        <Block label="Visual direction" text={strategy.visualDirection} />
        {strategy.viralHooks.length > 0 && (
          <div className="sm:col-span-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Viral hooks
            </div>
            <ul className="mt-1.5 space-y-1 text-sm">
              {strategy.viralHooks.map((h, i) => (
                <li key={h + i} className="flex items-start gap-2">
                  <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-foreground/60" />
                  <span className="text-foreground/90">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-sm text-foreground/90 leading-relaxed">{text}</p>
    </div>
  );
}
