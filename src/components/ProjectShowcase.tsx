import { useCallback, useEffect, useId, useRef, useState } from "react";

import { PROJECTS } from "../content/projects";
import { RichText } from "./RichText";
import styles from "./ProjectShowcase.module.css";

/**
 * 项目展示区，住在 `/projects`（2026-09-09 前在首屏下方，靠滚动进入）。
 *
 * 为什么不是纯自动轮播：招聘方停留时间短，只给一个会自己走的舞台，等于逼人等。
 * 所以底部那条时间线始终列出全部项目——它既是「一眼看全貌」的索引，也是
 * 走马灯的导航。舞台负责展示感，时间线负责信息完整。
 *
 * 自动播放遵守 docs/PRODUCT.md 的动效原则：hover／focus／reduced-motion 下一律停，
 * 并且给显式的暂停按钮，不做无法叫停的持续运动。
 */

const AUTOPLAY_MS = 8000;

interface ProjectShowcaseProps {
  /** 打开项目详情。弹层由页面自己挂，见 ProjectsPage 的说明。 */
  onOpenDetail: (projectId: string) => void;
}

export function ProjectShowcase({ onOpenDetail }: ProjectShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headingId = useId();

  const project = PROJECTS[index];
  const count = PROJECTS.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // 只有在「想播 + 没被指到 + 没要求减少动效」时才真的走。
  const autoplayActive = playing && !hovering && !reducedMotion;

  useEffect(() => {
    if (!autoplayActive) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(timer);
  }, [autoplayActive, count]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      className={styles.showcase}
      aria-labelledby={headingId}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setHovering(false);
        }
      }}
      onKeyDown={onKeyDown}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Projects · {PROJECTS.length} 个项目</p>
        <h2 className={styles.heading} id={headingId}>
          从同一套根系长出来
        </h2>
        <p className={styles.lead}>
          按时间顺序排列。左右可以翻，也可以直接从下面那条时间线跳到任意一个。
        </p>
      </header>

      <div className={styles.stage}>
        <div className={styles.visual} aria-hidden="true">
          {PROJECTS.map((item, i) => (
            <div
              className={styles.slide}
              key={item.id}
              data-active={i === index ? "true" : undefined}
            >
              {item.cover ? (
                <img
                  className={styles.cover}
                  src={item.cover.src}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : (
                // 没有可公开的截图时用排版承载，不放占位图充数
                <div className={styles.typographic}>
                  <span className={styles.typographicMark}>{item.dateLabel}</span>
                  <p className={styles.typographicQuote}>{item.tagline}</p>
                  {item.status ? (
                    <span className={styles.typographicStatus}>{item.status}</span>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.detail}>
          <p className={styles.detailMeta}>
            <time dateTime={project.dateTime}>{project.dateLabel}</time>
            {project.status ? (
              <span className={styles.statusChip}>{project.status}</span>
            ) : null}
          </p>
          <h3 className={styles.detailName}>{project.name}</h3>
          <p className={styles.detailTagline}>{project.tagline}</p>
          <p className={styles.detailSummary}>{project.summary}</p>

          <ul className={styles.outcomes}>
            {project.outcomes.slice(0, 2).map((item) => (
              <li key={item}>
                <RichText text={item} />
              </li>
            ))}
          </ul>

          <button
            className={styles.detailLink}
            type="button"
            onClick={() => onOpenDetail(project.id)}
          >
            查看项目详情 <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            className={styles.arrow}
            type="button"
            onClick={() => go(index - 1)}
            aria-label="上一个项目"
          >
            ←
          </button>
          <button
            className={styles.arrow}
            type="button"
            onClick={() => go(index + 1)}
            aria-label="下一个项目"
          >
            →
          </button>
          <button
            className={styles.play}
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-pressed={playing}
            disabled={reducedMotion}
            title={
              reducedMotion
                ? "系统已设置减少动态效果，自动播放保持关闭"
                : undefined
            }
          >
            {reducedMotion ? "自动播放已关闭" : playing ? "暂停自动播放" : "开始自动播放"}
          </button>
        </div>

        {/* 这条时间线同时是「看全貌」和「跳转」，所以不用抽象的小圆点 */}
        <ol className={styles.timeline}>
          {PROJECTS.map((item, i) => (
            <li key={item.id}>
              <button
                className={styles.timelineItem}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? "true" : undefined}
                data-highlight={item.highlight ? "true" : undefined}
              >
                <span className={styles.timelineName}>{item.name}</span>
                <span className={styles.timelineDate}>{item.dateLabel}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
