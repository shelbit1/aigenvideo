import type { Project, Generation, ProjectStatus } from "@prisma/client";

export type ProjectWithGenerations = Project & {
  generations: Generation[];
};

export type { Project, Generation, ProjectStatus };

export const projectStatusLabels: Record<ProjectStatus, string> = {
  DRAFT: "Черновик",
  GENERATING: "Генерация",
  READY: "Готов",
  ERROR: "Ошибка",
};
