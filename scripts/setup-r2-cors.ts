/**
 * Идемпотентная настройка CORS для Cloudflare R2 бакета.
 *
 * Запуск:  npm run r2:setup-cors
 *
 * Использует тот же S3 клиент, что и приложение, и применяет CORS-конфигурацию,
 * разрешающую браузерные PUT-загрузки с локалки и продовых доменов.
 */

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  // Динамический импорт ПОСЛЕ loadEnvConfig — иначе R2-клиент инициализируется
  // с пустыми env переменными (ES-импорты хойстятся).
  const { PutBucketCorsCommand, GetBucketCorsCommand } = await import(
    "@aws-sdk/client-s3"
  );
  const { r2Client, R2_BUCKET } = await import("../lib/r2/client");

  if (!R2_BUCKET) {
    throw new Error("R2_BUCKET_NAME не задан в .env.local");
  }

  // Дополнительные origins можно передавать через R2_CORS_EXTRA_ORIGINS
  // (значения через запятую). Это полезно когда .env.local содержит
  // только localhost-APP_URL, а продовые домены нужно добавить разово.
  const extraOrigins =
    process.env.R2_CORS_EXTRA_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const origins = Array.from(
    new Set([
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      ...(process.env.APP_URL ? [process.env.APP_URL] : []),
      ...extraOrigins,
    ])
  );

  console.log(`[r2-cors] применяю CORS к бакету "${R2_BUCKET}"`);
  console.log(`[r2-cors] разрешённые origins: ${origins.join(", ")}`);

  await r2Client.send(
    new PutBucketCorsCommand({
      Bucket: R2_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );

  const current = await r2Client.send(
    new GetBucketCorsCommand({ Bucket: R2_BUCKET })
  );
  console.log("[r2-cors] ✓ применено. Текущая конфигурация:");
  console.dir(current.CORSRules, { depth: 5 });
}

main().catch((err) => {
  console.error("[r2-cors] ошибка:", err);
  process.exit(1);
});
