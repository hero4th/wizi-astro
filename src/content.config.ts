import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./data/categories";

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.preprocess((val) => {
    if (!val || typeof val !== "object" || !("title" in val)) {
      return {
        title: "Borrador sin título",
        description: "Sin descripción",
        category: "General",
        categorySlug: "consejos-de-estudio",
        pubDate: new Date(),
        draft: true,
        ...(val && typeof val === "object" ? val : {}),
      };
    }
    return val;
  }, z.object({
    title: z.string().max(70),
    description: z.string().max(165),
    category: z.string(),
    categorySlug: z.enum(categorySlugs),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  })),
});

export const collections = { blog };
