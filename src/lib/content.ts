/**
 * Post content processing for the admin editor. The editor (Tiptap) authors
 * HTML directly — there's no Markdown step. This module sanitizes that HTML
 * before it's stored (defense in depth: the editor is trusted, but the
 * content is rendered unescaped on the public site via `set:html`) and
 * injects heading ids for the table of contents.
 *
 * Admin-only: this pulls in isomorphic-dompurify, which the public blog
 * pages must NOT import (see headings.ts for why sanitization utilities
 * that don't need it live separately).
 *
 * Note: sanitize-html was the first choice here, but its htmlparser2
 * dependency is ESM-only while sanitize-html's own code still `require()`s
 * it — an ERR_REQUIRE_ESM crash in Vercel's Node runtime that only shows up
 * in the deployed function, not in local dev or `astro check`. DOMPurify
 * doesn't have that split.
 */
import DOMPurify from "isomorphic-dompurify";
import { slugify } from "./slug";

export { extractHeadings, readingTimeFromHtml, type Heading } from "./headings";

const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "code", "pre",
  "blockquote", "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "span",
];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "width", "height", "id", "style"];

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("rel", "noopener noreferrer");
  }
  // Only allow a font-family declaration through the style attribute (the
  // editor's font picker is the only thing that writes inline styles).
  if (node.hasAttribute("style")) {
    const style = node.getAttribute("style") ?? "";
    const match = /font-family\s*:\s*[^;]+/i.exec(style);
    if (match) node.setAttribute("style", match[0]);
    else node.removeAttribute("style");
  }
});

/** Sanitize editor-authored HTML and inject `id` attributes on h2/h3/h4 for the TOC. */
export function processContentHtml(rawHtml: string): string {
  const clean = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS, ALLOWED_ATTR });

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
