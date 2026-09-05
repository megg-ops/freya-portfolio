/**
 * 零依赖浏览器驱动：直接用本机 cache 里的 chrome-headless-shell + Node 内建
 * WebSocket 说 CDP。刻意不引入 Playwright／Puppeteer——本机代理下载这类包
 * 不稳定，而验收需要的能力（视口、触屏、reduced-motion、拦截请求、截图、
 * 取 DOM 几何）CDP 本身都有。
 *
 * 环境变量：
 *   QA_CHROME  chrome-headless-shell 可执行文件路径（默认自动在 Playwright
 *              浏览器缓存里找最新的一个）
 *   QA_BASE    被测站点地址（默认 http://127.0.0.1:4319，即 vite preview）
 *   QA_SHOTS   截图输出目录（默认 <website>/.qa-shots）
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const BASE = process.env.QA_BASE ?? "http://127.0.0.1:4319";
export const SHOTS = process.env.QA_SHOTS ?? join(websiteRoot, ".qa-shots");

/** 在 Playwright 浏览器缓存里找 chrome-headless-shell，版本号不写死。 */
function findChrome() {
  if (process.env.QA_CHROME) return process.env.QA_CHROME;

  const cacheRoot = join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(cacheRoot)) return null;

  const candidates = readdirSync(cacheRoot)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    // 目录名形如 chromium_headless_shell-1208，按数字取最新
    .sort(
      (a, b) =>
        Number(b.split("-").pop() ?? 0) - Number(a.split("-").pop() ?? 0),
    )
    .map((name) =>
      join(cacheRoot, name, "chrome-headless-shell-linux64", "chrome-headless-shell"),
    );

  return candidates.find((path) => existsSync(path)) ?? null;
}

export async function launch(port = 9333) {
  const bin = findChrome();
  if (!bin) {
    throw new Error(
      "找不到 chrome-headless-shell。用 QA_CHROME 指定路径，或先安装 Playwright 浏览器缓存。",
    );
  }

  const proc = spawn(
    bin,
    [
      `--remote-debugging-port=${port}`,
      "--remote-allow-origins=*",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      // 本机有 HTTP 代理，不绕开的话连不上回环地址
      "--no-proxy-server",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  let wsUrl = "";
  await new Promise((resolvePromise, reject) => {
    const timer = setTimeout(
      () => reject(new Error("浏览器启动超时")),
      30_000,
    );
    proc.stderr.on("data", (chunk) => {
      const match = /ws:\/\/[^\s]+/.exec(String(chunk));
      if (match) {
        wsUrl = match[0];
        clearTimeout(timer);
        resolvePromise();
      }
    });
  });

  return { proc, wsUrl };
}

export class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: ok, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else ok(msg.result);
      } else if (msg.method) {
        for (const handler of this.handlers.get(msg.method) ?? []) {
          handler(msg.params);
        }
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((ok, reject) => {
      this.pending.set(id, { resolve: ok, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  on(method, handler) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(handler);
  }
}

export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, reject) => {
    ws.addEventListener("open", ok, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new Session(ws);
}

export function sleep(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

export function saveShot(dir, name, base64) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.png`), Buffer.from(base64, "base64"));
}

/** 统一的用例记录与退出码，避免每个 suite 各写一套。 */
export function createRecorder(label) {
  const results = [];
  return {
    record(name, ok, detail = "") {
      results.push({ name, ok, detail });
      console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
    },
    summarize(proc) {
      const failed = results.filter((r) => !r.ok);
      console.log(`\n===== ${label} =====`);
      console.log(
        `共 ${results.length} 项，通过 ${results.length - failed.length}，失败 ${failed.length}`,
      );
      failed.forEach((f) => console.log(`  FAIL ${f.name} — ${f.detail}`));
      proc?.kill();
      process.exit(failed.length === 0 ? 0 : 1);
    },
  };
}
