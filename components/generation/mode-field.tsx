"use client";

import * as React from "react";
import { Camera, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GenerationMode } from "@/lib/projects/types";

const MODES: Array<{
  id: GenerationMode;
  title: string;
  caption: string;
  audience: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "REALISTIC",
    title: "Realistic",
    caption: "Реалистично, как UGC iPhone-съёмка",
    audience: "Reels · TikTok · UGC · fashion · lifestyle",
    icon: Camera,
  },
  {
    id: "CARTOON",
    title: "Cartoon",
    caption: "Стилизованная 3D-анимация, Pixar-inspired",
    audience: "Kids · mascots · toys · brand campaigns",
    icon: Sparkles,
  },
];

interface ModeFieldProps {
  name?: string;
  defaultValue?: GenerationMode;
  error?: string;
}

export function ModeField({
  name = "generationMode",
  defaultValue = "REALISTIC",
  error,
}: ModeFieldProps) {
  const [value, setValue] = React.useState<GenerationMode>(defaultValue);
  return (
    <div className="flex flex-col gap-2">
      <Label>Режим генерации</Label>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = value === m.id;
          return (
            <button
              type="button"
              key={m.id}
              onClick={() => setValue(m.id)}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-foreground/60 bg-surface-elevated"
                  : "border-border bg-surface hover:bg-surface-hover"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
                  active
                    ? "bg-foreground text-background ring-foreground"
                    : "bg-surface-elevated text-foreground ring-border-strong"
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">{m.title}</span>
                  {active && (
                    <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-foreground/80">
                      Выбрано
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {m.caption}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/80 leading-snug">
                  {m.audience}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>
      )}
    </div>
  );
}
