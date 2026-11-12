const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".xml": "application/xml",
  ".ico": "image/x-icon"
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(root, p);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  } else if (!fs.existsSync(file) && !path.extname(file)) {
    if (fs.existsSync(file + ".html")) file = file + ".html";
    else if (fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("404"); return; }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });
    res.end(data);
  });
}).listen(4321, () => console.log("serving on http://localhost:4321"));
