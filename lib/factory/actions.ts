"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  triggerFactoryPlan,
  triggerFactoryRegenerate,
  triggerFactoryProduceReel,
} from "@/lib/trigger";
import {
  CreateFactorySchema,
  EditScenarioSchema,
  RegenerateScenarioSchema,
  type CreateFactoryFieldError,
  type CreateFactoryState,
} from "./schemas";

/**
 * Server actions для Content Factory.
 *
 *   createFactoryAction        — создаёт фабрику, запускает план через Trigger.
 *   regenerateScenarioAction   — отправляет фидбек в Trigger для re-gen.
 *   editScenarioAction         — ручная правка карточки.
 *   approveScenarioAction      — единичный approve / disapprove.
 *   startProductionAction      — стартует ежедневный выпуск всех approved.
 *   deleteFactoryAction        — удаляет фабрику.
 */

export async function createFactoryAction(
  _prev: CreateFactoryState,
  formData: FormData
): Promise<CreateFactoryState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Сессия истекла. Войдите снова." };
  }

  // formData.get() возвращает null когда поле отсутствует в форме
  // (например блок размеров не раскрыт). Zod .optional() ждёт undefined,
  // не null — поэтому нормализуем здесь.
  const field = (key: string) => {
    const v = formData.get(key);
    return v === null ? undefined : v;
  };

  const parsed = CreateFactorySchema.safeParse({
    title: field("title"),
    niche: field("niche"),
    description: field("description"),
    targetAudience: field("targetAudience"),
    generationMode: field("generationMode"),
    reelDuration: field("reelDuration"),
    videosPerWeek: field("videosPerWeek"),
    sourceImages: field("sourceImages"),
    deliveryTime: field("deliveryTime") ?? "10:00",
    deliveryTimezone: field("deliveryTimezone") ?? "UTC",
    hasDimensions: field("hasDimensions"),
    dimensionLength: field("dimensionLength"),
    dimensionWidth: field("dimensionWidth"),
    dimensionHeight: field("dimensionHeight"),
    dimensionWeight: field("dimensionWeight"),
    dimensionUnit: field("dimensionUnit"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте корректность данных.",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<
        Record<CreateFactoryFieldError, string[]>
      >,
    };
  }

  const factory = await prisma.factoryProject.create({
    data: {
      title: parsed.data.title,
      niche: parsed.data.niche || null,
      description: parsed.data.description,
      targetAudience: parsed.data.targetAudience || null,
      generationMode: parsed.data.generationMode,
      reelDuration: parsed.data.reelDuration,
      videosPerWeek: parsed.data.videosPerWeek,
      sourceImages: parsed.data.sourceImages,
      sourceImageUrl: parsed.data.sourceImages[0] ?? null,
      dimensions: parsed.data.dimensions
        ? (parsed.data.dimensions as unknown as object)
        : undefined,
      deliveryTime: parsed.data.deliveryTime,
      deliveryTimezone: parsed.data.deliveryTimezone,
      status: "DRAFT",
      userId: session.user.id,
    },
  });

  // Best-effort запуск плана. Если воркер недоступен — фабрика остаётся в
  // DRAFT и пользователь сможет перезапустить позже.
  try {
    await triggerFactoryPlan(factory.id);
    await prisma.factoryProject.update({
      where: { id: factory.id },
      data: { status: "PLANNING" },
    });
  } catch (error) {
    console.error("[factory] не удалось запустить план", error);
  }

  revalidatePath("/factory");
  redirect(`/factory/${factory.id}`);
}

async function loadOwnedScenario(scenarioId: string, userId: string) {
  return prisma.factoryScenario.findFirst({
    where: { id: scenarioId, factory: { userId } },
    include: { factory: true },
  });
}

export async function approveScenarioAction(
  scenarioId: string,
  approved: boolean
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const scenario = await loadOwnedScenario(scenarioId, session.user.id);
  if (!scenario) throw new Error("Сценарий не найден");

  await prisma.factoryScenario.update({
    where: { id: scenario.id },
    data: {
      approved,
      status: approved ? "APPROVED" : "DRAFT",
    },
  });

  revalidatePath(`/factory/${scenario.factoryId}`);
}

