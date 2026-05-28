/**
 * Низкоуровневый клиент Telegram Bot API.
 *
 * Все вызовы идут на https://api.telegram.org/bot<TOKEN>/<method>.
 * Один публичный хелпер callTelegram() для всех методов + специализированные
 * обёртки в send-video.ts и connect-user.ts.
 *
 * Docs: https://core.telegram.org/bots/api
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export class TelegramApiError extends Error {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = "TelegramApiError";
  }
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN не задан. Telegram-функциональность недоступна."
    );
  }
  return token;
}

export function getBotUsername(): string {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  if (!username) {
    throw new Error("TELEGRAM_BOT_USERNAME не задан");
  }
  return username.replace(/^@/, "");
}

/**
 * Универсальный вызов любого метода Telegram Bot API.
 * Бросает TelegramApiError при ok=false.
 */
export async function callTelegram<TResult, TBody = Record<string, unknown>>(
  method: string,
  body?: TBody,
  options: { timeoutMs?: number } = {}
): Promise<TResult> {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/${method}`;

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 30_000
  );

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = (await res.json()) as TelegramApiResponse<TResult>;
    if (!data.ok || data.result === undefined) {
      throw new TelegramApiError(
        data.description ?? `Telegram API ${method} failed`,
        data.error_code ?? res.status
      );
    }
    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build deep link, который ведёт пользователя в чат с ботом
 * и автоматически отправляет /start <payload>.
 *
 *   https://t.me/<bot>?start=<payload>
 */
export function buildBotStartLink(payload: string): string {
  return `https://t.me/${getBotUsername()}?start=${encodeURIComponent(payload)}`;
}
