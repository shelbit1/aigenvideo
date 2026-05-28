/**
 * Общие типы Kie AI задач.
 *
 * Kie использует асинхронную модель: POST запускает задачу и возвращает
 * jobId / taskId, далее идёт polling по эндпоинту /info.
 */

export type KieJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface KieJobResult<TPayload = unknown> {
  jobId: string;
  status: KieJobStatus;
  result?: TPayload;
  error?: string;
  rawResponse?: unknown;
}

/**
 * Тип одной сцены в master storyboard. Каждая сцена «знает» о предыдущей —
 * это даёт визуальный, эмоциональный и нарративный continuity.
 */
export interface SceneScript {
  index: number;
  goal: "hook" | "build" | "climax" | "cta";
  /** Что происходит в кадре, без отсылок к предыдущей сцене. */
  visualPrompt: string;
  /** Движение камеры именно в этой сцене (push-in, slow pan, hand-held и т.п.). */
  cameraMotion: string;
  /** Действие/поза субъекта в сцене (для continuity между frame-ами). */
  subjectAction: string;
  /** Как сцена переходит из предыдущей: "сохраняем тот же продукт под другим углом", "тот же актёр, ближе к камере", "локация меняется через blur". */
  transitionFromPrev: string;
  narration: string;
  durationSeconds: number;
}

/**
 * Master storyboard всего рилза. Общие поля (style, subject, palette)
 * задают глобальную «эстетику» — отдельные сцены строятся в её рамках.
 */
export interface CreativeScript {
  title: string;
  /** Hook — первые 1.5 секунды первой сцены. */
  hook: string;
  /** Единый визуальный язык на весь ролик. */
  style: string;
  /** Цветовая палитра (короткое словесное описание). */
  palette: string;
  /** Доминирующее освещение (warm sunset / soft studio / neon night и т.п.). */
  lighting: string;
  /** Главный субъект ролика: продукт, актёр или сцена. Передаётся в каждую сцену. */
  subject: string;
  /** Целевое настроение/эмоциональная дуга от первой до последней сцены. */
  narrativeArc: string;
  scenes: SceneScript[];
  callToAction: string;
}
