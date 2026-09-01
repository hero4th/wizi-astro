/**
 * WordPress headless data layer (WPGraphQL).
 * ---------------------------------------------------------------------------
 * Fetches every published post from proacademymx.com, cleans the theme-injected
 * markup, and normalizes it into the shape the Astro blog design expects.
 *
 * The WordPress content editor injects a `pas-post-title-wrap` header block
 * (nav + <h1> + author/date meta) into every post's rendered `content`.
 * Since the Astro templates render their own header, we strip that block and
 * keep only the real article body (Gutenberg `wp-block-*` markup), which maps
 * cleanly onto the existing `.prose-pa` styles.
 */

export const WP_ENDPOINT =
  import.meta.env.WP_GRAPHQL_ENDPOINT?.trim() ||
  "https://cms.proacademymx.com/graphql";

/** How many posts to request per GraphQL page (content is heavy, keep modest). */
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// GraphQL types (only the fields we query)
// ---------------------------------------------------------------------------

interface WpImageNode {
  sourceUrl: string | null;
  altText: string | null;
  mediaDetails: { width: number | null; height: number | null } | null;
}

interface WpCategoryNode {
  name: string;
  slug: string;
}

interface WpPostNode {
  databaseId: number;
  slug: string;
  title: string | null;
  date: string;
  modified: string | null;
  content: string | null;
  author: { node: { name: string | null } | null } | null;
  featuredImage: { node: WpImageNode | null } | null;
  categories: { nodes: WpCategoryNode[] } | null;
}

interface PostsResponse {
  data?: {
    posts: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: WpPostNode[];
    };
  };
  errors?: { message: string }[];
}

// ---------------------------------------------------------------------------
// Normalized shape consumed by the Astro pages / content loader
// ---------------------------------------------------------------------------

export interface BlogCategory {
  name: string;
  slug: string;
}

export interface BlogHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface WpPost {
  slug: string;
  title: string;
  description: string;
  html: string;
  headings: BlogHeading[];
  category: string;
  categorySlug: string;
  categories: BlogCategory[];
  pubDate: string;
  updatedDate: string | null;
  image: string | null;
  imageAlt: string;
  imageWidth: number | null;
  imageHeight: number | null;
  author: string;
  readingTime: number;
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const ALL_POSTS_QUERY = /* GraphQL */ `
  query AllPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        slug
        title
        date
        modified
        content
        author {
          node {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

async function gqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(WP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`WPGraphQL responded ${res.status} ${res.statusText} for ${WP_ENDPOINT}`);
  }

  return (await res.json()) as T;
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
function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITIES[name] ?? m);
}

/** Remove a balanced `<div class="…name…">…</div>` (and everything inside). */
function removeBalancedDiv(html: string, className: string): string {
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
function imageBaseName(url: string): string {
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
 * header, we drop it here to avoid a visible duplicate.
 */
function removeFeaturedImageFromContent(html: string, featuredUrl: string | null): string {
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
function stripInjectedChrome(html: string): string {
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

/** Build a URL-safe slug from heading text (accent-insensitive, deduped upstream). */
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

/**
 * Inject `id` attributes on h2/h3 headings (so the TOC anchors work) and
 * return the extracted heading list in Astro's MarkdownHeading shape.
 */
function processHeadings(html: string): { html: string; headings: BlogHeading[] } {
  const headings: BlogHeading[] = [];
  const used = new Set<string>();
  const headingRe = /<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi;

  const out = html.replace(headingRe, (full, tag: string, attrs: string, inner: string) => {
    const depth = Number(tag[1]);
    const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
    if (!text) return full;

    // Reuse an existing id if the author set one, otherwise derive from text.
    const existing = /\bid="([^"]+)"/i.exec(attrs);
    let slug = existing ? existing[1] : slugify(text) || `seccion-${headings.length + 1}`;

    let unique = slug;
    let n = 2;
    while (used.has(unique)) unique = `${slug}-${n++}`;
    used.add(unique);

    headings.push({ depth, slug: unique, text });

    const cleanedAttrs = attrs.replace(/\s*\bid="[^"]*"/i, "");
    return `<${tag}${cleanedAttrs} id="${unique}">${inner}</${tag}>`;
  });

  return { html: out, headings };
}

/** First real paragraph → clean, truncated meta description (~155 chars). */
function buildDescription(html: string, fallback: string): string {
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
function readingTime(html: string): number {
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
const CATEGORY_PRIORITY = [
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

function pickPrimaryCategory(categories: BlogCategory[]): BlogCategory {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch and normalize every published post from WordPress. */
export async function fetchAllPosts(): Promise<WpPost[]> {
  const posts: WpPost[] = [];
  let after: string | null = null;

  for (let guard = 0; guard < 50; guard++) {
    const json: PostsResponse = await gqlRequest<PostsResponse>(ALL_POSTS_QUERY, {
      first: PAGE_SIZE,
      after,
    });

    if (json.errors?.length) {
      throw new Error(`WPGraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`);
    }
    const conn = json.data?.posts;
    if (!conn) throw new Error("WPGraphQL: unexpected empty response for posts query.");

    for (const node of conn.nodes) {
      posts.push(normalizePost(node));
    }

    if (conn.pageInfo.hasNextPage && conn.pageInfo.endCursor) {
      after = conn.pageInfo.endCursor;
    } else {
      break;
    }
  }

  // Newest first — matches the previous blog ordering.
  posts.sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());
  return posts;
}

function normalizePost(node: WpPostNode): WpPost {
  const rawTitle = decodeEntities((node.title ?? "").replace(/<[^>]+>/g, "")).trim() || "Sin título";

  const img = node.featuredImage?.node ?? null;

  let cleaned = stripInjectedChrome(node.content ?? "");
  cleaned = removeFeaturedImageFromContent(cleaned, img?.sourceUrl ?? null);
  const { html, headings } = processHeadings(cleaned);

  const categories: BlogCategory[] = (node.categories?.nodes ?? []).map((c) => ({
    name: decodeEntities(c.name),
    slug: c.slug,
  }));
  const primary = pickPrimaryCategory(categories);

  return {
    slug: node.slug,
    title: rawTitle,
    description: buildDescription(html, `${rawTitle}. Guía de preparación de Professional Academy.`),
    html,
    headings,
    category: primary.name,
    categorySlug: primary.slug,
    categories,
    pubDate: node.date,
    updatedDate: node.modified && node.modified !== node.date ? node.modified : null,
    image: img?.sourceUrl ?? null,
    imageAlt: decodeEntities(img?.altText || rawTitle),
    imageWidth: img?.mediaDetails?.width ?? null,
    imageHeight: img?.mediaDetails?.height ?? null,
    author: decodeEntities(node.author?.node?.name || "Professional Academy"),
    readingTime: readingTime(html),
  };
}
