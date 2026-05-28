import { kieFetch } from "./client";
import type { KieJobStatus } from "./types";

/**
 * Общий async-API Kie AI для всех Market-моделей (Flux, Kling и т.д.).
 *
 * Все асинхронные задачи создаются одним и тем же эндпоинтом:
 *   POST /api/v1/jobs/createTask     → { data: { taskId } }
 *   GET  /api/v1/jobs/recordInfo     → { data: { state, resultJson, failMsg } }
 *
 * Docs: https://docs.kie.ai/market/common/get-task-detail
 */

interface CreateJobResponse {
  code: number;
  msg?: string;
  data?: { taskId?: string };
}

export async function createKieJob(params: {
  model: string;
  input: Record<string, unknown>;
  callBackUrl?: string;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: params.model,
    input: params.input,
  };
  if (params.callBackUrl) body.callBackUrl = params.callBackUrl;

  const data = await kieFetch<CreateJobResponse>("/api/v1/jobs/createTask", {
    method: "POST",
    body,
  });
  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(
      `Kie createTask (${params.model}) failed: code=${data.code} msg=${data.msg ?? ""}`
    );
  }
  return data.data.taskId;
}

interface RecordInfoResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
    state?: "waiting" | "queuing" | "generating" | "success" | "fail";
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
  };
}

export interface KieJobInfo {
  taskId: string;
  status: KieJobStatus;
  resultUrls: string[];
  error?: string;
  raw: unknown;
}

export async function getKieJob(taskId: string): Promise<KieJobInfo> {
  const data = await kieFetch<RecordInfoResponse>("/api/v1/jobs/recordInfo", {
    method: "GET",
    query: { taskId },
  });

  const raw = data.data?.state;
  const status = mapKieState(raw);

  const resultUrls: string[] = [];
  if (status === "succeeded" && data.data?.resultJson) {
    try {
      const parsed = JSON.parse(data.data.resultJson) as {
        resultUrls?: string[];
      };
      if (Array.isArray(parsed.resultUrls)) {
        resultUrls.push(...parsed.resultUrls);
      }
    } catch {
      // оставим пустой массив, дальше код считает это ошибкой
    }
  }

  return {
    taskId,
    status,
    resultUrls,
    error:
      status === "failed"
        ? data.data?.failMsg || data.data?.failCode || "Kie job failed"
        : undefined,
    raw: data,
  };
}

function mapKieState(raw?: string): KieJobStatus {
  switch (raw) {
    case "success":
      return "succeeded";
    case "fail":
      return "failed";
    case "generating":
      return "running";
    case "waiting":
    case "queuing":
      return "queued";
    default:
      return "queued";
  }
}
