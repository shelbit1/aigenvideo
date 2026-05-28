import { logger, task, tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import type { generateReelTask } from "./generate-reel";

/**
 * Content Factory: создание Project'а из FactoryScenario и запуск
 * стандартного generate-reel пайплайна.
 *
 * Этот шаг переносит "креативный план недели" → "реальный ролик":
 *   1. Создаёт обычный Project с brief, mode, sourceImages, dimensions,
 *      productIdentity, durationSeconds — всё из FactoryScenario+FactoryProject.
 *   2. Связывает Project ↔ FactoryScenario (1-к-1).
 *   3. Триггерит generate-reel; deliver-reel запустится автоматически
 *      по завершении рендера.
 */

type ProducePayload = { scenarioId: string };

export const factoryProduceReelTask = task({
  id: "factory-produce-reel",
  maxDuration: 60 * 10,
  retry: { maxAttempts: 2 },
  run: async (payload: ProducePayload) => {
    logger.info("Factory produce старт", payload);

    const scenario = await prisma.factoryScenario.findUnique({
      where: { id: payload.scenarioId },
      include: { factory: true },
    });
    if (!scenario) throw new Error(`Scenario ${payload.scenarioId} not found`);
    if (!scenario.approved) {
      logger.warn("Сценарий не утверждён — пропускаем", {
        scenarioId: scenario.id,
      });
      return { skipped: true, reason: "not-approved" };
    }
    if (scenario.projectId) {
      logger.info("Сценарий уже привязан к Project", {
        scenarioId: scenario.id,
        projectId: scenario.projectId,
      });
      return { skipped: true, reason: "already-produced" };
    }

    const factory = scenario.factory;

    const project = await prisma.project.create({
      data: {
        title: scenario.title,
        brief: scenario.brief,
        durationSeconds: factory.reelDuration,
        generationMode: factory.generationMode,
        sourceImageUrl: factory.sourceImageUrl,
        sourceImages: factory.sourceImages,
        dimensions: factory.dimensions ?? undefined,
        productIdentity: factory.productIdentity ?? undefined,
        status: "GENERATING",
        userId: factory.userId,
      },
    });

    await prisma.factoryScenario.update({
      where: { id: scenario.id },
      data: {
        projectId: project.id,
        status: "GENERATING",
        errorMessage: null,
      },
    });

    // Если хотя бы один сценарий пошёл в работу — фабрика помечается как GENERATING.
    await prisma.factoryProject.update({
      where: { id: factory.id },
      data: {
        status: factory.status === "GENERATING" ? "GENERATING" : "GENERATING",
      },
    });

    try {
      await tasks.trigger<typeof generateReelTask>("generate-reel", {
        projectId: project.id,
      });
    } catch (error) {
      logger.warn("Не удалось запустить generate-reel", {
        projectId: project.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await prisma.factoryScenario.update({
        where: { id: scenario.id },
        data: {
          status: "FAILED",
          errorMessage: "generate-reel trigger failed",
        },
      });
      throw error;
    }

    return { projectId: project.id, scenarioId: scenario.id };
  },
});
