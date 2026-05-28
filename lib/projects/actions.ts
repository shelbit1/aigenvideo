"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { triggerGenerateReel } from "@/lib/trigger";
import {
  CreateProjectSchema,
  type CreateProjectFieldError,
  type CreateProjectState,
} from "./schemas";

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
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

  const parsed = CreateProjectSchema.safeParse({
    title: field("title"),
    brief: field("brief"),
    sourceImages: field("sourceImages"),
    durationSeconds: field("durationSeconds"),
    generationMode: field("generationMode"),
    hasDimensions: field("hasDimensions"),
    dimensionLength: field("dimensionLength"),
    dimensionWidth: field("dimensionWidth"),
    dimensionHeight: field("dimensionHeight"),
    dimensionWeight: field("dimensionWeight"),
    dimensionUnit: field("dimensionUnit"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      message: "Проверьте корректность данных.",
      fieldErrors: flat as Partial<Record<CreateProjectFieldError, string[]>>,
    };
  }

  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      brief: parsed.data.brief,
      sourceImageUrl: parsed.data.sourceImages[0] ?? null,
      sourceImages: parsed.data.sourceImages,
      durationSeconds: parsed.data.durationSeconds,
      generationMode: parsed.data.generationMode,
      dimensions: parsed.data.dimensions
        ? (parsed.data.dimensions as unknown as object)
        : undefined,
      status: "DRAFT",
      userId: session.user.id,
    },
  });

  // Best-effort запуск Trigger.dev. Если оркестратор недоступен,
  // проект всё равно остаётся в DRAFT и пользователь может перезапустить.
  try {
    await triggerGenerateReel(project.id);
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "GENERATING" },
    });
  } catch (error) {
    console.error("[trigger] не удалось запустить generate-reel", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(projectId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.user.id },
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
