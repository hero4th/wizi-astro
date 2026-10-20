import { getStore } from "@netlify/blobs";

// Admin uploads are stored in Netlify Blobs, not on disk: Netlify Functions
// only have a read-only filesystem (plus an ephemeral /tmp), so anything written
// to disk is lost between requests and redeploys. Blobs persist and are shared
// across every function invocation.
const STORE_NAME = "uploads";

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

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export async function saveUpload(buffer: ArrayBuffer, filename: string): Promise<string> {
  await store().set(filename, buffer);
  return filename;
}

// Resolves a request path segment to a blob key, rejecting any attempt to
// escape the uploads namespace (path traversal).
export async function getUpload(
  segments: string[]
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const name = segments.join("/");
  if (!name || name.includes("..") || name.includes("\0")) return null;

  const data = await store().get(name, { type: "arrayBuffer" });
  if (!data) return null;

  return { data, contentType: contentTypeFor(name) };
}
