# 浏览器验收

零依赖的 CDP 验收工具链：直接驱动本机 cache 里的 `chrome-headless-shell`，用 Node 内建
WebSocket 说 Chrome DevTools Protocol。**刻意不装 Playwright／Puppeteer**——本机代理下载
这类包不稳定（试过一次，超时失败），而验收需要的能力 CDP 本身都有：视口与触屏模拟、
`prefers-reduced-motion`、拦截请求、截图、取 DOM 几何、监听 console 与网络错误。

因此这些脚本**不进 `package.json` 的 dependencies**，跑起来不需要 `npm install` 之外的任何东西。

## 跑之前

除 `qa:subpath` 外，都需要先起一个被测服务：

```bash
npm run build
NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
  npx vite preview --host 127.0.0.1 --port 4319
```

本机有 HTTP 代理，`NO_PROXY` 不设会连不上回环地址；浏览器侧已在 `cdp.mjs` 里带了
`--no-proxy-server`。

## 命令

| 命令 | 内容 |
| --- | --- |
| `npm run qa` | 日光整站主回归。首屏、项目详情弹层、履历、联系、深链接刷新、未知路由、键盘与焦点归还、reduced-motion、树图层加载失败降级 |
| `npm run qa:layout` | 版式几何断言。六档视口下断言文案与人物矩形不相交、树顶 ≥0 且完整落在视口内、柴犬与树干水平间距、信箱宽度区间、无横向溢出 |
| `npm run qa:subpath` | 子路径部署验收，需先起模拟器（见下） |
| `npm run qa:perf` | 首次加载传输量与「树 idle + 柴犬 ready」耗时 |
| `npm run qa:stars` | 星夜营地：四档视口、9 个星点、短笺焦点循环与归还、流星绘制与消散、静止开关、减少动态效果、路由往返 |

星夜验收使用 `launch(port, { finePointer: true })` 显式配置桌面精细指针；无头浏览器默认是 `pointer: none`。触屏模拟后新建桌面 target，避免关闭触屏模拟时恢复成 `pointer: none`。截图位于 `.qa-shots/stars-*.png`。

`qa:layout` 默认打 `QA_BASE`；开发时想打 dev server 就 `QA_BASE=http://127.0.0.1:5173 npm run qa:layout`。

### 子路径验收

GitHub Pages 默认地址是 `megg-ops.github.io/freya-portfolio/` 子路径，且未知路径返回
`404.html` 且状态码为 404。`gh-pages-sim.mjs` 忠实模拟这两点——**不要用 `vite preview` 代替**，
它的 SPA fallback 行为不一样，会让子路径的问题测不出来（这个坑踩过）。

```bash
BASE_PATH=/freya-portfolio/ npm run build
node scripts/qa/gh-pages-sim.mjs "$PWD/dist"   # 监听 4320
npm run qa:subpath
```

## 环境变量

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `QA_BASE` | `http://127.0.0.1:4319` | 被测站点地址 |
| `QA_CHROME` | 自动在 `~/.cache/ms-playwright` 里找最新的 `chrome-headless-shell` | 手动指定浏览器 |
| `QA_SHOTS` | `<website>/.qa-shots`（已 gitignore） | 截图输出目录 |
| `QA_SUBPATH_BASE` | `http://127.0.0.1:4320/freya-portfolio` | 子路径验收地址 |
| `QA_PORT_OFFSET` | `0` | CDP 调试端口整体偏移。并行会话（另一个 worktree 里的 agent 同时跑 QA）会撞 9333–9338，设成 `100` 之类即可错开 |

## 收尾

脚本正常结束会自己关掉浏览器。中途报错可能留下进程与端口占用：

```bash
ps -eo pid,comm | awk '$2 ~ /^chrome-headl/ {print $1}' | xargs -r kill
```

注意别用 `pkill -f chrome-headless` 这类写法——命令行本身会匹配到自己，把当前 shell 一起杀掉。

## 加新用例

`cdp.mjs` 导出 `launch` / `connect` / `sleep` / `saveShot` / `createRecorder` 与共享配置。
断言优先写成**可量化的几何或状态判断**，不要靠肉眼看截图。版式那轮就是因为断言写的是
「文案矩形与人物矩形不相交」，才量出树高公式漏算了 `scale(1.02)` 造成的 4–5px 偏差——
这个差值看截图是发现不了的。

同理，涉及时序的用例（焦点归还、路由切换）要连跑几轮再下结论。焦点归还那条第一次
「通过」其实是侥幸，重复跑才暴露出背后的路由重挂载缺陷。
