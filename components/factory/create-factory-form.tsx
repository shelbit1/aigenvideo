"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUpload } from "@/components/generation/multi-image-upload";
import { ModeField } from "@/components/generation/mode-field";
import { DimensionsField } from "@/components/generation/dimensions-field";
import { createFactoryAction } from "@/lib/factory/actions";
import { VIDEOS_PER_WEEK_OPTIONS } from "@/lib/factory/types";
import {
  FACTORY_REEL_DURATIONS,
  type CreateFactoryState,
  type FactoryReelDuration,
} from "@/lib/factory/schemas";

type VideosPerWeek = (typeof VIDEOS_PER_WEEK_OPTIONS)[number];

export function CreateFactoryForm() {
  const [state, formAction, pending] = useActionState<
    CreateFactoryState,
    FormData
  >(createFactoryAction, undefined);

  const errors =
    state && !state.ok ? state.fieldErrors ?? {} : ({} as Record<string, string[]>);

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="flex flex-col gap-6">
        <Field
          label="Название фабрики"
          name="title"
          placeholder="Luxury Fashion Week"
          error={errors.title?.[0]}
          required
        />

        <Field
          label="Бизнес-ниша"
          name="niche"
          placeholder="Премиальная одежда, e-commerce косметика, кафе..."
          error={errors.niche?.[0]}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Описание идеи и продукта</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            placeholder="Что вы продаёте, какая атмосфера, ключевое сообщение..."
            className="min-h-32"
          />
          {errors.description?.[0] && (
            <span className="text-xs text-[hsl(var(--destructive))]">
              {errors.description[0]}
            </span>
          )}
        </div>

        <Field
          label="Целевая аудитория"
          name="targetAudience"
          placeholder="Например: женщины 22–35, fashion-инсайдеры, премиум"
          error={errors.targetAudience?.[0]}
        />

        <ModeField error={errors.generationMode?.[0]} />

        <div className="flex flex-col gap-2">
          <Label>Фотографии продукта (опционально)</Label>
          <p className="text-xs text-muted-foreground">
            Если загрузите — AI учтёт текстуру, цвет и форму. Без фото — план
            строится из ниши и описания.
          </p>
          <MultiImageUpload />
          {errors.sourceImages?.[0] && (
            <span className="text-xs text-[hsl(var(--destructive))]">
              {errors.sourceImages[0]}
            </span>
          )}
        </div>

        <DimensionsField error={errors.dimensions?.[0]} />

        <DurationField error={errors.reelDuration?.[0]} />

        <VideosPerWeekField error={errors.videosPerWeek?.[0]} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="deliveryTime">Время ежедневной доставки (UTC)</Label>
          <Input
            id="deliveryTime"
            name="deliveryTime"
            defaultValue="10:00"
            placeholder="10:00"
            pattern="^([01]\d|2[0-3]):[0-5]\d$"
            className="max-w-32 tabular-nums"
          />
          <input type="hidden" name="deliveryTimezone" value="UTC" />
          {errors.deliveryTime?.[0] && (
            <span className="text-xs text-[hsl(var(--destructive))]">
              {errors.deliveryTime[0]}
            </span>
          )}
        </div>

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
                Собираем план...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Собрать неделю контента
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Обычно 1–3 минуты. После плана — вы утверждаете сценарии.
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <div className="rounded-xl border border-border bg-surface-elevated p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Как это работает
          </div>
          <ol className="mt-4 space-y-3 text-sm">
            <Step n="1" title="План недели" desc="GPT-5.5 strategist собирает стратегию и сценарии" />
            <Step n="2" title="Review" desc="Вы утверждаете или регенерируете каждый ролик" />
            <Step n="3" title="Production" desc="AI генерирует ролики и складывает в очередь" />
            <Step n="4" title="Daily delivery" desc="Каждый день в выбранное время — новый reel в Telegram" />
          </ol>
        </div>
      </aside>
    </form>
  );
}

function Field({
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

function DurationField({ error }: { error?: string }) {
  const [value, setValue] = React.useState<FactoryReelDuration>(5);
  return (
    <div className="flex flex-col gap-2">
      <Label>Длительность одного ролика</Label>
      <input type="hidden" name="reelDuration" value={value} />
      <div className="grid grid-cols-3 gap-2 max-w-md">
        {FACTORY_REEL_DURATIONS.map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => setValue(d)}
            className={[
              "rounded-xl border px-4 py-3 text-sm font-medium transition-colors tabular-nums",
              value === d
                ? "border-foreground/60 bg-surface-elevated"
                : "border-border bg-surface hover:bg-surface-hover",
            ].join(" ")}
          >
            {d} сек
          </button>
        ))}
      </div>
      {error && (
        <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>
      )}
    </div>
  );
}

function VideosPerWeekField({ error }: { error?: string }) {
  const [value, setValue] = React.useState<VideosPerWeek>(7);
  return (
    <div className="flex flex-col gap-2">
      <Label>Сколько роликов в неделю</Label>
      <input type="hidden" name="videosPerWeek" value={value} />
      <div className="grid grid-cols-4 gap-2 max-w-md">
        {VIDEOS_PER_WEEK_OPTIONS.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setValue(v)}
            className={[
              "rounded-xl border px-4 py-3 text-sm font-medium transition-colors tabular-nums",
              value === v
                ? "border-foreground/60 bg-surface-elevated"
                : "border-border bg-surface hover:bg-surface-hover",
            ].join(" ")}
          >
            {v}
          </button>
        ))}
      </div>
      {error && (
        <span className="text-xs text-[hsl(var(--destructive))]">{error}</span>
      )}
    </div>
  );
}

function Step({
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
