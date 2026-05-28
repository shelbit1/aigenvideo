import { z } from "zod";
import { DIMENSION_UNITS } from "./types";

export const VIDEO_DURATIONS = [5, 10, 15] as const;
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export const MAX_PRODUCT_IMAGES = 10;

const dimensionsSchema = z.object({
  length: z.coerce.number().positive({ error: "Длина должна быть > 0" }),
  width: z.coerce.number().positive({ error: "Ширина должна быть > 0" }),
  height: z.coerce.number().positive({ error: "Высота должна быть > 0" }),
  weight: z.coerce.number().positive().optional(),
  unit: z.enum(DIMENSION_UNITS),
});

export const CreateProjectSchema = z
  .object({
    title: z
      .string()
      .min(2, { error: "Название должно содержать минимум 2 символа" })
      .max(120)
      .trim(),
    brief: z
      .string()
      .min(8, { error: "Опишите идею подробнее (минимум 8 символов)" })
      .max(800)
      .trim(),
    /**
     * До 10 URL изображений продукта. Принимается JSON-массив строк
     * (формируется в hidden input на клиенте).
     */
    sourceImages: z
      .string()
      .transform((raw) => {
        if (!raw) return [];
        try {
          const arr = JSON.parse(raw) as unknown;
          if (!Array.isArray(arr)) return [];
          return arr.filter((u): u is string => typeof u === "string" && u.length > 0);
        } catch {
          return [];
        }
      })
      .pipe(
        z
          .array(z.url({ error: "Некорректный URL изображения" }))
          .min(1, { error: "Загрузите хотя бы одно изображение продукта" })
          .max(MAX_PRODUCT_IMAGES, {
            error: `Максимум ${MAX_PRODUCT_IMAGES} изображений`,
          })
      ),
    durationSeconds: z.coerce
      .number()
      .int()
      .refine((v): v is VideoDuration => (VIDEO_DURATIONS as readonly number[]).includes(v), {
        error: "Выберите длительность 5, 10 или 15 секунд",
      }),
    generationMode: z.enum(["REALISTIC", "CARTOON"], {
      error: "Выберите режим генерации",
    }),
    /**
     * Размеры заполняются только если пользователь снял галочку
     * «Это одежда или обувь» (`hasDimensions === "1"`).
     */
    hasDimensions: z.enum(["0", "1"]).default("0"),
    dimensionLength: z.string().optional(),
    dimensionWidth: z.string().optional(),
    dimensionHeight: z.string().optional(),
    dimensionWeight: z.string().optional(),
    dimensionUnit: z.enum(DIMENSION_UNITS).optional(),
  })
  .transform((data, ctx) => {
    if (data.hasDimensions !== "1") {
      return { ...data, dimensions: undefined };
    }
    const parsed = dimensionsSchema.safeParse({
      length: data.dimensionLength,
      width: data.dimensionWidth,
      height: data.dimensionHeight,
      weight: data.dimensionWeight || undefined,
      unit: data.dimensionUnit ?? "cm",
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["dimensions", ...issue.path],
        });
      }
      return z.NEVER;
    }
    return { ...data, dimensions: parsed.data };
  });

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export type CreateProjectFieldError =
  | "title"
  | "brief"
  | "sourceImages"
  | "durationSeconds"
  | "generationMode"
  | "dimensions";

export type CreateProjectState =
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<CreateProjectFieldError, string[]>>;
    }
  | { ok: true; projectId: string }
  | undefined;
