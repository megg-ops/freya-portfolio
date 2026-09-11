import { launch, connect, sleep, saveShot, SHOTS } from "./cdp.mjs";

// 子路径验收打的是 gh-pages-sim.mjs，不是普通 preview，所以不用共享的 BASE。
const BASE =
  process.env.QA_SUBPATH_BASE ?? "http://127.0.0.1:4320/freya-portfolio";
const results = [];
const record = (n, ok, d = "") => { results.push({ n, ok, d }); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? " — " + d : ""}`); };

const { proc, wsUrl } = await launch(9335);
const browser = await connect(wsUrl);

async function open(path, wait = 3500) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (m, p = {}) => browser.send(m, p, sessionId);
  const errors = [], badImages = [];
  browser.on("Runtime.exceptionThrown", (p) => errors.push(p.exceptionDetails?.text ?? "pageerror"));
  browser.on("Network.responseReceived", (p) => {
    // 深链接本身按 GitHub Pages 语义返回 404.html，只盯图片/脚本/样式
    if (p.type !== "Document" && p.response.status >= 400) badImages.push(`${p.response.status} ${p.response.url}`);
  });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1, screenWidth: 1440, screenHeight: 900 });
  await send("Page.navigate", { url: BASE + path });
  await sleep(wait);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result.value;
  return { send, ev, errors, badImages, close: () => browser.send("Target.closeTarget", { targetId }), shot: async (n) => saveShot(SHOTS, n, (await send("Page.captureScreenshot", { format: "png" })).data) };
}

{
  const p = await open("/");
  const s = await p.ev(`(() => ({
    tree: document.querySelector('[data-tree-stage]')?.dataset.phase,
    shiba: document.querySelector('[data-shiba]')?.dataset.loadState,
    roots: document.querySelectorAll('nav[aria-label="项目根系"] a').length,
    firstHref: document.querySelector('nav[aria-label="项目根系"] a')?.getAttribute('href'),
    figureSrc: document.querySelector('img[alt*="Freya"]')?.getAttribute('src'),
    cursorVar: getComputedStyle(document.documentElement).getPropertyValue('--butterfly-cursor'),
  }))()`);
  record("子路径首屏：树 idle + 柴犬 ready", s.tree === "idle" && s.shiba === "ready", `tree=${s.tree} shiba=${s.shiba}`);
  record("子路径首屏：6 个根系入口", s.roots === 6, "count=" + s.roots);
  record("路由链接带 base 前缀", (s.firstHref ?? "").startsWith("/freya-portfolio/projects/"), s.firstHref);
  record("图片路径带 base 前缀", (s.figureSrc ?? "").startsWith("/freya-portfolio/assets/"), s.figureSrc);
  record("蝴蝶指针 CSS 变量带 base 前缀", s.cursorVar.includes("/freya-portfolio/assets/ui/"), s.cursorVar.trim());
  record("子路径首屏无图片/脚本 4xx", p.badImages.length === 0, p.badImages.slice(0, 3).join(" | "));
  record("子路径首屏无 page error", p.errors.length === 0, p.errors.join(" | "));
  await p.shot("20-subpath-home");
  await p.close();
}

for (const [path, expect, name] of [
  ["/projects/solopr", "Solo Brand", "项目深链接"],
  ["/resume", "Freya", "履历深链接"],
  ["/contact", "信箱就挂在树下", "联系深链接"],
]) {
  const p = await open(path);
  const text = await p.ev(`document.body.innerText`);
  record(`${name}（404.html 兜底后前端接管）`, text.includes(expect), path);
  record(`${name}：无图片/脚本 4xx`, p.badImages.length === 0, p.badImages.slice(0, 2).join(" | "));
  await p.close();
}

{
  const p = await open("/nope");
  const t = await p.ev(`document.querySelector('h1')?.textContent`);
  record("子路径未知地址走 404 页面", (t ?? "").includes("没有长出"), t);
  await p.shot("21-subpath-404");
  await p.close();
}

console.log("\n===== 子路径汇总 =====");
const f = results.filter((r) => !r.ok);
console.log(`共 ${results.length} 项，通过 ${results.length - f.length}，失败 ${f.length}`);
f.forEach((x) => console.log(`  FAIL ${x.n} — ${x.d}`));
proc.kill(); process.exit(f.length === 0 ? 0 : 1);
