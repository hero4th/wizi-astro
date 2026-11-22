import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from 'cheerio';
import { cleanHtml, prepare, redirectMap, hash } from './prepare.mjs';
import { planAgainst } from './import.mjs';
import { publicBlogLinks } from '../../src/lib/blog-links.ts';
import { extractHeadings } from '../../src/lib/headings.ts';

test('public rendering resolves known course links and retains original heading anchors',()=>{
  const input='<h2 class="wp-block-heading" id="old-anchor" title="Heading">Section</h2><a href="https://cms.proacademymx.com/paa/?x=1#part">PAA</a><a href="https://other.example/paa/">External</a>';
  assert.deepEqual(extractHeadings(input),[{depth:2,slug:'old-anchor',text:'Section'}]);
  const output=publicBlogLinks(input);
  assert.ok(output.includes('https://proacademymx.com/cursos/paa?x=1#part'));
  assert.ok(output.includes('https://other.example/paa/'));
  assert.equal(publicBlogLinks('<a href="https://cms.proacademymx.com/unknown">Keep</a>'),'<a href="https://cms.proacademymx.com/unknown">Keep</a>');
});

test('preserves semantic HTML, anchors and external links while removing executable markup',()=>{
  const original='<div class="pas-post-title-wrap"><h1>Theme title</h1></div><h1 id="original">Article</h1><h2>Section</h2><p>Hello <strong>world</strong> <em>today</em>.</p><ol start="3"><li>First</li></ol><table><caption>Data</caption><tr><th scope="col">A</th><td rowspan="2">B</td></tr></table><figure><img src="https://cms.proacademymx.com/wp-content/uploads/a.webp" alt="Original alt" onerror="alert(1)"><figcaption>Caption</figcaption></figure><blockquote>Quote</blockquote><a href="/old/?x=1#original">Internal</a><a href="https://example.com" target="_blank">External</a><a href="javascript:alert(1)">Unsafe</a><script>alert(1)</script>';
  const result=cleanHtml(original,{'/old':'/blog/old'});
  assert.deepEqual(result.errors,[]);
  const $=load(result.html);
  assert.equal($('h1').attr('id'),'original');
  assert.equal($('a').first().attr('href'),'https://proacademymx.com/blog/old?x=1#original');
  assert.equal($('a').eq(1).attr('href'),'https://example.com');
  assert.equal($('a').eq(2).attr('href'),undefined);
  assert.equal($('img').attr('onerror'),undefined);
  assert.equal($('img').attr('alt'),'Original alt');
  assert.equal($('script').length,0);
  assert.equal($('td').attr('rowspan'),'2');
  assert.equal($('ol').attr('start'),'3');
});

test('keeps compatible embeds and blocks iframe hosts outside the site CSP',()=>{
  const result=cleanHtml('<p>Video</p><iframe src="https://www.youtube-nocookie.com/embed/abc" title="Video"></iframe><iframe src="https://evil.example/embed"></iframe>',{});
  const $=load(result.html);
  assert.equal($('iframe').first().attr('src'),'https://www.youtube-nocookie.com/embed/abc');
  assert.equal($('iframe').last().attr('src'),undefined);
});

test('slug conflicts, including drafts, never enter the insert set; title overlap is not identity',()=>{
  const prepared={entries:[{row:{slug:'existing',title:'Original'}},{row:{slug:'private',title:'Private'}},{row:{slug:'different_slug',title:'Original'}}]};
  const rows=[{id:1,slug:'existing',title:'Original',html:'Must remain',draft:false},{id:2,slug:'private',draft:true}];
  const before=hash(rows);
  const plan=planAgainst(prepared,rows);
  assert.deepEqual(plan.newEntries.map(e=>e.row.slug),['different_slug']);
  assert.equal(plan.conflicts.length,2);
  assert.equal(plan.conflicts.find(c=>c.slug==='private').draft,true);
  assert.equal(hash(rows),before);
});

const snapshotPath=process.env.RECOVERY_TEST_SNAPSHOT;
test('real snapshot: every original article survives and historical routes keep their exact destination',{skip:!snapshotPath},()=>{
  const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
  const result=prepare(snapshot);
  assert.equal(result.entries.length,64);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.held.status,'REQUIERE_APROBACION_EDITORIAL');
  assert.equal(result.held.row.draft,true);
  assert.equal(result.held.wpId,3744);
  assert.deepEqual(result.held.errors,[]);
  assert.equal(result.held.validation.beforeHash,result.held.validation.afterHash);
  assert.ok(result.held.validation.headings.length>0);
  assert.ok(!result.entries.some(e=>e.wpId===3744));
  assert.ok(!Object.values(result.redirects).includes('/blog/aprobar-paa-y-sat-2026'));
  for(const e of result.entries){
    assert.equal(e.validation.beforeHash,e.validation.afterHash,e.row.slug);
    assert.ok(e.validation.after.p>0,e.row.slug);
    // Some originals use bold paragraphs as sections or have no links.
    // Preserve that source faithfully; do not invent headings or anchors.
    assert.deepEqual(e.validation.before,e.validation.after,e.row.slug);
    assert.equal(e.row.body,e.row.html);
    assert.equal(e.row.noindex,false);
    assert.equal(e.row.canonical_url,`https://proacademymx.com/blog/${e.row.slug}`);
    assert.equal(result.redirects[`/${e.row.slug}`],`/blog/${e.row.slug}`);
  }
  for(const slug of snapshot.legacySlugs)assert.equal(result.redirects[`/${slug}`],`/blog/${slug}`);
  assert.equal(result.redirects['/acerca_del_gmat'],'/blog/que_es_el_gmat');
  const edited=structuredClone(snapshot);edited.posts[0].content.rendered+='changed';
  assert.throws(()=>prepare(edited),/SOURCE_HASH_CHANGED/);
  const missing=structuredClone(snapshot);missing.legacySlugs.push('not-in-source');
  assert.throws(()=>redirectMap(missing),/LEGACY_SOURCE_MISSING/);
});
