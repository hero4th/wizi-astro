import { purgeCache } from "@netlify/functions";

/**
 * Shared cache tag for every edge-cached blog response. Publishing, editing or
 * deleting a post purges this tag so readers see the change immediately.
 */
export const BLOG_CACHE_TAG = "blog";

/**
 * Cache a dynamic response at Netlify's edge instead of invoking the function
 * (and querying Postgres) on every request.
 *
 * - `durable` shares the cached copy across edge nodes, so a cold node reuses
 *   another node's response instead of invoking the function again.
 * - `stale-while-revalidate` serves the cached copy while it refreshes in the
 *   background, so visitors never wait for a revalidation.
 *
 * - Netlify does not cache function responses by default; the
 *   `Netlify-CDN-Cache-Control` header is what enables it.
 *
 * The default is 24 hours because publishing purges the `blog` tag, so normal
 * edits are visible immediately. The long TTL is what lets the database sleep:
 * without it, every revalidation wakes it up and keeps it billing compute.
 */
export function cacheBlogResponse(
  response: Response | { headers: Headers },
  maxAgeSeconds = 86400,
): void {
  response.headers.set(
    "Netlify-CDN-Cache-Control",
    `public, durable, s-maxage=${maxAgeSeconds}, stale-while-revalidate=86400`,
  );
  response.headers.set("Netlify-Cache-Tag", BLOG_CACHE_TAG);
}

/**
 * Drop every cached blog page after a write. No-op outside a Netlify deploy
 * (e.g. `astro dev`), where there is no site ID to purge against.
 */
export async function purgeBlogCache(): Promise<void> {
  if (!import.meta.env.PROD) return;

  try {
    await purgeCache({ tags: [BLOG_CACHE_TAG] });
  } catch (err) {
    // A failed purge only means stale content for up to `max-age`; never fail
    // the admin request because of it.
    console.error("[cache] No se pudo purgar el caché del blog:", (err as Error).message);
  }
}
