import { kieFetch } from "./client";

/**
 * Низкоуровневый клиент для синхронного эндпоинта Kie /codex/v1/responses
 * (совместимая обёртка над OpenAI Responses API). Поддерживает text-only и
 * vision-input (с URL-ами изображений), а также reasoning effort.
 *
 * Docs: https://docs.kie.ai/market/chat/gpt-5-5
 */

export type ResponsesContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export interface ResponsesInputItem {
  role: "system" | "user" | "assistant" | "developer";
  content: ResponsesContent[];
}

interface ResponsesRequest {
  model: "gpt-5-5";
  stream: false;
  input: ResponsesInputItem[];
  reasoning?: { effort?: "low" | "medium" | "high" | "xhigh" };
}

interface ResponsesOutputMessage {
  type: "message";
  role: "assistant";
  content: Array<{ type: "output_text"; text: string }>;
}

interface ResponsesOutputReasoning {
  type: "reasoning";
}

interface ResponsesResponse {
  output?: Array<ResponsesOutputMessage | ResponsesOutputReasoning>;
  status?: string;
}

export interface CallGptOptions {
  effort?: "low" | "medium" | "high" | "xhigh";
  timeoutMs?: number;
}

export async function callGpt55(
  messages: ResponsesInputItem[],
  options: CallGptOptions = {}
): Promise<string> {
  const body: ResponsesRequest = {
    model: "gpt-5-5",
    stream: false,
    input: messages,
    reasoning: { effort: options.effort ?? "medium" },
  };

  const data = await kieFetch<ResponsesResponse>("/codex/v1/responses", {
    method: "POST",
    body,
    timeoutMs: options.timeoutMs ?? 120_000,
  });

  const message = data.output?.find(
    (item): item is ResponsesOutputMessage => item.type === "message"
  );
  const text = message?.content
    ?.filter((c) => c.type === "output_text")
    .map((c) => c.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("GPT-5.5: пустой ответ");
  }
  return text;
}

/**
 * Иногда модель оборачивает JSON в markdown-блок ```json ... ```.
 * Аккуратно вырезаем содержимое первого JSON-объекта.
 */
export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}
