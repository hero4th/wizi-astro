import fs from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import legacySlugs from '../../src/data/legacy-redirects.mjs';

const cms = 'https://cms.proacademymx.com';
const out = process.argv[2] || `snapshots/proacademy-wordpress-${new Date().toISOString().slice(0, 10)}.json`;
const digest = value => createHash('sha256').update(value).digest('hex');
const get = async url => {
  const r = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`SOURCE_HTTP_${r.status}`);
  return r;
};

// Exclusively public REST/head fields; no credentials or unrestricted database metadata.
const posts = [];
const first = await get(`${cms}/wp-json/wp/v2/posts?per_page=100&_embed&page=1`);
const expected = Number(first.headers.get('x-wp-total'));
const pages = Number(first.headers.get('x-wp-totalpages'));
posts.push(...await first.json());
for (let page = 2; page <= pages; page++) {
  posts.push(...await (await get(`${cms}/wp-json/wp/v2/posts?per_page=100&_embed&page=${page}`)).json());
}
if (!expected || posts.length !== expected || new Set(posts.map(p => p.slug)).size !== expected) {
  throw new Error('SOURCE_INCOMPLETE_OR_DUPLICATE');
}
const heads = {};
for (let offset = 0; offset < posts.length; offset += 4) {
  await Promise.all(posts.slice(offset, offset + 4).map(async post => {
    if (new URL(post.link).origin !== cms) throw new Error('UNEXPECTED_SOURCE_ORIGIN');
    try {
      const $ = load(await (await get(post.link)).text());
      heads[post.id] = {
        title: $('head title').text(),
        description: $('meta[name="description"]').attr('content') || null,
        keywords: $('meta[name="keywords"]').attr('content') || null,
        canonical: $('link[rel="canonical"]').attr('href') || null,
        robots: $('meta[name="robots"]').attr('content') || null,
        ogImage: $('meta[property="og:image"]').attr('content') || null,
      };
    } catch { heads[post.id] = { error: 'HEAD_UNAVAILABLE' }; }
  }));
}

const history = [];
if (process.env.HISTORICAL_ENV_FILE) {
  const mysql = (await import('mysql2/promise')).default;
  const e = parseEnv(await fs.readFile(process.env.HISTORICAL_ENV_FILE, 'utf8'));
  for (const database of [...new Set([e.DB_PRO_NAME, 'proacade_wp2017'])]) {
    const c = await mysql.createConnection({host:e.DB_PRO_HOST,user:e.DB_PRO_USER,password:e.DB_PRO_PASSWORD,database,connectTimeout:15000,dateStrings:true});
    try {
      await c.query('START TRANSACTION READ ONLY');
      const [tables] = await c.query('SHOW TABLES');
      const names = tables.map(row => Object.values(row)[0]);
      const table = names.find(n => /^[a-zA-Z0-9_]+_posts$/.test(n) && !n.includes('aioseo'));
      if (!table) throw new Error('HISTORICAL_TABLE_MISSING');
      const prefix = table.slice(0, -5);
      const [settings] = await c.query(`SELECT option_name, option_value FROM \`${prefix}options\` WHERE option_name IN ('home','siteurl','permalink_structure')`);
      const [articles] = await c.query(`SELECT ID,post_name,post_title,post_content,post_excerpt,post_date,post_date_gmt,post_modified,post_modified_gmt,post_status,post_author,guid FROM \`${table}\` WHERE post_type='post'`);
      const [metadata] = await c.query(`SELECT m.post_id,m.meta_key,m.meta_value FROM \`${prefix}postmeta\` m JOIN \`${table}\` p ON p.ID=m.post_id WHERE p.post_type='post' AND m.meta_key IN ('_wp_old_slug','_wp_old_date','_thumbnail_id','_aioseop_title','_aioseop_description','_aioseop_keywords','_aioseop_custom_link')`);
      const [terms] = await c.query(`SELECT r.object_id,t.term_id,t.name,t.slug,tt.taxonomy,tt.parent FROM \`${prefix}term_relationships\` r JOIN \`${prefix}term_taxonomy\` tt ON tt.term_taxonomy_id=r.term_taxonomy_id JOIN \`${prefix}terms\` t ON t.term_id=tt.term_id JOIN \`${table}\` p ON p.ID=r.object_id WHERE p.post_type='post' AND tt.taxonomy IN ('category','post_tag')`);
      const [attachments] = await c.query(`SELECT ID,post_parent,post_title,post_excerpt,guid,post_mime_type FROM \`${table}\` WHERE post_type='attachment'`);
      const [seo] = await c.query(`SELECT post_id,title,description,keywords,canonical_url FROM \`${prefix}aioseo_posts\` WHERE post_id IN (SELECT ID FROM \`${table}\` WHERE post_type='post')`);
      history.push({database,settings,articles,metadata,terms,attachments,seo});
      await c.rollback();
    } finally { await c.end(); }
  }
}
const snapshot = {
  version: 1, capturedAt: new Date().toISOString(), source: cms, expected,
  posts, heads, history, legacySlugs,
  editorialHold: { id:3744, slug:'aprobar-paa-y-sat-2026', status:'REQUIERE_APROBACION_EDITORIAL' },
  hashes: Object.fromEntries(posts.map(p => [p.slug,digest(p.content.rendered)])),
};
await fs.mkdir('snapshots', { recursive:true });
await fs.writeFile(out, JSON.stringify(snapshot, null, 2)+'\n', {flag:'wx',mode:0o600});
console.log(JSON.stringify({snapshot:out,posts:posts.length,heads:Object.keys(heads).length,headErrors:Object.values(heads).filter(h=>h.error).length,history:history.map(h=>({database:h.database,articles:h.articles.length})),sha256:digest(JSON.stringify(snapshot))}));
