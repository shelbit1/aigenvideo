import { NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram";

/**
 * Telegram webhook endpoint.
 *
 * Telegram POST'ит сюда каждый update. Должны:
 *   1. Валидировать заголовок X-Telegram-Bot-Api-Secret-Token (если задан).
 *   2. Распарсить update и передать в handleTelegramUpdate.
 *   3. ВСЕГДА отвечать 200, иначе Telegram продолжит ретраить.
 *
 * Docs: https://core.telegram.org/bots/api#setwebhook
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const received = req.headers.get("x-telegram-bot-api-secret-token");
    if (received !== expectedSecret) {
      console.warn("[telegram] webhook: invalid secret token");
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Не дожидаемся обработки в ответе: Telegram прерывает соединение через
  // ~60 сек. Сразу отвечаем 200, а update обрабатываем асинхронно.
  void handleTelegramUpdate(update).catch((error) => {
    console.error("[telegram] handleTelegramUpdate failed", error);
  });

  return NextResponse.json({ ok: true });
}

export function GET(): NextResponse {
  return NextResponse.json({
    ok: true,
    info: "AigenVideo Telegram webhook is alive. Use POST.",
  });
}
