const http = require("http");
const getJSON = (url) => new Promise((res, rej) => { const q = http.get(url, (r) => { let d=""; r.on("data",c=>d+=c); r.on("end",()=>res(JSON.parse(d))); }); q.on("error",rej); });
async function measure(send, url, sel){
  await send("Page.navigate", { url });
  await new Promise(r=>setTimeout(r,5500));
  const expr = `(()=>{const els=[...document.querySelectorAll('.grid')].map(g=>({c:getComputedStyle(g).gridTemplateColumns,cls:g.className.slice(0,70)})); return JSON.stringify(els.slice(0,6));})()`;
  const res = await send("Runtime.evaluate", { expression: expr, returnByValue:true });
  return res.result.value;
}
(async () => {
  const t = await getJSON("http://localhost:9222/json");
  const page = t.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  let id=0; const pend=new Map();
  ws.onmessage=(ev)=>{const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}};
  const send=(method,params={})=>new Promise(r=>{const mid=++id;pend.set(mid,r);ws.send(JSON.stringify({id:mid,method,params}));});
  await send("Runtime.enable");
  console.log("=== TOEFL [slug] ==="); console.log(await measure(send,"http://localhost:4321/cursos/toefl-ibt/?v="+Date.now()));
  console.log("=== PRECIOS ==="); console.log(await measure(send,"http://localhost:4321/cursos/toefl-ibt/precios/?v="+Date.now()));
  ws.close(); setTimeout(()=>process.exit(0),200);
})();
