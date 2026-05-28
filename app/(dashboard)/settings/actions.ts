"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  buildBotStartLink,
  TelegramApiError,
} from "@/lib/telegram";
import {
  deleteTelegramWebhook,
  getTelegramWebhookInfo,
  setTelegramWebhook,
} from "@/lib/telegram/admin";

/**
 * Server actions для страницы /settings → Telegram.
 */

export type TelegramActionState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | undefined;

/**
 * Возвращает deep link, на который должен перейти пользователь, чтобы
 * подключить Telegram. Используется кнопкой «Connect Telegram».
 */
export async function getConnectTelegramLink(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return buildBotStartLink(session.user.id);
}

export async function disconnectTelegram(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Сессия истекла. Войдите снова." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      telegramChatId: null,
      telegramUsername: null,
      telegramConnected: false,
      telegramLinkedAt: null,
    },
  });

  revalidatePath("/settings");
  return { ok: true, message: "Аккаунт Telegram отвязан." };
}

/**
 * Регистрирует webhook на нашем endpoint /api/telegram/webhook.
 * URL берётся из TELEGRAM_PUBLIC_BASE_URL (или APP_URL как fallback).
 * Secret token берётся из TELEGRAM_WEBHOOK_SECRET и валидируется в route.
 */
export async function setupTelegramWebhook(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Сессия истекла. Войдите снова." };
  }

  const base = process.env.TELEGRAM_PUBLIC_BASE_URL ?? process.env.APP_URL;
  if (!base) {
    return {
      ok: false,
      message:
        "Не задан TELEGRAM_PUBLIC_BASE_URL/APP_URL — webhook не может быть зарегистрирован.",
    };
  }
  if (base.startsWith("http://localhost")) {
    return {
      ok: false,
      message:
        "Telegram требует HTTPS для webhook. Запустите ngrok (или используйте prod-URL) и задайте TELEGRAM_PUBLIC_BASE_URL.",
    };
  }

  const url = `${base.replace(/\/$/, "")}/api/telegram/webhook`;

  try {
    await setTelegramWebhook({
      url,
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    });
    revalidatePath("/settings");
    return { ok: true, message: `Webhook зарегистрирован: ${url}` };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof TelegramApiError
          ? `Telegram API: ${error.message}`
          : "Не удалось зарегистрировать webhook",
    };
  }
}

export async function dropTelegramWebhook(): Promise<TelegramActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Сессия истекла. Войдите снова." };
  }
  try {
    await deleteTelegramWebhook();
    revalidatePath("/settings");
    return { ok: true, message: "Webhook удалён." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof TelegramApiError
          ? `Telegram API: ${error.message}`
          : "Не удалось удалить webhook",
    };
  }
}

export async function readTelegramWebhookInfo() {
  try {
    return await getTelegramWebhookInfo();
  } catch (error) {
    console.warn("[telegram] getWebhookInfo failed", error);
    return null;
  }
}
