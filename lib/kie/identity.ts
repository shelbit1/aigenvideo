import { callGpt55, extractJsonObject } from "./responses";
import type { ProductIdentity } from "@/lib/projects/types";
import type { GenerationMode, ProductDimensions } from "@/lib/projects/types";

/**
 * Product Identity Analyzer.
 *
 * Один раз на проект GPT-5.5 (vision) изучает все фото продукта и формирует
 * Product Identity Object — глобальный «отпечаток» продукта. Этот объект
 * затем подмешивается в каждый scene prompt, чтобы Flux/Kling не «теряли»
 * фактуру/форму/цвет/детали между сценами.
 *
 * См. context2.md → FEATURE 3, PRODUCT IDENTITY OBJECT.
 */

const PRODUCT_IDENTITY_SYSTEM = `Ты — старший AI Product Director. Твоя задача: проанализировать набор изображений продукта (front/back/side/detail/lifestyle и т.п.) и собрать единый Product Identity Object — глобальную память продукта.

Это описание потом используется как «отпечаток» продукта в каждом кадре генерируемого ролика. Если ты упустишь деталь — она потеряется во всём ролике. Будь конкретен и не выдумывай детали, которых нет на фото.

ВЫХОДНОЙ ФОРМАТ — строго JSON-объект без markdown, без комментариев, без пояснений:
{
  "productType": string,
  "material": string,
  "shape": string,
  "texture": string,
  "dominantColors": string[],
  "smallDetails": string[],
  "surfaceFinish": string,
  "visualStyle": string
}

ПРАВИЛА ПОЛЕЙ:
- "productType" — название продукта максимально точно (например, "white linen oversized shirt", "matte black mechanical watch", "ceramic ribbed mug").
- "material" — основной материал и видимые вторичные ("linen with matte plastic buttons", "stainless steel and sapphire glass").
- "shape" — форма / силуэт ("oversized boxy fit", "round 40mm case", "cylindrical body with wide base").
- "texture" — фактура поверхности ("soft woven fabric, visible weave", "brushed metal with subtle grain").
- "dominantColors" — 1–4 цвета, как реально выглядят на фото ("warm white", "matte black", "champagne gold").
- "smallDetails" — мелкие узнаваемые детали, которые ОБЯЗАНЫ остаться во всех сценах ("white tag on left chest", "domed sapphire crystal", "embossed brand letter").
- "surfaceFinish" — глянец / матовый / сатин / тканое и т.п.
- "visualStyle" — короткое определение визуального характера ("minimal luxury", "casual UGC streetwear", "premium e-commerce", "playful kids product").

Все значения — на английском (это улучшает downstream Flux/Kling). Длина одного поля ≤ 120 символов.`;

interface AnalyzeProductImagesInput {
  imageUrls: string[];
  brief?: string;
  mode?: GenerationMode;
  dimensions?: ProductDimensions;
}

export async function analyzeProductImages(
  input: AnalyzeProductImagesInput
): Promise<ProductIdentity> {
  if (input.imageUrls.length === 0) {
    throw new Error("analyzeProductImages: нет изображений для анализа");
  }

  const userText = JSON.stringify({
    brief: input.brief ?? null,
    mode: input.mode ?? null,
    dimensions: input.dimensions ?? null,
    imageCount: input.imageUrls.length,
  });

  const raw = await callGpt55(
    [
      {
        role: "system",
        content: [{ type: "input_text", text: PRODUCT_IDENTITY_SYSTEM }],
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: userText },
          ...input.imageUrls.map(
            (url) => ({ type: "input_image", image_url: url }) as const
          ),
        ],
      },
    ],
    { effort: "medium", timeoutMs: 120_000 }
  );

  const json = extractJsonObject(raw);
  let parsed: Partial<ProductIdentity>;
  try {
    parsed = JSON.parse(json) as Partial<ProductIdentity>;
  } catch (error) {
    throw new Error(
      `Не удалось распарсить Product Identity JSON: ${(error as Error).message}\n---\n${raw}`
    );
  }

  return normalizeIdentity(parsed);
}

function normalizeIdentity(raw: Partial<ProductIdentity>): ProductIdentity {
  return {
    productType: (raw.productType ?? "").trim(),
    material: (raw.material ?? "").trim(),
    shape: (raw.shape ?? "").trim(),
    texture: (raw.texture ?? "").trim(),
    dominantColors: toStringArray(raw.dominantColors),
    smallDetails: toStringArray(raw.smallDetails),
    surfaceFinish: (raw.surfaceFinish ?? "").trim(),
    visualStyle: (raw.visualStyle ?? "").trim(),
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
}
