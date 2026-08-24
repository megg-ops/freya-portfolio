import { useEffect, useRef } from "react";

import { useSiteStore } from "../../app/store";
import { ACTIVE_SEASON, SEASON_ASSETS } from "./season-assets";
import { Shiba } from "./Shiba";
import { Tree } from "./Tree";
import styles from "./DaylightScene.module.css";

const projects = [
  {
    id: "p-solopr",
    name: "SoloPR",
    description: "一人公司 · 内容 Agent",
    dateTime: "2026-07",
    dateLabel: "2026 · 07",
  },
  {
    id: "p-chaiyu",
    name: "柴愈",
    description: "AI 情感陪伴",
    dateTime: "2026-05",
    dateLabel: "2026 · 05",
  },
  {
    id: "p-paper",
    name: "empirical-paper",
    description: "实证论文写作流水线",
    dateTime: "2026-05",
    dateLabel: "2026 · 05",
  },
  {
    id: "p-r2a",
    name: "Ready2Apply",
    description: "求职准备工作台",
    dateTime: "2026-04",
    dateLabel: "2026 · 04",
  },
] as const;

const overlayCopy = {
  resume: {
    title: "履历正在长成一圈年轮",
    body: "完整履历会在下一阶段接入；当前先从四个项目入口查看这套能力根系。",
  },
  mailbox: {
    title: "信箱还在接线",
    body: "留言传递链路尚未确定，当前不会提交任何内容。入口准备好后会在这里开放。",
  },
} as const;

