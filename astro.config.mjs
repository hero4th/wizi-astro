// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import legacyBlogSlugs from "./src/data/legacy-redirects.mjs";

// 301 redirects: old WordPress permalinks (/slug) → new Astro blog URLs (/blog/slug).
// Preserves SEO for the posts already indexed at the root of proacademymx.com.
const legacyRedirects = Object.fromEntries(
  legacyBlogSlugs.map((slug) => [`/${slug}`, `/blog/${slug}`])
);

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
        ph: ["phone", "map-pin", "arrow-right", "arrow-up-right", "plus", "check", "caret-down", "list", "x", "clock", "pencil-simple-line", "files", "chats-circle", "seal-check", "seal-percent", "seal-percent-fill", "book-open", "headphones", "pencil-simple", "microphone", "clipboard-text", "graduation-cap", "check-circle"],
        "simple-icons": ["facebook", "instagram", "x", "whatsapp"],
      },
    }),
    sitemap({
      filter: (page) => !page.includes("/gracias"),
      changefreq: "weekly",
      priority: 0.7,
    }),
  ],
  vite: {
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
