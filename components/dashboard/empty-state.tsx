import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({
  title = "Создайте свой первый ролик",
  description = "Загрузите фотографию продукта и опишите идею в одном предложении — AigenVideo сделает из этого кинематографичный ролик.",
  ctaLabel = "Создать ролик",
  ctaHref = "/projects/new",
}: EmptyStateProps) {
  return (
    <div className="relative isolate flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface/40 px-6 py-20 text-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(600px 220px at 50% 0%, hsl(36 100% 60% / 0.10), transparent 60%)",
        }}
      />

      <div className="mb-6 inline-flex items-center justify-center rounded-full size-14 bg-surface-elevated ring-1 ring-border-strong">
        <Sparkles className="size-6 text-[hsl(var(--accent))]" />
      </div>

      <h3 className="text-xl font-semibold tracking-tight text-balance">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed text-pretty">
        {description}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" variant="accent">
          <Link href={ctaHref}>
            <Wand2 className="size-4" />
            {ctaLabel}
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/dashboard">Посмотреть примеры</Link>
        </Button>
      </div>

      <ul className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-2 text-left sm:grid-cols-3">
        {[
          { num: "01", label: "Загрузите изображение" },
          { num: "02", label: "Опишите идею ролика" },
          { num: "03", label: "Получите готовый reel" },
        ].map((step) => (
          <li
            key={step.num}
            className="rounded-md border border-border bg-surface px-3 py-3"
          >
            <div className="text-[10px] font-mono text-muted-foreground/70 tracking-widest">
              {step.num}
            </div>
            <div className="mt-1 text-sm text-foreground/90">{step.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
