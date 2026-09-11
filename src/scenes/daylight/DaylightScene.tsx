import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";

import { useSiteStore } from "../../app/store";
import { ProjectDialog } from "../../components/ProjectDialog";
import { PROFILE } from "../../content/profile";
import { PROJECTS, PROJECT_MAP } from "../../content/projects";
import { asset } from "../../lib/asset";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { ACTIVE_SEASON, SEASON_ASSETS } from "./season-assets";
import { Shiba } from "./Shiba";
import { Tree } from "./Tree";
import styles from "./DaylightScene.module.css";

/**
 * 首屏根系的散布位置。x / y 是占 `.hero`（100vh 满屏）宽高的百分比，rot 是倾斜角。
 * 早的在下、新的在上——对应「生长」，与 PROJECTS 的时间升序一致。
 * 同一个月的两个项目落在同一高度带，所以是四档而不是六级，形状因此不齐整。
 * `flip` 表示悬停展开层放到名字左边（靠右的项目往右会顶出画面）。
 *
 * 只在「宽屏 + 有鼠标」时生效，见 DaylightScene.module.css 末尾的 media query；
 * 触屏与窄屏走的仍是原来那排常显的网格（用户 2026-09-07 裁定：
 * 触屏点进去有插图，不该退化成只有一行英文名和一句话）。
 */
/** 首屏那句自述里的项目数跟着 PROJECTS 走，避免再出现写死的「七个项目」。 */
const CN_NUMERAL = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const PROJECT_COUNT_CN = CN_NUMERAL[PROJECTS.length] ?? String(PROJECTS.length);

const ROOT_LAYOUT: Record<
  string,
  { x: string; y: string; rot: string; flip?: boolean }
> = {
  ready2apply: { x: "22.4%", y: "92.4%", rot: "-2.8deg" },
  "empirical-paper": { x: "38.6%", y: "88.9%", rot: "2.3deg" },
  chaiyu: { x: "59.2%", y: "87.3%", rot: "-1.6deg" },
  solopr: { x: "31.1%", y: "82.7%", rot: "3.4deg" },
  "jinnang-l10n": { x: "52.8%", y: "78%", rot: "-2.2deg" },
  "sisters-festival": { x: "72.6%", y: "76%", rot: "3.8deg", flip: true },
};

