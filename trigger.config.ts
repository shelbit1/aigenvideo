import { defineConfig } from "@trigger.dev/sdk";
import { ffmpeg, additionalFiles } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_ojwwqzyrlddidhasjgpt",
  runtime: "node-22",
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
    // ffmpeg() — ставит бинарь FFmpeg в образ и выставляет FFMPEG_PATH.
    //   В локальном dev path резолвится из node_modules/ffmpeg-static (см. lib/ffmpeg/render.ts).
    //
    // prismaExtension(legacy) — запускает `prisma generate` на trigger.dev build server.
    //   У нас Prisma 7 + provider="prisma-client-js" + @prisma/adapter-pg.
    //   В legacy режиме extension сам подхватит prisma.config.ts и сгенерирует client.
    extensions: [
      ffmpeg(),
      prismaExtension({
        mode: "legacy",
        configFile: "./prisma.config.ts",
      }),
      // Yandex Cloud CA-сертификат нужен в runtime для pg.Pool SSL.
      // Сам файл лежит в prisma/certs/ и в бандл Trigger.dev по умолчанию не попадает.
      additionalFiles({
        files: ["prisma/certs/yandex-cloud-ca.crt"],
      }),
    ],
  },
});
