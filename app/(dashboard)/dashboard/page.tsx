import Link from "next/link";
import { Film, Sparkles, Wand2, Zap } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/dashboard/project-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TelegramConnectBanner } from "@/components/settings/telegram-connect-banner";
import { prisma } from "@/lib/db/prisma";
import { listUserProjects, getUserProjectStats } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [projects, stats, user] = await Promise.all([
    listUserProjects(userId, 8),
    getUserProjectStats(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { telegramConnected: true },
    }),
  ]);

  const greeting = session!.user.name?.split(" ")[0] ?? "Привет";

  return (
    <div>
      <PageHeader
        title={`${greeting}, давайте создавать.`}
        description="Один продукт, одна идея, один клик — и AigenVideo превращает это в кинематографичный ролик."
        actions={
          <Button asChild variant="accent" size="lg">
            <Link href="/projects/new">
              <Wand2 className="size-4" />
              Новый ролик
            </Link>
          </Button>
        }
      />

      {!user?.telegramConnected && <TelegramConnectBanner />}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatsCard
          label="Всего проектов"
          value={stats.total}
          hint={stats.total === 0 ? "Создайте первый" : "За всё время"}
          icon={<Film className="size-4" />}
        />
        <StatsCard
          label="Готово"
          value={stats.ready}
          hint="Можно публиковать"
          icon={<Sparkles className="size-4" />}
        />
        <StatsCard
          label="В работе"
          value={stats.generating}
          hint="AI генерирует прямо сейчас"
          icon={<Zap className="size-4" />}
        />
        <StatsCard
          label="Черновики"
          value={stats.draft}
          hint="Ждут запуска"
          icon={<Wand2 className="size-4" />}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium tracking-tight">
            Последние проекты
          </h2>
          {projects.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">Все проекты</Link>
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
