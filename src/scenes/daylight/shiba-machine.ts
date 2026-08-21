import { SHIBA_SOURCES } from "./shiba-assets";

export type ShibaAction =
  | "loading"
  | "static"
  | "tracking"
  | "settling"
  | "turn-away"
  | "walk-away"
  | "turn-home"
  | "walk-home"
  | "lie-down"
  | "rest-turn"
  | "rest-breathe"
  | "wake-turn"
  | "wake-up"
  | "error"
  | "destroyed";

interface ShibaMachineOptions {
  canvas: HTMLCanvasElement;
  area: HTMLElement;
  motion: HTMLElement;
  root: HTMLElement;
  status: HTMLElement;
  images: ReadonlyMap<string, HTMLImageElement>;
  finePointer: boolean;
  reducedMotion: boolean;
}

export interface ShibaMachine {
  start: () => void;
  destroy: () => void;
}

interface PendingWait {
  id: number;
  resolve: (completed: boolean) => void;
}

const CANVAS_SIZE = 512;
const GAZE_PERIOD = 32;

const ACTION_LABELS: Record<ShibaAction, string> = {
  loading: "正在加载柴犬素材",
  static: "站在人物身边",
  tracking: "站在人物身边 · 全局视线跟随",
  settling: "鼠标停下 · 视线收回人物",
  "turn-away": "原地转身，准备远离人物",
  "walk-away": "向外走两步",
  "turn-home": "在远处转回人物",
  "walk-home": "走回人物身边",
  "lie-down": "慢慢趴下 · 仍看向人物",
  "rest-turn": "趴稳后 · 转头看向访问者",
  "rest-breathe": "正视访问者 · 安静呼吸",
  "wake-turn": "重新看向人物 · 准备起身",
  "wake-up": "起身回到人物身边",
  error: "柴犬素材加载失败",
  destroyed: "柴犬状态机已停止",
};

