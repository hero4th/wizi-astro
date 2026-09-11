import fs from 'node:fs/promises';
import { load } from 'cheerio';
import { structure, hash, SITE } from './prepare.mjs';
import redirects from '../../src/data/recovered-blog-redirects.mjs';

const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const base=option('--base',SITE).replace(/\/$/,'');
const prepared=JSON.parse(await fs.readFile(option('--prepared','snapshots/proacademy-wordpress-2026-09-10.json.prepared.json'),'utf8'));
const report={base,checkedAt:new Date().toISOString(),articles:[],redirects:[],errors:[]};
async function get(path,redirect='follow') {
  return fetch(new URL(path,base),{redirect,signal:AbortSignal.timeout(45000)});
}
async function batch(items,fn){for(let i=0;i<items.length;i+=4)await Promise.all(items.slice(i,i+4).map(fn));}
await batch(prepared.entries,async e=>{
  const path=`/blog/${e.row.slug}`;
  try{
    const r=await get(path);const $=load(await r.text());const actual=structure($('.prose-pa').html()||'');const expected=structure(e.row.html);
    const result={slug:e.row.slug,status:r.status,final:new URL(r.url).pathname,canonical:$('link[rel=canonical]').attr('href'),robots:$('meta[name=robots]').attr('content')||'',textPreserved:hash(actual.text)===hash(expected.text),structurePreserved:JSON.stringify(actual.counts)===JSON.stringify(expected.counts),headingsPreserved:JSON.stringify(actual.headings)===JSON.stringify(expected.headings)};
    report.articles.push(result);
    if(r.status!==200 || result.final!==path || result.canonical!==`${SITE}${path}` || /noindex/.test(result.robots) || !result.textPreserved || !result.structurePreserved || !result.headingsPreserved)report.errors.push({slug:e.row.slug,error:'ARTICLE_CHECK_FAILED'});
  }catch{report.errors.push({slug:e.row.slug,error:'ARTICLE_FETCH_FAILED'});}
});
if(!args.includes('--articles-only')){
  await batch(Object.entries(redirects).flatMap(([from,to])=>[[from,to],[`${from}/`,to]]),async([from,to])=>{
    try{const r=await get(from,'manual');const location=r.headers.get('location');const target=location?new URL(location,base).pathname:null;report.redirects.push({from,to,status:r.status,location});if(r.status!==301 || target!==to)report.errors.push({from,error:'REDIRECT_CHECK_FAILED'});}catch{report.errors.push({from,error:'REDIRECT_FETCH_FAILED'});}
  });
  const rss=await get('/rss.xml');const $rss=load(await rss.text(),{xml:true});const rssLinks=$rss('item > link').map((i,e)=>$rss(e).text()).get();
  const listing=await get('/blog');const $listing=load(await listing.text());const listingLinks=new Set($listing('a[href]').map((i,e)=>$listing(e).attr('href')).get());
  const index=await get('/sitemap-index.xml');const $index=load(await index.text(),{xml:true});let sitemapUrls=[];
  for(const url of $index('sitemap > loc').map((i,e)=>$index(e).text()).get()){
    const r=await get(new URL(url).pathname);const $=load(await r.text(),{xml:true});sitemapUrls.push(...$('url > loc').map((i,e)=>$(e).text()).get());
  }
  report.rssItems=rssLinks.length;report.sitemapUrls=sitemapUrls.length;
  for(const e of prepared.entries){const path=`/blog/${e.row.slug}`;if(!rssLinks.some(l=>new URL(l).pathname===path)||!listingLinks.has(path)||!sitemapUrls.includes(`${SITE}${path}`))report.errors.push({slug:e.row.slug,error:'DISCOVERY_MISSING'});}
  if(sitemapUrls.some(u=>/^\/(admin|api|404)(\/|$)/.test(new URL(u).pathname)))report.errors.push({error:'PRIVATE_SITEMAP_PATH'});
  const categories=[...new Set(prepared.entries.flatMap(e=>e.row.categories.map(c=>c.slug)))];
  report.categories=[];
  await batch(categories,async slug=>{const path=`/blog/categoria/${slug}`;const r=await get(path);const $=load(await r.text());const links=new Set($('a[href]').map((i,e)=>$(e).attr('href')).get());const expected=prepared.entries.filter(e=>e.row.categories.some(c=>c.slug===slug));const missing=expected.filter(e=>!links.has(`/blog/${e.row.slug}`));report.categories.push({slug,status:r.status,missing:missing.length});if(r.status!==200||missing.length||!sitemapUrls.includes(`${SITE}${path}`))report.errors.push({slug,error:'CATEGORY_CHECK_FAILED'});});
  const missing=await get('/blog/recovery-nonexistent-404-check','manual');report.missingStatus=missing.status;
  if(missing.status!==404)report.errors.push({error:'MISSING_ARTICLE_NOT_404'});
}
const output=option('--report','snapshots/public-verification.json');
await fs.writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({articles:report.articles.length,redirects:report.redirects.length,rssItems:report.rssItems,categories:report.categories?.length,errors:report.errors.length,report:output}));
if(report.errors.length)process.exitCode=1;
