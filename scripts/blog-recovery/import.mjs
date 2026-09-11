import fs from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { neon } from '@neondatabase/serverless';
import { load } from 'cheerio';
import { prepare, hash, SITE } from './prepare.mjs';

const args=process.argv.slice(2);
const flag=name=>args.includes(name);
const value=name=>args[args.indexOf(name)+1];
const snapshotPath=flag('--snapshot')?value('--snapshot'):null;
const mode=flag('--apply')?'apply':flag('--prepare')?'prepare':'dry-run';
const reportPath=flag('--report')?value('--report'):'snapshots/recovery-plan.json';
const write=async(file,data)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});};
const safeError=err=>/^[A-Z][A-Z0-9_:.-]+$/.test(err.message)?err.message:'RECOVERY_FAILED_SEE_LOCAL_CONFIGURATION';

export function planAgainst(prepared,rows) {
  const bySlug=new Map(rows.map(r=>[r.slug,r]));
  return {
    newEntries:prepared.entries.filter(e=>!bySlug.has(e.row.slug)),
    conflicts:prepared.entries.filter(e=>bySlug.has(e.row.slug)).map(e=>({slug:e.row.slug,id:bySlug.get(e.row.slug).id,draft:bySlug.get(e.row.slug).draft,reason:'EXISTING_SLUG_NEVER_OVERWRITE'})),
  };
}

