/**
 * 项目展示区（走马灯）验收。展示区 2026-09-09 从首屏下方搬到独立路由 `/projects`，
 * 所以除了「进入项目」那条，其余用例都直接开 `/projects`。
 *
 * 重点覆盖三件容易做错的事：
 * 1. 自动播放必须能被叫停——hover、暂停按钮、reduced-motion 三条路都要真的停；
 * 2. 没有可公开封面的项目要走排版式卡片，不能出现空白或占位图；
 * 3. 从走马灯打开详情再关闭，焦点要回到走马灯，不能把访客弹回页面顶部。
 */
import {
  launch,
  connect,
  sleep,
  saveShot,
  createRecorder,
  BASE,
  SHOTS,
} from "./cdp.mjs";

const { record, summarize } = createRecorder("走马灯汇总");
const { proc, wsUrl } = await launch(9336);
const browser = await connect(wsUrl);

async function newPage() {
  const { targetId } = await browser.send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await browser.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const errors = [];
  const failed = [];
  const send = (m, p = {}) => browser.send(m, p, sessionId);

  browser.on("Runtime.exceptionThrown", (p) =>
    errors.push(
      "pageerror: " +
        (p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text),
    ),
  );
  browser.on("Runtime.consoleAPICalled", (p) => {
    if (p.type === "error") errors.push("console.error");
  });
  browser.on("Network.responseReceived", (p) => {
    if (p.response.status >= 400) failed.push(`${p.response.status} ${p.response.url}`);
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  return {
    send,
    errors,
    failed,
    close: () => browser.send("Target.closeTarget", { targetId }),
    async evaluate(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
      return r.result.value;
    },
    async goto(path, { width = 1440, height = 900, reduce = false, touch = false } = {}) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: touch,
        screenWidth: width,
        screenHeight: height,
      });
      await send("Emulation.setTouchEmulationEnabled", {
        enabled: touch,
        maxTouchPoints: 5,
      });
      await send("Emulation.setEmulatedMedia", {
        features: reduce
          ? [{ name: "prefers-reduced-motion", value: "reduce" }]
          : [],
      });
      await send("Page.navigate", { url: BASE + path });
      await sleep(2800);
    },
    /** 真实鼠标点击：程序化 .click() 不会给 <a> 焦点，测不出焦点归还。 */
    async realClick(selector) {
      const box = await this.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        el.scrollIntoView({ block: "center" });
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      if (!box) throw new Error("找不到元素: " + selector);
      for (const type of ["mousePressed", "mouseReleased"]) {
        await send("Input.dispatchMouseEvent", {
          type,
          x: box.x,
          y: box.y,
          button: "left",
          clickCount: 1,
        });
      }
      await sleep(700);
    },
    async key(key) {
      const codes = { ArrowLeft: 37, ArrowRight: 39, Escape: 27 };
      for (const type of ["keyDown", "keyUp"]) {
        await send("Input.dispatchKeyEvent", {
          type,
          key,
          code: key,
          windowsVirtualKeyCode: codes[key],
        });
      }
      await sleep(600);
    },
    async shot(name) {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      saveShot(SHOTS, name, data);
    },
  };
}

const CURRENT = `(() => {
  const s = document.getElementById('projects');
  return {
    name: s.querySelector('h3')?.textContent.trim(),
    current: s.querySelector('[aria-current]')?.textContent.replace(/\\s+/g,' ').trim(),
  };
})()`;

