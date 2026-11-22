/**
 * The public article template renders the featured image as a hero. WordPress
 * imports often include the same image again as the first `<figure>` of the
 * body, so readers see it twice (and the article gets a redundant content
 * image). These helpers remove only exact/near-exact copies of the featured
 * image; unrelated body images are left untouched.
 */

const IMG_TAG_RE = /<img\b[^>]*>/gi;
const SRC_ATTR_RE =
  /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;
const FIGURE_RE = /<figure\b[^>]*>[\s\S]*?<\/figure>[ \t]*\n?/gi;

/** Stable key for an image URL: file name without WordPress resize suffix. */
export function imageKey(src: string | null | undefined): string {
  if (!src) return "";
  try {
    const url = new URL(src, "https://proacademymx.com");
    const file = decodeURIComponent(url.pathname.split("/").pop() ?? "");
    return file.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "").toLowerCase();
  } catch {
    return "";
  }
}

function srcFromTag(tag: string): string {
  const match = tag.match(SRC_ATTR_RE);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function figureContainsImage(figure: string, key: string): boolean {
  for (const match of figure.matchAll(IMG_TAG_RE)) {
    if (imageKey(srcFromTag(match[0])) === key) return true;
  }
  return false;
}

/**
 * Remove the featured image when it also appears inside the article body.
 * Handles the WordPress `wp-block-post-featured-image` figure, same image in
 * another figure, and resized variants (`image-1024x683.webp`).
 */
export function stripFeaturedImageDuplicates(
  html: string | null | undefined,
  featuredImage: string | null | undefined,
): string {
  if (!html) return "";
  const key = imageKey(featuredImage);
  if (!key) return html;

  const withoutFigures = html.replace(FIGURE_RE, (figure) =>
    figureContainsImage(figure, key) ? "" : figure,
  );

  const withoutImages = withoutFigures.replace(IMG_TAG_RE, (tag) =>
    imageKey(srcFromTag(tag)) === key ? "" : tag,
  );

  return withoutImages
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart();
}
