# AigenVideo

AI-платформа для генерации кинематографичных UGC-роликов и продуктовых видео.

Stack: **Next.js 16** · App Router · Server Actions · Tailwind v4 · shadcn-style UI · Framer Motion · Prisma 7 (PG adapter) · Auth.js v5 · Cloudflare R2 · Trigger.dev · Kie AI (GPT-5.5 / Flux Pro / Kling V3 / ElevenLabs) · FFmpeg.

## Структура проекта

```
/app
  /(auth)            — signin/signup (публичные)
  /(dashboard)       — главная, проекты, новый проект
  /api               — auth handler, uploads, ...
/components
  /ui                — базовые компоненты (button, card, ...)
  /layout            — sidebar, top-nav, mobile-nav, page-header, logo
  /dashboard         — project-card, empty-state, stats-card, timeline
  /generation        — image-upload, create-project-form
  /auth              — auth-form
/lib
  /ai                — высокоуровневый AI пайплайн (фасад)
  /kie               — клиент Kie AI (gpt, flux, kling, elevenlabs)
  /r2                — Cloudflare R2 client + storage (presigned/upload/fetch)
  /ffmpeg            — рендер audio + video
  /trigger           — обёртка для запуска Trigger.dev задач из server actions
  /db                — Prisma singleton + queries
  /auth              — Auth.js actions, схемы, пароли
  /projects          — server actions + zod схемы для проектов
  /utils             — cn(), formatRelativeDate, formatBytes
/prisma              — schema.prisma + миграции
/trigger             — Trigger.dev задачи (generate-reel)
/types               — общие TS типы
auth.ts              — NextAuth v5 instance
proxy.ts             — Next.js 16 «proxy» (бывший middleware) — защита роутов
prisma.config.ts     — конфиг Prisma 7 (URL/миграции)
trigger.config.ts    — конфиг Trigger.dev
```

## Старт

```bash
# 1. установить зависимости
npm install

# 2. заполнить .env.local (см. .env.example)
#    !!! заменить YOUR_POSTGRES_HOST на реальный хост Yandex Cloud Postgres

# 3. сгенерировать Prisma Client
npm run db:generate

# 4. накатить схему в БД (для MVP — push, в проде → migrate)
npm run db:push

# 5. запустить dev
npm run dev

# 6. (опционально) запустить Trigger.dev worker
npm run trigger:dev
```

## Маршруты

- `/` — публичный landing
- `/signin`, `/signup` — авторизация (Credentials + JWT)
- `/dashboard` — главная (статистика + последние проекты)
- `/projects` — список всех проектов
- `/projects/new` — создание нового ролика (upload + brief)
- `/projects/[id]` — детальная страница (плеер + таймлайн этапов)

## Архитектура генерации

```
Server Action (createProjectAction)
  ↓ создаёт Project в БД
  ↓ trigger.dev → generate-reel task (Node worker)
       1. SCRIPT     (Kie/GPT-5.5)         → DB.Generation
       2. START_FRAME (Kie/Flux Pro)        → poll → R2 → DB
       3. VIDEO       (Kie/Kling V3)        → poll → R2 → DB
       4. VOICE       (Kie/ElevenLabs V3)   → poll → R2 → DB
       5. RENDER      (FFmpeg merge)        — TODO
  ↓ Project.status = READY, finalVideoUrl, thumbnailUrl
```

## Дизайн

Cinematic dark UI вдохновлён `makeugc.ai`, Linear, Runway, Notion:

- глубокий чёрный фон с лёгкой синей нотой,
- soft borders + большие radii (0.875rem),
- тёплый акцент `--accent: 36 100% 65%` (янтарный),
- крупные whitespace, slow-motion переходы (300–500ms),
- `framer-motion` для появления карточек,
- skeleton с shimmer-эффектом,
- `gradient-radial` glow за hero/empty-state.

## Engineering rules

- Все API ключи строго на сервере (NEVER `NEXT_PUBLIC_KIE_*`).
- Все AI вызовы — через `lib/kie/*` (единая авторизация, ретраи, таймауты).
- Загрузки и генерация → Cloudflare R2 через `lib/r2/storage.ts`.
- Async job tracking → `Generation.externalJobId` + polling в Trigger.dev.
- Server Actions для всех мутаций. Никаких клиентских запросов к Kie/R2.
- Prisma 7 driver adapter (`@prisma/adapter-pg`) — никакого Rust query engine.

## Что дальше (MVP roadmap)

1. ✅ Auth + Dashboard + Upload + Create project
2. ✅ Trigger.dev оркестратор + Kie клиенты + R2
3. ⏳ FFmpeg merge задача (отдельная Trigger.dev task)
4. ⏳ Subscribe-to-status (Trigger.dev realtime) — live progress в UI
5. ⏳ Subtitles (whisper-style) + scene editor
