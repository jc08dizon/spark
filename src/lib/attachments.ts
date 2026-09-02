import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

// Stored outside `public/` so files are never reachable by URL guessing —
// every read goes through the access-checked route handler instead. Never
// join user-supplied path segments onto this; storagePath is always a
// server-generated name (see save()).
export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 5;

// Allowlist covers screenshots, logs, and common office docs an IT ticket
// would reasonably include. Deliberately no executables/scripts.
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function validateAttachmentFile(file: File): string | null {
  if (file.size === 0) return `${file.name} is empty`;
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} exceeds the 10MB limit`;
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `${file.name} has an unsupported file type`;
  }
  return null;
}

export function validateAttachmentFiles(files: File[]): string | null {
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `Attach at most ${MAX_FILES_PER_UPLOAD} files at a time`;
  }
  for (const file of files) {
    const error = validateAttachmentFile(file);
    if (error) return error;
  }
  return null;
}

export async function saveAttachmentFile(file: File) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const storageName = `${randomUUID()}${path.extname(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, storageName), buffer);
  return storageName;
}

export async function deleteAttachmentFile(storagePath: string) {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, storagePath));
  } catch (error) {
    // Already gone on disk — the DB row is still the source of truth we're
    // removing, so don't fail the request over a missing file.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function resolveAttachmentPath(storagePath: string) {
  return path.join(UPLOAD_DIR, storagePath);
}
