import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useSiteStore, type TreePhase } from "../../app/store";
import { createTreeGrowthTimeline } from "../../motion/tree";
import styles from "./Tree.module.css";

interface TreeProps {
  layers: readonly [string, string, string, string, string, string];
  parallaxTargetRef: RefObject<HTMLElement | null>;
}

type PetalStyle = CSSProperties & Record<`--${string}`, string>;

const petalStyles: PetalStyle[] = [
  { "--left": "14%", "--top": "31%", "--size": "8px", "--time": "7.2s", "--delay": "-1.1s", "--r0": "12deg", "--x1": "-18px", "--y1": "18px", "--r1": "95deg", "--x2": "30px", "--y2": "82px", "--r2": "210deg", "--x3": "84px", "--y3": "176px", "--r3": "330deg", "--x4": "142px", "--y4": "302px", "--r4": "470deg" },
  { "--left": "23%", "--top": "42%", "--size": "6px", "--time": "6.4s", "--delay": "-4.7s", "--r0": "-20deg", "--x1": "24px", "--y1": "10px", "--r1": "72deg", "--x2": "58px", "--y2": "76px", "--r2": "186deg", "--x3": "42px", "--y3": "164px", "--r3": "292deg", "--x4": "104px", "--y4": "274px", "--r4": "430deg" },
  { "--left": "34%", "--top": "23%", "--size": "7px", "--time": "8.1s", "--delay": "-6.3s", "--r0": "32deg", "--x1": "-12px", "--y1": "24px", "--r1": "126deg", "--x2": "44px", "--y2": "92px", "--r2": "250deg", "--x3": "106px", "--y3": "204px", "--r3": "378deg", "--x4": "176px", "--y4": "348px", "--r4": "520deg" },
  { "--left": "43%", "--top": "36%", "--size": "9px", "--time": "6.8s", "--delay": "-2.8s", "--r0": "-8deg", "--x1": "28px", "--y1": "16px", "--r1": "102deg", "--x2": "18px", "--y2": "88px", "--r2": "224deg", "--x3": "72px", "--y3": "190px", "--r3": "346deg", "--x4": "136px", "--y4": "326px", "--r4": "492deg" },
  { "--left": "52%", "--top": "18%", "--size": "6px", "--time": "7.7s", "--delay": "-5.5s", "--r0": "18deg", "--x1": "-20px", "--y1": "14px", "--r1": "118deg", "--x2": "36px", "--y2": "70px", "--r2": "242deg", "--x3": "94px", "--y3": "172px", "--r3": "370deg", "--x4": "164px", "--y4": "310px", "--r4": "514deg" },
  { "--left": "61%", "--top": "33%", "--size": "8px", "--time": "6.1s", "--delay": "-.6s", "--r0": "-28deg", "--x1": "22px", "--y1": "22px", "--r1": "64deg", "--x2": "66px", "--y2": "84px", "--r2": "190deg", "--x3": "122px", "--y3": "184px", "--r3": "318deg", "--x4": "190px", "--y4": "306px", "--r4": "460deg" },
  { "--left": "72%", "--top": "27%", "--size": "7px", "--time": "7.4s", "--delay": "-3.9s", "--r0": "40deg", "--x1": "-14px", "--y1": "18px", "--r1": "138deg", "--x2": "34px", "--y2": "96px", "--r2": "258deg", "--x3": "86px", "--y3": "208px", "--r3": "384deg", "--x4": "150px", "--y4": "354px", "--r4": "530deg" },
  { "--left": "82%", "--top": "39%", "--size": "9px", "--time": "6.6s", "--delay": "-5.9s", "--r0": "-16deg", "--x1": "18px", "--y1": "12px", "--r1": "82deg", "--x2": "50px", "--y2": "74px", "--r2": "204deg", "--x3": "28px", "--y3": "164px", "--r3": "326deg", "--x4": "88px", "--y4": "286px", "--r4": "478deg" },
  { "--left": "30%", "--top": "51%", "--size": "6px", "--time": "8.4s", "--delay": "-7.2s", "--r0": "26deg", "--x1": "-24px", "--y1": "20px", "--r1": "132deg", "--x2": "22px", "--y2": "104px", "--r2": "266deg", "--x3": "78px", "--y3": "222px", "--r3": "398deg", "--x4": "146px", "--y4": "372px", "--r4": "548deg" },
  { "--left": "49%", "--top": "48%", "--size": "8px", "--time": "7s", "--delay": "-2s", "--r0": "-36deg", "--x1": "26px", "--y1": "18px", "--r1": "58deg", "--x2": "72px", "--y2": "88px", "--r2": "184deg", "--x3": "118px", "--y3": "196px", "--r3": "314deg", "--x4": "182px", "--y4": "338px", "--r4": "466deg" },
  { "--left": "67%", "--top": "53%", "--size": "7px", "--time": "7.9s", "--delay": "-6.8s", "--r0": "8deg", "--x1": "-16px", "--y1": "26px", "--r1": "110deg", "--x2": "42px", "--y2": "116px", "--r2": "244deg", "--x3": "98px", "--y3": "236px", "--r3": "376deg", "--x4": "162px", "--y4": "390px", "--r4": "536deg" },
  { "--left": "77%", "--top": "47%", "--size": "6px", "--time": "6.3s", "--delay": "-3.2s", "--r0": "-12deg", "--x1": "20px", "--y1": "14px", "--r1": "90deg", "--x2": "54px", "--y2": "82px", "--r2": "216deg", "--x3": "102px", "--y3": "182px", "--r3": "342deg", "--x4": "168px", "--y4": "312px", "--r4": "486deg" },
];

