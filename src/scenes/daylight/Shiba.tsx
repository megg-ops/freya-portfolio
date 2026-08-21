import { useEffect, useRef, useState } from "react";

import {
  loadShibaAssets,
  SHIBA_ASSET_TOTAL,
  SHIBA_SOURCES,
} from "./shiba-assets";
import { createShibaMachine, type ShibaMachine } from "./shiba-machine";
import styles from "./Shiba.module.css";

type LoadState = "loading" | "ready" | "error";

export function Shiba() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [completedLoads, setCompletedLoads] = useState(0);
  const [failedLoads, setFailedLoads] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
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
    root.dataset.action = "loading";
    root.dataset.runtime = "loading";

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
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
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

  const loadingText = `柴犬素材加载中：${completedLoads}/${SHIBA_ASSET_TOTAL} 帧`;

  return (
    <div
      ref={rootRef}
      className={styles.shiba}
      data-shiba
      data-load-state={loadState}
      data-loaded-frames={completedLoads}
      data-failed-frames={failedLoads}
    >
      <div ref={motionRef} className={styles.motion}>
        <div className={styles.shadow} aria-hidden="true" />
        <a className={styles.link} href="#p-chaiyu" aria-label="柴犬；进入柴愈项目">
          <canvas ref={canvasRef} className={styles.canvas} width="512" height="512">
            一只站在 Freya 身边的柴犬
          </canvas>
        </a>
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
  );
}
