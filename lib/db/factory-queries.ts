import { prisma } from "@/lib/db/prisma";

/**
 * Шорткаты выборок для Content Factory.
 *
 * Хранятся отдельно от обычного queries.ts, чтобы файл не разрастался.
 */

export async function listUserFactories(userId: string) {
  return prisma.factoryProject.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { scenarios: true } },
    },
  });
}

export async function getFactoryById(factoryId: string, userId: string) {
  return prisma.factoryProject.findFirst({
    where: { id: factoryId, userId },
    include: {
      scenarios: {
        orderBy: { deliveryDay: "asc" },
        include: {
          project: {
            select: {
              id: true,
              status: true,
              finalVideoUrl: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  });
}
