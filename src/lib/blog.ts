import { categoryDescription } from "./wordpress";
import { publicBlogLinks } from "./blog-links";
import { stripFeaturedImageDuplicates } from "./blog-images";
import generatedBlogData from "@/data/blog-generated.json";
import fallbackPostsData from "@/data/blog-fallback.json";

export interface BlogCategoryRef {
  name: string;
  slug: string;
}

export interface PostData {
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  categories: BlogCategoryRef[];
  pubDate: Date;
  updatedDate?: Date;
  image?: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  author: string;
  readingTime: number;
  draft: boolean;
  html: string;
  body: string;
  /** Hidden metadata: overrides for <head>, none of it shown in the article. */
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  noindex: boolean;
  ogImage?: string;
  keywords?: string;
}

/** Shaped like an Astro `CollectionEntry` ({id, data}) so existing templates
 *  (post.id, post.data.title, …) keep working unchanged. */
export interface Post {
  id: string;
  data: PostData;
}

export interface CategoryWithCount {
  name: string;
  slug: string;
  count: number;
  description: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snapshotToPost(item: any): Post {
  return {
    id: item.slug,
    data: {
      title: item.title,
      description: item.description,
      category: item.category,
      categorySlug: item.categorySlug,
      categories: item.categories ?? [],
      pubDate: new Date(item.pubDate),
      updatedDate: item.updatedDate ? new Date(item.updatedDate) : undefined,
      image: item.image ?? undefined,
      imageAlt: item.imageAlt ?? "",
      imageWidth: item.imageWidth ?? undefined,
      imageHeight: item.imageHeight ?? undefined,
      author: item.author,
      readingTime: item.readingTime,
      draft: item.draft,
      html: stripFeaturedImageDuplicates(publicBlogLinks(item.html), item.image),
      body: stripFeaturedImageDuplicates(item.body, item.image),
      seoTitle: item.seoTitle ?? undefined,
      seoDescription: item.seoDescription ?? undefined,
      canonicalUrl: item.canonicalUrl ?? undefined,
      noindex: item.noindex ?? false,
      ogImage: item.ogImage ?? undefined,
      keywords: item.keywords ?? undefined,
    },
  };
}

function getGeneratedPosts(): Post[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((generatedBlogData as any[]) || []).map(snapshotToPost);
}

function getFallbackPosts(): Post[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((fallbackPostsData as any[]) || []).map(snapshotToPost);
}

/**
 * All published posts, newest first.
 *
 * This module is intentionally database-free. Public pages are rendered from
 * the JSON snapshot that the build generates, so visitors never wake the
 * database. Only /admin (and the prebuild script) may query Postgres.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const generated = getGeneratedPosts();
  return generated.length > 0 ? generated : getFallbackPosts();
}

/** A single published post by slug. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.id === slug) ?? null;
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
