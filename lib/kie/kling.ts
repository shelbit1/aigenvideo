import { createKieJob, getKieJob } from "./jobs";
import type { KieJobResult } from "./types";

/**
 * Kling 3.0 image-to-video через Kie AI Market.
 *
 * Использует unified async API:
 *   POST /api/v1/jobs/createTask  с model = "kling-3.0/video"
 *   GET  /api/v1/jobs/recordInfo
 *
 * Docs: https://docs.kie.ai/market/kling/kling-3-0
 */

interface KlingCreateInput {
  imageUrl: string;
  prompt: string;
  cameraMotion?: string;
  durationSeconds?: 3 | 5 | 10 | 15;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  mode?: "std" | "pro" | "4K";
  sound?: boolean;
}

export async function startKlingVideoJob(
  input: KlingCreateInput
): Promise<string> {
  const promptWithCamera = input.cameraMotion
    ? `${input.prompt}. Camera motion: ${input.cameraMotion}.`
    : input.prompt;

  return createKieJob({
    model: "kling-3.0/video",
    input: {
      prompt: promptWithCamera,
      image_urls: [input.imageUrl],
      mode: input.mode ?? "std",
      duration: String(input.durationSeconds ?? 5),
      aspect_ratio: input.aspectRatio ?? "9:16",
      sound: input.sound ?? false,
      multi_shots: false,
    },
  });
}

export async function pollKlingVideoJob(
  taskId: string
): Promise<KieJobResult<{ videoUrl: string }>> {
  const info = await getKieJob(taskId);

  if (info.status === "succeeded") {
    const videoUrl = info.resultUrls[0];
    if (!videoUrl) {
      return {
        jobId: taskId,
        status: "failed",
        error: "Kling: пустой resultUrls",
        rawResponse: info.raw,
      };
    }
    return {
      jobId: taskId,
      status: info.status,
      result: { videoUrl },
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
