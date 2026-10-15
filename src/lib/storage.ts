import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Where uploaded images live on disk. Must be persistent across deploys, so it
// defaults to an `uploads/` folder in the app root (override with UPLOAD_DIR).
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function saveUpload(buffer: ArrayBuffer, filename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(buffer));
  return filename;
}

// Resolves a request path segment to a file inside UPLOAD_DIR, rejecting any
// attempt to escape the directory (path traversal).
export function resolveUpload(segments: string[]): string | null {
  const name = segments.join("/");
  if (!name || name.includes("..") || name.includes("\0")) return null;
  const full = path.resolve(UPLOAD_DIR, name);
  const root = path.resolve(UPLOAD_DIR) + path.sep;
  if (!full.startsWith(root)) return null;
  return existsSync(full) ? full : null;
}

export async function readUpload(fullPath: string): Promise<Buffer> {
  return readFile(fullPath);
}