async function images(prepared,download=false) {
  const refs=new Map();
  const add=(url,slug)=>{if(!url)return;try{url=new URL(url,'https://cms.proacademymx.com').href;}catch{return;}if(!refs.has(url))refs.set(url,new Set());refs.get(url).add(slug);};
  for(const e of prepared.entries) {
    add(e.row.image,e.row.slug);add(e.row.og_image,e.row.slug);
    const $=load(e.row.html,null,false);
    $('img').each((i,node)=>{add($(node).attr('src'),e.row.slug);});
    $('[srcset]').each((i,node)=>{for(const item of $(node).attr('srcset').split(','))add(item.trim().split(/\s+/)[0],e.row.slug);});
  }
  const results=[];
  for(const [url,slugs] of refs) {
    const entry={url,slugs:[...slugs]};
    const u=new URL(url);
    // Never fetch arbitrary hosts from CMS markup (SSRF/credentials). Keep external references.
    if(u.protocol!=='https:' || !['cms.proacademymx.com','www.proacademymx.com','proacademymx.com'].includes(u.hostname) || !u.pathname.startsWith('/wp-content/uploads/')){
      results.push({...entry,status:'NOT_CHECKED_EXTERNAL'});continue;
    }
    try {
      const r=await fetch(url,{method:download?'GET':'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});
      const mime=r.headers.get('content-type')?.split(';')[0];
      if(!r.ok || !['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(mime))throw new Error(`HTTP_${r.status}_OR_UNSUPPORTED_IMAGE`);
      if(download){
        const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'}[mime];
        const bytes=Buffer.from(await r.arrayBuffer());
        if(bytes.length>20*1024*1024)throw new Error('IMAGE_TOO_LARGE');
        const local=`/blog/wordpress-images/${hash(bytes).slice(0,24)}.${ext}`;
        await fs.mkdir('public/blog/wordpress-images',{recursive:true});await fs.writeFile(`public${local}`,bytes);
        entry.local=local;
      }
      results.push({...entry,status:download?'RECOVERED':'AVAILABLE'});
    } catch (error) { results.push({...entry,status:'FAILED',error:/^HTTP_\d+_OR_UNSUPPORTED_IMAGE$|^IMAGE_TOO_LARGE$/.test(error.message)?error.message:'HTTP_TIMEOUT_OR_NETWORK_ERROR'}); }
  }
  if(download){
    const replacements=new Map(results.filter(r=>r.local).map(r=>[r.url,r.local]));
    for(const e of prepared.entries){
      const $=load(e.row.html,null,false);
      $('img').each((i,node)=>{const src=$(node).attr('src');if(replacements.has(src))$(node).attr('src',replacements.get(src));});
      $('[srcset]').each((i,node)=>{$(node).attr('srcset',$(node).attr('srcset').split(',').map(item=>{const [src,...rest]=item.trim().split(/\s+/);return [replacements.get(src)||src,...rest].join(' ');}).join(', '));});
      e.row.html=$.html();e.row.body=e.row.html;
      for(const key of ['image','og_image'])e.row[key]=replacements.get(e.row[key])||e.row[key];
    }
  }
  return results;
}

async function main() {
  if(!snapshotPath)throw new Error('SNAPSHOT_REQUIRED');
  const snapshot=JSON.parse(await fs.readFile(snapshotPath,'utf8'));
  const prepared=prepare(snapshot);
  await write(`${snapshotPath}.prepared.json`,prepared);
  const report={version:1,mode,createdAt:new Date().toISOString(),snapshotPath,snapshotHash:hash(snapshot),found:prepared.entries.length,preparedHash:hash(prepared),editorialHold:prepared.held?.status||'MISSING_3744',redirects:prepared.redirects,contentValidation:prepared.entries.map(e=>({slug:e.row.slug,...e.validation,errors:e.errors})),errors:[...prepared.errors]};
  if(flag('--check-images') || flag('--download-images')){
    report.images=await images(prepared,flag('--download-images'));
    report.preparedHash=hash(prepared);
    await write(`${snapshotPath}.prepared.json`,prepared);
  }
  if(mode==='prepare'){
    report.databaseChecked=false;
    await write(reportPath,report);
    console.log(JSON.stringify({mode,found:report.found,errors:report.errors.length,redirects:Object.keys(report.redirects).length,editorialHold:report.editorialHold,report:reportPath}));
    if(report.errors.length)process.exitCode=1;
    return;
  }
  if(!process.env.DATABASE_URL || !flag('--target')) {
    report.errors.push({error:'TARGET_POSTGRES_ACCESS_NOT_VERIFIED'});
    await write(reportPath,report);
    throw new Error('TARGET_POSTGRES_ACCESS_NOT_VERIFIED');
  }
  const target=JSON.parse(await fs.readFile(value('--target'),'utf8'));
  const url=new URL(process.env.DATABASE_URL);
  if(target.publicOrigin!==SITE || !(target.vercelProjectId || target.neonProjectId) || !target.hostname || !target.database || url.hostname!==target.hostname || decodeURIComponent(url.pathname.slice(1))!==target.database || !target.existingSlugs?.length)throw new Error('TARGET_IDENTITY_MISMATCH');
  const sql=neon(process.env.DATABASE_URL);
  const read=()=>sql.transaction([sql`SELECT current_database() AS database`,sql`SELECT * FROM posts ORDER BY id`],{readOnly:true,isolationLevel:'RepeatableRead'});
  const [identity,rows]=await read();
  if(identity[0].database!==target.database || target.existingSlugs.some(s=>!rows.some(r=>r.slug===s)))throw new Error('TARGET_BASELINE_MISMATCH');
  const baseline=rows.map(r=>({id:r.id,slug:r.slug,title:r.title,url:`${SITE}/blog/${r.slug}`,draft:r.draft,hash:hash(r)}));
  const plan=planAgainst(prepared,rows);
  Object.assign(report,{target:{hostname:target.hostname,database:target.database,projectId:target.vercelProjectId || target.neonProjectId},databaseChecked:true,baseline,baselineHash:hash(baseline),beforePublished:rows.filter(r=>!r.draft).length,newArticles:plan.newEntries.length,conflicts:plan.conflicts,omitted:1});
  // A draft at a historical destination cannot be silently treated as a working URL.
  for(const conflict of plan.conflicts.filter(c=>c.draft))report.errors.push({slug:conflict.slug,error:'HISTORICAL_DESTINATION_IS_DRAFT'});
  if(!prepared.held)report.errors.push({error:'EDITORIAL_BACKUP_MISSING'});
  if(mode==='dry-run'){
    await write(reportPath,report);
    await write(`${reportPath}.baseline.json`,rows);
    console.log(JSON.stringify({mode,found:report.found,new:report.newArticles,conflicts:report.conflicts.length,before:report.beforePublished,errors:report.errors.length,report:reportPath}));
    if(report.errors.length)process.exitCode=1;
    return;
  }
  if(!flag('--plan'))throw new Error('VALIDATED_DRY_RUN_REQUIRED');
  const prior=JSON.parse(await fs.readFile(value('--plan'),'utf8'));
  if(prior.mode!=='dry-run' || prior.errors.length || report.errors.length || prior.snapshotHash!==report.snapshotHash || prior.preparedHash!==report.preparedHash || prior.baselineHash!==report.baselineHash || hash(prior.target)!==hash(report.target))throw new Error('DRY_RUN_STALE_OR_UNSAFE');
  // Immutable pre-write backup; INSERT only, database UNIQUE protects concurrent creators.
  const receiptPath=`snapshots/applied-${Date.now()}.json`;
  await write(`${receiptPath}.before.json`,rows);
  const columns=Object.keys(prepared.entries[0].row);
  const queries=plan.newEntries.map(e=>sql.query(
    `INSERT INTO posts (${columns.map(c=>`"${c}"`).join(',')}) VALUES (${columns.map((c,i)=>`$${i+1}${c==='categories'?'::jsonb':''}`).join(',')}) ON CONFLICT (slug) DO NOTHING RETURNING id,slug`,
    columns.map(c=>c==='categories'?JSON.stringify(e.row[c]):e.row[c]),
  ));
  const inserted=queries.length?(await sql.transaction(queries,{isolationLevel:'Serializable'})).flat():[];
  await write(receiptPath,{...report,inserted,verification:'PENDING'});
  const [,after]=await read();
  const altered=baseline.filter(b=>!after.some(r=>r.id===b.id && hash(r)===b.hash));
  const missing=prepared.entries.filter(e=>!after.some(r=>r.slug===e.row.slug && !r.draft));
  const contentMismatch=inserted.filter(i=>{const expected=prepared.entries.find(e=>e.row.slug===i.slug).row;const actual=after.find(r=>r.id===i.id);return !actual || columns.some(c=>!['pub_date','updated_date'].includes(c) && !isDeepStrictEqual(actual[c],expected[c]));});
  const result={...report,inserted,afterPublished:after.filter(r=>!r.draft).length,alteredExisting:altered,missing:missing.map(e=>e.row.slug),contentMismatch,verification:altered.length||missing.length||contentMismatch.length?'FAILED':'PASSED'};
  await write(receiptPath,result);
  console.log(JSON.stringify({mode,inserted:inserted.length,after:result.afterPublished,verification:result.verification,receipt:receiptPath}));
  if(result.verification!=='PASSED')process.exitCode=1;
}
if(process.argv[1] && import.meta.url===new URL(`file://${path.resolve(process.argv[1])}`).href){
  main().catch(err=>{console.error(safeError(err));process.exitCode=1;});
}
