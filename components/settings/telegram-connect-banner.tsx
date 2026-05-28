import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";

/**
 * Дискретный баннер «Подключите Telegram», который показывается на главной
 * только если пользователь ещё не привязал Telegram-аккаунт. Открывает
 * страницу /settings, где находится сам Connect-флоу.
 */
export function TelegramConnectBanner() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
        <Send className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug">
          Получайте готовые ролики прямо в Telegram
        </div>
        <p className="text-xs text-muted-foreground">
          Подключите аккаунт — AI пришлёт MP4 сразу после рендера.
        </p>
      </div>
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
      >
        Подключить
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
