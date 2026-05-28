import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { auth } from "@/auth";
import { FactoryStatusPill } from "@/components/factory/factory-status-pill";
import { StrategyCard } from "@/components/factory/strategy-card";
import { ScenarioCard } from "@/components/factory/scenario-card";
import { FactoryActionsBar } from "@/components/factory/factory-actions-bar";
import { CompletedReels } from "@/components/factory/completed-reels";
import { getFactoryById } from "@/lib/db/factory-queries";
import type {
  FactoryStatus,
  ScenarioStatus,
  WeeklyStrategy,
} from "@/lib/factory/types";

export const dynamic = "force-dynamic";

export default async function FactoryDetailPage(
  props: PageProps<"/factory/[id]">
) {
  const { id } = await props.params;
  const session = await auth();
  const factory = await getFactoryById(id, session!.user.id);
  if (!factory) notFound();

  const strategy =
    (factory.weeklyStrategy ?? null) as WeeklyStrategy | null;

  const scenarios = factory.scenarios;
  const approvedCount = scenarios.filter((s) => s.approved).length;
  const productionStarted = factory.status !== "DRAFT" &&
    factory.status !== "PLANNING" &&
    factory.status !== "AWAITING_APPROVAL" &&
    factory.status !== "FAILED";

  const completedReels = scenarios
    .filter((s) => s.project?.finalVideoUrl)
    .map((s) => ({
      scenarioId: s.id,
      scenarioTitle: s.title,
      day: s.deliveryDay,
      projectId: s.project!.id,
      thumbnailUrl: s.project!.thumbnailUrl,
      deliveredAt: s.deliveredAt,
    }));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/factory"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Все фабрики
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance break-words">
            {factory.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {factory.niche && (
              <>
                <span>{factory.niche}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>
              {factory.videosPerWeek} reels × {factory.reelDuration} сек
            </span>
            <span aria-hidden>·</span>
            <span>{factory.generationMode === "REALISTIC" ? "Realistic" : "Cartoon"}</span>
            <span aria-hidden>·</span>
            <span>Доставка в {factory.deliveryTime} UTC</span>
          </div>
        </div>
        <FactoryStatusPill status={factory.status as FactoryStatus} />
      </header>

      {factory.errorMessage && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
          {factory.errorMessage}
        </div>
      )}

      <PlanningOverlay status={factory.status as FactoryStatus} />

      {strategy && <StrategyCard strategy={strategy} />}

      {scenarios.length > 0 && (
        <>
          <FactoryActionsBar
            factoryId={factory.id}
            approvedCount={approvedCount}
            totalCount={scenarios.length}
            productionStarted={productionStarted}
          />

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={{
                  id: s.id,
                  deliveryDay: s.deliveryDay,
                  conceptType: s.conceptType,
                  title: s.title,
                  hook: s.hook,
                  summary: s.summary,
                  visualStyle: s.visualStyle,
                  brief: s.brief,
                  approved: s.approved,
                  status: s.status as ScenarioStatus,
                  feedback: s.feedback,
                  errorMessage: s.errorMessage,
                  projectId: s.projectId,
                  deliveredAt: s.deliveredAt,
                  project: s.project
                    ? {
                        id: s.project.id,
                        status: s.project.status,
                        finalVideoUrl: s.project.finalVideoUrl,
                        thumbnailUrl: s.project.thumbnailUrl,
                      }
                    : null,
                }}
                durationSeconds={factory.reelDuration}
                mode={factory.generationMode}
                productionStarted={productionStarted}
              />
            ))}
          </section>
        </>
      )}

      <CompletedReels reels={completedReels} />
    </div>
  );
}

function PlanningOverlay({ status }: { status: FactoryStatus }) {
  if (status !== "PLANNING") return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm">
      <Loader2 className="size-4 animate-spin text-foreground/80" />
      <div className="min-w-0">
        <div className="font-medium">GPT-5.5 собирает план недели</div>
        <p className="text-xs text-muted-foreground">
          Обычно 1–3 минуты. Страница обновится автоматически при перезагрузке.
        </p>
      </div>
    </div>
  );
}
