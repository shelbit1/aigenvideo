/**
 * Доменные типы и константы продукта (режимы генерации, размеры, identity).
 *
 * Используются ВСЮДУ — на сервере (Trigger.dev задача, GPT клиент, actions),
 * и на клиенте (формы, отображение). Хранится отдельно от Prisma-типов, потому
 * что Prisma поля `dimensions` и `productIdentity` — это `Json`, и нам нужны
 * сильные TypeScript типы для безопасного парсинга.
 */

import type { GenerationMode } from "@prisma/client";

export type { GenerationMode };

// ──────────────────────────────────────────────────────────────────────
// GENERATION MODES
// ──────────────────────────────────────────────────────────────────────

export const GENERATION_MODES = [
  {
    id: "REALISTIC" as const,
    label: "Realistic",
    description: "Instagram reels, UGC ads, lifestyle, fashion",
  },
  {
    id: "CARTOON" as const,
    label: "Cartoon",
    description: "3D-анимация, mascot, toys, kids products",
  },
];

/**
 * Промпт-модификаторы, которые автоматически инжектятся в КАЖДЫЙ
 * Flux/Kling prompt для соответствующего режима.
 *
 * Источник — context2.md, REALISTIC MODE SYSTEM PROMPTS и
 * CARTOON MODE SYSTEM PROMPTS.
 */
export const MODE_MODIFIERS: Record<GenerationMode, string> = {
  REALISTIC: [
    "Instagram lifestyle reel aesthetic, amateur social-media footage.",
    "Raw realistic footage, NOT cinematic movie, NOT CGI, NOT AI-generated, NOT glossy skin, NOT fashion magazine.",
    "Natural skin texture with pores and slight imperfections, realistic street photography style, shot on iPhone 15 Pro.",
    "Natural lighting, handheld footage, subtle camera shake, realistic motion blur.",
    "Casual social-media-native footage, imperfect framing, realistic body movement, natural clothing physics.",
    "Calm natural facial expression, NO over-acted emotions, NO theatrical smiling, NO cringe AI-style posing.",
  ].join(" "),

  CARTOON: [
    "Stylized 3D animation, animated movie aesthetic.",
    "Family-friendly visuals, expressive character animation.",
    "Soft cinematic lighting, polished cartoon rendering, animated commercial style.",
    "Pixar-inspired and Disney-inspired visual storytelling.",
    "Do NOT use any copyrighted characters or branded IP — only the inspired aesthetic.",
  ].join(" "),
};

/**
 * Текст творческого задания GPT-5.5 Creative Director'у: задаёт глобальный
 * визуальный язык storyboard'а в зависимости от режима.
 */
export const MODE_STORYBOARD_BRIEF: Record<GenerationMode, string> = {
  REALISTIC:
    "Целевой стиль ролика — realistic Instagram/TikTok UGC. Никакой Hollywood-кинематографии и CGI. Сцены выглядят как лайв-съёмка на смартфон: естественный свет, ручная камера, реалистичная мимика и кожа, casual atmosphere. Никаких over-acted эмоций — герой ведёт себя как обычный человек, а не как актёр.",
  CARTOON:
    "Целевой стиль ролика — stylized 3D animation в духе Pixar/Disney-inspired анимации (БЕЗ копирайтных персонажей). Сцены выглядят как кадры из современного семейного 3D-мультфильма: выразительная мимика, чистый рендер, soft cinematic lighting.",
};

// ──────────────────────────────────────────────────────────────────────
// REALISM + MAIN CHARACTER EXCLUSIVITY (context5.md)
// ──────────────────────────────────────────────────────────────────────

/**
 * Жёсткие правила, которые инжектятся в КАЖДЫЙ финальный prompt
 * (Flux + Kling). Цель — реализм и эксклюзивность главного героя
 * (никаких толп моделей в похожей одежде, никаких визуально конкурирующих
 * персонажей).
 *
 * Краткие — Kling режет prompt после 2500 символов.
 */
export const REALISM_PROMPT_INJECTION = [
  "Single main character focus, main subject visually dominant.",
  "No competing fashion subjects, no other stylish models in frame.",
  "Avoid similar outfits or clothing on any other people.",
  "Background people only if blurred, far away and visually neutral.",
  "No fashion crowd scenes, no clone-like background characters.",
  "Believable social-media-style footage, NOT artificial, NOT over-acted, NOT cringe AI-generated.",
].join(" ");

