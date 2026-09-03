import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Blog posts live as Markdown files in src/content/blog/ — no external
 * fetch, no database. They're either:
 *  - migrated once from the old WordPress export (scripts/import-wordpress.mjs), or
 *  - written through the visual editor at /admin (Decap CMS), which commits
 *    the .md file straight to this folder via the GitHub API.
 * Astro's built-in `glob` loader reads them at build time; `render(entry)`
 * (used in the post page) turns the Markdown body into HTML.
 */
const category = z.object({
  name: z.string(),
  slug: z.string(),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    categorySlug: z.string(),
    categories: z.array(category).default([]),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Plain URL string (not Astro's `image()` helper) so it keeps working with
    // both the /images/blog/... paths written by the importer/CMS and any
    // remaining remote URLs, with zero changes to the existing <img src=...>
    // call sites across the blog pages.
    image: z.string().optional(),
    imageAlt: z.string().default(""),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
    author: z.string().default("Professional Academy"),
    readingTime: z.number().default(5),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
