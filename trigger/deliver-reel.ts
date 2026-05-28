import { logger, task } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import {
  buildFactoryReelCaption,
  buildReelCaption,
  sendReelToTelegram,
} from "@/lib/telegram";

/**
 * Telegram delivery task.
 *
 *   render done → upload to R2 → trigger deliver-reel → sendVideo to user
 *
 * Запускается из generate-reel сразу после финального рендера. Имеет
 * собственные retries (Trigger.dev по умолчанию), поэтому при ошибке сети
 * или таймауте Telegram API delivery переиграется автоматически — final
 * reel всегда остаётся доступным в дашборде даже если delivery не прошёл.
 *
 * Никаких приватных данных в caption (email, internal IDs, prompts) —
 * см. context3.md → IMPORTANT IMPLEMENTATION RULE.
 */

type DeliverReelPayload = {
  projectId: string;
};

export const deliverReelTask = task({
  id: "deliver-reel",
  maxDuration: 60 * 5,
  retry: {
    maxAttempts: 5,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
    factor: 2,
  },
  run: async (payload: DeliverReelPayload) => {
    logger.info("Telegram delivery старт", { projectId: payload.projectId });

    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
      include: {
        user: {
          select: {
            id: true,
            telegramChatId: true,
            telegramConnected: true,
          },
        },
        factoryScenario: {
          include: {
            factory: {
              select: {
                id: true,
                title: true,
                videosPerWeek: true,
              },
            },
          },
        },
      },
    });

    if (!project) throw new Error(`Project ${payload.projectId} не найден`);
    if (!project.finalVideoUrl) {
      throw new Error("У проекта нет finalVideoUrl — нечего доставлять");
    }

    if (!project.user.telegramConnected || !project.user.telegramChatId) {
      logger.info("У пользователя не подключён Telegram — пропускаем доставку", {
        userId: project.userId,
      });
      return { delivered: false, reason: "telegram-not-connected" };
    }

    const gen = await prisma.generation.create({
      data: {
        projectId: project.id,
        type: "DELIVERY",
        status: "RUNNING",
        inputPayload: {
          channel: "telegram",
          chatIdMasked: maskChatId(project.user.telegramChatId),
        },
        startedAt: new Date(),
      },
    });

    try {
      const factoryScenario = project.factoryScenario;
      const caption = factoryScenario
        ? buildFactoryReelCaption({
            factoryTitle: factoryScenario.factory.title,
            scenarioTitle: factoryScenario.title,
            day: factoryScenario.deliveryDay,
            totalDays: factoryScenario.factory.videosPerWeek,
          })
        : buildReelCaption({
            projectTitle: project.title,
            durationSeconds: project.durationSeconds,
          });

      const result = await sendReelToTelegram({
        chatId: project.user.telegramChatId,
        videoUrl: project.finalVideoUrl,
        caption,
        durationSeconds: project.durationSeconds,
        thumbnailUrl: project.thumbnailUrl ?? undefined,
      });

      await prisma.generation.update({
        where: { id: gen.id },
        data: {
          status: "SUCCEEDED",
          outputPayload: {
            channel: "telegram",
            messageId: result.messageId,
          },
          finishedAt: new Date(),
        },
      });

      // Если это Factory-ролик — помечаем сценарий DELIVERED и обновляем
      // статус всей фабрики, если все сценарии доставлены.
      if (factoryScenario) {
        await prisma.factoryScenario.update({
          where: { id: factoryScenario.id },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
          },
        });

        const remaining = await prisma.factoryScenario.count({
          where: {
            factoryId: factoryScenario.factory.id,
            approved: true,
            status: { notIn: ["DELIVERED"] },
          },
        });
        if (remaining === 0) {
          await prisma.factoryProject.update({
            where: { id: factoryScenario.factory.id },
            data: { status: "COMPLETED" },
          });
        }
      }

      logger.info("Telegram delivery успех", {
        projectId: project.id,
        messageId: result.messageId,
        factoryScenarioId: factoryScenario?.id,
      });
      return { delivered: true, messageId: result.messageId };
    } catch (error) {
      await prisma.generation
        .update({
          where: { id: gen.id },
          data: {
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : JSON.stringify(error),
            finishedAt: new Date(),
          },
        })
        .catch(() => {});
      throw error;
    }
  },
});

/**
 * Маскируем chat_id для логов: оставляем только первые/последние 2 символа.
 * Это всё ещё user-private, но позволяет дебажить delivery в логах.
 */
function maskChatId(chatId: string): string {
  if (chatId.length <= 4) return "***";
  return `${chatId.slice(0, 2)}***${chatId.slice(-2)}`;
}
