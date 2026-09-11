import { useEffect, useRef } from "react";
import styles from "./StarnightScene.module.css";

/** RAF stops when the final point fades. No React frame updates. */
export function MeteorTrail({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || paused) return;
    const media = matchMedia("(prefers-reduced-motion: no-preference) and (pointer: fine)");
    let points: { x: number; y: number; time: number }[] = [];
    let frame = 0;
    let width = innerWidth;
    let height = innerHeight;
    function clear() {
      cancelAnimationFrame(frame); frame = 0; points = [];
      context!.clearRect(0, 0, width, height);
    }
    function resize() {
      clear(); width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas!.width = width * dpr; canvas!.height = height * dpr;
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now: number) {
      frame = 0;
      points = points.filter((point) => now - point.time < 160);
      context!.clearRect(0, 0, width, height);
      context!.lineCap = "round";
      for (let i = 1; i < points.length; i++) {
        const opacity = Math.max(0, 1 - (now - points[i].time) / 160);
        const taper = i / Math.max(1, points.length - 1);
        context!.beginPath(); context!.moveTo(points[i - 1].x, points[i - 1].y);
        context!.lineTo(points[i].x, points[i].y);
        context!.strokeStyle = `rgba(255,234,191,${opacity * .9})`;
        context!.lineWidth = (.6 + taper * 3.6) * opacity;
        context!.shadowColor = "#f5d7a1"; context!.shadowBlur = 10;
        context!.stroke();
      }
      const head = points.at(-1);
      if (head) {
        context!.beginPath(); context!.arc(head.x, head.y, 3.1, 0, Math.PI * 2);
        context!.fillStyle = `rgba(255,247,222,${1 - (now - head.time) / 160})`; context!.fill();
        frame = requestAnimationFrame(draw);
      }
    }
    function move(event: PointerEvent) {
      if (!media.matches || event.pointerType !== "mouse" || document.hidden) return;
      if (event.target instanceof Element && event.target.closest("button, a, dialog")) { clear(); return; }
      points.push({ x: event.clientX, y: event.clientY, time: performance.now() });
      // Bound physical length as well as lifetime, even during fast pointer jumps.
      let length = 0;
      for (let i = points.length - 1; i > 0; i--) {
        const newer = points[i];
        const older = points[i - 1];
        const segment = Math.hypot(newer.x - older.x, newer.y - older.y);
        if (length + segment > 48) {
          const fraction = (48 - length) / segment;
          points[i - 1] = { x: newer.x + (older.x - newer.x) * fraction,
            y: newer.y + (older.y - newer.y) * fraction, time: older.time };
          points = points.slice(i - 1);
          break;
        }
        length += segment;
      }
      if (points.length > 70) points.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("resize", resize); window.addEventListener("blur", clear);
    document.addEventListener("pointerleave", clear); document.addEventListener("visibilitychange", clear);
    media.addEventListener("change", clear);
    return () => {
      clear(); window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize); window.removeEventListener("blur", clear);
      document.removeEventListener("pointerleave", clear); document.removeEventListener("visibilitychange", clear);
      media.removeEventListener("change", clear);
    };
  }, [paused]);
  return <canvas className={styles.meteor} ref={canvasRef} aria-hidden="true" />;
}