export function createShibaMachine({
  canvas,
  area,
  motion,
  root,
  status,
  images,
  finePointer,
  reducedMotion,
}: ShibaMachineOptions): ShibaMachine {
  const context = canvas.getContext("2d");
  const pendingWaits = new Set<PendingWait>();

  let action: ShibaAction = "loading";
  let runToken = 0;
  let dogX = 0;
  let near = false;
  let recallRequested = false;
  let lastMove = performance.now();
  let lastPointer = { x: 0, y: 0 };
  let patrolUsed = false;
  let gazePhase = 0;
  let gazeTarget = 0;
  let gazeRaf = 0;
  let monitorRaf = 0;
  let destroyed = false;
  let pointerRegistered = false;

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const setAction = (next: ShibaAction, label = ACTION_LABELS[next]) => {
    action = next;
    root.dataset.action = next;
    status.textContent = label;
  };

  const setDogX = (next: number) => {
    dogX = next;
    motion.style.setProperty("--dog-x", `${next}px`);
    root.dataset.dogX = String(Math.round(next));
  };

  const draw = (image: HTMLImageElement | undefined, mirror = false) => {
    if (
      destroyed ||
      !context ||
      !image ||
      !image.complete ||
      image.naturalWidth === 0
    ) {
      return false;
    }

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.save();
    if (mirror) {
      context.translate(CANVAS_SIZE, 0);
      context.scale(-1, 1);
    }
    context.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.restore();
    root.dataset.frame = image.currentSrc || image.src;
    return true;
  };

  const cancelPendingWaits = () => {
    for (const wait of pendingWaits) {
      window.clearTimeout(wait.id);
      wait.resolve(false);
    }
    pendingWaits.clear();
  };

  const interrupt = () => {
    runToken += 1;
    root.dataset.runToken = String(runToken);
    cancelPendingWaits();
    return runToken;
  };

  const wait = (milliseconds: number, token: number) =>
    new Promise<boolean>((resolve) => {
      if (destroyed || token !== runToken) {
        resolve(false);
        return;
      }

      const pending: PendingWait = {
        id: 0,
        resolve,
      };
      pending.id = window.setTimeout(function finishShibaWait() {
        pendingWaits.delete(pending);
        resolve(!destroyed && token === runToken);
      }, milliseconds);
      pendingWaits.add(pending);
    });

  const cancelGaze = () => {
    if (gazeRaf) cancelAnimationFrame(gazeRaf);
    gazeRaf = 0;
  };

  function scheduleGaze() {
    if (!gazeRaf && !destroyed) gazeRaf = requestAnimationFrame(animateGaze);
  }

  function animateGaze() {
    gazeRaf = 0;
    if (destroyed || !["tracking", "settling"].includes(action)) return;
    const delta =
      ((gazeTarget - gazePhase + GAZE_PERIOD / 2) % GAZE_PERIOD + GAZE_PERIOD) %
        GAZE_PERIOD -
      GAZE_PERIOD / 2;
    gazePhase = (gazePhase + delta * 0.18 + GAZE_PERIOD) % GAZE_PERIOD;
    draw(images.get(SHIBA_SOURCES.look[Math.round(gazePhase) % GAZE_PERIOD]));
    if (Math.abs(delta) > 0.04) scheduleGaze();
  }

  async function playFrames(
    list: readonly string[],
    {
      reverse = false,
      mirror = false,
      fps = 12,
      token = runToken,
    }: {
      reverse?: boolean;
      mirror?: boolean;
      fps?: number;
      token?: number;
    } = {},
  ) {
    const order = reverse ? [...list].reverse() : list;
    for (const src of order) {
      if (destroyed || token !== runToken) return false;
      if (!draw(images.get(src), mirror)) return false;
      if (!(await wait(1000 / fps, token))) return false;
    }
    return !destroyed && token === runToken;
  }

  async function playWalk(direction: -1 | 1, maxCycles: number, token: number) {
    const start = dogX;
    const step = 30 * direction;
    let cycles = 0;
    while (cycles < maxCycles && !destroyed && token === runToken) {
      for (let index = 0; index < SHIBA_SOURCES.walk.length; index += 1) {
        if (destroyed || token !== runToken) return false;
        const progress = (index + 1) / SHIBA_SOURCES.walk.length;
        setDogX(start + step * (cycles + progress));
        if (!draw(images.get(SHIBA_SOURCES.walk[index]), direction > 0)) return false;
        if (!(await wait(1000 / 12, token))) return false;
      }
      cycles += 1;
      if (recallRequested && direction > 0) break;
    }
    return !destroyed && token === runToken;
  }

  async function patrol() {
    if (
      destroyed ||
      reducedMotion ||
      !finePointer ||
      !["tracking", "settling", "rest-ready"].includes(action)
    ) {
      return;
    }

    const token = interrupt();
    patrolUsed = true;
    recallRequested = false;
    cancelGaze();
    setAction("turn-away");
    if (!(await playFrames(SHIBA_SOURCES.turn, { fps: 12, token }))) return;
    setAction("walk-away");
    if (!(await playWalk(1, 2, token))) return;
    if (!(await wait(recallRequested ? 120 : 360, token))) return;
    setAction(
      "turn-home",
      recallRequested ? "听见召唤，转回人物" : ACTION_LABELS["turn-home"],
    );
    if (!(await playFrames(SHIBA_SOURCES.turn, { reverse: true, fps: 12, token }))) {
      return;
    }
    setAction("walk-home");
    const cycles = Math.max(1, Math.round(dogX / 30));
    if (!(await playWalk(-1, cycles, token))) return;
    setDogX(0);
    draw(images.get(SHIBA_SOURCES.stand));
    gazePhase = 0;
    gazeTarget = 0;
    recallRequested = false;
    lastMove = performance.now();
    patrolUsed = true;
    setAction("tracking", "回到人物身边 · 等待视线互动");
    scheduleGaze();
  }

  async function restDog() {
    if (
      destroyed ||
      reducedMotion ||
      !finePointer ||
      !["tracking", "settling", "rest-ready"].includes(action)
    ) {
      return;
    }

    const token = interrupt();
    cancelGaze();
    setAction("lie-down");
    if (!(await playFrames(SHIBA_SOURCES.lie, { fps: 8, token }))) return;
    setAction("rest-turn");
    if (!(await playFrames(SHIBA_SOURCES.restTurn, { fps: 20, token }))) return;
    setAction("rest-breathe");
    while (!destroyed && token === runToken && action === "rest-breathe") {
      if (!(await playFrames(SHIBA_SOURCES.breathe, { fps: 6, token }))) return;
    }
  }

  async function wakeUp() {
    if (destroyed || action !== "rest-breathe") return;
    const token = interrupt();
    setAction("wake-turn");
    if (
      !(await playFrames(SHIBA_SOURCES.restTurn, {
        reverse: true,
        fps: 16,
        token,
      }))
    ) {
      return;
    }
    setAction("wake-up");
    if (!(await playFrames(SHIBA_SOURCES.lie, { reverse: true, fps: 12, token }))) {
      return;
    }
    draw(images.get(SHIBA_SOURCES.stand));
    lastMove = performance.now();
    patrolUsed = false;
    setAction("tracking", "重新注意到鼠标 · 全局视线跟随");
    scheduleGaze();
  }

  const updatePointer = (event: PointerEvent) => {
    if (destroyed) return;
    const moved = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) > 2;
    lastPointer = { x: event.clientX, y: event.clientY };
    if (moved) {
      lastMove = performance.now();
      patrolUsed = false;
      if (action === "rest-breathe") void wakeUp();
    }

    const bounds = area.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2 + dogX;
    const centerY = bounds.top + bounds.height * 0.48;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    near = distance < bounds.width * 0.78;
    root.dataset.near = String(near);
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    gazeTarget = ((((angle + 135) % 360) + 360) % 360) / 360 * GAZE_PERIOD;
    if (["tracking", "settling"].includes(action)) scheduleGaze();
    if (near && ["turn-away", "walk-away", "turn-home", "walk-home"].includes(action)) {
      recallRequested = true;
    }
  };

  function monitor() {
    if (destroyed) return;
    const idle = (performance.now() - lastMove) / 1000;
    root.dataset.idleSeconds = idle.toFixed(1);
    if (action === "tracking" && idle > 3) {
      setAction("settling");
      gazeTarget = 0;
      scheduleGaze();
    }
    if (!patrolUsed && ["tracking", "settling"].includes(action) && idle > 5 && !near) {
      void patrol();
    }
    if (patrolUsed && ["tracking", "settling"].includes(action) && idle > 7) {
      void restDog();
    }
    monitorRaf = requestAnimationFrame(monitor);
  }

  const start = () => {
    if (destroyed) return;
    setDogX(0);
    gazePhase = 0;
    gazeTarget = 0;
    lastMove = performance.now();
    patrolUsed = false;
    draw(images.get(SHIBA_SOURCES.stand));
    root.dataset.runtime = "active";

    if (!finePointer || reducedMotion) {
      setAction(
        "static",
        reducedMotion ? "减少动态：保持静态站姿" : "触屏设备：保持轻量静态姿态",
      );
      return;
    }

    setAction("tracking");
    window.addEventListener("pointermove", updatePointer, { passive: true });
    pointerRegistered = true;
    monitorRaf = requestAnimationFrame(monitor);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    interrupt();
    cancelGaze();
    if (monitorRaf) cancelAnimationFrame(monitorRaf);
    monitorRaf = 0;
    if (pointerRegistered) window.removeEventListener("pointermove", updatePointer);
    pointerRegistered = false;
    motion.style.setProperty("--dog-x", "0px");
    root.dataset.runtime = "destroyed";
    setAction("destroyed");
  };

  return { start, destroy };
}
