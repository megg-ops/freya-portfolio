import { useEffect } from "react";
import { Link } from "react-router-dom";

import { PROJECTS } from "../../content/projects";
import styles from "./StarnightScene.module.css";

/**
 * 星夜模式 —— 占位实现，等待填充。
 *
 * ## 这个文件的边界
 *
 * 星夜模式的全部实现都应该落在 `src/scenes/starnight/` 内。路由、模式切换、
 * 全局状态这三处接缝已经在别处铺好了，**不需要也不应该再去改它们**：
 *
 * - 路由 `/stars` 已在 `src/app/App.tsx` 注册
 * - 首屏右上角的日光／星夜切换已经能双向跳转
 * - `useSiteStore` 的 `world` 字段可用（`"daylight" | "stars"`）
 *
 * 这样安排是为了让星夜模式能和首屏、履历的改动并行推进而不产生 JSX 冲突。
 *
 * ## 内容从哪来
 *
 * 复用 `src/content/projects.ts`——它是全站唯一的项目内容源，日光首屏、
 * 项目详情弹层、走马灯展板、履历都从它取数。星夜模式**不要另建一份项目数据**，
 * 否则事实口径会漂移。每个项目已有 `dateTime` 可用于时间线排序、`highlight`
 * 可用于区分主次。
 *
 * ## 验收要求（来自 PLAN.md P1）
 *
 * - 要有区别于日光的探索布局，不能只是换个深色背景加星点
 * - 支持文本导航与键盘可达
 * - `prefers-reduced-motion` 下不做持续运动
 * - 与日光共用同一份内容数据
 */
export function StarnightScene() {
  useEffect(() => {
    document.documentElement.dataset.world = "stars";
    return () => {
      delete document.documentElement.dataset.world;
    };
  }, []);

  return (
    <main className={styles.scene}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Starnight · 星夜</p>
        <h1 className={styles.title}>这片天还没亮起来</h1>
        <p className={styles.lead}>
          星夜模式正在建设中。它会用一套区别于日光的探索式版式呈现同样这些项目，
          而不是给白天的页面换个深色背景。
        </p>

        <ul className={styles.list}>
          {PROJECTS.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`}>
                <span className={styles.name}>{project.name}</span>
                <time dateTime={project.dateTime}>{project.dateLabel}</time>
              </Link>
            </li>
          ))}
        </ul>

        <Link className={styles.back} to="/">
          <span aria-hidden="true">←</span> 回到日光
        </Link>
      </div>
    </main>
  );
}
