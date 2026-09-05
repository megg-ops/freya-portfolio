import { launch, connect, sleep, BASE } from "./cdp.mjs";
const { proc, wsUrl } = await launch(9334);
const browser = await connect(wsUrl);
const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
const send = (m, p = {}) => browser.send(m, p, sessionId);
const byType = new Map();
let total = 0;
browser.on("Network.loadingFinished", () => {});
browser.on("Network.responseReceived", (p) => {
  byType.set(p.type, (byType.get(p.type) ?? 0) + 1);
});
browser.on("Network.dataReceived", (p) => { total += p.encodedDataLength; });
await send("Page.enable"); await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1, screenWidth: 1440, screenHeight: 900 });
const t0 = Date.now();
await send("Page.navigate", { url: BASE + "/" });
let ready = 0;
for (let i = 0; i < 60; i++) {
  await sleep(500);
  const r = await send("Runtime.evaluate", { expression: `document.querySelector('[data-tree-stage]')?.dataset.phase === 'idle' && document.querySelector('[data-shiba]')?.dataset.loadState === 'ready'`, returnByValue: true });
  if (r.result.value) { ready = Date.now() - t0; break; }
}
await sleep(1500);
console.log("首屏全部资源（树 idle + 柴犬 ready）耗时：", ready ? ready + " ms" : "60s 内未就绪");
console.log("首次加载传输总量：", (total / 1024 / 1024).toFixed(2), "MB");
console.log("请求类型分布：", [...byType].map(([k, v]) => `${k}=${v}`).join(" "));
proc.kill(); process.exit(0);
