/**
 * WordPress content-processing helpers.
 * ---------------------------------------------------------------------------
 * The blog no longer fetches from WordPress at build time (see
 * src/content.config.ts — posts are local Markdown files now). This module
 * keeps the pure HTML/text helpers that both the one-time WXR importer
 * (scripts/import-wordpress.mjs) and the blog pages still need: cleaning up
 * the theme-injected markup WordPress used to embed in each post's `content`,
 * and picking/describing a post's primary category.
 *
 * The WordPress content editor injected a `pas-post-title-wrap` header block
 * (nav + <h1> + author/date meta) into every post's rendered `content`. Since
 * the Astro templates render their own header, the importer strips that block
 * and keeps only the real article body (Gutenberg `wp-block-*` markup).
 */

export interface BlogCategory {
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  uuml: "ü",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
};

/** Decode the small set of HTML entities WordPress emits in titles/text. */
export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITIES[name] ?? m);
}

/** Remove a balanced `<div class="…name…">…</div>` (and everything inside). */
export function removeBalancedDiv(html: string, className: string): string {
  const openRe = new RegExp(`<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "i");
  let result = html;

  // A post could contain the block more than once (header + footer nav).
  for (let guard = 0; guard < 5; guard++) {
    const match = openRe.exec(result);
    if (!match) break;

    const start = match.index;
    let depth = 0;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = start;

    let m: RegExpExecArray | null;
    let end = -1;
    while ((m = tagRe.exec(result))) {
      if (m[0].startsWith("</")) {
        depth--;
        if (depth === 0) {
          end = m.index + m[0].length;
          break;
        }
      } else {
        depth++;
      }
    }
    if (end === -1) break; // unbalanced — bail out rather than corrupt the html
    result = result.slice(0, start) + result.slice(end);
  }

  return result;
}

/** Filename of an image URL without extension or WordPress size/scaled suffix. */
export function imageBaseName(url: string): string {
  const file = url.split("/").pop()?.split("?")[0] ?? "";
  return file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-\d+x\d+$/i, "")
    .replace(/-scaled$/i, "")
    .toLowerCase();
}

/**
 * Remove the featured image from the article body. WordPress often embeds the
 * same image (as a size variant, e.g. `foo-1024x769.webp`) at the top of the
 * content; since the Astro layout already shows the featured image in the
 * header, this drops it here to avoid a visible duplicate.
 */
export function removeFeaturedImageFromContent(html: string, featuredUrl: string | null): string {
  if (!featuredUrl) return html;
  const base = imageBaseName(featuredUrl);
  if (!base) return html;

  let out = html.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (fig) => {
    const m = /<img[^>]+src="([^"]+)"/i.exec(fig);
    return m && imageBaseName(m[1]) === base ? "" : fig;
  });
  out = out.replace(/<img\b[^>]+src="([^"]+)"[^>]*>/gi, (img, src: string) =>
    imageBaseName(src) === base ? "" : img
  );
  return out;
}

/** Strip the theme's injected header/nav/meta so only the article body remains. */
export function stripInjectedChrome(html: string): string {
  let out = html;
  out = removeBalancedDiv(out, "pas-post-title-wrap");
  out = removeBalancedDiv(out, "pa-post-navigation");
  out = removeBalancedDiv(out, "pa-meta-global");
  // Drop leftover <style> blocks that styled the injected chrome.
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (block) =>
    /pa-post-navigation|pa-nav-link|pas-post-title/.test(block) ? "" : block
  );
  // A stray injected <h1> (post title) sometimes survives outside the wrap.
  out = out.replace(/<h1\b[^>]*class="[^"]*(?:pas-post-title|entry-title)[^"]*"[^>]*>[\s\S]*?<\/h1>/gi, "");
  return out.trim();
}

/** Build a URL-safe slug from text (accent-insensitive). */
export function slugify(text: string): string {
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

/** First real paragraph → clean, truncated meta description (~155 chars). */
export function buildDescription(html: string, fallback: string): string {
  const paragraphs = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
  for (const p of paragraphs) {
    const text = decodeEntities(p.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (text.length < 40) continue;
    if (text.length <= 160) return text;
    const cut = text.slice(0, 157);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 120 ? lastSpace : 157).trim()}…`;
  }
  return fallback;
}

/** Reading time in minutes from the visible text (≈200 wpm). */
export function readingTime(html: string): number {
  const words = decodeEntities(html.replace(/<[^>]+>/g, " ")).trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(words.length / 200));
}

// ---------------------------------------------------------------------------
// Category handling
// ---------------------------------------------------------------------------

/**
 * Priority order used to pick a post's single "primary" category (the one the
 * card/breadcrumb shows). Exam categories win over university tags; the WP
 * "Otros" bucket (slug `uncategorised`) is always last resort.
 */
export const CATEGORY_PRIORITY = [
  "toefl",
  "sat",
  "gre",
  "gmat",
  "paa-examen-de-admision-udg",
  "exani-ii",
  "exani-i",
  "exani-iii",
  "comipems",
  "ediems",
  "unam",
  "ipn",
  "uam",
  "udg",
  "buap",
  "prepa-udg",
  "kp",
  "cursos",
];

export function pickPrimaryCategory(categories: BlogCategory[]): BlogCategory {
  if (categories.length === 0) {
    return { name: "General", slug: "general" };
  }
  const ranked = [...categories].sort((a, b) => {
    const ra = CATEGORY_PRIORITY.indexOf(a.slug);
    const rb = CATEGORY_PRIORITY.indexOf(b.slug);
    const na = ra === -1 ? (a.slug === "uncategorised" ? 999 : 500) : ra;
    const nb = rb === -1 ? (b.slug === "uncategorised" ? 999 : 500) : rb;
    return na - nb;
  });
  return ranked[0];
}

/** Curated descriptions for the category landing pages; generic fallback otherwise. */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  toefl: "Estrategias, recursos y guías para dominar el TOEFL iBT.",
  sat: "Todo sobre el Digital SAT: formato, secciones y preparación.",
  gre: "Preparación verbal, cuantitativa y de redacción para el GRE.",
  gmat: "GMAT Focus Edition: estrategia y preparación para tu MBA.",
  "paa-examen-de-admision-udg": "La Prueba de Aptitud Académica del College Board y el examen de admisión de la UDG.",
  "exani-ii": "Guías y simuladores para el EXANI-II del Ceneval.",
  "exani-i": "Preparación y simuladores para el EXANI-I del Ceneval.",
  "exani-iii": "Preparación y simuladores para el EXANI-III del Ceneval.",
  comipems: "Todo para el examen COMIPEMS y el ingreso a la educación media superior.",
  ediems: "Recursos y simuladores para el examen EDIEMS.",
  unam: "Guías, simuladores y estrategias para el examen de admisión a la UNAM.",
  ipn: "Preparación completa para el examen de admisión al IPN.",
  uam: "Guías y simuladores para el examen de admisión a la UAM.",
  udg: "Proceso de admisión, puntajes y preparación para la Universidad de Guadalajara.",
  buap: "Recursos y simuladores para el examen de admisión a la BUAP.",
  "prepa-udg": "Preparación para la prueba de admisión a la Preparatoria de la UDG.",
  kp: "Knowledge Profile: preparación para universidades como Anáhuac y Tecmilenio.",
  cursos: "Comparativas y guías de los mejores cursos de preparación.",
  uncategorised: "Artículos, guías y recursos de preparación académica.",
};

export function categoryDescription(cat: BlogCategory): string {
  return (
    CATEGORY_DESCRIPTIONS[cat.slug] ??
    `Guías, estrategias y recursos sobre ${cat.name}.`
  );
}
