import { callTelegram } from "./bot";

/**
 * Админ-операции Telegram Bot API.
 *
 * setWebhook / getWebhookInfo / deleteWebhook вынесены отдельно от обычных
 * бизнес-операций — их вызывают из server actions (только авторизованным
 * пользователем), а не из основного pipeline'а.
 */

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
}

export async function setTelegramWebhook(input: {
  url: string;
  secretToken?: string;
}): Promise<true> {
  await callTelegram<true>("setWebhook", {
    url: input.url,
    secret_token: input.secretToken,
    drop_pending_updates: true,
    allowed_updates: ["message", "edited_message"],
  });
  return true;
}

export async function getTelegramWebhookInfo(): Promise<WebhookInfo> {
  return callTelegram<WebhookInfo>("getWebhookInfo");
}

export async function deleteTelegramWebhook(): Promise<true> {
  await callTelegram<true>("deleteWebhook", { drop_pending_updates: true });
  return true;
}
