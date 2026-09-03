/**
 * Post content processing for the admin editor. The editor (Tiptap) authors
 * HTML directly — there's no Markdown step. This module sanitizes that HTML
 * before it's stored (defense in depth: the editor is trusted, but the
 * content is rendered unescaped on the public site via `set:html`) and
 * injects heading ids for the table of contents.
 *
 * Admin-only: this pulls in sanitize-html, which the public blog pages must
 * NOT import (see headings.ts for why).
 */
import sanitizeHtml from "sanitize-html";
import { slugify } from "./slug";

export { extractHeadings, readingTimeFromHtml, type Heading } from "./headings";

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "code", "pre",
  "blockquote", "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "span",
];

/** Sanitize editor-authored HTML and inject `id` attributes on h2/h3/h4 for the TOC. */
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
