"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectStatusPill } from "./project-status-pill";
import { RelativeTime } from "./relative-time";
import type { Project } from "@prisma/client";

interface ProjectCardProps {
  project: Pick<
    Project,
    | "id"
    | "title"
    | "brief"
    | "status"
    | "thumbnailUrl"
    | "finalVideoUrl"
    | "createdAt"
  >;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.32), ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={`/projects/${project.id}`}
        className={cn(
          "group block rounded-xl border border-border bg-card overflow-hidden",
          "transition-all duration-300 hover:border-border-strong hover:bg-surface-elevated",
          "hover:shadow-[0_24px_60px_-30px_hsl(0_0%_0%/_0.8)]"
        )}
      >
        <div className="relative aspect-[9/16] sm:aspect-[4/5] overflow-hidden bg-muted">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-surface to-surface-elevated">
              <Film className="size-10 text-muted-foreground/50" />
            </div>
          )}

          {project.finalVideoUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
              <span className="flex items-center justify-center size-12 rounded-full bg-white/95 text-black">
                <Play className="size-5 fill-current ml-0.5" />
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3">
            <ProjectStatusPill status={project.status} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-medium text-foreground/95 group-hover:text-foreground transition-colors">
            {project.title}
          </h3>
          {project.brief && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
              {project.brief}
            </p>
          )}
          <RelativeTime
            date={project.createdAt}
            className="mt-3 block text-[11px] text-muted-foreground/70"
          />
        </div>
      </Link>
    </motion.div>
  );
}
