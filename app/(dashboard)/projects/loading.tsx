import { Skeleton } from "@/components/ui/skeleton";
import { ProjectGridSkeleton } from "@/components/dashboard/project-card-skeleton";

export default function ProjectsLoading() {
  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>
      <ProjectGridSkeleton count={12} />
    </div>
  );
}
