import { load } from 'cheerio';
import sanitize from 'sanitize-html';
import { createHash } from 'node:crypto';
import { pickPrimaryCategory } from '../../src/lib/wordpress.ts';

export const SITE = 'https://proacademymx.com';
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const hosts = new Set(['proacademymx.com','www.proacademymx.com','cms.proacademymx.com']);
const text = html => load(html || '',null,false).root().text().replace(/\s+/g,' ').trim();
const tags = ['h1','h2','h3','h4','h5','h6','p','li','table','tr','td','th','blockquote','a','img','figcaption'];
export function structure(html) {
  const $ = load(html,null,false);
  return {text:text(html),counts:Object.fromEntries(tags.map(t=>[t,$(t).length])),headings:$('h1,h2,h3,h4,h5,h6').map((i,e)=>$(e).text().trim()).get()};
}
export function stripChrome(html) {
  const $ = load(html,null,false);
  $('.pas-post-title-wrap,.pa-post-navigation,.pa-meta-global,h1.pas-post-title,h1.entry-title,script,style,noscript').remove();
  return $.html();
}
export function redirectMap(snapshot) {
  const out = {};
  const add = (path,slug) => {
    path = path.replace(/\/+$/,'');
    if (!path.startsWith('/') || /[?#\\]/.test(path) || !/^[a-z0-9_%-]+$/.test(slug)) throw new Error('UNSAFE_ALIAS');
    const destination = `/blog/${slug}`;
    if(out[path] && out[path] !== destination) throw new Error(`ALIAS_CONFLICT:${path}`);
    if(path !== destination) out[path] = destination;
  };
  for (const p of snapshot.posts) {
    if(p.id === 3744 || p.slug === 'aprobar-paa-y-sat-2026') continue;
    add(`/${p.slug}`,p.slug);
    for(const h of snapshot.history || []) {
      const old = h.articles.find(a=>Number(a.ID)===p.id && a.post_name===p.slug);
      if(!old) continue;
      const aliases = h.metadata.filter(m=>Number(m.post_id)===p.id && m.meta_key==='_wp_old_slug').map(m=>m.meta_value).filter(s=>/^[a-z0-9_%-]+$/.test(s));
      for(const slug of aliases) add(`/${slug}`,p.slug);
      const settings = Object.fromEntries(h.settings.map(s=>[s.option_name,s.option_value]));
      const prefix = new URL(settings.home).pathname.replace(/\/+$/,'');
      if(settings.permalink_structure==='/%category%/%postname%/') {
        // Multiple historical categories are retained as compatibility aliases;
        // the snapshot records them as candidates, not proof of indexation.
        const categories = h.terms.filter(t=>Number(t.object_id)===p.id && t.taxonomy==='category');
        for(const cat of categories) {
          let parts=[cat.slug], parent=Number(cat.parent); const visited=new Set([Number(cat.term_id)]);
          while(parent && !visited.has(parent)) {
            visited.add(parent);
            const ancestor=h.terms.find(t=>Number(t.term_id)===parent && t.taxonomy==='category');
            if(!ancestor) break;
            parts.unshift(ancestor.slug); parent=Number(ancestor.parent);
          }
          for(const slug of [p.slug,...aliases]) {
            add(`/${parts.join('/')}/${slug}`,p.slug);
            if(prefix) add(`${prefix}/${parts.join('/')}/${slug}`,p.slug);
          }
        }
      }
    }
  }
  for(const slug of snapshot.legacySlugs) {
    if(!out[`/${slug}`]) throw new Error(`LEGACY_SOURCE_MISSING:${slug}`);
  }
  return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
}

export function cleanHtml(input, redirects) {
  const cleaned = stripChrome(input);
  const before = structure(cleaned);
  const $ = load(cleaned,null,false);
  const rewrites=[];
  $('a[href]').each((i,e)=>{
    const original=$(e).attr('href');
    if(original.startsWith('#')) return;
    try {
      const u=new URL(original,'https://cms.proacademymx.com');
      if(!hosts.has(u.hostname)) return;
      const path=u.pathname.replace(/\/+$/,'');
      const target=redirects[path] || (Object.values(redirects).includes(path)?path:null);
      if(target){const to=`${SITE}${target}${u.search}${u.hash}`;$(e).attr('href',to);rewrites.push({from:original,to});}
    } catch { /* Invalid original URLs are handled by sanitizer. */ }
  });
  let index=0; const ids=new Set($('[id]').map((i,e)=>$(e).attr('id')).get());
  $('h1,h2,h3,h4,h5,h6').each((i,e)=>{
    if($(e).attr('id')) return;
    let id; do{id=`wp-section-${++index}`;}while(ids.has(id));
    ids.add(id);$(e).attr('id',id);
  });
  const html=sanitize($.html(),{
    allowedTags:[...sanitize.defaults.allowedTags,'img','picture','source','iframe','video','audio','details','summary'],
    allowedAttributes:{
      '*':['id','class','title','lang','dir','role','aria-label','aria-labelledby','aria-describedby'],
      a:['href','name','target','rel','title','id'],
      img:['src','srcset','sizes','alt','width','height','loading','decoding','title','id','class'],
      source:['src','srcset','sizes','type','media'],
      video:['src','poster','controls','width','height'],audio:['src','controls'],
      iframe:['src','title','width','height','allowfullscreen','loading','referrerpolicy'],
      td:['colspan','rowspan','headers'],th:['colspan','rowspan','scope','headers'],
      ol:['start','reversed','type'],li:['value'],time:['datetime'],col:['span'],colgroup:['span'],
    },
    allowedSchemes:['http','https','mailto','tel'],allowProtocolRelative:false,
    allowedIframeHostnames:['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com'],
    transformTags:{a:(tagName,attribs)=>({tagName,attribs:{...attribs,...(attribs.target==='_blank'?{rel:'noopener noreferrer'}:{})}})},
  });
  const after=structure(html);
  const errors=[];
  if(!after.text) errors.push('EMPTY_CONTENT');
  if(before.text!==after.text) errors.push('TEXT_CHANGED');
  for(const tag of tags.filter(t=>t!=='img')) {
    if(before.counts[tag]!==after.counts[tag]) errors.push(`STRUCTURE_CHANGED:${tag}`);
  }
  if(JSON.stringify(before.headings)!==JSON.stringify(after.headings)) errors.push('HEADINGS_CHANGED');
  return {html,errors,rewrites,validation:{beforeHash:hash(before.text),afterHash:hash(after.text),before:before.counts,after:after.counts,headings:after.headings}};
}

export function preparePost(p,snapshot,redirects) {
  const result=cleanHtml(p.content.rendered,redirects);
  const terms=(p._embedded?.['wp:term']||[]).flat();
  const categories=terms.filter(t=>t.taxonomy==='category').map(t=>({name:text(t.name),slug:t.slug}));
  const primary=pickPrimaryCategory(categories);
  const media=p._embedded?.['wp:featuredmedia']?.[0];
  const head=snapshot.heads[p.id] || {};
  const historic=(snapshot.history||[]).flatMap(h=>h.seo.filter(s=>Number(s.post_id)===p.id));
  // Old SEO templates (e.g. #post_title) are preserved in snapshot, not rendered literally.
  const historicalValue=key=>historic.map(h=>h[key]).find(v=>v && !/[#<>]/.test(v)) || null;
  const description=text(p.excerpt?.rendered)||text(result.html).slice(0,160);
  const row={
    slug:p.slug,title:text(p.title.rendered),description,category:primary.name,category_slug:primary.slug,categories,
    pub_date:p.date.slice(0,10),updated_date:p.modified?.slice(0,10)||null,
    image:media?.source_url||null,image_alt:media?.alt_text||'',image_width:media?.media_details?.width||null,image_height:media?.media_details?.height||null,
    author:p._embedded?.author?.[0]?.name||'Professional Academy',reading_time:Math.max(1,Math.ceil(text(result.html).split(/\s+/).length/200)),
    draft:false,body:result.html,html:result.html,
    seo_title:head.title||historicalValue('title'),seo_description:head.description||historicalValue('description'),
    canonical_url:`${SITE}/blog/${p.slug}`,noindex:false,og_image:head.ogImage||media?.source_url||null,keywords:head.keywords||historicalValue('keywords'),
  };
  if(!/^[a-z0-9_%-]+$/.test(p.slug) || !row.title || Number.isNaN(Date.parse(row.pub_date))) result.errors.push('INVALID_REQUIRED_FIELDS');
  return {wpId:p.id,source:p.link,rawHash:hash(p.content.rendered),row,validation:result.validation,errors:result.errors,rewrites:result.rewrites};
}

export function prepare(snapshot) {
  if(snapshot.version!==1 || snapshot.posts.length!==snapshot.expected) throw new Error('INVALID_SNAPSHOT');
  const redirects=redirectMap(snapshot);
  const entries=snapshot.posts.filter(p=>p.id!==3744 && p.slug!=='aprobar-paa-y-sat-2026').map(p=>{
    if(hash(p.content.rendered)!==snapshot.hashes[p.slug]) throw new Error(`SOURCE_HASH_CHANGED:${p.slug}`);
    if(p.status!=='publish') throw new Error('NON_PUBLIC_SOURCE');
    return preparePost(p,snapshot,redirects);
  });
  const h=snapshot.history.find(h=>h.database==='proacade_wp2017');
  const old=h?.articles.find(p=>Number(p.ID)===3744);
  const held=old?preparePost({id:3744,slug:old.post_name,title:{rendered:old.post_title},content:{rendered:old.post_content},excerpt:{rendered:old.post_excerpt},date:old.post_date,modified:old.post_modified,link:old.guid,_embedded:{'wp:term':[h.terms.filter(t=>Number(t.object_id)===3744)]}},snapshot,redirects):null;
  if(held){held.status='REQUIERE_APROBACION_EDITORIAL';held.row.draft=true;}
  return {version:1,snapshotHash:hash(snapshot),entries,redirects,held,errors:entries.flatMap(e=>e.errors.map(error=>({slug:e.row.slug,error})))};
}
