// Production server for the Neubox (Node.js) deployment.
//
// @astrojs/node in `standalone` mode exports a `handler` that serves both the
// prerendered client assets and the SSR routes. We wrap it so every response
// (static HTML included) carries the security headers that used to live in
// vercel.json — the node adapter only supports CSP headers natively.
process.env.ASTRO_NODE_AUTOSTART = "disabled";

import http from "node:http";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://connect.facebook.net https://snap.licdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.clarity.ms https://px.ads.linkedin.com; frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://wa.me",
};

const { handler } = await import("./dist/server/entry.mjs");

const server = http.createServer((req, res) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  handler(req, res);
});

const port = process.env.PORT ? Number(process.env.PORT) : 4321;
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
  console.log(`[server] Listening on http://${host}:${port}`);
});
