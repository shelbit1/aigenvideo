import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { TelegramCard } from "@/components/settings/telegram-card";
import { WebhookCard } from "@/components/settings/webhook-card";
import { readTelegramWebhookInfo } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      telegramConnected: true,
      telegramUsername: true,
      telegramLinkedAt: true,
    },
  });

  const webhookInfo = await readTelegramWebhookInfo();

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Настройки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управляйте интеграциями и доставкой роликов.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <TelegramCard
          connected={user?.telegramConnected ?? false}
          username={user?.telegramUsername ?? null}
          linkedAt={user?.telegramLinkedAt ?? null}
        />

        <WebhookCard
          currentUrl={webhookInfo?.url || null}
          pendingUpdates={webhookInfo?.pending_update_count ?? null}
          lastErrorAt={
            webhookInfo?.last_error_date
              ? new Date(webhookInfo.last_error_date * 1000)
              : null
          }
          lastErrorMessage={webhookInfo?.last_error_message ?? null}
        />
      </div>
    </div>
  );
}
