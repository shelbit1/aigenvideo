import { callGpt55, extractJsonObject } from "./responses";
import type { CreativeScript, SceneScript } from "./types";
import {
  MODE_STORYBOARD_BRIEF,
  STORYBOARD_REALISM_RULES,
  type GenerationMode,
  type ProductDimensions,
  type ProductIdentity,
} from "@/lib/projects/types";

/**
 * GPT-5.5 Creative Director.
 *
 * Принимает brief + mode + productIdentity + dimensions и возвращает
 * мастер-раскадровку (storyboard) на N сцен. Каждая сцена «знает» о
 * предыдущей — это даёт визуальный, эмоциональный и нарративный continuity.
 *
 * Docs: https://docs.kie.ai/market/chat/gpt-5-5
 */

const CREATIVE_DIRECTOR_PROMPT = `Ты — старший креативный режиссёр премиальных UGC-роликов для TikTok / Reels / YouTube Shorts.

ЗАДАЧА: по брифу, описанию продукта (Product Identity), реальным размерам и выбранному режиму генерации составь МАСТЕР-РАСКАДРОВКУ (master storyboard) на N сцен.
Готовый ролик — это ОДНА связная мини-история, а не нарезка независимых кадров.

ПРИНЦИПЫ:
- Сцены ОБЯЗАНЫ быть последовательными и связанными: каждая сцена N+1 продолжает сцену N (тот же субъект/продукт, та же эстетика, явный переход).
- Единая визуальная стилистика на весь ролик: одна цветовая палитра, одно освещение, один характер камеры, одна эмоциональная дуга.
- Нарративная дуга hook → build → climax → cta (на N=1 — только hook+cta; на N=2 — hook+climax; на N=3 — hook→build→climax с CTA в последних кадрах).
- Один и тот же субъект сохраняется во всех сценах. НИКАКИХ новых актёров или новых продуктов между сценами.
- Все сцены ровно по 5 секунд.
- Камера динамична, но без «скачков»: рывок камеры между сценами обоснован переходом.
- Все описания максимально конкретны: ракурс, дистанция, материалы, фактуры, свет, движение субъекта.
- Если задан Product Identity — продукт во всех сценах ОБЯЗАН выглядеть точно так же: та же фактура, форма, детали, пропорции.
- Если заданы реальные размеры продукта — масштаб в кадре должен быть реалистичным относительно окружения; не «раздувай» и не уменьшай продукт.
- Режим генерации (REALISTIC vs CARTOON) определяет глобальный визуальный язык ролика.

ВЫХОДНОЙ ФОРМАТ — строго JSON-объект без markdown, без комментариев, без пояснений:
{
  "title": string,
  "hook": string,
  "style": string,
  "palette": string,
  "lighting": string,
  "subject": string,
  "narrativeArc": string,
  "scenes": [
    {
      "index": number,
      "goal": "hook" | "build" | "climax" | "cta",
      "visualPrompt": string,
      "cameraMotion": string,
      "subjectAction": string,
      "transitionFromPrev": string,
      "narration": string,
      "durationSeconds": 5
    }
  ],
  "callToAction": string
}

ПРАВИЛА ПОЛЕЙ:
- "subject" — одна короткая фраза, описывающая центральный объект (продукт + ключевые детали). Используется во всех сценах для consistency.
- "style", "palette", "lighting" — короткие, но конкретные, согласованные с режимом (REALISTIC: реалистично/UGC; CARTOON: стилизованная 3D-анимация).
- "visualPrompt" — что именно в кадре сейчас. Без отсылок к "предыдущей сцене" — это поле автономно.
- "transitionFromPrev" — как сцена логически переходит из предыдущей (для index=0 — пустая строка). Описывает continuity камеры/субъекта/окружения.
- "subjectAction" — что делает субъект (микро-движение, поза).
- "cameraMotion" — конкретное движение (slow push-in, lateral dolly left, orbital arc, static hold с lens-breathing и т.п.).
- "goal" — индексирует роль сцены в нарративной дуге.
- "narration" — 1 короткое предложение для подписей/титров.

Сцены (visualPrompt, cameraMotion, subjectAction, transitionFromPrev) пиши на английском (это улучшает качество Flux/Kling).
Остальные поля (title, hook, callToAction, narration) — на языке outputLanguage.

${STORYBOARD_REALISM_RULES}`;

interface GenerateScriptInput {
  brief: string;
  sceneCount: number;
  mode: GenerationMode;
  productIdentity?: ProductIdentity | null;
  dimensions?: ProductDimensions | null;
  language?: string;
}

export async function generateCreativeScript(
  input: GenerateScriptInput
): Promise<CreativeScript> {
  const userPayload = JSON.stringify({
    brief: input.brief,
    outputLanguage: input.language ?? "ru",
    sceneCount: input.sceneCount,
    generationMode: input.mode,
    modeBrief: MODE_STORYBOARD_BRIEF[input.mode],
    productIdentity: input.productIdentity ?? null,
    productDimensions: input.dimensions ?? null,
  });

  const raw = await callGpt55(
    [
      {
        role: "system",
        content: [{ type: "input_text", text: CREATIVE_DIRECTOR_PROMPT }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPayload }],
      },
    ],
    { effort: "medium", timeoutMs: 120_000 }
  );

  const json = extractJsonObject(raw);
  let parsed: CreativeScript;
  try {
    parsed = JSON.parse(json) as CreativeScript;
  } catch (error) {
    throw new Error(
      `Не удалось распарсить ответ GPT-5.5 как JSON: ${(error as Error).message}\n---\n${raw}`
    );
  }
  return normalizeStoryboard(parsed, input.sceneCount);
}

/**
 * Защищаемся от частых отклонений модели:
 *  - обрезаем/добиваем массив сцен до N,
 *  - проставляем числовой index,
 *  - подставляем дефолты для опциональных полей continuity.
 */
function normalizeStoryboard(
  raw: CreativeScript,
  sceneCount: number
): CreativeScript {
  const scenes = (raw.scenes ?? []).slice(0, sceneCount).map((s, i) => ({
    index: i,
    goal: s.goal ?? defaultGoal(i, sceneCount),
    visualPrompt: s.visualPrompt ?? "",
    cameraMotion: s.cameraMotion ?? "slow push-in",
    subjectAction: s.subjectAction ?? "",
    transitionFromPrev: i === 0 ? "" : s.transitionFromPrev ?? "",
    narration: s.narration ?? "",
    durationSeconds: 5 as const,
  }));

  if (scenes.length < sceneCount) {
    throw new Error(
      `GPT вернул ${scenes.length} сцен вместо ${sceneCount}`
    );
  }

  return {
    title: raw.title ?? "AI Reel",
    hook: raw.hook ?? "",
    style: raw.style ?? "",
    palette: raw.palette ?? "",
    lighting: raw.lighting ?? "",
    subject: raw.subject ?? "",
    narrativeArc: raw.narrativeArc ?? "",
    scenes,
    callToAction: raw.callToAction ?? "",
  };
}

function defaultGoal(index: number, total: number): SceneScript["goal"] {
  if (index === 0) return "hook";
  if (index === total - 1) return total === 1 ? "hook" : "cta";
  if (total === 3 && index === 1) return "build";
  return "climax";
}
