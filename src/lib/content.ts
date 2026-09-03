/**
 * Post content processing. The admin editor (Tiptap) authors HTML directly —
 * there's no Markdown step anymore. This module sanitizes that HTML before
 * it's stored (defense in depth: the editor is trusted, but the content is
 * rendered unescaped on the public site via `set:html`) and injects heading
 * ids for the table of contents.
 */
import sanitizeHtml from "sanitize-html";

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
    .replace(/-+/g, "-");
}

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "code", "pre",
  "blockquote", "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "span",
];

/** Sanitize editor-authored HTML and inject `id` attributes on h2/h3 for the TOC. */
export function processContentHtml(rawHtml: string): string {
  const clean = sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      span: ["style"],
      "*": ["id"],
    },
    allowedStyles: {
      span: { "font-family": [/^[\w\s,'"-]+$/] },
    },
    // Links to other sites open safely; internal links are untouched.
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, false),
    },
  });

  const used = new Set<string>();
  return clean.replace(/<(h[234])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (full, tag: string, attrs = "", inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return full;
    let slug = slugify(text) || "seccion";
    let n = 2;
    while (used.has(slug)) slug = `${slug}-${n++}`;
    used.add(slug);
    const cleanedAttrs = (attrs || "").replace(/\s*id="[^"]*"/i, "");
    return `<${tag}${cleanedAttrs} id="${slug}">${inner}</${tag}>`;
  });
}

/** Extract the {depth, slug, text} list back out of already-processed HTML (for the TOC). */
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
