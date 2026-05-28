import { callTelegram, type TelegramMessage } from "./bot";

/**
 * Отправка готового ролика пользователю.
 *
 * Используем метод sendVideo с публичным R2-URL — Telegram сам скачает
 * MP4 и пришлёт пользователю как полноценное видео в чат.
 *
 * Docs: https://core.telegram.org/bots/api#sendvideo
 */

export interface SendReelInput {
  chatId: string;
  videoUrl: string;
  caption: string;
  /** Полная длина ролика, секунд (улучшает превью в Telegram). */
  durationSeconds?: number;
  /** Thumbnail из R2, опционально. */
  thumbnailUrl?: string;
}

export interface SendReelResult {
  messageId: number;
}

export async function sendReelToTelegram(
  input: SendReelInput
): Promise<SendReelResult> {
  const message = await callTelegram<TelegramMessage>("sendVideo", {
    chat_id: input.chatId,
    video: input.videoUrl,
    caption: input.caption,
    parse_mode: "HTML",
    supports_streaming: true,
    duration: input.durationSeconds,
    thumbnail: input.thumbnailUrl,
  });

  return { messageId: message.message_id };
}

/**
 * Сборка caption для финального ролика. Без приватных данных
 * (email, internal IDs, prompt'ы) — только информация, нужная пользователю.
 */
export function buildReelCaption(input: {
  projectTitle: string;
  durationSeconds: number;
}): string {
  const escape = htmlEscape;
  return [
    "🎬 <b>Ваш ролик готов</b>",
    "",
    `📌 Проект: <b>${escape(input.projectTitle)}</b>`,
    `⏱ Длительность: ${input.durationSeconds} сек`,
    "",
    "Сгенерировано с помощью <b>AigenVideo</b>.",
  ].join("\n");
}

/**
 * Caption для роликов из Content Factory: показывает день недели,
 * имя фабрики и тему сегодняшнего сценария (см. context4.md).
 */
export function buildFactoryReelCaption(input: {
  factoryTitle: string;
  scenarioTitle: string;
  day: number;
  totalDays: number;
}): string {
  const escape = htmlEscape;
  return [
    "🎬 <b>Новый AI-reel готов</b>",
    "",
    `🏭 Content Factory: <b>${escape(input.factoryTitle)}</b>`,
    `🗓 День: <b>${input.day} / ${input.totalDays}</b>`,
    `🎨 Тема дня: <b>${escape(input.scenarioTitle)}</b>`,
    "",
    "Сгенерировано с помощью <b>AigenVideo</b>.",
  ].join("\n");
}

function htmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
