import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@prisma/client";
import { projectStatusLabels } from "@/types/project";

interface ProjectStatusPillProps {
  status: ProjectStatus;
}

export function ProjectStatusPill({ status }: ProjectStatusPillProps) {
  const variant = ((): Parameters<typeof Badge>[0]["variant"] => {
    switch (status) {
      case "READY":
        return "success";
      case "GENERATING":
        return "accent";
      case "ERROR":
        return "destructive";
      case "DRAFT":
      default:
        return "muted";
    }
  })();

  return (
    <Badge variant={variant} className="font-medium">
      {status === "GENERATING" && (
        <Loader2 className="size-3 animate-spin" />
      )}
      {projectStatusLabels[status]}
    </Badge>
  );
}
