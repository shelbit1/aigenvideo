/**
 * Серверный helper для запуска Trigger.dev задач из server actions.
 *
 * Импортируем тип задачи (не саму реализацию), чтобы избежать тянуть
 * весь /trigger код в Next.js бандл.
 */

import { tasks } from "@trigger.dev/sdk";
import type { generateReelTask } from "@/trigger/generate-reel";
import type { factoryPlanTask } from "@/trigger/factory-plan";
import type { factoryRegenerateScenarioTask } from "@/trigger/factory-regenerate-scenario";
import type { factoryProduceReelTask } from "@/trigger/factory-produce-reel";

export async function triggerGenerateReel(projectId: string) {
  return tasks.trigger<typeof generateReelTask>("generate-reel", { projectId });
}

export async function triggerFactoryPlan(factoryId: string) {
  return tasks.trigger<typeof factoryPlanTask>("factory-plan", { factoryId });
}

export async function triggerFactoryRegenerate(input: {
  scenarioId: string;
  feedback: string;
}) {
  return tasks.trigger<typeof factoryRegenerateScenarioTask>(
    "factory-regenerate-scenario",
    input
  );
}

export async function triggerFactoryProduceReel(scenarioId: string) {
  return tasks.trigger<typeof factoryProduceReelTask>(
    "factory-produce-reel",
    { scenarioId }
  );
}
