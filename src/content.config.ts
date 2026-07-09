import { defineCollection, z } from "astro:content";
import type { Loader } from "astro/loaders";
import { fetchAllPosts } from "./lib/wordpress";

/**
 * Content Layer loader that pulls every published post from WordPress
 * (WPGraphQL) at build time. The normalized data — including the cleaned
 * article HTML and the extracted headings — is stored on each entry so the
 * Astro blog pages keep working through the familiar `getCollection` API.
 */
const wordpressBlogLoader: Loader = {
  name: "wordpress-blog",
  load: async ({ store, logger, parseData, generateDigest }) => {
    logger.info("Fetching blog posts from WordPress (WPGraphQL)…");

    let posts;
    try {
      posts = await fetchAllPosts();
    } catch (error) {
      logger.error(`Could not fetch WordPress posts: ${(error as Error).message}`);
      // Keep the previous store (if any) rather than wiping the blog on a
      // transient network/API hiccup during a rebuild.
      if (store.keys().length > 0) {
        logger.warn("Reusing previously cached posts from the data store.");
        return;
      }
      throw error;
    }

    store.clear();

    for (const post of posts) {
      const data = await parseData({
        id: post.slug,
        data: {
          title: post.title,
          description: post.description,
          html: post.html,
          headings: post.headings,
          category: post.category,
          categorySlug: post.categorySlug,
          categories: post.categories,
          pubDate: post.pubDate,
          updatedDate: post.updatedDate ?? undefined,
          image: post.image ?? undefined,
          imageAlt: post.imageAlt,
          imageWidth: post.imageWidth ?? undefined,
          imageHeight: post.imageHeight ?? undefined,
          author: post.author,
          readingTime: post.readingTime,
          draft: false,
        },
      });

      store.set({ id: post.slug, data, digest: generateDigest(data) });
    }

    logger.info(`Loaded ${posts.length} posts from WordPress.`);
  },
};

const heading = z.object({
  depth: z.number(),
  slug: z.string(),
  text: z.string(),
});

const category = z.object({
  name: z.string(),
  slug: z.string(),
});

const blog = defineCollection({
  loader: wordpressBlogLoader,
  schema: z.object({
    title: z.string(),
    description: z.string(),
    html: z.string().default(""),
    headings: z.array(heading).default([]),
    category: z.string(),
    categorySlug: z.string(),
    categories: z.array(category).default([]),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
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
