import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import fs from "node:fs";
import path from "node:path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL не задан. Добавьте его в .env.local перед запуском."
  );
}

if (connectionString.includes("YOUR_POSTGRES_HOST")) {
  throw new Error(
    "DATABASE_URL содержит плейсхолдер 'YOUR_POSTGRES_HOST'. Замените его на реальный хост Postgres в .env.local и перезапустите dev-сервер."
  );
}

declare global {
  var prismaClient: PrismaClient | undefined;
  var pgPool: Pool | undefined;
}

function buildSslOption(): PoolConfig["ssl"] {
  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (!caPath) return undefined;

  const absolutePath = path.isAbsolute(caPath)
    ? caPath
    : path.join(process.cwd(), caPath);

  try {
    const ca = fs.readFileSync(absolutePath).toString();
    return { ca, rejectUnauthorized: true };
  } catch (error) {
    console.warn(
      `[db] Не удалось прочитать CA-сертификат по пути ${absolutePath}. Подключаюсь без проверки цепочки. Ошибка: ${(error as Error).message}`
    );
    return { rejectUnauthorized: false };
  }
}

// Yandex Cloud PgBouncer (port 6432) рубит idle-коннекты по своему таймауту.
// Trigger.dev между шагами делает checkpoint'ы (wait.for >5s), и за это время
// pg.Pool «теряет» коннект. Поэтому держим idleTimeoutMillis маленьким,
// включаем TCP keep-alive и навешиваем pool.on('error') — иначе разрыв
// idle-сокета валит весь процесс.
const pool =
  globalThis.pgPool ??
  (() => {
    const p = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5_000,
      allowExitOnIdle: true,
      ssl: buildSslOption(),
    });
    p.on("error", (err) => {
      console.warn(
        `[pg.Pool] idle client error (ignored): ${(err as Error).message}`
      );
    });
    return p;
  })();

const adapter = new PrismaPg(pool);

export const prisma: PrismaClient =
  globalThis.prismaClient ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma;
  globalThis.pgPool = pool;
}
