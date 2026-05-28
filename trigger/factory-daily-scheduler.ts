import { logger, schedules, tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import type { factoryProduceReelTask } from "./factory-produce-reel";

/**
 * Content Factory: ежечасный scheduler.
 *
 * Раз в час проверяет все FactoryScenario со статусом QUEUED и
 * scheduledFor <= now(): для каждого запускает factory-produce-reel.
 * Это даёт ежедневную доставку в выбранное пользователем время (HH:MM).
 *
 * Точность — до часа, чего достаточно для "каждый день в 10:00".
 *
 * Каждая Trigger.dev задача (produce-reel, generate-reel, deliver-reel)
 * имеет собственные retries — scheduler делает только "тыкание".
 */

export const factoryDailySchedulerTask = schedules.task({
  id: "factory-daily-scheduler",
  cron: "0 * * * *", // каждый час, в начале часа (UTC)
  run: async () => {
    const now = new Date();

    const due = await prisma.factoryScenario.findMany({
      where: {
        status: "QUEUED",
        approved: true,
        projectId: null,
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: "asc" },
      take: 50,
    });

    if (due.length === 0) {
      logger.info("Factory scheduler: ничего не запланировано");
      return { triggered: 0 };
    }

    logger.info("Factory scheduler: запускаем сценарии", {
      count: due.length,
    });

    let triggered = 0;
    for (const scenario of due) {
      try {
        await tasks.trigger<typeof factoryProduceReelTask>(
          "factory-produce-reel",
          { scenarioId: scenario.id }
        );
        triggered += 1;
      } catch (error) {
        logger.error("scheduler trigger failed", {
          scenarioId: scenario.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { triggered };
  },
});
