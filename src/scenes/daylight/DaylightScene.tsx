import { useEffect } from "react";

import { useSiteStore } from "../../app/store";
import { ACTIVE_SEASON, SEASON_ASSETS } from "./season-assets";
import styles from "./DaylightScene.module.css";

const projects = [
  {
    id: "p-chaiyu",
    name: "柴愈",
    description: "AI 情感陪伴",
    top: "73%",
  },
  {
    id: "p-solopr",
    name: "SoloPR",
    description: "一人公司 · 内容 agent",
    top: "80%",
  },
  {
    id: "p-paper",
    name: "empirical-paper",
    description: "实证论文写作流水线",
    top: "87%",
  },
  {
    id: "p-r2a",
    name: "Ready2Apply",
    description: "求职准备工作台",
    top: "94%",
  },
] as const;

const nodules = [
  { left: "20.54%", top: "95.93%" },
  { left: "32.73%", top: "96.82%" },
  { left: "71.21%", top: "92.15%" },
  { left: "81.49%", top: "89.78%" },
] as const;

export function DaylightScene() {
  const season = useSiteStore((state) => state.season);
  const springAssets = SEASON_ASSETS[ACTIVE_SEASON];

  useEffect(() => {
    document.documentElement.dataset.season = season;
  }, [season]);

  return (
    <main className={styles.hero}>
      <div className={styles.sky} />
      <div className={styles.soil} />

      <svg
        className={styles.wash}
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
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

      <div className={styles.treeShadow} />
      <div className={styles.treeWrap}>
        <img
          className={styles.tree}
          src={springAssets.daylightShell.treeReference}
          alt="一棵完整的树：根、干、分枝与树冠"
        />

        <svg
          className={styles.leaders}
          viewBox="-78 0 178 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M-8,73 C 0,73 8,84 20.5,95.9" />
          <path d="M-8,80 C 2,80 16,88 32.7,96.8" />
          <path d="M-8,87 C 14,87 44,90 71.2,92.2" />
          <path d="M-8,94 C 18,94 52,92 81.5,89.8" />
        </svg>

        {nodules.map((position) => (
          <div className={styles.nodule} style={position} key={position.left}>
            <div className={styles.noduleBody} />
          </div>
        ))}

        {projects.map((project) => (
          <a
            className={styles.note}
            style={{ top: project.top }}
            href={`#${project.id}`}
            key={project.id}
          >
            <span className={styles.noteName}>{project.name}</span>
            <span className={styles.noteDescription}>{project.description}</span>
          </a>
        ))}
      </div>

      <div className={styles.figureShadow} />
      <img
        className={styles.figure}
        src={springAssets.daylightShell.figure}
        alt="Freya，戴棒球帽扎高马尾，站在树旁"
      />

      <div className={styles.copy}>
        <div className={styles.eyebrow}>Daylight · 生长</div>
        <h1 className={styles.name}>
          Freya<span className={styles.dot}>.</span>
        </h1>
        <div className={styles.role}>AI 应用 / 大模型应用开发</div>
        <p className={styles.intro}>
          我把模糊的需求，种成<em>可以验证的东西</em>。<br />
          四个项目从同一套根系长出来：<br />
          问题在地下，作品在地上。
        </p>
        <div className={styles.actions}>
          <a className={styles.button} href="#projects">
            进入项目
          </a>
          <a className={`${styles.button} ${styles.ghost}`} href="#resume">
            查看履历
          </a>
        </div>
      </div>

      <div className={styles.depth}>
        <b>地层 · 越深越早</b>
        根系供给 → 树冠成形
      </div>

      <div className={styles.mode}>
        <span>日光</span>
        <span className={styles.switch} />
        <span className={styles.inactiveMode}>星夜</span>
      </div>

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
