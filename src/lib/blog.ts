import { sql } from "./db";
import { categoryDescription } from "./wordpress";
import { publicBlogLinks } from "./blog-links";

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
function rowToPost(row: any): Post {
  return {
    id: row.slug,
    data: {
      title: row.title,
      description: row.description,
      category: row.category,
      categorySlug: row.category_slug,
      categories: row.categories ?? [],
      pubDate: new Date(row.pub_date),
      updatedDate: row.updated_date ? new Date(row.updated_date) : undefined,
      image: row.image ?? undefined,
      imageAlt: row.image_alt ?? "",
      imageWidth: row.image_width ?? undefined,
      imageHeight: row.image_height ?? undefined,
      author: row.author,
      readingTime: row.reading_time,
      draft: row.draft,
      html: publicBlogLinks(row.html),
      body: row.body,
      seoTitle: row.seo_title ?? undefined,
      seoDescription: row.seo_description ?? undefined,
      canonicalUrl: row.canonical_url ?? undefined,
      noindex: row.noindex ?? false,
      ogImage: row.og_image ?? undefined,
      keywords: row.keywords ?? undefined,
    },
  };
}

/** All published posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  try {
    const rows = await sql`
      SELECT * FROM posts WHERE draft = false ORDER BY pub_date DESC
    `;
    return rows.map(rowToPost);
  } catch (err) {
    console.error("[blog] Error al consultar posts publicados en la base de datos:", err);
    return [];
  }
}

/** A single post by slug — published only, unless includeDrafts is set (admin preview). */
export async function getPostBySlug(slug: string, includeDrafts = false): Promise<Post | null> {
  try {
    const rows = includeDrafts
      ? await sql`SELECT * FROM posts WHERE slug = ${slug}`
      : await sql`SELECT * FROM posts WHERE slug = ${slug} AND draft = false`;
    return rows[0] ? rowToPost(rows[0]) : null;
  } catch (err) {
    console.error(`[blog] Error al consultar post '${slug}' en la base de datos:`, err);
    return null;
  }
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
