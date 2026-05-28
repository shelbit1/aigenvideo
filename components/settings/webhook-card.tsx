"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  PlugZap,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dropTelegramWebhook,
  setupTelegramWebhook,
} from "@/app/(dashboard)/settings/actions";

interface WebhookCardProps {
  currentUrl: string | null;
  pendingUpdates: number | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
}

/**
 * Админ-карточка: текущий статус Telegram webhook и кнопки управления.
 * Видна авторизованному пользователю; в проде/деве используется одним
 * человеком для one-time setup на новом домене.
 */
export function WebhookCard({
  currentUrl,
  pendingUpdates,
  lastErrorAt,
  lastErrorMessage,
}: WebhookCardProps) {
  const [pending, startTransition] = React.useTransition();

  const handleSetup = () => {
    startTransition(async () => {
      const result = await setupTelegramWebhook();
      if (result?.ok) toast.success(result.message);
      else if (result) toast.error(result.message);
    });
  };

  const handleDrop = () => {
    if (!confirm("Удалить webhook? Бот перестанет принимать сообщения.")) return;
    startTransition(async () => {
      const result = await dropTelegramWebhook();
      if (result?.ok) toast.success(result.message);
      else if (result) toast.error(result.message);
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-surface-elevated ring-1 ring-border-strong">
          <PlugZap className="size-5 text-foreground/80" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-medium">Telegram webhook</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground leading-relaxed">
            Регистрирует webhook на нашем эндпоинте, через который Telegram
            доставляет update&apos;ы (например, /start от пользователей).
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-xs">
        <Row label="URL">
          {currentUrl ? (
            <code className="font-mono text-foreground/90 break-all">
              {currentUrl}
            </code>
          ) : (
            <span className="text-muted-foreground">не зарегистрирован</span>
          )}
        </Row>
        <Row label="Pending updates">
          <span className="tabular-nums">{pendingUpdates ?? 0}</span>
        </Row>
        {lastErrorAt && (
          <Row label="Последняя ошибка">
            <span className="text-[hsl(var(--destructive))]">
              {lastErrorMessage ?? "—"}
            </span>
          </Row>
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          onClick={handleSetup}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlugZap className="size-4" />
          )}
          {currentUrl ? "Перерегистрировать" : "Зарегистрировать webhook"}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDrop}
            disabled={pending}
          >
            <Trash2 className="size-4" />
            Удалить webhook
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right">{children}</dd>
    </div>
  );
}
