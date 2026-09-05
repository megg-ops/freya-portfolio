import { useCallback, useEffect, useRef } from "react";
import { Link, useMatch, useNavigate } from "react-router-dom";

import { useSiteStore } from "../../app/store";
import { ProjectDialog } from "../../components/ProjectDialog";
import { PROJECTS, PROJECT_MAP } from "../../content/projects";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { ACTIVE_SEASON, SEASON_ASSETS } from "./season-assets";
import { Shiba } from "./Shiba";
import { Tree } from "./Tree";
import styles from "./DaylightScene.module.css";

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
   * 关闭详情后把焦点还给对应的根系入口，键盘用户不会掉回页面顶部。
   * 焦点要等弹层真正卸载后再移交，所以记在 ref 里由 effect 执行，
   * 而不是在 navigate 之后直接 rAF——那样会和 React 的提交时机赛跑。
   */
  const pendingFocusRef = useRef<string | null>(null);

  const closeProject = useCallback(() => {
    pendingFocusRef.current = projectId ?? null;
    navigate("/");
  }, [navigate, projectId]);

  useEffect(() => {
    if (activeProject) return;
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    document.getElementById(target)?.focus();
  }, [activeProject]);

  const focusProjectRoots = () => {
    const target = document.getElementById(projectId ?? PROJECTS[0].id);
    if (target instanceof HTMLElement) target.focus();
  };

  if (unknownProject) return <NotFoundPage />;

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
        {PROJECTS.map((project) => (
          <Link
            id={project.id}
            className={styles.note}
            key={project.id}
            to={`/projects/${project.id}`}
            data-highlight={project.highlight ? "true" : undefined}
            aria-current={projectId === project.id ? "page" : undefined}
          >
            <span className={styles.noteName}>{project.name}</span>
            <time className={styles.noteTime} dateTime={project.dateTime}>
              {project.dateLabel}
            </time>
            <span className={styles.noteDescription}>{project.tagline}</span>
          </Link>
        ))}
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
          src="/assets/ui/mailbox-entry.png"
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
        <div className={styles.role}>AI 应用 / 大模型应用开发</div>
        <p className={styles.intro}>
          我把模糊的需求，种成<em>可以验证的东西</em>。<br />
          七个项目从同一套根系长出来，按时间从左往右。
        </p>
        <div className={styles.actions}>
          <button className={styles.button} type="button" onClick={focusProjectRoots}>
            进入项目
          </button>
          <Link className={`${styles.button} ${styles.ghost}`} to="/resume">
            查看履历
          </Link>
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

      {activeProject ? (
        <ProjectDialog project={activeProject} onClose={closeProject} />
      ) : null}
    </main>
  );
}
