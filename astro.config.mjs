// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://www.proacademymx.com",
  output: "static",
  adapter: vercel({
    webAnalytics: { enabled: false },
    imageService: true,
  }),
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