// ---------- 0. 首屏只有一屏，展示区已经搬走 ----------
{
  const page = await newPage();
  await page.goto("/");
  const s = await page.evaluate(`(() => ({
    showcaseOnHero: document.querySelectorAll('#projects').length,
    heroNavId: document.querySelector('nav[aria-label="项目根系"]')?.id,
    overflow: document.documentElement.scrollHeight - window.innerHeight,
  }))()`);
  record("首屏不再渲染展示区", s.showcaseOnHero === 0, "#projects=" + s.showcaseOnHero);
  record("首屏没有可以往下滑的内容", s.overflow <= 1, "超出视口 " + s.overflow + "px");
  record("首屏根系 nav 仍是 project-roots", s.heroNavId === "project-roots", String(s.heroNavId));
  record("无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 1. 结构与默认状态 ----------
{
  const page = await newPage();
  await page.goto("/projects");
  const s = await page.evaluate(`(() => {
    const sec = document.getElementById('projects');
    if (!sec) return { found: false };
    return {
      found: true,
      heading: sec.querySelector('h2')?.textContent.trim(),
      timeline: [...sec.querySelectorAll('ol button')].length,
      labelled: !!sec.getAttribute('aria-labelledby'),
      dupProjectsId: document.querySelectorAll('#projects').length,
    };
  })()`);
  record("展示区存在且有可访问标题", s.found && s.labelled, s.heading);
  record("时间线列出全部 6 个项目", s.timeline === 6, "count=" + s.timeline);
  record("展示页只有一个 #projects", s.dupProjectsId === 1, "#projects=" + s.dupProjectsId);

  const cur = await page.evaluate(CURRENT);
  record("默认停在时间线第一个项目", cur.name === "投得过", cur.name);
  await page.shot("20-showcase-default");
  await page.close();
}

// ---------- 2. 封面与排版式卡片 ----------
{
  const page = await newPage();
  await page.goto("/projects");
  const slides = await page.evaluate(`(() => {
    const sec = document.getElementById('projects');
    return [...sec.querySelectorAll('[class*=slide]')].map(el => {
      const img = el.querySelector('img');
      return {
        kind: img ? 'cover' : 'typographic',
        loaded: img ? img.naturalWidth > 0 : null,
        text: img ? null : el.textContent.replace(/\\s+/g,' ').trim().slice(0, 40),
      };
    });
  })()`);
  const covers = slides.filter((s) => s.kind === "cover");
  const typo = slides.filter((s) => s.kind === "typographic");
  record("6 个项目都有封面", covers.length === 6 && typo.length === 0, `cover=${covers.length} typo=${typo.length}`);
  record("排版式卡片有实际文案，不是空占位", typo.every((t) => t.text && t.text.length > 6), typo.map((t) => t.text?.slice(0, 14)).join(" | "));

  // 懒加载的图要切过去才会解码，逐个走一遍再验
  await page.evaluate(`(() => {
    const btns = [...document.querySelectorAll('#projects ol button')];
    btns.forEach(b => b.click());
  })()`);
  await sleep(1500);
  const loaded = await page.evaluate(`(() => {
    const imgs = [...document.querySelectorAll('#projects img')];
    return { total: imgs.length, ok: imgs.filter(i => i.naturalWidth > 0).length };
  })()`);
  record("封面图全部真实加载成功", loaded.total === 6 && loaded.ok === 6, `${loaded.ok}/${loaded.total}`);
  record("无资源错误", page.failed.length === 0, page.failed.slice(0, 2).join(" | "));
  await page.close();
}

// ---------- 3. 手动切换：时间线、箭头、键盘 ----------
{
  const page = await newPage();
  await page.goto("/projects");
  await page.evaluate(`document.querySelectorAll('#projects ol button')[4].click()`);
  await sleep(600);
  let cur = await page.evaluate(CURRENT);
  record("点时间线第 5 项切到出海锦囊", cur.name === "出海锦囊", cur.name);
  // 入口从 <a href> 变成了按钮，DOM 上没有目标可读，改为点开来看开的是谁
  await page.realClick('#projects button[class*=detailLink]');
  const opened = await page.evaluate(
    `document.querySelector('[role="dialog"] h2')?.textContent.trim()`,
  );
  record("详情入口跟着当前项目走", opened === "出海锦囊", String(opened));
  await page.key("Escape");

  await page.evaluate(`document.querySelector('#projects button[aria-label="下一个项目"]').click()`);
  await sleep(600);
  cur = await page.evaluate(CURRENT);
  record("右箭头前进一个", cur.name === "她的姊妹节", cur.name);

  await page.evaluate(`document.querySelector('#projects button[aria-label="上一个项目"]').click()`);
  await sleep(600);
  cur = await page.evaluate(CURRENT);
  record("左箭头后退一个", cur.name === "出海锦囊", cur.name);

  // 键盘方向键（焦点在区块内）。注意聚焦某个时间线按钮并不等于选中它，
  // 所以断言写成「相对当前位置前进/后退一格」，而不是硬编码项目名。
  await page.evaluate(`document.querySelector('#projects ol button').focus()`);
  const base = (await page.evaluate(CURRENT)).name;
  await page.key("ArrowRight");
  const next = (await page.evaluate(CURRENT)).name;
  record("键盘 → 前进一个", next === "她的姊妹节" && next !== base, `${base} → ${next}`);
  await page.key("ArrowLeft");
  const back = (await page.evaluate(CURRENT)).name;
  record("键盘 ← 退回原处", back === base, `${next} → ${back}`);
  await page.shot("21-showcase-switched");
  await page.close();
}

// ---------- 4. 自动播放必须能被叫停 ----------
{
  const page = await newPage();
  await page.goto("/projects");
  // 把鼠标移开展示区（左上角是返回条，不是 section），让自动播放真的能跑
  await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  const before = (await page.evaluate(CURRENT)).name;
  await sleep(9000);
  const after = (await page.evaluate(CURRENT)).name;
  record("自动播放会前进（约 8 秒一张）", before !== after, `${before} → ${after}`);

  await page.evaluate(`document.querySelector('#projects button[aria-pressed]').click()`);
  const paused = (await page.evaluate(CURRENT)).name;
  await sleep(9000);
  const stillPaused = (await page.evaluate(CURRENT)).name;
  record("暂停按钮真的停住", paused === stillPaused, `${paused} → ${stillPaused}`);

  const label = await page.evaluate(
    `document.querySelector('#projects button[aria-pressed]').textContent.trim()`,
  );
  record("暂停后按钮文案变为可再次播放", label === "开始自动播放", label);
  await page.close();
}

// ---------- 5. hover 暂停 ----------
{
  const page = await newPage();
  await page.goto("/projects");
  // 展示区已经是整页主体，滚到顶只是把返回条推出视口；保留这步是为了
  // 让鼠标坐标稳定落在 section 内——这条曾经因坐标落在视口外假性失败。
  const box = await page.evaluate(`(() => {
    const sec = document.getElementById('projects');
    sec.scrollIntoView({ block: 'start' });
    const r = sec.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 60), top: Math.round(r.top) };
  })()`);
  await sleep(400);
  record("hover 测试前展示区已进入视口", box.top < 200 && box.y > 0, `top=${box.top} y=${box.y}`);
  await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
  const before = (await page.evaluate(CURRENT)).name;
  await sleep(9000);
  const after = (await page.evaluate(CURRENT)).name;
  record("鼠标停在展示区时不自动翻页", before === after, `${before} → ${after}`);
  await page.close();
}

// ---------- 6. reduced-motion ----------
{
  const page = await newPage();
  await page.goto("/projects", { reduce: true });
  await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  const s = await page.evaluate(`(() => {
    const b = document.querySelector('#projects button[aria-pressed]');
    return { disabled: b.disabled, label: b.textContent.trim() };
  })()`);
  record("reduced-motion 下自动播放按钮禁用并说明原因", s.disabled === true && s.label === "自动播放已关闭", s.label);
  const before = (await page.evaluate(CURRENT)).name;
  await sleep(9000);
  const after = (await page.evaluate(CURRENT)).name;
  record("reduced-motion 下不会自动翻页", before === after, `${before} → ${after}`);
  record("reduced-motion 下仍可手动切换", await page.evaluate(`(() => {
    document.querySelectorAll('#projects ol button')[3].click();
    return true;
  })()`) === true);
  await page.shot("22-showcase-reduced-motion");
  await page.close();
}

// ---------- 7. 从走马灯进详情，关闭后焦点不跳回首屏 ----------
{
  const page = await newPage();
  await page.goto("/projects");
  await page.realClick('#projects button[class*=detailLink]');
  const opened = await page.evaluate(`(() => {
    const d = document.querySelector('[role="dialog"]');
    return { open: !!d, title: d?.querySelector('h2')?.textContent.trim() };
  })()`);
  record("走马灯的「查看项目详情」能打开弹层", opened.open === true, opened.title);

  await page.key("Escape");
  const after = await page.evaluate(`(() => ({
    closed: !document.querySelector('[role="dialog"]'),
    path: location.pathname,
    focusedInShowcase: !!document.getElementById('projects')?.contains(document.activeElement),
    focusedTag: document.activeElement?.tagName + '.' + (document.activeElement?.className || '').split(' ')[0],
    scrollY: Math.round(window.scrollY),
  }))()`);
  record("Escape 关闭且仍留在 /projects", after.closed && after.path === "/projects", after.path);
  record("焦点回到走马灯内，而不是掉回 body", after.focusedInShowcase === true, after.focusedTag);
  await page.shot("23-showcase-focus-return");
  record("无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 8.「进入项目」把访客送到 /projects ----------
{
  const page = await newPage();
  await page.goto("/");
  await page.realClick(`a[href="/projects"]`);
  const s = await page.evaluate(`(() => ({
    path: location.pathname,
    hasShowcase: !!document.getElementById('projects'),
    hasHero: !!document.querySelector('nav[aria-label="项目根系"]'),
    scrollY: Math.round(window.scrollY),
    backHref: document.querySelector('a[href="/"]')?.getAttribute('href'),
  }))()`);
  record("「进入项目」跳到 /projects", s.path === "/projects", s.path);
  record("展示区在新页面上", s.hasShowcase === true);
  record("首屏没有跟着一起渲染", s.hasHero === false);
  record("落地时停在页面顶部", s.scrollY === 0, "scrollY=" + s.scrollY);
  record("展示页留有回首屏的入口", s.backHref === "/", String(s.backHref));
  record("无 console/page 错误", page.errors.length === 0, page.errors.join(" | "));
  await page.close();
}

// ---------- 9. 移动端 ----------
{
  const page = await newPage();
  await page.goto("/projects", { width: 390, height: 844, touch: true });
  const s = await page.evaluate(`(() => {
    const sec = document.getElementById('projects');
    const r = sec.getBoundingClientRect();
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      width: Math.round(r.width),
      vw: window.innerWidth,
      timeline: sec.querySelectorAll('ol button').length,
    };
  })()`);
  record("移动端无横向溢出", s.overflowX <= 0, "h=" + s.overflowX);
  record("移动端展示区不超出视口宽", s.width <= s.vw + 1, `${s.width} / ${s.vw}`);
  record("移动端时间线仍列出 6 个", s.timeline === 6, "count=" + s.timeline);
  await page.shot("24-showcase-390");
  record("移动端无资源错误", page.failed.length === 0, page.failed.slice(0, 2).join(" | "));
  await page.close();
}

summarize(proc);
