import { launch, connect, sleep, saveShot, BASE, SHOTS } from "./cdp.mjs";

const VIEWPORTS = [
  { name: "1476x832-freya", width: 1476, height: 832, desktop: true },
  { name: "1440x900", width: 1440, height: 900, desktop: true },
  { name: "1280x800", width: 1280, height: 800, desktop: true },
  { name: "1920x1080", width: 1920, height: 1080, desktop: true },
  { name: "900x1200-tablet", width: 900, height: 1200, desktop: false },
  { name: "390x844-mobile", width: 390, height: 844, desktop: false, touch: true },
];

const results = [];
const record = (n, ok, d = "") => {
  results.push({ n, ok, d });
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? " — " + d : ""}`);
};

const { proc, wsUrl } = await launch(9336);
const browser = await connect(wsUrl);

const MEASURE = `(() => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const copyEl = document.querySelector('h1')?.closest('div');
  const stage = document.querySelector('[data-tree-stage]');
  return {
    copy: box(copyEl),
    figure: box(document.querySelector('img[alt*="Freya"]')),
    shiba: box(document.querySelector('[data-shiba]')),
    tree: box(stage),
    treePhase: stage?.dataset.phase,
    shibaState: document.querySelector('[data-shiba]')?.dataset.loadState,
    mailbox: box(document.querySelector('a[href$="/contact"]')),
    roots: box(document.querySelector('nav[aria-label="项目根系"]')),
    horizonPx: Math.round(document.querySelector('main').getBoundingClientRect().height * 0.58),
    vw: window.innerWidth,
    vh: window.innerHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
})()`;

for (const vp of VIEWPORTS) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (m, p = {}) => browser.send(m, p, sessionId);
  const errors = [], bad = [];
  browser.on("Runtime.exceptionThrown", (p) => errors.push(p.exceptionDetails?.text ?? "pageerror"));
  browser.on("Network.responseReceived", (p) => { if (p.response.status >= 400) bad.push(`${p.response.status} ${p.response.url}`); });

  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.width, height: vp.height, mobile: Boolean(vp.touch),
    deviceScaleFactor: 1, screenWidth: vp.width, screenHeight: vp.height,
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: Boolean(vp.touch), maxTouchPoints: 5 });
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(4200);

  const m = (await send("Runtime.evaluate", { expression: MEASURE, returnByValue: true })).result.value;
  const tag = vp.name;

  record(`[${tag}] 树到达 idle、柴犬 ready`, m.treePhase === "idle" && m.shibaState === "ready", `tree=${m.treePhase} shiba=${m.shibaState}`);
  record(`[${tag}] 无横向溢出`, m.overflowX <= 0, `overflowX=${m.overflowX}`);
  record(`[${tag}] 树冠未被顶边裁切`, m.tree && m.tree.t >= 0, `treeTop=${m.tree?.t}`);
  record(`[${tag}] 无 console/page error`, errors.length === 0, errors.join(" | "));
  record(`[${tag}] 无资源 4xx/5xx`, bad.length === 0, bad.slice(0, 2).join(" | "));

  if (vp.desktop) {
    const overlap = m.copy && m.figure && !(m.figure.l >= m.copy.r || m.figure.r <= m.copy.l);
    record(`[${tag}] 人物不遮挡文案栏`, !overlap,
      `copy ${m.copy?.l}…${m.copy?.r} / figure ${m.figure?.l}…${m.figure?.r}`);

    const trunkCx = m.tree ? (m.tree.l + m.tree.r) / 2 : 0;
    const shibaCx = m.shiba ? (m.shiba.l + m.shiba.r) / 2 : 0;
    const gap = Math.round(Math.abs(trunkCx - shibaCx));
    record(`[${tag}] 柴犬不压在树干上（≥100px）`, gap >= 100, `gap=${gap}px`);

    record(`[${tag}] 信箱宽度 112–156px`, m.mailbox && m.mailbox.w >= 112 && m.mailbox.w <= 156, `w=${m.mailbox?.w}`);

    record(`[${tag}] 树完整落在视口内`, m.tree && m.tree.r <= m.vw && m.tree.l >= 0, `tree ${m.tree?.l}…${m.tree?.r} / vw=${m.vw}`);
  }

  record(`[${tag}] 根系不越出视口底部`, m.roots && m.roots.b <= m.vh, `rootsBottom=${m.roots?.b} vh=${m.vh}`);

  const { data } = await send("Page.captureScreenshot", { format: "png" });
  saveShot(SHOTS, `L-${tag}`, data);
  await browser.send("Target.closeTarget", { targetId });
}

console.log("\n===== 版式汇总 =====");
const f = results.filter((r) => !r.ok);
console.log(`共 ${results.length} 项，通过 ${results.length - f.length}，失败 ${f.length}`);
f.forEach((x) => console.log(`  FAIL ${x.n} — ${x.d}`));
proc.kill();
process.exit(f.length === 0 ? 0 : 1);
