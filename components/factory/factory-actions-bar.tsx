"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  deleteFactoryAction,
  startProductionAction,
} from "@/lib/factory/actions";

interface FactoryActionsBarProps {
  factoryId: string;
  approvedCount: number;
  totalCount: number;
  productionStarted: boolean;
}

export function FactoryActionsBar({
  factoryId,
  approvedCount,
  totalCount,
  productionStarted,
}: FactoryActionsBarProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const startProduction = () => {
    if (approvedCount === 0) {
      toast.error("Утвердите хотя бы один сценарий");
      return;
    }
    if (
      !confirm(
        `Запустить production для ${approvedCount} утверждённых сценариев?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await startProductionAction(factoryId);
        toast.success("Production запущен. Доставка пойдёт по расписанию.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Не удалось стартовать"
        );
      }
    });
  };

  const remove = () => {
    if (!confirm("Удалить фабрику и все её сценарии безвозвратно?")) return;
    startTransition(async () => {
      try {
        await deleteFactoryAction(factoryId);
        toast.success("Фабрика удалена");
        router.push("/factory");
      } catch {
        toast.error("Не удалось удалить");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3">
      <div className="text-xs text-muted-foreground">
        Утверждено{" "}
        <span className="text-foreground font-medium tabular-nums">
          {approvedCount}
        </span>{" "}
        из{" "}
        <span className="text-foreground font-medium tabular-nums">
          {totalCount}
        </span>{" "}
        сценариев
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={startProduction}
          disabled={pending || productionStarted}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {productionStarted ? "Production запущен" : "Start production"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
        >
          <Trash2 className="size-4" />
          Удалить
        </Button>
      </div>
    </div>
  );
}
