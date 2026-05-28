import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

// Используем process.env напрямую вместо env(), чтобы `prisma generate`
// не падал на CI/билд-серверах, где DATABASE_URL может быть не задан.
// Реальное подключение к БД использует переменную из окружения в рантайме
// (см. lib/db/prisma.ts). Для миграций/db push DATABASE_URL обязателен.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
