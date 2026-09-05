/**
 * SPA 深链接兜底。
 * - `404.html`：GitHub Pages 对未知路径返回它，前端路由再接管。
 * - `_redirects`：Cloudflare Pages / Netlify 的 SPA fallback，由 public/ 直接复制。
 * 两份产物同时存在，换平台不用改构建。
 */
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const index = resolve(dist, "index.html");

if (!existsSync(index)) {
  console.error("postbuild: dist/index.html 不存在，构建可能失败了。");
  process.exit(1);
}

copyFileSync(index, resolve(dist, "404.html"));
console.log("postbuild: 已生成 dist/404.html");
