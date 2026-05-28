"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Loader2, Send, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disconnectTelegram,
  getConnectTelegramLink,
} from "@/app/(dashboard)/settings/actions";

/**
 * Карточка управления Telegram-подключением.
 *
 * Подключение работает через deep link t.me/<bot>?start=<userId>.
 * После клика мы:
 *   1. Получаем deep link у сервера (server action).
 *   2. Открываем его в новой вкладке (Telegram сам обрабатывает /start).
 *   3. Показываем тост с инструкцией: «нажмите Start в боте».
 *   4. Пользователь возвращается на страницу — она перерендерится
 *      после revalidate (или по F5), показав статус Connected.
 */

interface TelegramCardProps {
  connected: boolean;
  username: string | null;
  linkedAt: Date | null;
}

export function TelegramCard({
  connected,
  username,
  linkedAt,
}: TelegramCardProps) {
  const [pending, startTransition] = React.useTransition();

  const handleConnect = () => {
    startTransition(async () => {
      try {
        const url = await getConnectTelegramLink();
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Откройте Telegram и нажмите Start в боте", {
          description: "После подтверждения обновите страницу.",
        });
      } catch {
        toast.error("Не удалось сформировать ссылку Telegram");
      }
    });
  };

  const handleDisconnect = () => {
    if (!confirm("Отключить аккаунт Telegram? Ролики перестанут приходить.")) {
      return;
    }
    startTransition(async () => {
      const result = await disconnectTelegram();
      if (result?.ok) {
        toast.success(result.message);
      } else if (result) {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] ring-1 ring-[hsl(var(--accent))]/30">
            <Send className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-medium">Telegram доставка</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground leading-relaxed">
              Готовые ролики автоматически приходят прямо в Telegram.
              Подключение в один клик через бот{" "}
              <span className="font-mono text-foreground/90">@genaivei_bot</span>.
            </p>
          </div>
        </div>

        <StatusBadge connected={connected} />
      </div>

      {connected && (
        <div className="mt-5 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {username && (
              <span>
                Подключён как{" "}
                <span className="font-medium text-foreground">@{username}</span>
              </span>
            )}
            {linkedAt && (
              <span className="text-xs">
                с{" "}
                {new Intl.DateTimeFormat("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(linkedAt)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {connected ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDisconnect}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Unlink className="size-4" />
            )}
            Отвязать аккаунт
          </Button>
        ) : (
          <Button
            type="button"
            variant="accent"
            onClick={handleConnect}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            Connect Telegram
          </Button>
        )}
      </div>

      <ol className="mt-6 space-y-2 text-xs text-muted-foreground">
        <Step n="1" text="Нажмите «Connect Telegram» — откроется чат с ботом." />
        <Step n="2" text="В чате нажмите кнопку Start. Бот сам подхватит вашу учётку." />
        <Step n="3" text="Готово — следующий ролик прилетит сразу в Telegram." />
      </ol>
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="size-3.5" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/60" />
      Not Connected
    </span>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[10px] font-mono text-foreground/80 ring-1 ring-border">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}
