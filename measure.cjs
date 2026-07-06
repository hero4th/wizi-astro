const http = require("http");
const getJSON = (url) => new Promise((res, rej) => { const q = http.get(url, (r) => { let d=""; r.on("data",c=>d+=c); r.on("end",()=>res(JSON.parse(d))); }); q.on("error",rej); });
(async () => {
  const t = await getJSON("http://localhost:9222/json");
  const page = t.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  let id=0; const pend=new Map();
  ws.onmessage=(ev)=>{const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id);}};
  const send=(method,params={})=>new Promise(r=>{const mid=++id;pend.set(mid,r);ws.send(JSON.stringify({id:mid,method,params}));});
  await send("Runtime.enable");
  await send("Page.navigate", { url: "http://localhost:4321/cursos/toefl-ibt/precios/?v="+Date.now() });
  await new Promise(r=>setTimeout(r,6000));
  const expr = `(()=>{
    const out={};
    out.mqLg = matchMedia('(min-width:64rem)').matches;
    out.htmlFont = getComputedStyle(document.documentElement).fontSize;
    const cardsGrid = document.querySelector('[aria-label^="Planes"] .grid');
    out.cardsCols = cardsGrid ? getComputedStyle(cardsGrid).gridTemplateColumns : 'none';
    // find a lg:grid-cols-3 rule presence
    let has3=false, hasLgWrap=false;
    for(const sheet of document.styleSheets){ try{ for(const r of sheet.cssRules){ if(r.type===4 && r.conditionText && r.conditionText.includes('64rem')){ hasLgWrap=true; for(const ir of r.cssRules){ if(ir.selectorText && ir.selectorText.includes('grid-cols-\\[1fr_1fr\\]')){ has3=true; } } } } }catch(e){} }
    out.hasLgMediaBlock=hasLgWrap; out.lgGridRuleInMedia=has3;
    return JSON.stringify(out);
  })()`;
  const res = await send("Runtime.evaluate", { expression: expr, returnByValue:true });
  console.log(res.result.value);
  ws.close(); setTimeout(()=>process.exit(0),200);
})();
