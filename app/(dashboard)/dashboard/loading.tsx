import { Skeleton } from "@/components/ui/skeleton";
import { ProjectGridSkeleton } from "@/components/dashboard/project-card-skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="max-w-xl">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-4 w-96" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-5 w-44 mb-5" />
      <ProjectGridSkeleton count={8} />
    </div>
  );
}
