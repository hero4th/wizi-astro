// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import legacyBlogSlugs from "./src/data/legacy-redirects.mjs";
import recoveredBlogRedirects from "./src/data/recovered-blog-redirects.mjs";

// 301 redirects: old WordPress permalinks (/slug) → new Astro blog URLs (/blog/slug/).
// Preserves SEO for the posts already indexed at the root of proacademymx.com.
// Targets use the trailing slash that Netlify serves with 200, so old URLs
// resolve in a single hop instead of chaining two 301s.
const finalUrl = (target) =>
  target.startsWith("/") && !target.endsWith("/") && !/\.[a-z0-9]+$/i.test(target)
    ? `${target}/`
    : target;

const legacyRedirects = {
  ...Object.fromEntries(
    Object.entries(recoveredBlogRedirects).map(([from, to]) => [from, finalUrl(to)])
  ),
  ...Object.fromEntries(
    legacyBlogSlugs.map((slug) => [`/${slug}`, `/blog/${slug}/`])
  ),
};

// https://astro.build/config
export default defineConfig({
  site: "https://proacademymx.com",
  output: "static",
  trailingSlash: "ignore",
  redirects: legacyRedirects,
  adapter: netlify({
    imageCDN: true,
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
      // Netlify's pretty URLs serve each page as `/ruta/` (200) and redirect
      // `/ruta` to it with a 301. The sitemap and canonicals must list the URL
      // that returns 200, not the redirect.
      serialize(item) {
        const { pathname } = new URL(item.url);
        if (pathname !== "/") {
          item.url = `${item.url.replace(/\/+$/, "")}/`;
        }
        return item;
      },
    }),
  ],
  vite: {
    // Build/check also create Vite optimizers. Keep them out of the live dev
    // cache: replacing its metadata produces 504 Outdated Optimize Dep errors.
    cacheDir: `node_modules/.vite/astro-${process.argv.find((arg) => ["dev", "build", "check", "preview"].includes(arg)) ?? "tools"}`,
    plugins: [tailwindcss()],
  },
  // No prefetchear todos los enlaces del viewport: cada enlace visible a una
  // ruta SSR (blog, categorías) es una invocación de Netlify Function y una
  // consulta a Postgres, lo que multiplica el consumo de compute. El prefetch
  // por hover sigue disponible para enlaces con `data-astro-prefetch`.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
