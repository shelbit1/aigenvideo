import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * Скачивание готового ролика.
 *
 * Прокси через наш сервер с заголовком Content-Disposition: attachment,
 * чтобы браузер реально сохранил MP4, а не открывал его в новой вкладке
 * (cross-origin R2 игнорирует HTML-атрибут `download`).
 *
 * Используем streaming (Response.body) — память сервера не нагружается
 * даже на больших роликах.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, finalVideoUrl: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!project.finalVideoUrl) {
    return NextResponse.json(
      { error: "Видео ещё не готово" },
      { status: 409 }
    );
  }

  const upstream = await fetch(project.finalVideoUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Не удалось получить файл из хранилища" },
      { status: 502 }
    );
  }

  // Имя файла: «Название проекта.mp4», очищенное от спецсимволов.
  // RFC 5987 filename* для UTF-8 + ASCII-fallback filename для старых
  // браузеров.
  const safeAscii = project.title
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, 80)
    .trim() || "reel";
  const utf8 = encodeURIComponent(`${project.title}.mp4`);

  return new Response(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "video/mp4",
      "Content-Length":
        upstream.headers.get("content-length") ?? "",
      "Content-Disposition": `attachment; filename="${safeAscii}.mp4"; filename*=UTF-8''${utf8}`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
