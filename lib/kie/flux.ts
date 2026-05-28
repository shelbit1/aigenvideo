import { createKieJob, getKieJob } from "./jobs";
import type { KieJobResult } from "./types";

/**
 * Flux-2 Pro через Kie AI Market.
 *
 * Если задан `imageReferenceUrl` — используется `flux-2/pro-image-to-image`
 * (продуктовое фото пользователя как референс). Иначе — text-to-image.
 *
 * Docs:
 *  - https://docs.kie.ai/market/flux2/pro-text-to-image
 *  - https://docs.kie.ai/market/flux2/pro-image-to-image
 */

interface FluxCreateInput {
  prompt: string;
  aspectRatio?: "9:16" | "16:9" | "1:1" | "3:4" | "4:3" | "3:2" | "2:3";
  resolution?: "1K" | "2K";
  /**
   * До 8 референсных изображений. Например: [productPhoto, previousSceneFrame]
   * — это даёт Flux одновременно «привязку» к продукту и continuity со сценой.
   */
  imageReferenceUrls?: string[];
}

export async function startFluxImageJob(
  input: FluxCreateInput
): Promise<string> {
  const refs = (input.imageReferenceUrls ?? []).filter(Boolean).slice(0, 8);
  const hasReference = refs.length > 0;
  const model = hasReference
    ? "flux-2/pro-image-to-image"
    : "flux-2/pro-text-to-image";

  const apiInput: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio ?? "9:16",
    resolution: input.resolution ?? "1K",
    nsfw_checker: false,
  };
  if (hasReference) {
    apiInput.input_urls = refs;
  }

  return createKieJob({ model, input: apiInput });
}

export async function pollFluxImageJob(
  taskId: string
): Promise<KieJobResult<{ imageUrl: string }>> {
  const info = await getKieJob(taskId);

  if (info.status === "succeeded") {
    const imageUrl = info.resultUrls[0];
    if (!imageUrl) {
      return {
        jobId: taskId,
        status: "failed",
        error: "Flux: пустой resultUrls",
        rawResponse: info.raw,
      };
    }
    return {
      jobId: taskId,
      status: info.status,
      result: { imageUrl },
      rawResponse: info.raw,
    };
  }

  if (info.status === "failed") {
    return {
      jobId: taskId,
      status: info.status,
      error: info.error,
      rawResponse: info.raw,
    };
  }

  return { jobId: taskId, status: info.status, rawResponse: info.raw };
}