export async function regenerateScenarioAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = RegenerateScenarioSchema.safeParse({
    scenarioId: formData.get("scenarioId"),
    feedback: formData.get("feedback") ?? undefined,
  });
  if (!parsed.success) throw new Error("Некорректные данные");

  const scenario = await loadOwnedScenario(
    parsed.data.scenarioId,
    session.user.id
  );
  if (!scenario) throw new Error("Сценарий не найден");

  await prisma.factoryScenario.update({
    where: { id: scenario.id },
    data: {
      status: "REGENERATING",
      feedback: parsed.data.feedback ?? null,
      approved: false,
    },
  });

  try {
    await triggerFactoryRegenerate({
      scenarioId: scenario.id,
      feedback: parsed.data.feedback ?? "",
    });
  } catch (error) {
    console.error("[factory] regenerate trigger failed", error);
    await prisma.factoryScenario.update({
      where: { id: scenario.id },
      data: { status: "DRAFT", errorMessage: "Воркер недоступен" },
    });
  }

  revalidatePath(`/factory/${scenario.factoryId}`);
}

export async function editScenarioAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = EditScenarioSchema.safeParse({
    scenarioId: formData.get("scenarioId"),
    title: formData.get("title"),
    hook: formData.get("hook"),
    summary: formData.get("summary"),
    brief: formData.get("brief"),
  });
  if (!parsed.success) throw new Error("Некорректные данные");

  const scenario = await loadOwnedScenario(
    parsed.data.scenarioId,
    session.user.id
  );
  if (!scenario) throw new Error("Сценарий не найден");

  await prisma.factoryScenario.update({
    where: { id: scenario.id },
    data: {
      title: parsed.data.title,
      hook: parsed.data.hook,
      summary: parsed.data.summary,
      brief: parsed.data.brief,
    },
  });
  revalidatePath(`/factory/${scenario.factoryId}`);
}

/**
 * Перезапуск упавшего сценария без regenerate (без нового похода в GPT).
 * Отвязываем от failed-проекта (он остаётся в /projects для истории)
 * и снова триггерим factory-produce-reel — он создаст новый Project
 * и прогонит его через свежий пайплайн.
 */
export async function retryScenarioAction(scenarioId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const scenario = await loadOwnedScenario(scenarioId, session.user.id);
  if (!scenario) throw new Error("Сценарий не найден");
  if (scenario.status !== "FAILED") {
    throw new Error("Перезапуск возможен только для FAILED-сценариев");
  }

  await prisma.factoryScenario.update({
    where: { id: scenario.id },
    data: {
      projectId: null,
      status: "QUEUED",
      errorMessage: null,
      scheduledFor: new Date(),
      approved: true,
    },
  });

  try {
    await triggerFactoryProduceReel(scenario.id);
  } catch (error) {
    console.error("[factory] retry trigger failed", error);
    await prisma.factoryScenario.update({
      where: { id: scenario.id },
      data: {
        status: "FAILED",
        errorMessage: "Не удалось переотправить run в Trigger.dev",
      },
    });
    throw error;
  }

  revalidatePath(`/factory/${scenario.factoryId}`);
}

export async function startProductionAction(factoryId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const factory = await prisma.factoryProject.findFirst({
    where: { id: factoryId, userId: session.user.id },
    include: { scenarios: { orderBy: { deliveryDay: "asc" } } },
  });
  if (!factory) throw new Error("Фабрика не найдена");

  const approved = factory.scenarios.filter((s) => s.approved);
  if (approved.length === 0) {
    throw new Error("Утвердите хотя бы один сценарий перед стартом");
  }

  // Параллельный запуск: все approved сценарии стартуют сразу.
  // scheduledFor = now (для логов и совместимости с scheduler'ом,
  // если он подберёт пропущенные QUEUED-сценарии).
  const now = new Date();
  await prisma.factoryScenario.updateMany({
    where: { id: { in: approved.map((s) => s.id) } },
    data: { status: "QUEUED", scheduledFor: now },
  });
  await prisma.factoryProject.update({
    where: { id: factory.id },
    data: { status: "SCHEDULED", productionStartedAt: now },
  });

  // Триггерим все produce-reel параллельно. Каждый run в Trigger.dev
  // независим, ошибки одного не блокируют остальные.
  const results = await Promise.allSettled(
    approved.map((s) => triggerFactoryProduceReel(s.id))
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(
      `[factory] не удалось запустить ${failed.length}/${approved.length} сценариев`,
      failed
    );
  }

  revalidatePath(`/factory/${factory.id}`);
}

export async function deleteFactoryAction(factoryId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.factoryProject.deleteMany({
    where: { id: factoryId, userId: session.user.id },
  });
  revalidatePath("/factory");
}
