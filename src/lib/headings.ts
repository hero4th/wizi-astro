/**
 * Pure HTML utilities with no external dependencies — kept separate from
 * content.ts (which pulls in sanitize-html) so the public blog pages that
 * only need these don't drag that dependency into their bundle. That import
 * previously broke /blog/[slug] in production: sanitize-html's htmlparser2
 * dependency is ESM-only and Vercel's function bundler choked on the
 * require() of it (ERR_REQUIRE_ESM) — a failure that only shows up in the
 * deployed bundle, not in local dev or `astro check`.
 */

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

/** Extract the {depth, slug, text} list out of already-processed HTML (for the TOC). */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const re = /<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    headings.push({
      depth: Number(m[1]),
      slug: m[2],
      text: m[3].replace(/<[^>]+>/g, "").trim(),
    });
  }
  return headings;
}

/** Reading time in minutes from rendered HTML (~200 wpm). */
export function readingTimeFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(words.length / 200));
}
