/**
 * Базовый HTTP-клиент для Kie AI.
 *
 * Все вызовы AI-моделей идут через единую точку: общая авторизация,
 * таймауты, ретраи и логирование. Конкретные модели (GPT, Flux, Kling,
 * Suno) реализуют тонкие обёртки поверх этого клиента.
 */

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRIES = 2;

export class KieAPIError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "KieAPIError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
}

function getBaseUrl(): string {
  return process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";
}

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) {
    throw new Error(
      "KIE_API_KEY is not set. Add it to .env.local before calling Kie AI."
    );
  }
  return key;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${getBaseUrl().replace(/\/$/, "")}${path}`
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function kieFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    signal,
  } = options;

  const url = buildUrl(path, query);
  const apiKey = getApiKey();

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const composedSignal = signal
      ? abortAny(controller.signal, signal)
      : controller.signal;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: composedSignal,
      });

      clearTimeout(timeout);

      const raw = await response.text();
      let parsed: unknown = raw;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        // keep raw text
      }

      if (!response.ok) {
        // 5xx и 429 → можно ретраить
        if (
          (response.status >= 500 || response.status === 429) &&
          attempt < retries
        ) {
          attempt += 1;
          await sleep(500 * 2 ** (attempt - 1));
          continue;
        }
        throw new KieAPIError(
          `Kie AI ${method} ${path} → ${response.status}`,
          response.status,
          parsed
        );
      }

      return parsed as T;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (
        attempt < retries &&
        (error instanceof Error && error.name === "AbortError")
      ) {
        attempt += 1;
        await sleep(500 * 2 ** (attempt - 1));
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Kie AI request failed");
}

function abortAny(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (a.aborted || b.aborted) controller.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
}
