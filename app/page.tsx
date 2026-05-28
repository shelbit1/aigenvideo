import Link from "next/link";
import { ArrowRight, Film, Sparkles, Wand2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-background">
      <BackgroundLayer />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <Logo href="/" size="md" />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/signin">Войти</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">
              Начать
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10">
        <Hero />
        <Pipeline />
        <Showcase />
        <CTA />
      </main>

      <footer className="relative z-10 mt-24 border-t border-border px-6 sm:px-10 py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} AigenVideo</div>
          <div>Сделано с любовью к кинематографу</div>
        </div>
      </footer>
    </div>
  );
}

function BackgroundLayer() {
  return (
    <>
      <div className="absolute inset-0 -z-10 gradient-radial" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[100vh]"
        style={{
          background:
            "radial-gradient(900px 480px at 50% -10%, hsl(36 100% 60% / 0.15), transparent 60%), radial-gradient(800px 400px at 100% 30%, hsl(220 100% 60% / 0.10), transparent 60%)",
        }}
      />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 sm:pt-24 pb-16 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
        <Sparkles className="size-3 text-[hsl(var(--accent))]" />
        GPT-5.5 · Flux Pro · Kling 3.0
      </div>

      <h1 className="mt-7 max-w-3xl text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
        Кинематографичные AI-ролики
        <br />
        <span className="bg-gradient-to-r from-foreground via-foreground to-[hsl(var(--accent))] bg-clip-text text-transparent">
          из одного изображения
        </span>
      </h1>

      <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
        AigenVideo превращает фото продукта и короткий бриф в полноценный UGC-reel:
        с кинематографичным движением камеры и нарративом. Готово за минуты.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="accent" size="xl">
          <Link href="/signup">
            <Wand2 className="size-4" />
            Создать первый ролик
          </Link>
        </Button>
        <Button asChild variant="ghost" size="xl">
          <Link href="/signin">Войти в аккаунт</Link>
        </Button>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Бесплатный старт · без карты · доступно прямо сейчас
      </p>
    </section>
  );
}

function Pipeline() {
  const steps = [
    {
      icon: ImageIcon,
      title: "Изображение",
      desc: "Загрузите фото продукта или сцены. JPG, PNG, WEBP.",
    },
    {
      icon: Sparkles,
      title: "Бриф",
      desc: "Опишите идею одним предложением. GPT-5.5 развернёт сценарий.",
    },
    {
      icon: Film,
      title: "Кадры",
      desc: "Flux Pro генерирует кинематографичные стартовые кадры.",
    },
    {
      icon: Film,
      title: "Движение",
      desc: "Kling 3.0 оживляет кадры с движением камеры.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
          Один пайплайн. Три AI-модели.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Без монтажа, без таймлайнов. Просто результат.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-border-strong hover:bg-surface-elevated"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-surface-elevated ring-1 ring-border-strong">
                <step.icon className="size-4" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                0{i + 1}
              </span>
            </div>
            <div className="mt-5">
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground">
            Для кого
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            Бренды, маркетологи, креаторы
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-pretty">
            Делайте десятки UGC-вариаций для рекламы, тестируйте креативы быстрее
            конкурентов. От одного продуктового шота — к готовому ролику для Reels,
            TikTok и YouTube Shorts.
          </p>

          <ul className="mt-6 space-y-2 text-sm">
            {[
              "Вертикальный 9:16 формат из коробки",
              "Кинематографичное движение камеры",
              "Сильный нарратив и continuity между сценами",
              "Готовые экспорты в R2 storage",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 inline-block size-1.5 rounded-full bg-[hsl(var(--accent))]" />
                <span className="text-foreground/85">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] rounded-lg border border-border bg-gradient-to-br from-surface to-surface-elevated overflow-hidden"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, hsl(240 6% 12%), hsl(36 100% 8%))"
                      : "linear-gradient(135deg, hsl(240 6% 10%), hsl(220 100% 8%))",
                }}
              />
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(closest-side, transparent 65%, hsl(var(--background)) 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="relative isolate overflow-hidden rounded-2xl border border-border-strong bg-surface-elevated px-8 py-12 text-center">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(600px 240px at 50% 0%, hsl(36 100% 60% / 0.18), transparent 60%)",
          }}
        />
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
          Начните создавать ролики прямо сейчас
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Создайте аккаунт за 30 секунд.
        </p>
        <div className="mt-6">
          <Button asChild variant="accent" size="xl">
            <Link href="/signup">
              <Wand2 className="size-4" />
              Создать аккаунт
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
