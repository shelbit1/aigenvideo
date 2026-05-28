import { logger, task, tasks, wait } from "@trigger.dev/sdk";
import type { deliverReelTask } from "./deliver-reel";
import { prisma } from "@/lib/db/prisma";
import { ai } from "@/lib/ai";
import {
  buildObjectKey,
  fetchAndUpload,
  uploadBuffer,
} from "@/lib/r2/storage";
import { mergeReel } from "@/lib/ffmpeg/render";
import type { CreativeScript, SceneScript } from "@/lib/kie/types";
import {
  MODE_MODIFIERS,
  REALISM_PROMPT_INJECTION,
  dimensionsToPromptHint,
  identityToPromptHint,
  type GenerationMode,
  type ProductDimensions,
  type ProductIdentity,
} from "@/lib/projects/types";

/**
 * Главная Trigger.dev задача — оркестратор полного пайплайна генерации reel.
 *
 *   product photos (1-10) + brief + mode + dimensions?
 *      → Product Identity Object   (GPT-5.5 vision)
 *      → master storyboard         (GPT-5.5 Creative Director)
 *      → N стартовых кадров        (Flux, sequential + multi-ref continuity)
 *      → N сегментов видео по 5 сек (Kling 3.0 image-to-video)
 *      → склейка через FFmpeg      (video concat, без аудио)
 *      → финальный MP4 в R2
 *
 * Каждая сцена N+1 строится с учётом сцены N (продукт остаётся прежним,
 * передаётся frame предыдущей сцены как референс continuity, в промпт
 * подмешиваются: режим (REALISTIC/CARTOON), Product Identity, реальные
 * размеры продукта и явный transitionFromPrev).
 *
 * sceneCount = durationSeconds / 5  (5 сек = 1 сцена, 10 сек = 2, 15 сек = 3).
 */

type ReelPayload = {
  projectId: string;
};

const SCENE_DURATION_SECONDS = 5;
// Trigger.dev checkpoint'ит только waits > 5 сек. С интервалом ровно 5с
// run теряется при connection loss и не возобновляется. 8с гарантирует
// дешёвый wakeup и устойчивость к разрывам соединения.
const POLL_INTERVAL_SECONDS = 8;
const MAX_POLL_ATTEMPTS = 150; // 150 × 8s = 20 минут на самый медленный шаг

