"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUpload } from "./multi-image-upload";
import { ModeField } from "./mode-field";
import { DimensionsField } from "./dimensions-field";
import { createProjectAction } from "@/lib/projects/actions";
import {
  VIDEO_DURATIONS,
  type CreateProjectState,
  type VideoDuration,
} from "@/lib/projects/schemas";

const BRIEF_PRESETS = [
  "Кинематографичный ролик-тизер с тёплым светом и slow-motion.",
  "Минималистичный продуктовый шот с медленным push-in.",
  "Энергичный UGC-стиль с быстрыми сменами кадров.",
];

const DURATION_DESCRIPTIONS: Record<VideoDuration, { scenes: string; hint: string }> = {
  5: { scenes: "1 сцена", hint: "Чистый продуктовый шот" },
  10: { scenes: "2 сцены", hint: "Hook + ключевая сцена" },
  15: { scenes: "3 сцены", hint: "Полный нарратив с CTA" },
};

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState<
    CreateProjectState,
    FormData
  >(createProjectAction, undefined);

  const errors =
    state && !state.ok ? state.fieldErrors ?? {} : ({} as Record<string, string[]>);

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="flex flex-col gap-6">
        <FormField
          label="Название проекта"
          name="title"
          placeholder="Например: Тизер коллекции лето 2026"
          required
          error={errors.title?.[0]}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="brief">Опишите идею ролика</Label>
          <Textarea
            id="brief"
            name="brief"
            rows={6}
            placeholder="Опишите атмосферу, целевую аудиторию, ключевое сообщение..."
            className="min-h-32"
          />
          {errors.brief?.[0] && (
            <span className="text-xs text-[hsl(var(--destructive))]">
              {errors.brief[0]}
            </span>
          )}

          <div className="mt-1 flex flex-wrap gap-1.5">
            {BRIEF_PRESETS.map((preset) => (
              <PresetChip key={preset} value={preset} />
            ))}
          </div>
        </div>

        <ModeField error={errors.generationMode?.[0]} />

        <div className="flex flex-col gap-2">
          <Label>Фотографии продукта</Label>
          <MultiImageUpload />
          {errors.sourceImages?.[0] && (
            <span className="text-xs text-[hsl(var(--destructive))]">
              {errors.sourceImages[0]}
            </span>
          )}
        </div>

        <DimensionsField error={errors.dimensions?.[0]} />

        <DurationField error={errors.durationSeconds?.[0]} />

        {state && !state.ok && state.message && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
            {state.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={pending}
            className="w-full sm:w-auto sm:min-w-48"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Запускаем AI...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Запустить генерацию
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Обычно занимает 3–6 минут.
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <div className="rounded-xl border border-border bg-surface-elevated p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Что произойдёт
          </div>
          <ol className="mt-4 space-y-3 text-sm">
            <PipelineStep n="1" title="Identity" desc="GPT-5.5 анализирует фото продукта" />
            <PipelineStep n="2" title="Скрипт" desc="Storyboard с continuity по сценам" />
            <PipelineStep n="3" title="Кадры" desc="Flux Pro генерирует визуал" />
            <PipelineStep n="4" title="Движение" desc="Kling 3.0 оживляет кадры" />
            <PipelineStep n="5" title="Финал" desc="FFmpeg собирает ролик" />
          </ol>
        </div>
      </aside>
    </form>
  );
}

function FormField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {error && (
        <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>
      )}
    </div>
  );
}

function PresetChip({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const form = (e.target as HTMLElement).closest("form");
        const textarea = form?.querySelector<HTMLTextAreaElement>(
          'textarea[name="brief"]'
        );
        if (textarea) {
          textarea.value = value;
          textarea.focus();
        }
      }}
      className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
    >
      {value}
    </button>
  );
}

function DurationField({ error }: { error?: string }) {
  const [value, setValue] = React.useState<VideoDuration>(5);
  return (
    <div className="flex flex-col gap-2">
      <Label>Длительность ролика</Label>
      <input type="hidden" name="durationSeconds" value={value} />
      <div className="grid grid-cols-3 gap-2">
        {VIDEO_DURATIONS.map((d) => {
          const meta = DURATION_DESCRIPTIONS[d];
          const active = value === d;
          return (
            <button
              type="button"
              key={d}
              onClick={() => setValue(d)}
              className={[
                "flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-foreground/60 bg-surface-elevated"
                  : "border-border bg-surface hover:bg-surface-hover",
              ].join(" ")}
            >
              <span className="text-base font-medium tabular-nums">{d} сек</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {meta.scenes}
              </span>
              <span className="text-xs text-muted-foreground leading-snug">
                {meta.hint}
              </span>
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

function PipelineStep({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-mono text-muted-foreground ring-1 ring-border-strong">
        {n}
      </span>
      <div>
        <div className="font-medium leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}
