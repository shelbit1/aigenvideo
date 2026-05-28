import { prisma } from "@/lib/db/prisma";
import { callTelegram, type TelegramMessage } from "./bot";

/**
 * Account linking flow.
 *
 * Пользователь жмёт «Connect Telegram» → открывается t.me/<bot>?start=<userId>.
 * Telegram присылает webhook update с message.text = "/start <userId>".
 *
 * Здесь мы:
 *   1. валидируем payload (это должен быть наш существующий userId),
 *   2. сохраняем telegramChatId + username в User,
 *   3. отправляем подтверждение пользователю в бот.
 */

const CONNECTED_REPLY = [
  "✅ Аккаунт Telegram подключён.",
  "Теперь готовые AI-ролики из AigenVideo будут приходить прямо сюда.",
  "Можно закрыть это окно и вернуться в дашборд.",
].join("\n\n");

const UNKNOWN_USER_REPLY = [
  "⚠️ Не удалось распознать ваш аккаунт AigenVideo.",
  "Откройте приложение, зайдите в Настройки → Telegram и нажмите «Connect Telegram» ещё раз.",
].join("\n\n");

const NO_PAYLOAD_REPLY = [
  "👋 Это бот доставки роликов AigenVideo.",
  "Чтобы привязать аккаунт, нажмите «Connect Telegram» в дашборде AigenVideo.",
].join("\n\n");

/**
 * Парсит "/start <payload>" из текста сообщения. Возвращает payload
 * или null, если это не /start или payload отсутствует.
 */
export function parseStartPayload(text: string | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith("/start")) return null;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return "";
  return parts[1] ?? "";
}

interface HandleStartResult {
  ok: boolean;
  reason?: "no-payload" | "user-not-found" | "linked";
}

/**
 * Обрабатывает /start <payload> от пользователя.
 */
export async function handleStartCommand(
  message: TelegramMessage,
  payload: string
): Promise<HandleStartResult> {
  const chatId = message.chat.id;

  if (!payload) {
    await sendText(chatId, NO_PAYLOAD_REPLY);
    return { ok: false, reason: "no-payload" };
  }

  const user = await prisma.user.findUnique({ where: { id: payload } });
  if (!user) {
    await sendText(chatId, UNKNOWN_USER_REPLY);
    return { ok: false, reason: "user-not-found" };
  }

  // Если этот chat был привязан к ДРУГОМУ пользователю — отвязываем,
  // чтобы один аккаунт телеги не присылал ролики двум людям одновременно.
  await prisma.user.updateMany({
    where: { telegramChatId: String(chatId), NOT: { id: user.id } },
    data: {
      telegramChatId: null,
      telegramUsername: null,
      telegramConnected: false,
      telegramLinkedAt: null,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: String(chatId),
      telegramUsername: message.from?.username ?? message.chat.username ?? null,
      telegramConnected: true,
      telegramLinkedAt: new Date(),
    },
  });

  await sendText(chatId, CONNECTED_REPLY);
  return { ok: true, reason: "linked" };
}

async function sendText(chatId: number, text: string): Promise<void> {
  try {
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    });
  } catch (error) {
    // не маскируем reason, просто логируем
    console.error("[telegram] sendMessage failed", error);
  }
}
