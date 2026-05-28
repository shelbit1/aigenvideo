"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Play,
  RotateCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  approveScenarioAction,
  editScenarioAction,
  regenerateScenarioAction,
  retryScenarioAction,
} from "@/lib/factory/actions";
import {
  CONCEPT_LABELS,
  type ScenarioConcept,
} from "@/lib/factory/types";
import { ScenarioStatusPill } from "./factory-status-pill";

interface ScenarioCardProps {
  scenario: {
    id: string;
    deliveryDay: number;
    conceptType: string;
    title: string;
    hook: string;
    summary: string;
    visualStyle: string;
    brief: string;
    approved: boolean;
    status:
      | "DRAFT"
      | "APPROVED"
      | "REGENERATING"
      | "QUEUED"
      | "GENERATING"
      | "READY"
      | "DELIVERED"
      | "FAILED";
    feedback: string | null;
    errorMessage: string | null;
    projectId: string | null;
    deliveredAt: Date | null;
    project: {
      id: string;
      status: "DRAFT" | "GENERATING" | "READY" | "ERROR";
      finalVideoUrl: string | null;
      thumbnailUrl: string | null;
    } | null;
  };
  durationSeconds: number;
  mode: "REALISTIC" | "CARTOON";
  /** Когда production уже запущен, нельзя ничего регенерировать/редактировать. */
  productionStarted: boolean;
}

const FEEDBACK_CHIPS = [
  "Сделай эмоциональнее",
  "Добавь luxury aesthetic",
  "Менее cinematic",
  "Более реалистично",
  "Сменить локацию",
];

export function ScenarioCard({
  scenario,
  durationSeconds,
  mode,
  productionStarted,
}: ScenarioCardProps) {
  const [pending, startTransition] = React.useTransition();
  const [regenOpen, setRegenOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const toggleApprove = () => {
    startTransition(async () => {
      try {
        await approveScenarioAction(scenario.id, !scenario.approved);
        toast.success(
          !scenario.approved ? "Сценарий утверждён" : "Утверждение снято"
        );
      } catch {
        toast.error("Не удалось обновить статус");
      }
    });
  };

  const retry = () => {
    startTransition(async () => {
      try {
        await retryScenarioAction(scenario.id);
        toast.success("Перезапуск отправлен");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось перезапустить"
        );
      }
    });
  };

  const concept = (CONCEPT_LABELS[scenario.conceptType as ScenarioConcept] ??
    scenario.conceptType) as string;

  const inProduction =
    scenario.status === "QUEUED" ||
    scenario.status === "GENERATING" ||
    scenario.status === "READY" ||
    scenario.status === "DELIVERED";

  const canEdit = !productionStarted && !inProduction;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-surface p-5 transition-colors",
        scenario.approved
          ? "border-emerald-500/40"
          : "border-border hover:border-border-strong"
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="rounded-full bg-surface-elevated px-2 py-0.5 ring-1 ring-border">
              День {scenario.deliveryDay}
            </span>
            <span className="rounded-full bg-surface-elevated px-2 py-0.5 ring-1 ring-border">
              {concept}
            </span>
            <span className="rounded-full bg-surface-elevated px-2 py-0.5 ring-1 ring-border">
              {durationSeconds} сек · {mode === "REALISTIC" ? "Realistic" : "Cartoon"}
            </span>
          </div>
          <h3 className="mt-2 text-base font-medium leading-tight">
            {scenario.title}
          </h3>
        </div>
        <ScenarioStatusPill status={scenario.status} />
      </header>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Hook
        </div>
        <p className="mt-1 text-sm font-medium text-foreground/95">
          “{scenario.hook}”
        </p>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          О ролике
        </div>
        <p className="mt-1 text-sm text-foreground/85 leading-relaxed">
          {scenario.summary}
        </p>
      </div>

      {scenario.visualStyle && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Visual style
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {scenario.visualStyle}
          </p>
        </div>
      )}

      {scenario.feedback && scenario.status !== "REGENERATING" && (
        <p className="rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-[11px] text-muted-foreground">
          Последний фидбек: «{scenario.feedback}»
        </p>
      )}

      {scenario.status === "FAILED" && scenario.errorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-[11px] text-[hsl(var(--destructive))]">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <p className="leading-snug break-words line-clamp-3">
            {scenario.errorMessage}
          </p>
        </div>
      )}

      {scenario.project?.finalVideoUrl && (
        <a
          href={`/projects/${scenario.project.id}`}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground/90 hover:bg-surface-hover transition-colors"
        >
          Открыть готовый ролик
          <ExternalLink className="size-3" />
        </a>
      )}

      <footer className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {scenario.status === "FAILED" ? (
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={retry}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Перезапустить
          </Button>
        ) : (
          <Button
            type="button"
            variant={scenario.approved ? "default" : "accent"}
            size="sm"
            onClick={toggleApprove}
            disabled={pending || inProduction || productionStarted}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : scenario.approved ? (
              <>
                <X className="size-3.5" /> Снять
              </>
            ) : (
              <>
                <Check className="size-3.5" /> Approve
              </>
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRegenOpen(true)}
          disabled={pending || !canEdit || scenario.status === "REGENERATING"}
        >
          <RotateCw
            className={cn(
              "size-3.5",
              scenario.status === "REGENERATING" && "animate-spin"
            )}
          />
          Regenerate
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
          disabled={pending || !canEdit}
        >
          <Edit3 className="size-3.5" />
          Edit
        </Button>
      </footer>

      <RegenerateDialog
        open={regenOpen}
        onOpenChange={setRegenOpen}
        scenarioId={scenario.id}
        scenarioTitle={scenario.title}
      />
      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        scenario={scenario}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Dialogs
// ──────────────────────────────────────────────────────────────────────

function RegenerateDialog({
  open,
  onOpenChange,
  scenarioId,
  scenarioTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: string;
  scenarioTitle: string;
}) {
  const [feedback, setFeedback] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("scenarioId", scenarioId);
    formData.set("feedback", feedback);
    startTransition(async () => {
      try {
        await regenerateScenarioAction(formData);
        toast.success("Сценарий отправлен на регенерацию");
        onOpenChange(false);
        setFeedback("");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось запустить"
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Регенерировать сценарий</DialogTitle>
            <DialogDescription>
              «{scenarioTitle}» — GPT пересоздаст ролик с учётом фидбека.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback">Что улучшить</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Например: сделай эмоциональнее, добавь luxury..."
            />
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_CHIPS.map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setFeedback((prev) => (prev ? `${prev} ${chip}` : chip))}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button type="submit" variant="accent" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Регенерировать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  scenario,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: ScenarioCardProps["scenario"];
}) {
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set("scenarioId", scenario.id);
    startTransition(async () => {
      try {
        await editScenarioAction(formData);
        toast.success("Сценарий обновлён");
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось сохранить"
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Редактировать сценарий</DialogTitle>
            <DialogDescription>
              Ваша правка пойдёт в Creative Director как есть.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-title">Название</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={scenario.title}
              required
              maxLength={120}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-hook">Hook</Label>
            <Input
              id="edit-hook"
              name="hook"
              defaultValue={scenario.hook}
              required
              maxLength={280}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-summary">Summary</Label>
            <Textarea
              id="edit-summary"
              name="summary"
              defaultValue={scenario.summary}
              required
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-brief">Creative brief (EN)</Label>
            <Textarea
              id="edit-brief"
              name="brief"
              defaultValue={scenario.brief}
              required
              rows={6}
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button type="submit" variant="accent" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
