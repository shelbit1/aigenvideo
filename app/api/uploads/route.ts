import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { buildObjectKey, getPresignedUploadUrl } from "@/lib/r2/storage";

const Schema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|png|webp|jpg)$/i, {
      error: "Поддерживаются только JPG, PNG, WEBP",
    }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(15 * 1024 * 1024, { error: "Максимальный размер — 15 МБ" }),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const ext =
    parsed.data.filename.split(".").pop()?.toLowerCase() ??
    parsed.data.contentType.split("/")[1];

  const key = buildObjectKey("uploads", ext, session.user.id);
  const presigned = await getPresignedUploadUrl({
    key,
    contentType: parsed.data.contentType,
  });

  return NextResponse.json(presigned);
}
