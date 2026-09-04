/**
 * Normalizes the hidden/SEO metadata fields shared by the create and update
 * post endpoints. Empty strings become null so the public page can fall back
 * to the visible title/description with a simple `??`.
 */
export interface SeoFields {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  ogImage: string | null;
  keywords: string | null;
}

const trimmed = (value: unknown, max: number): string | null => {
  const s = String(value ?? "").trim();
  return s ? s.slice(0, max) : null;
};

/** Only absolute http(s) URLs or site-relative paths are stored. */
const url = (value: unknown): string | null => {
  const s = trimmed(value, 500);
  if (!s) return null;
  return /^(https?:\/\/|\/)/i.test(s) ? s : null;
};

export function seoFields(data: Record<string, unknown>): SeoFields {
  return {
    seoTitle: trimmed(data.seoTitle, 200),
    seoDescription: trimmed(data.seoDescription, 400),
    canonicalUrl: url(data.canonicalUrl),
    noindex: data.noindex === true,
    ogImage: url(data.ogImage),
    keywords: trimmed(data.keywords, 300),
  };
}
