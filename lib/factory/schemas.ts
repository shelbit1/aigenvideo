import { z } from "zod";
import { DIMENSION_UNITS } from "@/lib/projects/types";
import { VIDEOS_PER_WEEK_OPTIONS } from "./types";

/**
 * Zod-схемы для форм и server actions Content Factory.
 *
 * Источник правды для всех валидаций — сюда же ходит UI и actions.
 */

export const FACTORY_REEL_DURATIONS = [5, 10, 15] as const;
export type FactoryReelDuration = (typeof FACTORY_REEL_DURATIONS)[number];

const dimensionsSchema = z.object({
  length: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  weight: z.coerce.number().positive().optional(),
  unit: z.enum(DIMENSION_UNITS),
});

export const CreateFactorySchema = z
  .object({
    title: z
      .string()
      .min(2, { error: "Минимум 2 символа" })
      .max(120)
      .trim(),
    niche: z.string().max(120).trim().optional().or(z.literal("")),
    description: z
      .string()
      .min(8, { error: "Опишите идею (минимум 8 символов)" })
      .max(1200)
      .trim(),
    targetAudience: z.string().max(300).trim().optional().or(z.literal("")),
    generationMode: z.enum(["REALISTIC", "CARTOON"]),
    reelDuration: z.coerce
      .number()
      .int()
      .refine(
        (v): v is FactoryReelDuration =>
          (FACTORY_REEL_DURATIONS as readonly number[]).includes(v),
        { error: "Выберите 5, 10 или 15 секунд" }
      ),
    videosPerWeek: z.coerce
      .number()
      .int()
      .refine(
        (v) => (VIDEOS_PER_WEEK_OPTIONS as readonly number[]).includes(v),
        { error: "Выберите 3, 5, 7 или 14 видео" }
      ),
    /** Multi-image upload, как в обычном Project (опционально). */
    sourceImages: z
      .string()
      .transform((raw) => {
        if (!raw) return [];
        try {
          const arr = JSON.parse(raw) as unknown;
          if (!Array.isArray(arr)) return [];
          return arr.filter(
            (u): u is string => typeof u === "string" && u.length > 0
          );
        } catch {
          return [];
        }
      })
      .pipe(z.array(z.url()).max(10)),
    /** Время доставки HH:MM (24h). По дефолту 10:00. */
    deliveryTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
        error: "Время в формате HH:MM",
      })
      .default("10:00"),
    deliveryTimezone: z.string().default("UTC"),
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
        ctx.addIssue({ ...issue, path: ["dimensions", ...issue.path] });
      }
      return z.NEVER;
    }
    return { ...data, dimensions: parsed.data };
  });

export type CreateFactoryInput = z.infer<typeof CreateFactorySchema>;

export const RegenerateScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  feedback: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const EditScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  title: z.string().min(2).max(120).trim(),
  hook: z.string().min(2).max(280).trim(),
  summary: z.string().min(2).max(500).trim(),
  brief: z.string().min(8).max(2000).trim(),
});

export type CreateFactoryFieldError =
  | "title"
  | "niche"
  | "description"
  | "targetAudience"
  | "generationMode"
  | "reelDuration"
  | "videosPerWeek"
  | "sourceImages"
  | "deliveryTime"
  | "dimensions";

export type CreateFactoryState =
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<CreateFactoryFieldError, string[]>>;
    }
  | { ok: true; factoryId: string }
  | undefined;
