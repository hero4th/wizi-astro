// Post-build: relaja el regex de las redirecciones 301 heredadas del blog para
// que acepten barra final opcional (^/slug$ -> ^/slug/?$). Así las URLs viejas
// de WordPress redirigen con un 301 real tanto con como sin "/" al final.
//
// Se ejecuta automáticamente después de `astro build` (ver package.json).
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const CONFIG = ".vercel/output/config.json";

if (!existsSync(CONFIG)) {
  console.warn(`[patch-redirects] ${CONFIG} no existe; se omite (¿build sin adaptador Vercel?).`);
  process.exit(0);
}

const cfg = JSON.parse(await readFile(CONFIG, "utf-8"));
let patched = 0;

for (const route of cfg.routes ?? []) {
  const location = route.headers?.Location;
  if (
    route.status === 301 &&
    typeof route.src === "string" &&
    typeof location === "string" &&
    location.startsWith("/blog/") &&
    route.src.endsWith("$") &&
    !route.src.endsWith("/?$")
  ) {
    route.src = route.src.replace(/\$$/, "/?$");
    patched++;
  }
}

if (patched > 0) {
  await writeFile(CONFIG, JSON.stringify(cfg));
}
console.log(`[patch-redirects] ${patched} redirecciones aceptan ahora barra final opcional.`);
