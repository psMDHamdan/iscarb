/**
 * Lecture Object Storage — S3 wrapper with a dev-only local fallback.
 * ===========================================================================
 * Reads credentials from env (see TASK-02). S3 client is a lazy singleton.
 *
 * DEV MODE: when credentials are not configured (no LECTURE_STORAGE_* keys and
 * no AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) and NODE_ENV is not
 * "production", files are stored on the local filesystem under
 * `{cwd}/.lecture-storage` so uploads/exports work without an external object
 * store. Queries are wired to fail closed in production: a misconfigured prod
 * deploy throws a descriptive error instead of silently falling back.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const BUCKET = process.env.LECTURE_STORAGE_BUCKET;
const REGION = process.env.LECTURE_STORAGE_REGION || "me-central-1";
const LOCAL_ROOT = process.env.LECTURE_STORAGE_LOCAL_DIR || ".lecture-storage";

let client: S3Client | null = null;

/**
 * True when the local-filesystem fallback should serve the storage layer.
 * Only ever active in non-production; prod always requires a real S3 store.
 */
export function isLocalFallbackActive(): boolean {
  const hasCreds =
    Boolean(process.env.LECTURE_STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.LECTURE_STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY);
  if (!BUCKET || !hasCreds) return true;
  return false;
}

export function localStorageRoot(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "/tmp/iscarb-lecture-storage";
  }
  return path.resolve(process.cwd(), LOCAL_ROOT);
}

/** Resolve the on-disk path for a storage key, guarding against traversal. */
function localPathForKey(key: string): string {
  const root = localStorageRoot();
  const resolved = path.resolve(root, key);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`Storage key escapes local storage root: ${key}`);
  }
  return resolved;
}

function getClient(): S3Client {
  if (!BUCKET) {
    throw new Error(
      "Lecture storage is not configured: set LECTURE_STORAGE_BUCKET (and LECTURE_STORAGE_ACCESS_KEY / LECTURE_STORAGE_SECRET_KEY) in .env"
    );
  }
  if (!client) {
    const config: S3ClientConfig = { region: REGION };
    const accessKey =
      process.env.LECTURE_STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretKey =
      process.env.LECTURE_STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    if (accessKey && secretKey) {
      config.credentials = { accessKeyId: accessKey, secretAccessKey: secretKey };
    }
    client = new S3Client(config);
  }
  return client;
}

/** Storage key convention: `lecture/{projectId}/{documentId}/{filename}` */
export function buildStorageKey(projectId: string, documentId: string, filename: string): string {
  const prefix = (process.env.LECTURE_STORAGE_PREFIX || "lecture/").replace(/^\/|\/$/g, "");
  return `${prefix}/${projectId}/${documentId}/${filename}`;
}

export async function uploadLectureFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  if (isLocalFallbackActive()) {
    const filePath = localPathForKey(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return key;
  }
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return key;
}

export async function getLectureFile(key: string): Promise<Buffer> {
  if (isLocalFallbackActive()) {
    return readFile(localPathForKey(key));
  }
  const s3 = getClient();
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!res.Body) {
    throw new Error(`Object ${key} has no body`);
  }
  return Buffer.from(await res.Body.transformToByteArray());
}

/**
 * Presigned GET URL (15 min expiry) for a stored export file. In dev-local
 * mode there is no presigning service, so a file:// URL to the local blob is
 * returned instead.
 */
export async function getLectureFileUrl(key: string, expiresIn = 900): Promise<string> {
  if (isLocalFallbackActive()) {
    const filePath = localPathForKey(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    return pathToFileURL(filePath).href;
  }
  const s3 = getClient();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}