/**
 * Более развёрнутый блок правил для GPT-сценаристов (Creative Director,
 * Weekly Strategist) — чтобы они на уровне сценария НЕ предлагали
 * "fashion crowd", "group of models", "стильная компания друзей" и т.п.
 */
export const STORYBOARD_REALISM_RULES = `
CORE GENERATION REQUIREMENTS (must follow strictly):

1. REALISM
   - Every scene must feel like real social-media footage (Instagram/TikTok UGC).
   - The character must behave like a real human, not an actor: calm natural expression, no theatrical emotions, no over-acted smiling, no cringe AI-style posing.
   - Avoid Hollywood/cinematic vibes. Avoid CGI feel. Avoid fashion-magazine vibes.

2. MAIN CHARACTER EXCLUSIVITY
   - The main character must visually dominate every scene.
   - DO NOT introduce other attractive models, similar-looking people, competing fashion subjects, or distracting background characters.
   - DO NOT design scenes around "groups of stylish models", "fashion crowd", "company of friends in matching outfits", "models walking together" or similar concepts.

3. BACKGROUND PEOPLE
   - Allowed only if blurred, far away, visually neutral and wearing nothing similar to the main character.
   - Never design scenes where background people compete for attention.

4. AVOID
   - clone-like background characters
   - multiple people wearing similar clothes
   - duplicate fashion styles in one frame
   - any visual element that pulls attention away from the main subject + product

These rules apply equally in REALISTIC and CARTOON modes (in CARTOON: no group-of-mascots scenes).
`.trim();

// ──────────────────────────────────────────────────────────────────────
// PRODUCT DIMENSIONS
// ──────────────────────────────────────────────────────────────────────

export const DIMENSION_UNITS = ["cm", "mm", "inches"] as const;
export type DimensionUnit = (typeof DIMENSION_UNITS)[number];

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight?: number;
  unit: DimensionUnit;
}

/** Промпт-модификатор размеров. Описан в context2.md, REQUIRED PROMPT INJECTION. */
export const DIMENSIONS_PROMPT_INJECTION =
  "Maintain accurate real-world scale. Do not resize the product unrealistically. Keep product proportions consistent across all scenes.";

export function formatDimensions(d: ProductDimensions): string {
  const main = `${d.length} × ${d.width} × ${d.height} ${d.unit}`;
  return d.weight ? `${main}, ${d.weight}g` : main;
}

export function dimensionsToPromptHint(d: ProductDimensions): string {
  return `Real product dimensions: length ${d.length}${d.unit}, width ${d.width}${d.unit}, height ${d.height}${d.unit}${
    d.weight ? `, weight ${d.weight}g` : ""
  }. ${DIMENSIONS_PROMPT_INJECTION}`;
}

// ──────────────────────────────────────────────────────────────────────
// PRODUCT IDENTITY (результат GPT-анализа фото)
// ──────────────────────────────────────────────────────────────────────

/**
 * Глобальный «отпечаток» продукта, который GPT-5.5 формирует один раз
 * из загруженных изображений. Затем подмешивается в каждый scene prompt,
 * чтобы Flux/Kling не «теряли» фактуру/форму/цвет между сценами.
 */
export interface ProductIdentity {
  productType: string;
  material: string;
  shape: string;
  texture: string;
  dominantColors: string[];
  smallDetails: string[];
  surfaceFinish: string;
  visualStyle: string;
}

export function identityToPromptHint(identity: ProductIdentity): string {
  const parts: string[] = [];
  parts.push(`Product identity (must stay identical across all scenes): ${identity.productType}.`);
  if (identity.material) parts.push(`Material: ${identity.material}.`);
  if (identity.shape) parts.push(`Shape: ${identity.shape}.`);
  if (identity.texture) parts.push(`Texture: ${identity.texture}.`);
  if (identity.surfaceFinish) parts.push(`Surface finish: ${identity.surfaceFinish}.`);
  if (identity.dominantColors?.length) {
    parts.push(`Dominant colors: ${identity.dominantColors.join(", ")}.`);
  }
  if (identity.smallDetails?.length) {
    parts.push(`Key details to preserve: ${identity.smallDetails.join("; ")}.`);
  }
  if (identity.visualStyle) parts.push(`Visual style of the product: ${identity.visualStyle}.`);
  parts.push("Keep the same texture, shape, details, proportions and visual identity in every shot.");
  return parts.join(" ");
}
