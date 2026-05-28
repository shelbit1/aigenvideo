import { callGpt55, extractJsonObject } from "@/lib/kie/responses";
import type {
  GenerationMode,
  ProductDimensions,
  ProductIdentity,
} from "@/lib/projects/types";
import {
  MODE_STORYBOARD_BRIEF,
  STORYBOARD_REALISM_RULES,
} from "@/lib/projects/types";
import {
  SCENARIO_CONCEPTS,
  type ScenarioConcept,
  type ScenarioConceptDraft,
  type WeeklyPlan,
  type WeeklyStrategy,
} from "./types";

/**
 * GPT-5.5 AI Content Strategist for AigenVideo Content Factory.
 *
 * Принимает niche/description/audience/mode/identity/dimensions/videosPerWeek
 * и возвращает: контентную стратегию недели + N разных сценариев
 * (каждый — свой conceptType: lifestyle/emotional/transformation/POV/street/aesthetic).
 */

const WEEKLY_STRATEGY_PROMPT = `Ты — AI Creative Strategist и AI Social Media Manager одновременно.
Твоя задача — собрать целую неделю reels-контента (TikTok / Instagram Reels) для одного продукта или бренда.

ВХОД: niche, описание, target audience, режим генерации (REALISTIC / CARTOON), опционально Product Identity и реальные размеры продукта.
ВЫХОД — JSON-объект:
{
  "strategy": {
    "contentStyle": string,
    "audiencePsychology": string,
    "visualDirection": string,
    "viralHooks": string[]
  },
  "scenarios": [
    {
      "deliveryDay": number,            // 1..N (последовательность дней)
      "conceptType": "lifestyle" | "emotional" | "transformation" | "POV" | "street" | "aesthetic",
      "title": string,                  // короткое название reel'а на языке outputLanguage
      "hook": string,                   // мощный first-second hook
      "summary": string,                // 1-2 предложения о ролике для UI-карточки
      "visualStyle": string,            // визуальный язык, согласованный с режимом
      "brief": string                   // подробный creative brief, который позже пойдёт в Creative Director (на английском)
    }
  ]
}

ВАЖНЫЕ ПРАВИЛА:
- Создай ровно N сценариев (где N задан в "videosPerWeek").
- Все сценарии РАЗНЫЕ по conceptType, hook, эмоции, storytelling-формату.
- Один продукт, одна visual identity на всю неделю, но РАЗНЫЕ углы и истории.
- "brief" должен быть достаточно полным, чтобы по нему отдельный Creative Director мог построить storyboard ролика без дополнительных вопросов: что в кадре, что делает субъект, какая эмоция, какой call-to-action. Английский язык.
- Все остальные текстовые поля (strategy, title, hook, summary, visualStyle) — на языке outputLanguage.
- Без markdown, без комментариев, без пояснений — только чистый JSON.
- Если не указан продукт/identity — фокусируйся на нише и audience, придумывай концепции вокруг них.

${STORYBOARD_REALISM_RULES}`;

const REGENERATE_PROMPT = `Ты — AI Creative Strategist для Content Factory.
Тебе нужно ПЕРЕСОЗДАТЬ один reel-сценарий из уже существующей недели контента, учитывая обратную связь пользователя.

ВХОД содержит:
- "current": исходный сценарий (title, hook, summary, visualStyle, brief, conceptType, deliveryDay),
- "feedback": пожелания пользователя,
- "context": niche, description, audience, mode, identity, dimensions, weekly strategy.

ВЫХОД — JSON-объект (один сценарий, тот же deliveryDay):
{
  "deliveryDay": number,
  "conceptType": string,
  "title": string,
  "hook": string,
  "summary": string,
  "visualStyle": string,
  "brief": string
}

ПРАВИЛА:
- Сохрани deliveryDay из current.
- Можно поменять conceptType, если это улучшает результат после feedback.
- Visual identity продукта остаётся прежней.
- brief — на английском, остальное — на языке outputLanguage.
- Чистый JSON, без markdown.

${STORYBOARD_REALISM_RULES}`;

interface PlanInput {
  niche?: string;
  description?: string;
  targetAudience?: string;
  mode: GenerationMode;
  videosPerWeek: number;
  identity?: ProductIdentity | null;
  dimensions?: ProductDimensions | null;
  language?: string;
}

