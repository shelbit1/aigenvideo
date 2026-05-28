import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;

if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
  if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
    console.warn(
      "[r2] Missing R2_* env vars. R2 storage will fail until they are set."
    );
  }
}

declare global {
  var __r2Client: S3Client | undefined;
}

export const r2Client: S3Client =
  globalThis.__r2Client ??
  new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: accessKeyId ?? "",
      secretAccessKey: secretAccessKey ?? "",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__r2Client = r2Client;
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";