export function DaylightScene() {
  const season = useSiteStore((state) => state.season);
  const activeProject = useSiteStore((state) => state.activeProject);
  const overlay = useSiteStore((state) => state.overlay);
  const setActiveProject = useSiteStore((state) => state.setActiveProject);
  const setOverlay = useSiteStore((state) => state.setOverlay);
  const springAssets = SEASON_ASSETS[ACTIVE_SEASON];
  const sceneRef = useRef<HTMLElement>(null);
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const mailboxButtonRef = useRef<HTMLButtonElement>(null);

  const closeOverlay = () => {
    const returnFocus =
      overlay === "mailbox" ? mailboxButtonRef.current : resumeButtonRef.current;
    setOverlay(null);
    requestAnimationFrame(() => returnFocus?.focus());
  };

  useEffect(() => {
    document.documentElement.dataset.season = season;
  }, [season]);

  useEffect(() => {
    if (!overlay) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverlay();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [overlay]);

  const focusProjectRoots = () => {
    const target = document.getElementById(activeProject ?? projects[0].id);
    if (target instanceof HTMLButtonElement) target.focus();
  };

  return (
    <main ref={sceneRef} className={styles.hero}>
      <div className={styles.sky} />
      <div className={styles.soil} />

      <div className={styles.washClip} aria-hidden="true">
        <svg
          className={styles.wash}
          viewBox="0 0 1440 1000"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="wcA" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.009 0.014"
                numOctaves="5"
                seed="4"
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="72"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id="wcA2" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.016 0.011"
                numOctaves="4"
                seed="19"
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="52"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <g filter="url(#wcA)" opacity=".5">
            <ellipse cx="250" cy="200" rx="230" ry="150" fill="#CFE0B6" />
            <ellipse cx="1080" cy="150" rx="300" ry="170" fill="#D9E7C4" />
            <ellipse cx="700" cy="430" rx="340" ry="120" fill="#E3EDD2" />
          </g>
          <g filter="url(#wcA2)" opacity=".34">
            <ellipse cx="430" cy="330" rx="200" ry="110" fill="#BFD5A2" />
            <ellipse cx="1260" cy="380" rx="180" ry="120" fill="#CBDEAE" />
          </g>
        </svg>
      </div>

      <svg
        className={styles.horizonLine}
        viewBox="0 0 1440 16"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,9 C120,6 210,11 330,8.5 C450,6 540,11.5 660,9 C780,6.5 880,11 1000,8.6 C1120,6.2 1230,11.4 1340,8.8 C1390,7.6 1420,9.4 1440,8.6"
          fill="none"
          stroke="#B6A98C"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity=".85"
        />
        <path
          d="M0,11.4 C160,9 280,13 420,10.8 C560,8.6 700,13.2 840,11 C980,8.8 1130,13 1280,10.6 C1360,9.4 1410,11.2 1440,10.6"
          fill="none"
          stroke="#C9BC9E"
          strokeWidth="1"
          strokeLinecap="round"
          opacity=".6"
        />
      </svg>

      <div className={styles.treeWrap}>
        <Tree layers={springAssets.treeLayers} parallaxTargetRef={sceneRef} />
      </div>

      <nav id="projects" className={styles.projectRoots} aria-label="项目根系">
        {projects.map((project) => (
          <button
            id={project.id}
            className={styles.note}
            type="button"
            key={project.id}
            aria-pressed={activeProject === project.id}
            onClick={() =>
              setActiveProject(activeProject === project.id ? null : project.id)
            }
          >
            <span className={styles.noteName}>{project.name}</span>
            <time className={styles.noteTime} dateTime={project.dateTime}>
              {project.dateLabel}
            </time>
            <span className={styles.noteDescription}>{project.description}</span>
          </button>
        ))}
      </nav>

      <div className={styles.figureShadow} />
      <img
        className={styles.figure}
        src={springAssets.daylightShell.figure}
        alt="Freya，戴棒球帽扎高马尾，站在树旁"
      />
      <Shiba />

      <button
        ref={mailboxButtonRef}
        className={styles.mailboxEntry}
        type="button"
        aria-label={overlay === "mailbox" ? "收起来信入口" : "打开来信入口"}
        aria-expanded={overlay === "mailbox"}
        aria-controls={overlay === "mailbox" ? "daylight-overlay-note" : undefined}
        onClick={() => setOverlay(overlay === "mailbox" ? null : "mailbox")}
      >
        <img
          className={styles.mailboxImage}
          src="/assets/ui/mailbox-entry.png"
          alt=""
          aria-hidden="true"
        />
        <span className={styles.mailboxLabel}>给我来信</span>
      </button>

      {overlay ? (
        <aside
          id="daylight-overlay-note"
          className={styles.overlayNotice}
          aria-live="polite"
        >
          <strong>{overlayCopy[overlay].title}</strong>
          <p>{overlayCopy[overlay].body}</p>
          <button type="button" onClick={closeOverlay}>
            收起
          </button>
        </aside>
      ) : null}

      <div className={styles.copy}>
        <div className={styles.eyebrow}>Daylight · 生长</div>
        <h1 className={styles.name}>
          Freya<span className={styles.dot}>.</span>
        </h1>
        <div className={styles.role}>AI 应用 / 大模型应用开发</div>
        <p className={styles.intro}>
          我把模糊的需求，种成<em>可以验证的东西</em>。<br />
          四个项目从同一套根系长出来。
        </p>
        <div className={styles.actions}>
          <button className={styles.button} type="button" onClick={focusProjectRoots}>
            进入项目
          </button>
          <button
            ref={resumeButtonRef}
            className={`${styles.button} ${styles.ghost}`}
            type="button"
            aria-expanded={overlay === "resume"}
            aria-controls={overlay === "resume" ? "daylight-overlay-note" : undefined}
            onClick={() => setOverlay(overlay === "resume" ? null : "resume")}
          >
            查看履历
          </button>
        </div>
      </div>

      <button
        className={styles.mode}
        type="button"
        aria-label="当前为日光模式；星夜模式正在建设中"
        aria-pressed="true"
        aria-disabled="true"
        title="星夜模式正在生长中"
      >
        <span>日光</span>
        <span className={styles.switch} aria-hidden="true" />
        <span className={styles.inactiveMode}>星夜</span>
      </button>

      <svg
        className={styles.grain}
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <filter id="grainA">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0 0.30  0 0 0 0.055 0"
          />
        </filter>
        <rect width="1440" height="1000" filter="url(#grainA)" />
      </svg>
    </main>
  );
}
