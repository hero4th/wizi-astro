const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "dist");
const types = { ".html":"text/html",".css":"text/css",".js":"text/javascript",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".json":"application/json",".xml":"application/xml",".ico":"image/x-icon" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let file = path.join(root, p);
  if (!fs.existsSync(file) && !path.extname(file)) file = path.join(root, p, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("404"); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(4321, () => console.log("serving"));
