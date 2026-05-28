import { defineConfig } from "@trigger.dev/sdk";
import { ffmpeg } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_ojwwqzyrlddidhasjgpt",
  runtime: "node",
  logLevel: "info",
  maxDuration: 60 * 60, // 1h на самый длинный пайплайн
  dirs: ["./trigger"],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 5_000,
      maxTimeoutInMs: 60_000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    // На production-деплое ставит ffmpeg в образ и выставляет FFMPEG_PATH.
    // В локальном dev path резолвится из node_modules/ffmpeg-static (см. lib/ffmpeg/render.ts).
    extensions: [ffmpeg()],
  },
});
