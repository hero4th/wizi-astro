// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import legacyBlogSlugs from "./src/data/legacy-redirects.mjs";
import recoveredBlogRedirects from "./src/data/recovered-blog-redirects.mjs";
import { getBlogSitemapUrls } from "./scripts/get-blog-sitemap-urls.mjs";

// 301 redirects: old WordPress permalinks (/slug) → new Astro blog URLs (/blog/slug).
// Preserves SEO for the posts already indexed at the root of proacademymx.com.
const legacyRedirects = { ...recoveredBlogRedirects, ...Object.fromEntries(
  legacyBlogSlugs.map((slug) => [`/${slug}`, `/blog/${slug}`])
)};

const SITE_URL = "https://www.proacademymx.com";
// /blog/[slug] is SSR now (posts live in Postgres), so Astro can't discover
// those routes by scanning prerendered pages — fetch the published slugs here
// so the sitemap still lists every post.
const blogSitemapUrls = await getBlogSitemapUrls(SITE_URL);

// https://astro.build/config
export default defineConfig({
  site: "https://www.proacademymx.com",
  output: "static",
  redirects: legacyRedirects,
  adapter: vercel({
    webAnalytics: { enabled: false },
    imageService: true,
  }),
  image: {
    // Allow featured/content images served from the headless WordPress backend.
    remotePatterns: [
      { protocol: "https", hostname: "proacademymx.com" },
      { protocol: "https", hostname: "www.proacademymx.com" },
      // Agrega tu nuevo subdominio para que Astro pueda procesar las imágenes de WP
      { protocol: "https", hostname: "cms.proacademymx.com" },
    ],
  },
  integrations: [
    react(),
    mdx(),
    icon({
      include: {
        ph: ["phone", "map-pin", "arrow-right", "arrow-up-right", "plus", "check", "caret-down", "list", "x", "clock", "pencil-simple-line", "files", "chats-circle", "chat-circle", "envelope-simple", "seal-check", "seal-percent", "seal-percent-fill", "book-open", "headphones", "pencil-simple", "microphone", "clipboard-text", "graduation-cap", "check-circle", "calendar", "calendar-blank", "wrench", "toolbox", "cpu", "robot", "x-circle", "check-circle-fill", "seal-check-fill", "calculator", "math-operations", "globe-hemisphere-west", "stack", "target"],
        "simple-icons": ["facebook", "instagram", "x", "whatsapp"],
      },
    }),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, "");
        return !/^\/(admin|api|gracias|404)(\/|$)/.test(pathname) && !(pathname in legacyRedirects);
      },
      changefreq: "weekly",
      priority: 0.7,
      customPages: blogSitemapUrls,
    }),
  ],
  vite: {
    // Build/check also create Vite optimizers. Keep them out of the live dev
    // cache: replacing its metadata produces 504 Outdated Optimize Dep errors.
    cacheDir: `node_modules/.vite/astro-${process.argv.find((arg) => ["dev", "build", "check", "preview"].includes(arg)) ?? "tools"}`,
    plugins: [tailwindcss()],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
