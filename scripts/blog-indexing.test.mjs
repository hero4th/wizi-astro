import test from "node:test";
import assert from "node:assert/strict";
import {
  imageKey,
  stripFeaturedImageDuplicates,
} from "../src/lib/blog-images.ts";

test("imageKey ignores WordPress resize suffixes and query strings", () => {
  assert.equal(
    imageKey("https://cms.proacademymx.com/wp-content/uploads/2026/01/foto-1024x683.webp?x=1"),
    "foto.webp",
  );
  assert.equal(imageKey("/images/blog-sat.webp"), "blog-sat.webp");
});

test("removes the leading WordPress featured figure but keeps body images", () => {
  const html =
    '<figure class="wp-block-post-featured-image"><img src="/images/blog-sat.webp" alt=""></figure>\n' +
    "<p>Contenido</p>" +
    '<figure><img src="https://cms.proacademymx.com/wp-content/uploads/otra.webp" alt="Otra"></figure>';

  const result = stripFeaturedImageDuplicates(html, "/images/blog-sat.webp");

  assert.equal(result.startsWith("<p>Contenido</p>"), true);
  assert.equal(result.includes("blog-sat.webp"), false);
  assert.equal(result.includes("otra.webp"), true);
});

test("removes duplicated featured images in any figure, including resized variants", () => {
  const html =
    "<p>Intro</p>" +
    '<figure class="wp-block-image"><img src="https://cms.proacademymx.com/wp-content/uploads/foto-1024x683.webp" alt=""></figure>' +
    "<p>Cierre</p>";

  const result = stripFeaturedImageDuplicates(
    html,
    "https://cms.proacademymx.com/wp-content/uploads/foto.webp",
  );

  assert.equal(result, "<p>Intro</p><p>Cierre</p>");
});

test("does nothing without a featured image and is idempotent", () => {
  const html = '<figure><img src="/images/blog-gre.webp" alt=""></figure><p>Texto</p>';
  assert.equal(stripFeaturedImageDuplicates(html, undefined), html);

  const once = stripFeaturedImageDuplicates(html, "/images/blog-gre.webp");
  assert.equal(stripFeaturedImageDuplicates(once, "/images/blog-gre.webp"), once);
});