export const generateReelTask = task({
  id: "generate-reel",
  maxDuration: 60 * 45,
  run: async (payload: ReelPayload) => {
    logger.info("Старт reel-пайплайна", { projectId: payload.projectId });

    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
    });
    if (!project) throw new Error(`Project ${payload.projectId} не найден`);
    if (!project.brief) throw new Error("У проекта пустой brief");

    try {
      return await runPipeline(project);
    } catch (error) {
      // Любая невосстановимая ошибка после всех retry'ев Trigger.dev:
      // проект не должен висеть в GENERATING — переводим в ERROR.
      logger.error("Reel pipeline failed", {
        projectId: project.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await prisma.project
        .update({
          where: { id: project.id },
          data: { status: "ERROR" },
        })
        .catch(() => {});
      // Если проект из Content Factory — сценарий тоже помечаем FAILED.
      await prisma.factoryScenario
        .updateMany({
          where: { projectId: project.id, status: { not: "DELIVERED" } },
          data: {
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
        })
        .catch(() => {});
      throw error;
    }
  },
});

async function runPipeline(project: {
  id: string;
  brief: string | null;
  durationSeconds: number;
  generationMode: GenerationMode;
  sourceImages: string[];
  sourceImageUrl: string | null;
  dimensions: unknown;
  productIdentity: unknown;
}) {
  if (!project.brief) throw new Error("brief отсутствует");

  const totalDuration = project.durationSeconds || 5;
  const sceneCount = Math.max(
    1,
    Math.round(totalDuration / SCENE_DURATION_SECONDS)
  );

  const mode = project.generationMode as GenerationMode;
  const sourceImages = (project.sourceImages?.length
    ? project.sourceImages
    : project.sourceImageUrl
      ? [project.sourceImageUrl]
      : []) as string[];
  const dimensions = (project.dimensions ?? null) as ProductDimensions | null;
  const existingIdentity =
    (project.productIdentity ?? null) as ProductIdentity | null;

  await prisma.project.update({
    where: { id: project.id },
    data: { status: "GENERATING" },
  });

    // === 0. PRODUCT IDENTITY (GPT-5.5 vision) ===
    // Анализируем все фото продукта один раз и сохраняем в проект.
    // Если identity уже есть (переподним пайплайн) — пропускаем шаг.
    let identity: ProductIdentity | null = existingIdentity;
    if (!identity && sourceImages.length > 0) {
      identity = await runIdentityStep({
        projectId: project.id,
        imageUrls: sourceImages,
        brief: project.brief,
        mode,
        dimensions,
      });
    }

    // === 1. STORYBOARD (Creative Director) ===
    const script = await runScriptStep({
      projectId: project.id,
      brief: project.brief,
      sceneCount,
      mode,
      identity,
      dimensions,
    });

    // === 2 + 3. SEQUENTIAL: FRAME (Flux) → VIDEO (Kling) ===
    const sceneVideos: string[] = [];
    let thumbnailUrl: string | undefined;
    let previousFrameUrl: string | undefined;

    for (let i = 0; i < sceneCount; i += 1) {
      const scene = script.scenes[i] ?? script.scenes[script.scenes.length - 1];

      const frameUrl = await runFrameStep({
        projectId: project.id,
        scene,
        script,
        sourceImages,
        previousFrameUrl,
        mode,
        identity,
        dimensions,
      });
      if (i === 0) thumbnailUrl = frameUrl;

      const videoUrl = await runVideoStep({
        projectId: project.id,
        scene,
        script,
        frameUrl,
        mode,
      });

      sceneVideos.push(videoUrl);
      previousFrameUrl = frameUrl;
    }

    // === 4. RENDER (FFmpeg concat, без аудио) ===
    const finalUrl = await runRenderStep({
      projectId: project.id,
      videoUrls: sceneVideos,
      totalDuration,
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "READY",
        finalVideoUrl: finalUrl,
        thumbnailUrl: thumbnailUrl ?? null,
      },
    });

    // Если проект пришёл из Content Factory — помечаем сценарий как READY
    // (готов к доставке). DELIVERED проставится позже в deliver-reel.
    await prisma.factoryScenario
      .updateMany({
        where: { projectId: project.id, status: { not: "DELIVERED" } },
        data: { status: "READY", errorMessage: null },
      })
      .catch(() => {});

    // === 5. DELIVERY (Telegram, async fire-and-forget) ===
    // Доставка идёт отдельным task'ом — у неё свой retry, и если она упадёт,
    // ролик всё равно останется доступным в дашборде. Не блокируем основной
    // пайплайн.
    try {
      await tasks.trigger<typeof deliverReelTask>("deliver-reel", {
        projectId: project.id,
      });
    } catch (error) {
      logger.warn("Не удалось запустить deliver-reel", {
        projectId: project.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info("Reel pipeline complete", {
      projectId: project.id,
      finalUrl,
      sceneCount,
      mode,
    });

    return { projectId: project.id, finalUrl, sceneCount };
}

// ──────────────────────────────────────────────────────────────────────
// Шаги пайплайна
// ──────────────────────────────────────────────────────────────────────

async function runIdentityStep(params: {
  projectId: string;
  imageUrls: string[];
  brief: string;
  mode: GenerationMode;
  dimensions: ProductDimensions | null;
}): Promise<ProductIdentity> {
  const gen = await prisma.generation.create({
    data: {
      projectId: params.projectId,
      type: "IDENTITY",
      status: "RUNNING",
      inputPayload: { imageCount: params.imageUrls.length, mode: params.mode },
      startedAt: new Date(),
    },
  });

  try {
    const identity = await ai.identity.analyze({
      imageUrls: params.imageUrls,
      brief: params.brief,
      mode: params.mode,
      dimensions: params.dimensions ?? undefined,
    });

    // Без $transaction: после долгого ai.identity.analyze() pg-pool мог
    // закрыть idle-соединение, и $transaction падает по дефолтному 5s timeout.
    // Атомарность тут некритична: если 2-й update упадёт, при следующем
    // запуске identity уже будет в проекте и шаг просто пропустится.
    await prisma.project.update({
      where: { id: params.projectId },
      data: { productIdentity: identity as unknown as object },
    });
    await prisma.generation.update({
      where: { id: gen.id },
      data: {
        status: "SUCCEEDED",
        outputPayload: identity as unknown as object,
        finishedAt: new Date(),
      },
    });
    return identity;
  } catch (error) {
    await markFailed(gen.id, error);
    throw error;
  }
}

async function runScriptStep(params: {
  projectId: string;
  brief: string;
  sceneCount: number;
  mode: GenerationMode;
  identity: ProductIdentity | null;
  dimensions: ProductDimensions | null;
}): Promise<CreativeScript> {
  const gen = await prisma.generation.create({
    data: {
      projectId: params.projectId,
      type: "SCRIPT",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const script = await ai.script.generate({
      brief: params.brief,
      sceneCount: params.sceneCount,
      mode: params.mode,
      productIdentity: params.identity,
      dimensions: params.dimensions,
      language: "ru",
    });

    await prisma.generation.update({
      where: { id: gen.id },
      data: {
        status: "SUCCEEDED",
        outputPayload: script as unknown as object,
        finishedAt: new Date(),
      },
    });
    return script;
  } catch (error) {
    await markFailed(gen.id, error);
    throw error;
  }
}

async function runFrameStep(params: {
  projectId: string;
  scene: SceneScript;
  script: CreativeScript;
  sourceImages: string[];
  previousFrameUrl: string | undefined;
  mode: GenerationMode;
  identity: ProductIdentity | null;
  dimensions: ProductDimensions | null;
}): Promise<string> {
  const prompt = buildFluxPrompt({
    script: params.script,
    scene: params.scene,
    mode: params.mode,
    identity: params.identity,
    dimensions: params.dimensions,
  });

  const gen = await prisma.generation.create({
    data: {
      projectId: params.projectId,
      type: "START_FRAME",
      status: "RUNNING",
      prompt,
      startedAt: new Date(),
    },
  });

  try {
    // Flux принимает до 8 image references.
    // [0..N] — оригинальные фото продукта (формирует визуальный «отпечаток»).
    // [last] — кадр предыдущей сцены (даёт continuity между сценами).
    const references = [
      ...params.sourceImages,
      params.previousFrameUrl,
    ].filter((u): u is string => Boolean(u));

    const taskId = await ai.image.start({
      prompt,
      aspectRatio: "9:16",
      imageReferenceUrls: references.slice(0, 8),
    });
    await prisma.generation.update({
      where: { id: gen.id },
      data: { externalJobId: taskId },
    });

    const imageUrl = await pollUntilDone(
      "Flux",
      taskId,
      async (id) => ai.image.poll(id),
      (r) => r.result?.imageUrl
    );

    const stored = await fetchAndUpload({
      sourceUrl: imageUrl,
      key: buildObjectKey("frames", "jpg", params.projectId),
      contentType: "image/jpeg",
    });

    await prisma.generation.update({
      where: { id: gen.id },
      data: {
        status: "SUCCEEDED",
        outputUrl: stored.url,
        finishedAt: new Date(),
      },
    });
    return stored.url;
  } catch (error) {
    await markFailed(gen.id, error);
    throw error;
  }
}

async function runVideoStep(params: {
  projectId: string;
  scene: SceneScript;
  script: CreativeScript;
  frameUrl: string;
  mode: GenerationMode;
}): Promise<string> {
  const prompt = buildKlingPrompt({
    script: params.script,
    scene: params.scene,
    mode: params.mode,
  });

  const gen = await prisma.generation.create({
    data: {
      projectId: params.projectId,
      type: "VIDEO",
      status: "RUNNING",
      prompt,
      startedAt: new Date(),
    },
  });

  try {
    const taskId = await ai.video.start({
      imageUrl: params.frameUrl,
      prompt,
      cameraMotion: params.scene.cameraMotion,
      aspectRatio: "9:16",
      durationSeconds: SCENE_DURATION_SECONDS,
      mode: "std",
    });
    await prisma.generation.update({
      where: { id: gen.id },
      data: { externalJobId: taskId },
    });

    const videoUrl = await pollUntilDone(
      "Kling",
      taskId,
      async (id) => ai.video.poll(id),
      (r) => r.result?.videoUrl
    );

    const stored = await fetchAndUpload({
      sourceUrl: videoUrl,
      key: buildObjectKey("videos", "mp4", params.projectId),
      contentType: "video/mp4",
    });

    await prisma.generation.update({
      where: { id: gen.id },
      data: {
        status: "SUCCEEDED",
        outputUrl: stored.url,
        finishedAt: new Date(),
      },
    });
    return stored.url;
  } catch (error) {
    await markFailed(gen.id, error);
    throw error;
  }
}

async function runRenderStep(params: {
  projectId: string;
  videoUrls: string[];
  totalDuration: number;
}): Promise<string> {
  const gen = await prisma.generation.create({
    data: {
      projectId: params.projectId,
      type: "RENDER",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const buffer = await mergeReel({
      videoUrls: params.videoUrls,
      totalDurationSeconds: params.totalDuration,
    });

    const stored = await uploadBuffer({
      key: buildObjectKey("renders", "mp4", params.projectId),
      body: buffer,
      contentType: "video/mp4",
    });

    await prisma.generation.update({
      where: { id: gen.id },
      data: {
        status: "SUCCEEDED",
        outputUrl: stored.url,
        finishedAt: new Date(),
      },
    });
    return stored.url;
  } catch (error) {
    await markFailed(gen.id, error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Хелперы
// ──────────────────────────────────────────────────────────────────────

/**
 * Богатый prompt для Flux Pro (стартовый кадр).
 *
 * Flux принимает большие тексты, поэтому мы запихиваем сюда ВСЁ:
 * глобальный стиль ролика, контент сцены, continuity, Product Identity,
 * реальные размеры продукта и mode-модификаторы. Это даёт максимальную
 * визуальную точность отдельного кадра.
 */
function buildFluxPrompt(input: {
  script: CreativeScript;
  scene: SceneScript;
  mode: GenerationMode;
  identity: ProductIdentity | null;
  dimensions: ProductDimensions | null;
}): string {
  const { script, scene, mode, identity, dimensions } = input;
  const parts: string[] = [];

  parts.push(
    `Scene ${scene.index + 1} of ${script.scenes.length} for a vertical 9:16 ad reel.`
  );
  if (script.subject) parts.push(`Subject (consistent across scenes): ${script.subject}.`);
  if (script.style) parts.push(`Visual style: ${script.style}.`);
  if (script.palette) parts.push(`Color palette: ${script.palette}.`);
  if (script.lighting) parts.push(`Lighting: ${script.lighting}.`);
  if (script.narrativeArc) parts.push(`Narrative arc of the reel: ${script.narrativeArc}.`);

  parts.push(`This scene goal: ${scene.goal}.`);
  parts.push(`Scene content: ${scene.visualPrompt}`);
  if (scene.subjectAction) parts.push(`Subject action: ${scene.subjectAction}.`);
  if (scene.cameraMotion) parts.push(`Camera motion: ${scene.cameraMotion}.`);

  if (scene.index > 0 && scene.transitionFromPrev) {
    parts.push(`Transition from previous scene: ${scene.transitionFromPrev}.`);
    parts.push(
      "Keep the same subject identity, palette and lighting as in the previous scene. Smooth visual continuity, no jump cuts."
    );
  } else {
    parts.push("This is the opening shot — establish the subject clearly within the first second.");
  }

  if (identity) parts.push(identityToPromptHint(identity));
  if (dimensions) parts.push(dimensionsToPromptHint(dimensions));

  parts.push(MODE_MODIFIERS[mode]);
  // Глобальные правила реализма + эксклюзивности главного героя
  // (context5.md). Применяются в обоих режимах.
  parts.push(REALISM_PROMPT_INJECTION);

  return parts.join(" ");
}

/** Жёсткий лимит Kling 3.0 на длину prompt'а. */
const KLING_PROMPT_LIMIT = 2400; // запас 100 символов от лимита 2500

/**
 * Компактный prompt для Kling 3.0 (image-to-video).
 *
 * Kling режет prompt после ~2500 символов, поэтому здесь только то, что
 * критично для движения: визуальный отпечаток субъекта (через стартовый
 * кадр, который Kling уже видит как референс), действие, движение камеры,
 * палитра/освещение и короткий mode-тег. Identity и dimensions не нужны —
 * они уже «впечатаны» в стартовый кадр.
 */
function buildKlingPrompt(input: {
  script: CreativeScript;
  scene: SceneScript;
  mode: GenerationMode;
}): string {
  const { script, scene, mode } = input;
  const parts: string[] = [];

  if (script.subject) parts.push(`Subject: ${script.subject}.`);
  parts.push(`Scene: ${scene.visualPrompt}`);
  if (scene.subjectAction) parts.push(`Action: ${scene.subjectAction}.`);
  if (scene.cameraMotion) parts.push(`Camera: ${scene.cameraMotion}.`);
  if (script.palette) parts.push(`Palette: ${script.palette}.`);
  if (script.lighting) parts.push(`Lighting: ${script.lighting}.`);
  if (scene.index > 0 && scene.transitionFromPrev) {
    parts.push(`Transition: ${scene.transitionFromPrev}.`);
  }
  parts.push(KLING_MODE_TAG[mode]);
  parts.push("Maintain subject identity and proportions from the input frame.");
  // Глобальные правила реализма + эксклюзивности главного героя
  // (context5.md). Применяются в обоих режимах.
  parts.push(REALISM_PROMPT_INJECTION);

  const joined = parts.join(" ");
  return joined.length > KLING_PROMPT_LIMIT
    ? `${joined.slice(0, KLING_PROMPT_LIMIT - 1)}…`
    : joined;
}

/**
 * Короткие mode-теги для Kling (одна-две фразы вместо длинного блока
 * MODE_MODIFIERS, который Flux получает целиком).
 */
const KLING_MODE_TAG: Record<GenerationMode, string> = {
  REALISTIC:
    "Realistic UGC iPhone footage style, natural light, subtle handheld camera motion, no CGI feel.",
  CARTOON:
    "Pixar-inspired stylized 3D animation, soft cinematic lighting, expressive character motion.",
};

async function pollUntilDone<TPayload>(
  label: string,
  taskId: string,
  poll: (id: string) => Promise<{
    status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
    error?: string;
    result?: TPayload;
  }>,
  pickResult: (r: { result?: TPayload }) => string | undefined
): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i += 1) {
    const r = await poll(taskId);
    if (r.status === "succeeded") {
      const url = pickResult(r);
      if (!url) throw new Error(`${label}: пустой URL результата`);
      return url;
    }
    if (r.status === "failed" || r.status === "cancelled") {
      throw new Error(`${label} failed: ${r.error ?? "unknown"}`);
    }
    await wait.for({ seconds: POLL_INTERVAL_SECONDS });
  }
  throw new Error(`${label}: polling timeout (${MAX_POLL_ATTEMPTS} attempts)`);
}

async function markFailed(generationId: string, error: unknown) {
  await prisma.generation
    .update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : JSON.stringify(error),
        finishedAt: new Date(),
      },
    })
    .catch(() => {
      // не маскируем оригинальную ошибку, если БД недоступна
    });
}
