import { logger, task } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai";
import { generateWeeklyPlan } from "@/lib/factory/strategy";
import type {
  GenerationMode,
  ProductDimensions,
  ProductIdentity,
} from "@/lib/projects/types";

/**
 * Content Factory: построение плана недели.
 *
 *   фабрика создана (DRAFT) → factory-plan
 *      → если есть фото и нет productIdentity, GPT vision строит Identity
 *      → GPT-5.5 strategist возвращает weeklyStrategy + N сценариев
 *      → status: AWAITING_APPROVAL
 *
 * Дальше пользователь сам ревьюит сценарии в UI и жмёт Approve / Regenerate.
 */

type FactoryPlanPayload = { factoryId: string };

export const factoryPlanTask = task({
  id: "factory-plan",
  maxDuration: 60 * 10,
  retry: { maxAttempts: 2 },
  run: async (payload: FactoryPlanPayload) => {
    logger.info("Factory plan старт", { factoryId: payload.factoryId });

    const factory = await prisma.factoryProject.findUnique({
      where: { id: payload.factoryId },
    });
    if (!factory) throw new Error(`FactoryProject ${payload.factoryId} not found`);

    try {
      await prisma.factoryProject.update({
        where: { id: factory.id },
        data: { status: "PLANNING", errorMessage: null },
      });

      const mode = factory.generationMode as GenerationMode;
      const dimensions =
        (factory.dimensions ?? null) as ProductDimensions | null;
      let identity =
        (factory.productIdentity ?? null) as ProductIdentity | null;

      // Если есть фото — строим Product Identity один раз и сохраняем.
      if (!identity && factory.sourceImages.length > 0) {
        identity = await ai.identity.analyze({
          imageUrls: factory.sourceImages,
          brief: factory.description ?? undefined,
          mode,
          dimensions: dimensions ?? undefined,
        });
        await prisma.factoryProject.update({
          where: { id: factory.id },
          data: { productIdentity: identity as unknown as object },
        });
      }

      const plan = await generateWeeklyPlan({
        niche: factory.niche ?? undefined,
        description: factory.description ?? undefined,
        targetAudience: factory.targetAudience ?? undefined,
        mode,
        identity,
        dimensions,
        videosPerWeek: factory.videosPerWeek,
        language: "ru",
      });

      // Sequential операции вместо $transaction.
      // После долгого GPT-вызова pg-pool часто закрывает idle-соединение,
      // и $transaction падает по дефолтному 5-секундному таймауту старта.
      // Атомарность здесь некритична: даже если упадём посередине,
      // status фабрики останется в PLANNING → пользователь увидит ошибку
      // и сможет перезапустить. createMany() даёт батч-вставку одним
      // запросом (быстрее N отдельных create'ов).
      await prisma.factoryScenario.deleteMany({
        where: { factoryId: factory.id },
      });
      await prisma.factoryProject.update({
        where: { id: factory.id },
        data: {
          status: "AWAITING_APPROVAL",
          weeklyStrategy: plan.strategy as unknown as object,
        },
      });
      await prisma.factoryScenario.createMany({
        data: plan.scenarios.map((s) => ({
          factoryId: factory.id,
          deliveryDay: s.deliveryDay,
          conceptType: s.conceptType,
          title: s.title,
          hook: s.hook,
          summary: s.summary,
          visualStyle: s.visualStyle,
          brief: s.brief,
          status: "DRAFT" as const,
        })),
      });

      logger.info("Factory plan завершён", {
        factoryId: factory.id,
        scenarios: plan.scenarios.length,
      });
      return { factoryId: factory.id, scenarios: plan.scenarios.length };
    } catch (error) {
      await prisma.factoryProject.update({
        where: { id: factory.id },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : JSON.stringify(error),
        },
      });
      throw error;
    }
  },
});
