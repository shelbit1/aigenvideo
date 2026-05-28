/**
 * Доменные типы Content Factory.
 *
 * Хранятся отдельно от Prisma-типов: `weeklyStrategy` в БД — это Json,
 * а здесь — строго-типизированная форма, которой пользуются GPT-клиент,
 * Trigger.dev задача и UI.
 */

import type {
  FactoryStatus,
  GenerationMode,
  ScenarioStatus,
} from "@prisma/client";

export type { FactoryStatus, ScenarioStatus, GenerationMode };

// ──────────────────────────────────────────────────────────────────────
// Параметры формы создания фабрики
// ──────────────────────────────────────────────────────────────────────

export const VIDEOS_PER_WEEK_OPTIONS = [3, 5, 7, 14] as const;
export type VideosPerWeek = (typeof VIDEOS_PER_WEEK_OPTIONS)[number];

export const DEFAULT_VIDEOS_PER_WEEK: VideosPerWeek = 7;

export const SCENARIO_CONCEPTS = [
  "lifestyle",
  "emotional",
  "transformation",
  "POV",
  "street",
  "aesthetic",
] as const;
export type ScenarioConcept = (typeof SCENARIO_CONCEPTS)[number];

// ──────────────────────────────────────────────────────────────────────
// Weekly strategy (то, что GPT возвращает помимо сценариев)
// ──────────────────────────────────────────────────────────────────────

export interface WeeklyStrategy {
  contentStyle: string;
  audiencePsychology: string;
  visualDirection: string;
  viralHooks: string[];
}

// ──────────────────────────────────────────────────────────────────────
// Концепт одного reel'а (сценарий)
// ──────────────────────────────────────────────────────────────────────

export interface ScenarioConceptDraft {
  deliveryDay: number;        // 1..N
  conceptType: ScenarioConcept;
  title: string;
  hook: string;
  summary: string;
  visualStyle: string;
  /** Полный brief для последующего generate-reel (Creative Director). */
  brief: string;
}

export interface WeeklyPlan {
  strategy: WeeklyStrategy;
  scenarios: ScenarioConceptDraft[];
}

// ──────────────────────────────────────────────────────────────────────
// Human-readable labels
// ──────────────────────────────────────────────────────────────────────

export const FACTORY_STATUS_LABELS: Record<FactoryStatus, string> = {
  DRAFT: "Черновик",
  PLANNING: "Планируем",
  AWAITING_APPROVAL: "На утверждении",
  GENERATING: "В производстве",
  SCHEDULED: "В расписании",
  COMPLETED: "Завершено",
  FAILED: "Ошибка",
};

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  DRAFT: "Черновик",
  APPROVED: "Утверждён",
  REGENERATING: "Регенерация",
  QUEUED: "В очереди",
  GENERATING: "Генерируется",
  READY: "Готов",
  DELIVERED: "Доставлен",
  FAILED: "Ошибка",
};

export const CONCEPT_LABELS: Record<ScenarioConcept, string> = {
  lifestyle: "Lifestyle",
  emotional: "Emotional",
  transformation: "Transformation",
  POV: "POV",
  street: "Street style",
  aesthetic: "Aesthetic",
};