export function DaylightScene() {
  const season = useSiteStore((state) => state.season);
  const springAssets = SEASON_ASSETS[ACTIVE_SEASON];
  const sceneRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  // 布局路由拿不到子路由参数，用 useMatch 直接读当前地址。
  const projectMatch = useMatch("/projects/:projectId");
  const projectId = projectMatch?.params.projectId;
  const activeProject = projectId ? PROJECT_MAP.get(projectId) : undefined;
  const unknownProject = Boolean(projectId) && !activeProject;

  useEffect(() => {
    document.documentElement.dataset.season = season;
  }, [season]);

  /**
   * 关闭详情后把焦点还给「当初点开它的那个元素」，而不是按 id 去找首屏的
   * 根系入口——深链直接进来时页面上并没有对应的根系节点被点过，按 id 找
   * 会把焦点塞到一个访客从没碰过的地方。
   *
   * 触发元素必须在**渲染期**捕获：子组件的 effect 先于父组件执行，等到父
   * effect 跑的时候，弹层已经把焦点移进去了。
   *
   * 焦点移交本身则要等弹层真正卸载后再做，所以记在 ref 里由 effect 执行，
   * 而不是在 navigate 之后直接 rAF——那样会和 React 的提交时机赛跑。
   */
  const triggerRef = useRef<HTMLElement | null>(null);
  const pendingFocusRef = useRef<HTMLElement | null>(null);
  const pendingFallbackRef = useRef<string | null>(null);

  if (activeProject && !triggerRef.current) {
    const active = document.activeElement;
    // 深链接直接进来时 activeElement 是 body，还给它没有意义
    triggerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }

  const closeProject = useCallback(() => {
    pendingFocusRef.current = triggerRef.current;
    pendingFallbackRef.current = projectId ?? null;
    triggerRef.current = null;
    navigate("/");
  }, [navigate, projectId]);

  useEffect(() => {
    if (activeProject) return;
    triggerRef.current = null;
    const target = pendingFocusRef.current;
    pendingFocusRef.current = null;
    if (target?.isConnected) {
      target.focus();
      return;
    }
    // 捕获不到触发元素时（脚本调用 click()、或从没聚焦过的入口进来）
    // 退回按 id 找首屏根系入口，至少不把焦点丢回 body。
    const fallbackId = pendingFallbackRef.current;
    pendingFallbackRef.current = null;
    if (fallbackId) document.getElementById(fallbackId)?.focus();
  }, [activeProject]);

  if (unknownProject) return <NotFoundPage />;

  return (
    <>
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

      <nav id="project-roots" className={styles.projectRoots} aria-label="项目根系">
        {PROJECTS.map((project) => {
          const layout = ROOT_LAYOUT[project.id];
          return (
            <Link
              id={project.id}
              className={styles.note}
              key={project.id}
              to={`/projects/${project.id}`}
              data-highlight={project.highlight ? "true" : undefined}
              data-flip={layout?.flip ? "true" : undefined}
              aria-current={projectId === project.id ? "page" : undefined}
              style={
                layout
                  ? ({
                      "--x": layout.x,
                      "--y": layout.y,
                      "--rot": layout.rot,
                    } as CSSProperties)
                  : undefined
              }
            >
              <span className={styles.noteName}>{project.name}</span>
              <time className={styles.noteTime} dateTime={project.dateTime}>
                {project.dateLabel}
              </time>
              {/* 宽屏上这一层收进悬停；触屏与窄屏里 display:contents，
                  只留一行定位，与改版前一致 */}
              <span className={styles.noteDetail}>
                <span className={styles.noteEn}>{project.enName}</span>
                <span className={styles.noteDescription}>{project.tagline}</span>
                {project.status ? (
                  <span className={styles.noteStatus}>{project.status}</span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.figureShadow} />
      <img
        className={styles.figure}
        src={springAssets.daylightShell.figure}
        alt="Freya，戴棒球帽扎高马尾，站在树旁"
      />
      <Shiba />

      <Link
        className={styles.mailboxEntry}
        to="/contact"
        aria-label="联系方式：给我来信"
      >
        <img
          className={styles.mailboxImage}
          src={asset("/assets/ui/mailbox-entry.png")}
          alt=""
          aria-hidden="true"
        />
        <span className={styles.mailboxLabel}>给我来信</span>
      </Link>

      <div className={styles.copy}>
        <div className={styles.eyebrow}>Daylight · 生长</div>
        <h1 className={styles.name}>
          Freya<span className={styles.dot}>.</span>
        </h1>
        <div className={styles.role}>{PROFILE.role}</div>
        <p className={styles.intro}>
          我把模糊的需求，种成<em>可以验证的东西</em>。<br />
          {PROJECT_COUNT_CN}个项目从同一套根系长出来，按时间先后排开。
        </p>
        <div className={styles.actions}>
          <Link className={styles.button} to="/projects">
            进入项目
          </Link>
          <Link className={`${styles.button} ${styles.ghost}`} to="/resume">
            查看履历
          </Link>
        </div>
      </div>

      {/* 星夜模式的实现全部在 src/scenes/starnight/ 内，这里只是入口 */}
      <Link className={styles.mode} to="/stars" aria-label="切换到星夜模式">
        <span>日光</span>
        <span className={styles.switch} aria-hidden="true" />
        <span className={styles.inactiveMode}>星夜</span>
      </Link>

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

    {/* 弹层放在 main 之外：它要盖住整页，而不只是首屏那一屏 */}
    {activeProject ? (
      <ProjectDialog project={activeProject} onClose={closeProject} />
    ) : null}
    </>
  );
}