export async function generateWeeklyPlan(input: PlanInput): Promise<WeeklyPlan> {
  const payload = JSON.stringify({
    niche: input.niche ?? null,
    description: input.description ?? null,
    targetAudience: input.targetAudience ?? null,
    generationMode: input.mode,
    modeBrief: MODE_STORYBOARD_BRIEF[input.mode],
    videosPerWeek: input.videosPerWeek,
    productIdentity: input.identity ?? null,
    productDimensions: input.dimensions ?? null,
    outputLanguage: input.language ?? "ru",
  });

  const raw = await callGpt55(
    [
      {
        role: "system",
        content: [{ type: "input_text", text: WEEKLY_STRATEGY_PROMPT }],
      },
      { role: "user", content: [{ type: "input_text", text: payload }] },
    ],
    { effort: "medium", timeoutMs: 180_000 }
  );

  const parsed = JSON.parse(extractJsonObject(raw)) as {
    strategy?: Partial<WeeklyStrategy>;
    scenarios?: Array<Partial<ScenarioConceptDraft>>;
  };

  return normalizePlan(parsed, input.videosPerWeek);
}

interface RegenerateInput {
  current: ScenarioConceptDraft;
  feedback: string;
  niche?: string;
  description?: string;
  targetAudience?: string;
  mode: GenerationMode;
  identity?: ProductIdentity | null;
  dimensions?: ProductDimensions | null;
  strategy?: WeeklyStrategy | null;
  language?: string;
}

export async function regenerateScenario(
  input: RegenerateInput
): Promise<ScenarioConceptDraft> {
  const payload = JSON.stringify({
    current: input.current,
    feedback: input.feedback,
    context: {
      niche: input.niche ?? null,
      description: input.description ?? null,
      targetAudience: input.targetAudience ?? null,
      generationMode: input.mode,
      modeBrief: MODE_STORYBOARD_BRIEF[input.mode],
      productIdentity: input.identity ?? null,
      productDimensions: input.dimensions ?? null,
      weeklyStrategy: input.strategy ?? null,
    },
    outputLanguage: input.language ?? "ru",
  });

  const raw = await callGpt55(
    [
      {
        role: "system",
        content: [{ type: "input_text", text: REGENERATE_PROMPT }],
      },
      { role: "user", content: [{ type: "input_text", text: payload }] },
    ],
    { effort: "medium", timeoutMs: 120_000 }
  );

  const parsed = JSON.parse(extractJsonObject(raw)) as Partial<ScenarioConceptDraft>;
  return normalizeScenario(parsed, input.current.deliveryDay);
}

// ──────────────────────────────────────────────────────────────────────
// Нормализация ответов модели
// ──────────────────────────────────────────────────────────────────────

function normalizePlan(
  raw: { strategy?: Partial<WeeklyStrategy>; scenarios?: Array<Partial<ScenarioConceptDraft>> },
  expected: number
): WeeklyPlan {
  const scenariosRaw = (raw.scenarios ?? []).slice(0, expected);
  if (scenariosRaw.length < expected) {
    throw new Error(
      `GPT вернул ${scenariosRaw.length} сценариев вместо ${expected}`
    );
  }
  return {
    strategy: {
      contentStyle: raw.strategy?.contentStyle ?? "",
      audiencePsychology: raw.strategy?.audiencePsychology ?? "",
      visualDirection: raw.strategy?.visualDirection ?? "",
      viralHooks: Array.isArray(raw.strategy?.viralHooks)
        ? raw.strategy.viralHooks.filter(
            (h): h is string => typeof h === "string" && h.length > 0
          )
        : [],
    },
    scenarios: scenariosRaw.map((s, i) => normalizeScenario(s, i + 1)),
  };
}

function normalizeScenario(
  raw: Partial<ScenarioConceptDraft>,
  deliveryDay: number
): ScenarioConceptDraft {
  const concept = SCENARIO_CONCEPTS.includes(raw.conceptType as ScenarioConcept)
    ? (raw.conceptType as ScenarioConcept)
    : "lifestyle";
  return {
    deliveryDay,
    conceptType: concept,
    title: (raw.title ?? "Untitled reel").trim(),
    hook: (raw.hook ?? "").trim(),
    summary: (raw.summary ?? "").trim(),
    visualStyle: (raw.visualStyle ?? "").trim(),
    brief: (raw.brief ?? "").trim(),
  };
}
