import { sql } from "./db";
import { stripFeaturedImageDuplicates } from "./blog-images";
import { publicBlogLinks } from "./blog-links";
import fs from "node:fs";
import path from "node:path";

export interface SnapshotPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  categories: Array<{ name: string; slug: string }>;
  pubDate: string;
  updatedDate?: string | null;
  image?: string | null;
  imageAlt?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  author: string;
  readingTime: number;
  draft: boolean;
  html: string;
  body: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noindex: boolean;
  ogImage?: string | null;
  keywords?: string | null;
}

function rowToSnapshot(row: any): SnapshotPost {
  const html = stripFeaturedImageDuplicates(publicBlogLinks(row.html || row.body || ""), row.image);
  const body = stripFeaturedImageDuplicates(row.body || row.html || "", row.image);
  
  return {
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    category: row.category || "General",
    categorySlug: row.category_slug || "general",
    categories: Array.isArray(row.categories) ? row.categories : [],
    pubDate: row.pub_date instanceof Date ? row.pub_date.toISOString() : row.pub_date,
    updatedDate: row.updated_date ? (row.updated_date instanceof Date ? row.updated_date.toISOString() : row.updated_date) : null,
    image: row.image || null,
    imageAlt: row.image_alt || "",
    imageWidth: row.image_width || null,
    imageHeight: row.image_height || null,
    author: row.author || "Professional Academy",
    readingTime: row.reading_time || 0,
    draft: row.draft || false,
    html,
    body,
    seoTitle: row.seo_title || null,
    seoDescription: row.seo_description || null,
    canonicalUrl: row.canonical_url || null,
    noindex: row.noindex || false,
    ogImage: row.og_image || null,
    keywords: row.keywords || null,
  };
}

export async function generateBlogSnapshot(): Promise<SnapshotPost[]> {
  try {
    const rows = await sql`
      SELECT * FROM posts WHERE draft = false ORDER BY pub_date DESC
    `;
    
    const posts = (rows || []).map(rowToSnapshot);
    
    const snapshotPath = path.resolve(process.cwd(), "src/data/blog-generated.json");
    const snapshotDir = path.dirname(snapshotPath);
    
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }
    
    fs.writeFileSync(snapshotPath, JSON.stringify(posts, null, 2), "utf-8");
    console.log(`[blog-snapshot] Generated ${posts.length} posts to ${snapshotPath}`);
    
    return posts;
  } catch (err) {
    console.error("[blog-snapshot] Error generating snapshot:", err);
    throw err;
  }
}

export async function triggerNetlifyBuild(): Promise<boolean> {
  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL || process.env.BUILD_HOOK_URL;
  
  if (!hookUrl) {
    console.log("[blog-snapshot] No build hook configured, skipping rebuild trigger");
    return false;
  }
  
  try {
    const res = await fetch(hookUrl, { method: "POST" });
    console.log(`[blog-snapshot] Build hook triggered: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[blog-snapshot] Error triggering build hook:", err);
    return false;
  }
}
