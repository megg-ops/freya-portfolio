/**
 * 模拟 GitHub Pages 的行为：仓库内容挂在 /freya-portfolio/ 下，
 * 未知路径返回 404.html 且 HTTP 状态为 404（前端路由再接管）。
 * 用来验证子路径部署与深链接刷新，而不是依赖 vite preview 的 SPA fallback。
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.argv[2];
const PREFIX = "/freya-portfolio";
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".webp": "image/webp", ".png": "image/png", ".json": "application/json",
};

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith(PREFIX)) {
    res.writeHead(404).end("not this repo");
    return;
  }
  let rel = url.pathname.slice(PREFIX.length) || "/";
  if (rel.endsWith("/")) rel += "index.html";
  const file = join(ROOT, normalize(rel));
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("dir");
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    // GitHub Pages：未知路径返回 404.html，状态码 404
    res.writeHead(404, { "content-type": "text/html" });
    res.end(await readFile(join(ROOT, "404.html")));
  }
}).listen(4320, "127.0.0.1", () => console.log("gh-pages-sim on 4320"));
