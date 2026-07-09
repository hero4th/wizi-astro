// Regenera src/data/legacy-redirects.mjs con los slugs de todas las entradas
// publicadas en WordPress, para mantener las redirecciones 301 de las URLs
// antiguas (/slug) hacia las nuevas (/blog/slug).
//
//   node scripts/gen-legacy-redirects.mjs
//
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ENDPOINT = process.env.WP_GRAPHQL_ENDPOINT?.trim() || "https://proacademymx.com/graphql";
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/legacy-redirects.mjs");

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`WPGraphQL ${res.status}`);
  return res.json();
}

const slugs = [];
let after = null;
do {
  const json = await gql(
    `query ($after: String) {
      posts(first: 50, after: $after, where: { status: PUBLISH }) {
        pageInfo { hasNextPage endCursor }
        nodes { slug }
      }
    }`,
    { after }
  );
  const conn = json.data.posts;
  for (const n of conn.nodes) slugs.push(n.slug);
  after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
} while (after);

const body =
  "// Auto-generado desde WordPress (posts publicados) para redirigir\n" +
  "// las URLs antiguas /<slug>/ (raíz) hacia las nuevas /blog/<slug> (301).\n" +
  "// Regenerar: node scripts/gen-legacy-redirects.mjs\n" +
  "export default " +
  JSON.stringify(slugs, null, 2) +
  ";\n";

writeFileSync(OUT, body, "utf-8");
console.log(`Wrote ${OUT} with ${slugs.length} slugs`);
