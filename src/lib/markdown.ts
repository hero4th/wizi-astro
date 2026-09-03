/**
 * Markdown → HTML rendering for admin-authored posts, plus the heading-id
 * injection the table of contents relies on. Rendered once when a post is
 * saved (see src/pages/api/admin/posts.ts); the result is cached in
 * posts.html so page views never re-parse Markdown.
 */
import { marked } from "marked";

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Render Markdown to HTML and inject `id` attributes on h2/h3 for the TOC. */
export function renderMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const used = new Set<string>();

  return rawHtml.replace(/<(h[23])>([\s\S]*?)<\/\1>/gi, (full, tag: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return full;
    let slug = slugify(text) || "seccion";
    let n = 2;
    while (used.has(slug)) slug = `${slug}-${n++}`;
    used.add(slug);
    return `<${tag} id="${slug}">${inner}</${tag}>`;
  });
}

/** Extract the {depth, slug, text} list back out of already-rendered HTML (for the TOC). */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const re = /<h([23])\s+id="([^"]+)">([\s\S]*?)<\/h\1>/gi;
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
