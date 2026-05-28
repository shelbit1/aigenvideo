import { handleStartCommand, parseStartPayload } from "./connect-user";
import { callTelegram, type TelegramUpdate } from "./bot";

/**
 * Точка входа для всех Telegram update'ов.
 *
 * Маршрутизирует входящие сообщения по командам и поддерживает MVP-набор:
 *   /start <userId>  — линковка аккаунта
 *   /help            — справка
 *   <любое другое>   — короткий нейтральный ответ
 *
 * Никогда НЕ светит приватные данные пользователя (email, internal IDs,
 * prompt'ы) — только команды.
 */

const HELP_REPLY = [
  "ℹ️ AigenVideo Telegram Bot",
  "",
  "/start — привязать аккаунт (откройте дашборд → Настройки → Connect Telegram)",
  "/help — это сообщение",
  "",
  "Готовые ролики приходят сюда автоматически после рендера.",
].join("\n");

const FALLBACK_REPLY =
  "Бот принимает только команды. Отправьте /help для списка.";

export async function handleTelegramUpdate(
  update: TelegramUpdate
): Promise<void> {
  const message = update.message ?? update.edited_message;
  if (!message) return;

  const text = message.text?.trim() ?? "";

  if (text.startsWith("/start")) {
    const payload = parseStartPayload(text) ?? "";
    await handleStartCommand(message, payload);
    return;
  }

  if (text.startsWith("/help")) {
    await safeSend(message.chat.id, HELP_REPLY);
    return;
  }

  await safeSend(message.chat.id, FALLBACK_REPLY);
}

async function safeSend(chatId: number, text: string): Promise<void> {
  try {
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error("[telegram] sendMessage failed", error);
  }
}
