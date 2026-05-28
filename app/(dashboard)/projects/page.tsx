import Link from "next/link";
import { Wand2 } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/dashboard/project-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { listUserProjects } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Проекты" };

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await listUserProjects(session!.user.id, 100);

  return (
    <div>
      <PageHeader
        title="Проекты"
        description="Все ваши AI-ролики в одном месте."
        actions={
          <Button asChild variant="accent" size="lg">
            <Link href="/projects/new">
              <Wand2 className="size-4" />
              Новый ролик
            </Link>
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
