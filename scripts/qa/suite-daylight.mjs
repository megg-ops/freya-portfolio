import { launch, connect, sleep, saveShot, BASE, SHOTS } from "./cdp.mjs";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, mobile: true, deviceScaleFactor: 1 },
};

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

const { proc, wsUrl } = await launch();
const browser = await connect(wsUrl);

async function newPage() {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const errors = [];
  const failedRequests = [];
  const page = {
    sessionId,
    errors,
    failedRequests,
    send: (method, params = {}) => browser.send(method, params, sessionId),
    close: () => browser.send("Target.closeTarget", { targetId }),
  };
  browser.on("Runtime.consoleAPICalled", (p) => {
    if (p.sessionId !== undefined && p.sessionId !== sessionId) return;
    if (p.type === "error") errors.push("console.error: " + JSON.stringify(p.args?.[0]?.value ?? p.args));
  });
  browser.on("Runtime.exceptionThrown", (p) => {
    errors.push("pageerror: " + (p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text));
  });
  browser.on("Network.loadingFailed", (p) => {
    if (p.type === "Image" || p.type === "Script" || p.type === "Stylesheet" || p.type === "Document") {
      failedRequests.push(`${p.type} ${p.errorText}`);
    }
  });
  browser.on("Network.responseReceived", (p) => {
    if (p.response.status >= 400) failedRequests.push(`${p.response.status} ${p.response.url}`);
  });
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Network.enable");
  return page;
}

async function goto(page, path, { viewport = "desktop", reducedMotion = false, touch = false } = {}) {
  const vp = VIEWPORTS[viewport];
  await page.send("Emulation.setDeviceMetricsOverride", {
    ...vp,
    screenWidth: vp.width,
    screenHeight: vp.height,
  });
  await page.send("Emulation.setTouchEmulationEnabled", {
    enabled: Boolean(touch || vp.mobile),
    maxTouchPoints: 5,
  });
  await page.send("Emulation.setEmulatedMedia", {
    features: reducedMotion ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
  });
  await page.send("Page.navigate", { url: BASE + path });
  await sleep(2600);
}

const evalJs = async (page, expression) => {
  const r = await page.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + JSON.stringify(r.result));
  return r.result.value;
};

const shot = async (page, name) => {
  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  saveShot(SHOTS, name, data);
};

const OVERFLOW = `(() => ({
  h: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  v: document.documentElement.scrollHeight - document.documentElement.clientHeight,
}))()`;

