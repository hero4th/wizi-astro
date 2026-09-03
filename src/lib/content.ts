/**
 * Post content processing for the admin editor. The editor (Tiptap) authors
 * HTML directly — there's no Markdown step. This module sanitizes that HTML
 * before it's stored (defense in depth: the editor is trusted, but the
 * content is rendered unescaped on the public site via `set:html`) and
 * injects heading ids for the table of contents.
 *
 * Admin-only, and deliberately dependency-free — see below for why.
 *
 * ## Why a hand-rolled sanitizer instead of a library
 *
 * Two attempts at a real sanitizer (`sanitize-html`, then
 * `isomorphic-dompurify`) both crashed in Vercel's deployed Node runtime —
 * not locally, not in `astro check`, only once actually deployed — with
 * `ERR_REQUIRE_ESM` from a transitive dependency two or three levels deep
 * (htmlparser2, then html-encoding-sniffer's `@exodus/bytes`) that ships
 * ESM-only while something upstream still `require()`s it. Both are
 * incompatibilities inside those dependency trees, not something fixable
 * from this project's config (already tried marking things external in
 * vite.ssr — same crash, just relocated).
 *
 * Given the actual threat model — this HTML only ever comes from Tiptap's
 * own well-formed output, authored by the one trusted admin user, never
 * from arbitrary internet input — a small allowlist-based sanitizer here is
 * a reasonable, defensible trade-off, and it has zero dependencies to break
 * in this environment. It is NOT a substitute for a real sanitizer (like
 * DOMPurify) if this endpoint ever accepts untrusted/public HTML input.
 */
import { slugify } from "./slug";

export { extractHeadings, readingTimeFromHtml, type Heading } from "./headings";

const ALLOWED_TAGS = new Set([
  "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "code", "pre",
  "blockquote", "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "span",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  span: new Set(["style"]),
};
const GLOBAL_ATTRS = new Set(["id"]);

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;
const SAFE_FONT_STYLE = /^font-family\s*:\s*[\w\s,'"-]+;?$/i;

/** Remove entire dangerous elements (tag, attributes, and everything inside). */
function stripDangerousElements(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|svg|math)\b[^>]*\/?>/gi, "");
}

/** Sanitize one attribute value for a given (already-allowed) tag+attribute pair. */
function sanitizeAttrValue(tag: string, attr: string, value: string): string | null {
  if (attr === "href" || attr === "src") {
    const v = value.trim();
    return SAFE_URL.test(v) ? v : null;
  }
  if (attr === "style") {
    const v = value.trim();
    return SAFE_FONT_STYLE.test(v) ? v : null;
  }
  if (attr === "target") return value === "_blank" ? "_blank" : null;
  if (attr === "rel") return "noopener noreferrer"; // always overwritten anyway, see below
  return value;
}

/** Strip disallowed tags (unwrapping their content) and filter attributes on the rest. */
function filterTagsAndAttrs(html: string): string {
  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*)?)\/?>/g, (full, closing: string, rawTag: string, attrsStr: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return ""; // drop the tag, keep surrounding text (unwrap)
    if (closing) return `</${tag}>`;

    const allowedForTag = ALLOWED_ATTRS[tag];
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    const kept: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrsStr))) {
      const attr = m[1].toLowerCase();
      const raw = m[3] ?? m[4] ?? m[5] ?? "";
      if (attr.startsWith("on")) continue; // event handlers, always dropped
      const isAllowed = GLOBAL_ATTRS.has(attr) || (allowedForTag && allowedForTag.has(attr));
      if (!isAllowed) continue;
      const value = sanitizeAttrValue(tag, attr, raw);
      if (value === null) continue;
      kept.push(`${attr}="${value.replace(/"/g, "&quot;")}"`);
    }
    // Links always get a safe rel, regardless of what was authored.
    if (tag === "a" && attrsStr.includes("href") && !kept.some((a) => a.startsWith("rel="))) {
      kept.push('rel="noopener noreferrer"');
    }

    const selfClosing = tag === "img" || tag === "br" || tag === "hr";
    return `<${tag}${kept.length ? " " + kept.join(" ") : ""}${selfClosing ? " /" : ""}>`;
  });
}

/** Sanitize editor-authored HTML and inject `id` attributes on h2/h3/h4 for the TOC. */
export function processContentHtml(rawHtml: string): string {
  const clean = filterTagsAndAttrs(stripDangerousElements(rawHtml));

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