const settleImage = (image: HTMLImageElement, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const rejectLoad = () => reject(new Error(image.currentSrc || image.src));
    if (image.complete) {
      if (image.naturalWidth > 0) {
        image.decode().catch(() => undefined).finally(resolve);
      } else {
        rejectLoad();
      }
      return;
    }
    image.addEventListener(
      "load",
      () => image.decode().catch(() => undefined).finally(resolve),
      { once: true, signal },
    );
    image.addEventListener("error", rejectLoad, { once: true, signal });
    signal.addEventListener("abort", rejectLoad, { once: true });
  });

export function Tree({ layers, parallaxTargetRef }: TreeProps) {
  const [completedLoads, setCompletedLoads] = useState(0);
  const [failedLoads, setFailedLoads] = useState(0);
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [phase, setPhase] = useState<TreePhase>("loading");
  const setTreePhase = useSiteStore((state) => state.setTreePhase);
  const stageRef = useRef<HTMLDivElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const crownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const timelineRef = useRef<GSAPTimeline | null>(null);
  const timeoutRefs = useRef<number[]>([]);
  const mountedRef = useRef(false);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timeoutRefs.current.push(id);
  }, []);

  const playGrowth = useCallback(() => {
    timelineRef.current?.kill();
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setIsReducedMotion(true);
      setPhase("idle");
      setTreePhase("idle");
      return;
    }

    setIsReducedMotion(false);
    const skeleton = skeletonRef.current;
    const groundShadow = shadowRef.current;
    const crowns = crownRefs.current;
    if (!skeleton || !groundShadow || crowns.some((crown) => !crown)) return;

    setPhase("growing");
    setTreePhase("growing");
    timelineRef.current = createTreeGrowthTimeline(
      {
        skeleton,
        groundShadow,
        crowns: [
          { element: crowns[4]!, duration: 0.44, enterRotation: 1.7, start: 0.64 },
          { element: crowns[3]!, duration: 0.46, enterRotation: -1.5, start: 0.69 },
          { element: crowns[2]!, duration: 0.45, enterRotation: 2.2, start: 0.74 },
          { element: crowns[0]!, duration: 0.46, enterRotation: -2.2, start: 0.79 },
          { element: crowns[1]!, duration: 0.5, enterRotation: 1, start: 0.86 },
        ],
      },
      () => {
        if (!mountedRef.current) return;
        setPhase("idle");
        setTreePhase("idle");
      },
    );
    timelineRef.current.play(0);
  }, [setTreePhase]);

  useEffect(() => {
    mountedRef.current = true;
    const abortController = new AbortController();
    let cancelled = false;
    setPhase("loading");
    setTreePhase("loading");
    setCompletedLoads(0);
    setFailedLoads(0);
    setIsLoaderComplete(false);

    const images = imageRefs.current.filter(
      (image): image is HTMLImageElement => image !== null,
    );
    let completed = 0;
    let failed = 0;

    void Promise.all(
      images.map((image) =>
        settleImage(image, abortController.signal)
          .catch(() => {
            failed += 1;
          })
          .finally(() => {
            completed += 1;
            if (!cancelled) setCompletedLoads(completed);
          }),
      ),
    ).then(() => {
      if (cancelled) return;
      setFailedLoads(failed);
      if (failed > 0) return;
      schedule(() => {
        if (!mountedRef.current) return;
        setIsLoaderComplete(true);
        schedule(playGrowth, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220);
      }, 100);
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      abortController.abort();
      timelineRef.current?.kill();
      for (const timeout of timeoutRefs.current) window.clearTimeout(timeout);
      timeoutRefs.current = [];
    };
  }, [playGrowth, schedule, setTreePhase]);

  useEffect(() => {
    const target = parallaxTargetRef.current;
    const stage = stageRef.current;
    if (!target || !stage) return;
    const precisePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let parallaxFrame = 0;
    const properties = ["--back-x", "--back-y", "--mid-x", "--mid-y", "--front-x", "--front-y"];
    const reset = () => {
      for (const property of properties) stage.style.setProperty(property, "0px");
    };
    const move = (event: PointerEvent) => {
      if (!precisePointer.matches || reducedMotion.matches || phase !== "idle") return;
      const bounds = target.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      cancelAnimationFrame(parallaxFrame);
      parallaxFrame = requestAnimationFrame(() => {
        stage.style.setProperty("--back-x", `${(x * -1.6).toFixed(2)}px`);
        stage.style.setProperty("--back-y", `${(y * -1).toFixed(2)}px`);
        stage.style.setProperty("--mid-x", `${(x * 1.4).toFixed(2)}px`);
        stage.style.setProperty("--mid-y", `${(y * 0.8).toFixed(2)}px`);
        stage.style.setProperty("--front-x", `${(x * 3.2).toFixed(2)}px`);
        stage.style.setProperty("--front-y", `${(y * 1.8).toFixed(2)}px`);
      });
    };
    target.addEventListener("pointermove", move, { passive: true });
    target.addEventListener("pointerleave", reset);
    return () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerleave", reset);
      cancelAnimationFrame(parallaxFrame);
      reset();
    };
  }, [parallaxTargetRef, phase]);

  const percent = layers.length
    ? Math.round((completedLoads / layers.length) * 100)
    : 100;
  const phaseText =
    phase === "loading"
      ? "等待图层"
      : phase === "growing"
        ? "从根系开始生长"
        : isReducedMotion
          ? "已显示最终状态"
          : "生长完成 · 阵风与落花";

  return (
    <>
      <div
        ref={stageRef}
        className={`${styles.treeStage} ${phase === "growing" ? styles.isGrowing : ""} ${phase === "idle" ? styles.isIdle : ""}`}
        aria-label="春季樱花树 2.5D 生长动画"
        role="img"
        data-tree-stage
        data-phase={phase}
      >
        <div ref={shadowRef} className={styles.groundShadow} aria-hidden="true" />
        <div ref={skeletonRef} className={styles.skeletonFrame}>
          <img
            ref={(image) => { imageRefs.current[0] = image; }}
            className={styles.treeLayer}
            src={layers[0]}
            alt=""
            width="759"
            height="953"
          />
        </div>
        <div ref={(crown) => { crownRefs.current[0] = crown; }} className={`${styles.crown} ${styles.leftHigh}`} data-tree-crown="left-high">
          <img ref={(image) => { imageRefs.current[1] = image; }} src={layers[1]} alt="" width="795" height="780" />
        </div>
        <div ref={(crown) => { crownRefs.current[1] = crown; }} className={`${styles.crown} ${styles.center}`} data-tree-crown="center">
          <img ref={(image) => { imageRefs.current[2] = image; }} src={layers[2]} alt="" width="621" height="797" />
        </div>
        <div ref={(crown) => { crownRefs.current[2] = crown; }} className={`${styles.crown} ${styles.rightHigh}`} data-tree-crown="right-high">
          <img ref={(image) => { imageRefs.current[3] = image; }} src={layers[3]} alt="" width="745" height="744" />
        </div>
        <div ref={(crown) => { crownRefs.current[3] = crown; }} className={`${styles.crown} ${styles.leftLow}`} data-tree-crown="left-low">
          <img ref={(image) => { imageRefs.current[4] = image; }} src={layers[4]} alt="" width="738" height="650" />
        </div>
        <div ref={(crown) => { crownRefs.current[4] = crown; }} className={`${styles.crown} ${styles.rightLow}`} data-tree-crown="right-low">
          <img ref={(image) => { imageRefs.current[5] = image; }} src={layers[5]} alt="" width="621" height="541" />
        </div>
        <div className={styles.petals} aria-hidden="true" data-tree-petals>
          {petalStyles.map((style, index) => (
            <span className={styles.petal} style={style} key={index} />
          ))}
        </div>
        <span className={styles.srOnly} role="status" aria-live="polite">
          {phaseText}
        </span>
      </div>

      {createPortal(
        <div
          className={`${styles.loader} ${isLoaderComplete ? styles.loaderComplete : ""}`}
          aria-live="polite"
          aria-busy={!isLoaderComplete}
          data-tree-loader
        >
          <div className={styles.loadCard}>
            <h2 className={styles.loadTitle}>loading...</h2>
            <p className={styles.loadStatus}>
              {failedLoads > 0
                ? `${failedLoads} 个图层加载失败，请检查本地资源路径。`
                : completedLoads === layers.length
                  ? "全部图层已就绪"
                  : "正在载入首屏关键图层…"}
            </p>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="首屏资源加载进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className={styles.progressBar} style={{ "--progress-scale": percent / 100 } as CSSProperties} />
            </div>
            <div className={styles.loadMeta}>
              <span>{completedLoads} / {layers.length}</span>
              <span>{percent}%</span>
            </div>
            {failedLoads > 0 ? (
              <button className={styles.retry} type="button" onClick={() => window.location.reload()}>
                重试加载
              </button>
            ) : null}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
