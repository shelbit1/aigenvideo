import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { R2_BUCKET, R2_PUBLIC_URL, r2Client } from "./client";

const DEFAULT_PRESIGN_EXPIRES = 60 * 15; // 15 минут

export type R2Folder =
  | "uploads"
  | "frames"
  | "videos"
  | "renders"
  | "thumbnails";

export function buildObjectKey(folder: R2Folder, extension: string, prefix?: string): string {
  const ext = extension.startsWith(".") ? extension.slice(1) : extension;
  const id = randomUUID();
  const safePrefix = prefix ? `${prefix.replace(/[^a-zA-Z0-9_-]/g, "")}/` : "";
  return `${folder}/${safePrefix}${id}.${ext}`;
}

export function publicUrl(key: string): string {
  if (!R2_PUBLIC_URL) return "";
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

export async function uploadBuffer(params: {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType?: string;
  cacheControl?: string;
}): Promise<{ key: string; url: string }> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: params.key,
      Body: params.body as Buffer,
      ContentType: params.contentType,
      CacheControl: params.cacheControl ?? "public, max-age=31536000, immutable",
    })
  );
  return { key: params.key, url: publicUrl(params.key) };
}

export async function getPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ url: string; key: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(r2Client, command, {
    expiresIn: params.expiresInSeconds ?? DEFAULT_PRESIGN_EXPIRES,
  });
  return { url, key: params.key, publicUrl: publicUrl(params.key) };
}

export async function getPresignedDownloadUrl(params: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
  });
  return getSignedUrl(r2Client, command, {
    expiresIn: params.expiresInSeconds ?? DEFAULT_PRESIGN_EXPIRES,
  });
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
  );
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function fetchAndUpload(params: {
  sourceUrl: string;
  key: string;
  contentType?: string;
}): Promise<{ key: string; url: string; bytes: number }> {
  const response = await fetch(params.sourceUrl);
  if (!response.ok) {
    throw new Error(
      `Не удалось скачать файл из ${params.sourceUrl}: ${response.status} ${response.statusText}`
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  const body = Buffer.from(arrayBuffer);
  const contentType =
    params.contentType ?? response.headers.get("content-type") ?? "application/octet-stream";

  const result = await uploadBuffer({
    key: params.key,
    body,
    contentType,
  });

  return { ...result, bytes: body.byteLength };
}
