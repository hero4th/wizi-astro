import { getCollection, type CollectionEntry } from "astro:content";
import { categoryDescription } from "./wordpress";

export type Post = CollectionEntry<"blog">;

export interface CategoryWithCount {
  name: string;
  slug: string;
  count: number;
  description: string;
}

/** All published posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Every category that has at least one published post, most-used first. */
export async function getBlogCategories(posts?: Post[]): Promise<CategoryWithCount[]> {
  const all = posts ?? (await getPublishedPosts());
  const map = new Map<string, CategoryWithCount>();

  for (const post of all) {
    for (const cat of post.data.categories) {
      const existing = map.get(cat.slug);
      if (existing) {
        existing.count++;
      } else {
        map.set(cat.slug, {
          name: cat.name,
          slug: cat.slug,
          count: 1,
          description: categoryDescription(cat),
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Published posts belonging to a given category slug, newest first. */
export async function getPostsByCategory(slug: string, posts?: Post[]): Promise<Post[]> {
  const all = posts ?? (await getPublishedPosts());
  return all.filter((post) => post.data.categories.some((c) => c.slug === slug));
}
