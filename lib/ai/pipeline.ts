/**
 * High-level AI пайплайн.
 *
 * Фасад над AI-моделями Kie (GPT/Flux/Kling) и R2-хранилищем.
 * Используется из Trigger.dev задач, оркестрация которых живёт в /trigger/*.
 */

import { generateCreativeScript } from "@/lib/kie/gpt";
import { analyzeProductImages } from "@/lib/kie/identity";
import { startFluxImageJob, pollFluxImageJob } from "@/lib/kie/flux";
import { startKlingVideoJob, pollKlingVideoJob } from "@/lib/kie/kling";

export const ai = {
  identity: {
    analyze: analyzeProductImages,
  },
  script: {
    generate: generateCreativeScript,
  },
  image: {
    start: startFluxImageJob,
    poll: pollFluxImageJob,
  },
  video: {
    start: startKlingVideoJob,
    poll: pollKlingVideoJob,
  },
};
