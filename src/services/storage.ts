import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private file storage for medical documents.
 *
 * Files live OUTSIDE `public/` and are only reachable through an authorised API
 * route. Storage keys are random UUIDs — the patient-supplied filename is kept
 * as metadata only and never touches the filesystem path. To move to object
 * storage (S3, GCS) implement the same three functions against that SDK.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_TYPES = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;
export type AllowedMime = keyof typeof ALLOWED_TYPES;

const KEY_PATTERN = /^[0-9a-f-]{36}\.(pdf|png|jpg|webp)$/;

function root() {
  return path.resolve(process.env.UPLOAD_DIR ?? ".data/uploads");
}

function resolveKey(key: string): string {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid storage key.");
  return path.join(root(), key);
}

/** Detects the real file type from its leading bytes; the client-declared type is never trusted. */
export function sniffMimeType(bytes: Uint8Array): AllowedMime | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp"; // RIFF....WEBP
  return null;
}

/** Strips any path components and control characters from a user-supplied filename. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const forbidden = '<>:"|?*';
  const cleaned = [...base]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 0x1f && code !== 0x7f && !forbidden.includes(ch);
    })
    .join("")
    .trim();
  return (cleaned || "document").slice(0, 120);
}

export async function saveFile(bytes: Uint8Array, mime: AllowedMime): Promise<string> {
  const key = `${randomUUID()}.${ALLOWED_TYPES[mime]}`;
  await mkdir(root(), { recursive: true });
  await writeFile(resolveKey(key), bytes, { flag: "wx" });
  return key;
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(resolveKey(key));
}

export async function deleteStoredFile(key: string): Promise<void> {
  await unlink(resolveKey(key)).catch(() => undefined);
}