// ---------- 1. 首屏（桌面） ----------
{
  const page = await newPage();
  await goto(page, "/");
  await sleep(3000);
  const state = await evalJs(page, `(() => ({
    tree: document.querySelector('[data-tree-stage]')?.dataset.phase ?? 'missing',
    shiba: document.querySelector('[data-shiba]')?.dataset.loadState ?? 'missing',
    roots: [...document.querySelectorAll('nav[aria-label="项目根系"] a')].map(a => a.id),
    highlights: [...document.querySelectorAll('nav[aria-label="项目根系"] a[data-highlight]')].map(a => a.id),
    resumeHref: document.querySelector('a[href="/resume"]')?.getAttribute('href'),
    contactHref: document.querySelector('a[href="/contact"]')?.getAttribute('href'),
  }))()`);
  record("首屏 1440：7 个根系入口", state.roots.length === 7, state.roots.join(","));
  record("首屏 1440：4 个亮点项目", state.highlights.length === 4, state.highlights.join(","));
  record("首屏 1440：树进入 idle", state.tree === "idle", "tree=" + state.tree);
  record("首屏 1440：柴犬进入 ready", state.shiba === "ready", "shiba=" + state.shiba);
  record("首屏 1440：履历/联系入口存在", !!state.resumeHref && !!state.contactHref);
  const of = await evalJs(page, OVERFLOW);
  record("首屏 1440：无横向溢出", of.h <= 0, `h=${of.h} v=${of.v}`);
  await shot(page, "01-home-1440");
  record("首屏 1440：无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  record("首屏 1440：无资源失败", page.failedRequests.length === 0, page.failedRequests.slice(0, 3).join(" | "));
  await page.close();
}

// ---------- 2. 项目详情深链接刷新（桌面） ----------
{
  const page = await newPage();
  await goto(page, "/projects/jinnang-l10n");
  const detail = await evalJs(page, `(() => {
    const d = document.querySelector('[role="dialog"]');
    if (!d) return { found: false };
    const headings = [...d.querySelectorAll('h3')].map(h => h.textContent.trim());
    return {
      found: true,
      title: d.querySelector('h2')?.textContent.trim(),
      headings,
      evidenceCount: d.querySelectorAll('a[target="_blank"]').length,
      modal: d.getAttribute('aria-modal'),
      labelled: !!d.getAttribute('aria-labelledby'),
      focusInside: d.contains(document.activeElement),
    };
  })()`);
  record("深链接刷新 /projects/jinnang-l10n 直接打开详情", detail.found === true, detail.title ?? "");
  const need = ["问题与用户", "我的角色", "关键产品决策", "工作流程", "成果", "实际边界", "证据入口"];
  const missing = need.filter((h) => !detail.headings?.includes(h));
  record("详情包含全部要求板块", missing.length === 0, missing.join(",") || "全部存在");
  record("详情为可访问弹层 aria-modal+labelledby", detail.modal === "true" && detail.labelled);
  record("打开后焦点进入弹层", detail.focusInside === true);
  const of = await evalJs(page, OVERFLOW);
  record("详情 1440：无横向溢出", of.h <= 0, `h=${of.h}`);
  await shot(page, "02-project-jinnang-1440");
  record("详情 1440：无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 3. 键盘：Escape 关闭并归还焦点 ----------
{
  const page = await newPage();
  await goto(page, "/");
  await sleep(2500);
  await evalJs(page, `document.getElementById('ready2apply').click()`);
  await sleep(700);
  const opened = await evalJs(page, `(() => ({
    dialog: !!document.querySelector('[role="dialog"]'),
    tree: document.querySelector('[data-tree-stage]')?.dataset.phase,
    shiba: document.querySelector('[data-shiba]')?.dataset.loadState,
  }))()`);
  record("点击根系入口打开真实详情", opened.dialog === true, "ready2apply");
  record("打开详情不重挂载场景：树仍 idle、柴犬仍 ready",
    opened.tree === "idle" && opened.shiba === "ready",
    `tree=${opened.tree} shiba=${opened.shiba}`);
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(700);
  const after = await evalJs(page, `(() => ({
    closed: !document.querySelector('[role="dialog"]'),
    path: location.pathname,
    focused: document.activeElement?.id,
  }))()`);
  record("Escape 关闭详情并回到 /", after.closed === true && after.path === "/", after.path);
  record("关闭后焦点回到对应根系入口", after.focused === "ready2apply", "focus=" + after.focused);
  record("键盘流程无错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 4. 手机 390 ----------
{
  const page = await newPage();
  await goto(page, "/", { viewport: "mobile", touch: true });
  await sleep(3000);
  const of = await evalJs(page, OVERFLOW);
  record("首屏 390：无横向溢出", of.h <= 0, `h=${of.h}`);
  const roots = await evalJs(page, `(() => {
    const nav = document.querySelector('nav[aria-label="项目根系"]');
    const r = nav.getBoundingClientRect();
    return { bottom: Math.round(r.bottom), vh: window.innerHeight, count: nav.querySelectorAll('a').length };
  })()`);
  record("首屏 390：根系不越出视口", roots.bottom <= roots.vh, `bottom=${roots.bottom} vh=${roots.vh}`);
  await shot(page, "03-home-390");
  await evalJs(page, `document.getElementById('sisters-festival').click()`);
  await sleep(800);
  const dlg = await evalJs(page, `(() => {
    const d = document.querySelector('[role="dialog"]');
    return d ? { ok: true, w: d.scrollWidth, vw: window.innerWidth } : { ok: false };
  })()`);
  record("首屏 390：触屏点击进入详情", dlg.ok === true);
  record("详情 390：内容不横向溢出", dlg.ok && dlg.w <= dlg.vw + 1, `w=${dlg.w} vw=${dlg.vw}`);
  await shot(page, "04-project-390");
  record("移动端无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  record("移动端无资源失败", page.failedRequests.length === 0, page.failedRequests.slice(0, 3).join(" | "));
  await page.close();
}

// ---------- 5. 履历 ----------
{
  const page = await newPage();
  await goto(page, "/resume");
  // 履历已改为三折页一页纸 CV：原先 13 条的时间线是刻意去掉的——它和项目
  // 列表重复 7 条，一页纸上不该有两套时间叙事。
  await sleep(1800); // 等折页展开动画跑完
  const r = await evalJs(page, `(() => {
    const sheet = document.querySelector('article');
    const panels = [...document.querySelectorAll('article > section')];
    return {
      title: document.querySelector('h1')?.textContent.trim(),
      sections: [...document.querySelectorAll('h2')].map(h => h.textContent.trim()),
      panels: panels.length,
      opened: sheet?.getAttribute('data-opened'),
      wingRotations: panels.map(p => {
        const m = new DOMMatrix(getComputedStyle(p).transform);
        return Math.round(Math.asin(Math.min(1, Math.max(-1, -m.m31))) * 180 / Math.PI);
      }),
      panelOverflow: panels.map(p => p.firstElementChild.scrollHeight - p.firstElementChild.clientHeight),
      projectLinks: document.querySelectorAll('a[href^="/projects/"]').length,
      awards: document.querySelectorAll('article ul')[1]?.children.length ?? 0,
      hasName: document.body.innerText.includes('湖南大学') || document.body.innerText.includes('中南财经'),
      docH: document.documentElement.scrollHeight,
      vh: window.innerHeight,
    };
  })()`);
  record("履历页可读且有内容", !!r.title && r.sections.length >= 6, r.sections.join("/"));
  record("履历是三折页结构", r.panels === 3, "panels=" + r.panels);
  record("折页展开到位（两翼旋转归零）", r.opened === "true" && r.wingRotations.every((d) => Math.abs(d) <= 1), r.wingRotations.join(","));
  record("三个面板都不溢出", r.panelOverflow.every((v) => v <= 0), r.panelOverflow.join(","));
  record("整张纸一屏装得下，不用滚动", r.docH <= r.vh, `docH=${r.docH} vh=${r.vh}`);
  record("履历项目链接指向真实详情", r.projectLinks === 7, "count=" + r.projectLinks);
  record("履历列出奖项", r.awards === 3, "count=" + r.awards);
  record("履历未泄露学校全名", r.hasName === false);
  const of = await evalJs(page, OVERFLOW);
  record("履历 1440：无横向溢出", of.h <= 0, `h=${of.h}`);
  await shot(page, "05-resume-1440");
  record("履历无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));

  await goto(page, "/resume", { viewport: "mobile", touch: true });
  const ofm = await evalJs(page, OVERFLOW);
  record("履历 390：无横向溢出", ofm.h <= 0, `h=${ofm.h}`);
  await shot(page, "06-resume-390");
  await page.close();
}

// ---------- 6. 联系 ----------
{
  const page = await newPage();
  await goto(page, "/contact");
  const c = await evalJs(page, `(() => {
    const a = document.querySelector('a[href^="mailto:"]');
    return {
      mailto: a?.getAttribute('href'),
      label: a?.textContent.trim(),
      hasFakeForm: !!document.querySelector('form'),
      statusEmpty: document.querySelector('[role="status"]')?.textContent.trim() === '',
      github: document.querySelector('a[href*="github.com/megg-ops"]')?.getAttribute('href'),
    };
  })()`);
  record("联系页有真实 mailto 入口", (c.mailto ?? "").startsWith("mailto:freya223@agent.qq.com"), c.mailto?.slice(0, 60));
  record("mailto 按钮文案说明其作用", c.label === "打开你的邮件应用", c.label);
  record("没有假的留言表单", c.hasFakeForm === false);
  record("复制状态初始为空，不预告成功", c.statusEmpty === true);
  record("GitHub 链接存在", !!c.github, c.github);
  const of = await evalJs(page, OVERFLOW);
  record("联系 1440：无横向溢出", of.h <= 0, `h=${of.h}`);
  await shot(page, "07-contact-1440");
  await goto(page, "/contact", { viewport: "mobile", touch: true });
  const ofm = await evalJs(page, OVERFLOW);
  record("联系 390：无横向溢出", ofm.h <= 0, `h=${ofm.h}`);
  await shot(page, "08-contact-390");
  record("联系页无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 6.5 星夜接缝 ----------
// 星夜模式本身由另一条线并行实现，这里只锁住接缝：路由通、切换可双向、
// 与日光共用同一份项目数据。接缝坏了要在这里就被发现，而不是等合并时。
{
  const page = await newPage();
  await goto(page, "/");
  const toggle = await evalJs(page, `(() => {
    const el = document.querySelector('a[href="/stars"]');
    return { exists: !!el, label: el?.getAttribute('aria-label') };
  })()`);
  record("首屏有通往星夜的入口", toggle.exists === true, toggle.label ?? "");

  await goto(page, "/stars");
  const stars = await evalJs(page, `(() => ({
    heading: document.querySelector('h1')?.textContent.trim(),
    world: document.documentElement.dataset.world,
    projects: document.querySelectorAll('a[href^="/projects/"]').length,
    back: !!document.querySelector('a[href="/"]'),
  }))()`);
  record("/stars 深链接可直接打开", !!stars.heading, stars.heading);
  record("星夜标记 data-world=stars", stars.world === "stars", "world=" + stars.world);
  record("星夜与日光共用同一份项目数据", stars.projects === 7, "count=" + stars.projects);
  record("星夜可回到日光", stars.back === true);
  const of = await evalJs(page, OVERFLOW);
  record("星夜 1440：无横向溢出", of.h <= 0, `h=${of.h}`);
  record("星夜无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  await shot(page, "13-starnight-1440");
  await page.close();
}

// ---------- 7. 未知路由 ----------
{
  const page = await newPage();
  await goto(page, "/projects/does-not-exist");
  const a = await evalJs(page, `(() => ({ h1: document.querySelector('h1')?.textContent.trim(), links: document.querySelectorAll('a').length }))()`);
  record("未知项目 id 走 404 而不是空弹层", (a.h1 ?? "").includes("没有长出"), a.h1);
  await goto(page, "/random/deep/path");
  const b = await evalJs(page, `document.querySelector('h1')?.textContent.trim()`);
  record("未知深路径走 404", (b ?? "").includes("没有长出"), b);
  await shot(page, "09-404");
  await page.close();
}

// ---------- 8. 减少动态效果 ----------
{
  const page = await newPage();
  await goto(page, "/", { reducedMotion: true });
  await sleep(3000);
  const s = await evalJs(page, `(() => ({
    tree: document.querySelector('[data-tree-stage]')?.dataset.phase,
    shiba: document.querySelector('[data-shiba]')?.dataset.loadState,
  }))()`);
  record("reduced-motion：树仍到达终态", s.tree === "idle", "tree=" + s.tree);
  await shot(page, "10-home-reduced-motion");
  await goto(page, "/projects/empirical-paper", { reducedMotion: true });
  const d = await evalJs(page, `!!document.querySelector('[role="dialog"]')`);
  record("reduced-motion：详情可打开", d === true);
  await shot(page, "11-project-reduced-motion");
  record("reduced-motion 无错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 9. 资源失败降级 ----------
{
  const page = await newPage();
  await page.send("Network.setBlockedURLs", { urls: ["*/assets/tree/spring/04-layer.webp"] });
  await goto(page, "/");
  await sleep(3500);
  const s = await evalJs(page, `(() => ({
    stage: document.querySelector('[data-tree-stage]')?.dataset.phase,
    retry: !!document.body.innerText.match(/重试/),
    bodyVisible: document.body.innerText.includes('Freya'),
  }))()`);
  record("树图层失败：不永远卡在加载层，给出重试", s.retry === true, "stage=" + s.stage);
  record("树失败时正文仍可读", s.bodyVisible === true);
  await shot(page, "12-tree-asset-failure");
  await page.close();
}

console.log("\n===== 汇总 =====");
const failed = results.filter((r) => !r.ok);
console.log(`共 ${results.length} 项，通过 ${results.length - failed.length}，失败 ${failed.length}`);
failed.forEach((f) => console.log(`  FAIL ${f.name} — ${f.detail}`));

proc.kill();
process.exit(failed.length === 0 ? 0 : 1);
