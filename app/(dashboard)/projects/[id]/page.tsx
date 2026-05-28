import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Film } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ProjectStatusPill } from "@/components/dashboard/project-status-pill";
import { GenerationTimeline } from "@/components/dashboard/generation-timeline";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { ProjectMeta } from "@/components/dashboard/project-meta";
import { getProjectById } from "@/lib/db/queries";
import type {
  GenerationMode,
  ProductDimensions,
  ProductIdentity,
} from "@/lib/projects/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage(
  props: PageProps<"/projects/[id]">
) {
  const { id } = await props.params;
  const session = await auth();
  const project = await getProjectById(id, session!.user.id);

  if (!project) notFound();

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Все проекты
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance min-w-0 break-words">
            {project.title}
          </h1>
          <ProjectStatusPill status={project.status} />
        </div>
        <p className="text-xs text-muted-foreground mb-8">
          Создан <RelativeTime date={project.createdAt} />
        </p>

        <div className="relative rounded-2xl border border-border bg-card overflow-hidden aspect-[9/16] w-full max-w-xs sm:max-w-sm">
          {project.finalVideoUrl ? (
            <video
              src={project.finalVideoUrl}
              poster={project.thumbnailUrl ?? undefined}
              controls
              playsInline
              className="size-full object-cover"
            />
          ) : project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Film className="size-12" />
            </div>
          )}
        </div>

        {project.brief && (
          <div className="mt-8 max-w-2xl">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Бриф
            </h2>
            <p className="text-sm text-foreground/90 leading-relaxed text-pretty">
              {project.brief}
            </p>
          </div>
        )}

        <div className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Контекст генерации
          </h2>
          <ProjectMeta
            mode={project.generationMode as GenerationMode}
            dimensions={(project.dimensions ?? null) as ProductDimensions | null}
            identity={
              (project.productIdentity ?? null) as ProductIdentity | null
            }
            sourceImages={project.sourceImages ?? []}
          />
        </div>

        {project.finalVideoUrl && (
          <div className="mt-8 flex gap-2">
            <Button asChild variant="accent">
              <a href={`/api/projects/${project.id}/download`}>
                <Download className="size-4" />
                Скачать ролик
              </a>
            </Button>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          Этапы генерации
        </h2>
        <GenerationTimeline generations={project.generations} />
      </aside>
    </div>
  );
}
