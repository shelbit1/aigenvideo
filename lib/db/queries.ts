import "server-only";
import { prisma } from "./prisma";

export async function listUserProjects(userId: string, limit = 24) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      brief: true,
      status: true,
      thumbnailUrl: true,
      finalVideoUrl: true,
      sourceImageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserProjectStats(userId: string) {
  const [total, ready, generating, draft] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.project.count({ where: { userId, status: "READY" } }),
    prisma.project.count({ where: { userId, status: "GENERATING" } }),
    prisma.project.count({ where: { userId, status: "DRAFT" } }),
  ]);

  return { total, ready, generating, draft };
}

export async function getProjectById(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      generations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
