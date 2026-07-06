const fs = require("fs"), http = require("http");
const OUT = process.argv[2] || "shot.png";
const PATHQ = process.argv[3] || "/";
const MODE = process.argv[4] || "full";
const LOG = OUT + ".log"; const log = (m) => fs.appendFileSync(LOG, m + "\n"); fs.writeFileSync(LOG, "start\n");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (url) => new Promise((res, rej) => { const q = http.get(url, (r) => { let d=""; r.on("data",c=>d+=c); r.on("end",()=>{try{res(JSON.parse(d))}catch(e){rej(e)}}); }); q.on("error",rej); q.setTimeout(3000,()=>q.destroy(new Error("t"))); });
(async () => {
  let page = null;
  for (let i=0;i<25&&!page;i++){ try{ const t=await getJSON("http://localhost:9222/json"); page=t.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);}catch{} if(!page)await sleep(600); }
  if(!page){log("no target");return;}
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((rs,rj)=>{ws.onopen=rs;ws.onerror=()=>rj(new Error("wsfail"))});
  log("ws open");
  let id=0; const pend=new Map();
  ws.onmessage=(ev)=>{try{const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}}catch{}};
  const send=(method,params={})=>new Promise(r=>{const mid=++id;pend.set(mid,r);ws.send(JSON.stringify({id:mid,method,params}));});
  await send("Page.enable"); await send("Runtime.enable");
  await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Page.navigate", { url: "http://localhost:4321" + PATHQ });
  await sleep(6500);
  if (MODE.startsWith("scroll:")) { const y=parseInt(MODE.slice(7),10)||0; await send("Runtime.evaluate",{expression:`window.scrollTo(0,${y})`}); await sleep(2500); }
  let params = { format:"png" };
  if (MODE === "full") params.captureBeyondViewport = true;
  const shot = await send("Page.captureScreenshot", params);
  if(shot&&shot.data){fs.writeFileSync(OUT,Buffer.from(shot.data,"base64"));log("wrote");}else log("no data");
  ws.close();
})().catch(e=>log("FATAL "+e.message)).finally(()=>setTimeout(()=>process.exit(0),300));
