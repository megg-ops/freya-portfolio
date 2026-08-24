import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  loadShibaAssets,
  SHIBA_ASSET_TOTAL,
  SHIBA_SOURCES,
} from "./shiba-assets";
import {
  createShibaMachine,
  type ShibaAction,
  type ShibaCommand,
  type ShibaMachine,
} from "./shiba-machine";
import styles from "./Shiba.module.css";

type LoadState = "loading" | "ready" | "error";

const COMMANDS: readonly {
  command: ShibaCommand;
  label: string;
  glyph: string;
  description: string;
}[] = [
  { command: "track", label: "跟随", glyph: "◎", description: "回到站姿并跟随指针视线" },
  { command: "patrol", label: "踱步", glyph: "↔", description: "转身并在人物身边来回踱步" },
  { command: "recall", label: "回来", glyph: "↩", description: "召唤柴犬回到人物身边" },
  { command: "rest", label: "趴下", glyph: "⌄", description: "趴下、转向访问者并呼吸" },
] as const;

function commandForAction(action: ShibaAction): ShibaCommand {
  if (["turn-away", "walk-away"].includes(action)) return "patrol";
  if (["turn-home", "walk-home", "wake-turn", "wake-up"].includes(action)) {
    return "recall";
  }
  if (["lie-down", "rest-turn", "rest-breathe"].includes(action)) return "rest";
  return "track";
}

export function Shiba() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [completedLoads, setCompletedLoads] = useState(0);
  const [failedLoads, setFailedLoads] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ShibaAction>("loading");
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const machineRef = useRef<ShibaMachine | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const motion = motionRef.current;
    const canvas = canvasRef.current;
    const status = statusRef.current;
    if (!root || !motion || !canvas || !status) return;

    const abortController = new AbortController();
    setLoadState("loading");
    setCompletedLoads(0);
    setFailedLoads(0);
    setCurrentAction("loading");
    root.dataset.action = "loading";
    root.dataset.runtime = "loading";

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIsReducedMotion(reducedMotion);

    void loadShibaAssets({
      signal: abortController.signal,
      onProgress: setCompletedLoads,
    }).then(({ images, failed }) => {
      if (abortController.signal.aborted) return;

      const context = canvas.getContext("2d");
      const fallback = images.get(SHIBA_SOURCES.stand) ?? images.values().next().value;
      if (context && fallback) {
        canvas.width = 512;
        canvas.height = 512;
        context.clearRect(0, 0, 512, 512);
        context.drawImage(fallback, 0, 0, 512, 512);
      }

      if (failed.length > 0) {
        setFailedLoads(failed.length);
        setLoadState("error");
        setCurrentAction("error");
        root.dataset.action = "error";
        root.dataset.runtime = "stopped";
        status.textContent = `柴犬素材加载失败：${failed.length} 帧`;
        return;
      }

      setLoadState("ready");
      const machine = createShibaMachine({
        canvas,
        area: root,
        motion,
        root,
        status,
        images,
        finePointer: matchMedia("(hover: hover) and (pointer: fine)").matches,
        reducedMotion,
        onActionChange: (action) => {
          if (!abortController.signal.aborted) setCurrentAction(action);
        },
      });
      machineRef.current = machine;
      machine.start();
    });

    return () => {
      abortController.abort();
      machineRef.current?.destroy();
      machineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    const scene = root?.closest("main");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !cursor || !scene || !finePointer.matches || reducedMotion.matches) return;

    let cursorRaf = 0;
    let x = 0;
    let y = 0;
    scene.classList.add(styles.gazeActive);

    const paintCursor = () => {
      cursorRaf = 0;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };
    const moveCursor = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest("a, button");
      const shibaTrigger = target?.closest("[data-shiba-trigger]");
      const visible = !interactive || Boolean(shibaTrigger);
      cursor.dataset.visible = String(visible);
      if (!visible) return;
      x = event.clientX;
      y = event.clientY;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(paintCursor);
    };
    const hideCursor = () => {
      cursor.dataset.visible = "false";
    };

    scene.addEventListener("pointermove", moveCursor, { passive: true });
    scene.addEventListener("pointerleave", hideCursor);
    return () => {
      scene.removeEventListener("pointermove", moveCursor);
      scene.removeEventListener("pointerleave", hideCursor);
      scene.classList.remove(styles.gazeActive);
      if (cursorRaf) cancelAnimationFrame(cursorRaf);
      cursor.dataset.visible = "false";
    };
  }, []);

  const runCommand = (command: ShibaCommand) => {
    machineRef.current?.command(command);
    setMenuOpen(false);
    triggerRef.current?.focus();
  };

  const loadingText = `柴犬素材加载中：${completedLoads}/${SHIBA_ASSET_TOTAL} 帧`;
  const activeCommand = commandForAction(currentAction);

  return (
    <>
      <div
        ref={rootRef}
        className={styles.shiba}
        data-shiba
        data-load-state={loadState}
        data-loaded-frames={completedLoads}
        data-failed-frames={failedLoads}
        data-menu-open={menuOpen}
      >
        <div ref={motionRef} className={styles.motion}>
          <div className={styles.shadow} aria-hidden="true" />
          <button
            ref={triggerRef}
            className={styles.trigger}
            type="button"
            aria-label={menuOpen ? "关闭柴犬互动状态" : "打开柴犬互动状态"}
            aria-expanded={menuOpen}
            aria-controls="shiba-command-halo"
            data-shiba-trigger
            disabled={loadState !== "ready"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <img
              className={styles.placeholder}
              src={SHIBA_SOURCES.stand}
              alt=""
              aria-hidden="true"
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
            <canvas ref={canvasRef} className={styles.canvas} width="512" height="512">
              一只站在 Freya 身边的柴犬
            </canvas>
          </button>

          <div
            id="shiba-command-halo"
            className={`${styles.commandHalo} ${menuOpen ? styles.commandHaloOpen : ""}`}
            role="group"
            aria-label="柴犬互动状态"
            aria-hidden={!menuOpen}
          >
            {COMMANDS.map(({ command, label, glyph, description }) => (
              <button
                key={command}
                className={`${styles.command} ${styles[`command${command}`]}`}
                type="button"
                data-shiba-command={command}
                aria-label={`${label}：${description}`}
                aria-pressed={activeCommand === command}
                disabled={
                  loadState !== "ready" ||
                  (isReducedMotion && (command === "patrol" || command === "rest"))
                }
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => runCommand(command)}
              >
                <span className={styles.commandGlyph} aria-hidden="true">
                  {glyph}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <span ref={statusRef} className={styles.status} role="status" aria-live="polite" />
        {loadState === "loading" ? (
          <span className={styles.status} role="status">
            {loadingText}
          </span>
        ) : null}
        {loadState === "error" ? (
          <span className={styles.error}>柴犬暂时走丢了，请刷新重试</span>
        ) : null}
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <span ref={cursorRef} className={styles.gazeCursor} data-visible="false">
              <span className={styles.gazeCursorBody} />
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
