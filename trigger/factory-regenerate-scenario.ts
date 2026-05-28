import { logger, task } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db/prisma";
import { regenerateScenario } from "@/lib/factory/strategy";
import type {
  GenerationMode,
  ProductDimensions,
  ProductIdentity,
} from "@/lib/projects/types";
import type {
  ScenarioConcept,
  ScenarioConceptDraft,
  WeeklyStrategy,
} from "@/lib/factory/types";
import { SCENARIO_CONCEPTS } from "@/lib/factory/types";

/**
 * Content Factory: regenerate одной сценария с фидбеком пользователя.
 *
 * Сохраняет deliveryDay, может поменять conceptType если это улучшит результат.
 * Перед регенерацией статус сценария устанавливается в REGENERATING (server action).
 */

type RegeneratePayload = { scenarioId: string; feedback: string };

export const factoryRegenerateScenarioTask = task({
  id: "factory-regenerate-scenario",
  maxDuration: 60 * 5,
  retry: { maxAttempts: 2 },
  run: async (payload: RegeneratePayload) => {
    logger.info("Factory regenerate старт", payload);

    const scenario = await prisma.factoryScenario.findUnique({
      where: { id: payload.scenarioId },
      include: { factory: true },
    });
    if (!scenario) throw new Error(`Scenario ${payload.scenarioId} not found`);

    const factory = scenario.factory;

    try {
      const conceptType = SCENARIO_CONCEPTS.includes(
        scenario.conceptType as ScenarioConcept
      )
        ? (scenario.conceptType as ScenarioConcept)
        : "lifestyle";

      const current: ScenarioConceptDraft = {
        deliveryDay: scenario.deliveryDay,
        conceptType,
        title: scenario.title,
        hook: scenario.hook,
        summary: scenario.summary,
        visualStyle: scenario.visualStyle,
        brief: scenario.brief,
      };

      const updated = await regenerateScenario({
        current,
        feedback: payload.feedback,
        niche: factory.niche ?? undefined,
        description: factory.description ?? undefined,
        targetAudience: factory.targetAudience ?? undefined,
        mode: factory.generationMode as GenerationMode,
        identity:
          (factory.productIdentity ?? null) as ProductIdentity | null,
        dimensions:
          (factory.dimensions ?? null) as ProductDimensions | null,
        strategy:
          (factory.weeklyStrategy ?? null) as WeeklyStrategy | null,
        language: "ru",
      });

      await prisma.factoryScenario.update({
        where: { id: scenario.id },
        data: {
          conceptType: updated.conceptType,
          title: updated.title,
          hook: updated.hook,
          summary: updated.summary,
          visualStyle: updated.visualStyle,
          brief: updated.brief,
          status: "DRAFT",
          approved: false,
          errorMessage: null,
        },
      });

      return { scenarioId: scenario.id };
    } catch (error) {
      await prisma.factoryScenario.update({
        where: { id: scenario.id },
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
