/**
 * FFmpeg-обёртка для финального рендеринга reel.
 *
 * Используется на сервере (Trigger.dev задача).
 * Склеивает несколько 5-секундных Kling-видео в один ролик длительностью
 * totalDurationSeconds. Аудио-дорожка не накладывается — ролики тихие.
 */

import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

/**
 * Резолвим путь к ffmpeg-бинарю в порядке приоритета:
 *
 *  1. `FFMPEG_PATH` из env — продакшен (Trigger.dev ffmpeg() extension).
 *  2. `node_modules/ffmpeg-static/ffmpeg` относительно `process.cwd()` —
 *     локальный dev и Trigger worker (он бандлит код в .trigger/tmp/,
 *     но cwd остаётся корнем проекта).
 *  3. Значение по умолчанию из пакета `ffmpeg-static`.
 *
 * Пункт 2 нужен потому, что `ffmpeg-static` вычисляет путь от `__dirname`,
 * который после bundling указывает в `.trigger/tmp/build-*` — а туда
 * native-бинарь не копируется.
 */
function resolveFfmpegPath(): string | null {
  const candidates: Array<string | null | undefined> = [
    process.env.FFMPEG_PATH,
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    ffmpegStatic as unknown as string | null,
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

const ffmpegPath = resolveFfmpegPath();
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const TMP_ROOT = path.join(os.tmpdir(), "aigenvideo");

async function ensureTmpDir(): Promise<string> {
  await mkdir(TMP_ROOT, { recursive: true });
  return TMP_ROOT;
}

async function downloadToTmp(url: string, suffix: string): Promise<string> {
  const dir = await ensureTmpDir();
  const filePath = path.join(dir, `${randomUUID()}.${suffix}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось скачать ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
  return filePath;
}

/**
 * Целевые параметры финального ролика. 9:16 portrait для TikTok/Reels.
 * Все входные сегменты приводим к этим параметрам ПЕРЕД склейкой —
 * это требование FFmpeg concat filter (он принимает только потоки
 * с идентичными w/h/SAR/fps/pix_fmt, иначе падает с
 * "Failed to inject frame into filter network: Invalid argument").
 */
const TARGET_WIDTH = 720;
const TARGET_HEIGHT = 1280;
const TARGET_FPS = 30;

/**
 * Склеить несколько видео-сегментов в один ролик заданной длительности.
 *
 * Каждый сегмент нормализуется к одинаковым параметрам (scale + pad +
 * setsar + fps + format), затем concat-filter объединяет их в один поток.
 * Перекодируем в libx264 yuv420p — гарантированно совместимо со всеми
 * браузерами и Telegram preview.
 *
 * @returns Buffer с финальным MP4 (без аудио-дорожки).
 */
export async function mergeReel(params: {
  videoUrls: string[];
  totalDurationSeconds: number;
}): Promise<Buffer> {
  if (params.videoUrls.length === 0) {
    throw new Error("mergeReel: список видео пустой");
  }

  const dir = await ensureTmpDir();
  const videoPaths = await Promise.all(
    params.videoUrls.map((url) => downloadToTmp(url, "mp4"))
  );
  const outputPath = path.join(dir, `${randomUUID()}.mp4`);

  const cleanup = async () => {
    await Promise.allSettled([
      ...videoPaths.map((p) => unlink(p)),
      unlink(outputPath),
    ]);
  };

  try {
    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg();
      for (const p of videoPaths) cmd = cmd.input(p);

      // Нормализуем каждый input в единые параметры.
      // scale+pad с force_original_aspect_ratio=decrease — вписываем кадр
      // в 720×1280 без обрезки; пустые поля заливаются чёрным.
      const normalizedLabels: string[] = [];
      const normalizeFilters = videoPaths.map((_, i) => {
        const label = `v${i}`;
        normalizedLabels.push(`[${label}]`);
        return (
          `[${i}:v:0]` +
          `scale=${TARGET_WIDTH}:${TARGET_HEIGHT}:force_original_aspect_ratio=decrease,` +
          `pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,` +
          `setsar=1,` +
          `fps=${TARGET_FPS},` +
          `format=yuv420p` +
          `[${label}]`
        );
      });

      const concatFilter =
        `${normalizedLabels.join("")}` +
        `concat=n=${videoPaths.length}:v=1:a=0[outv]`;

      cmd
        .complexFilter([...normalizeFilters, concatFilter])
        .outputOptions([
          "-map", "[outv]",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "20",
          "-pix_fmt", "yuv420p",
          "-an",
          "-t", String(params.totalDurationSeconds),
          "-movflags", "+faststart",
        ])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    return await readFile(outputPath);
  } finally {
    await cleanup();
  }
}
