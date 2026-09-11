import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ProjectDialog } from "../components/ProjectDialog";
import { ProjectShowcase } from "../components/ProjectShowcase";
import { PROJECT_MAP } from "../content/projects";
import styles from "./ProjectsPage.module.css";

/**
 * 项目展示页，由首屏的「进入项目」进来。
 *
 * 用户 2026-09-09 裁定：日光首屏固定一屏、不往下滚，展示区从首屏下方搬到这条
 * 独立路由。好处是这一页有自己的 URL，可以单独发给招聘方。
 *
 * 详情弹层在这里用本地 state 开，而不是跳 `/projects/:id`——那条路由归日光首屏
 * 所有。弹层是半覆盖的 bottom sheet，顶部与两侧都露出背景，跳过去的话访客会看见
 * 背景从走马灯闪成一整棵树，关闭后还被丢回首屏。本地开则背景始终是他当前所在的
 * 场景，关掉也停在原来的走马灯位置。深链 `/projects/:id` 行为不变。
 */
export function ProjectsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const project = openId ? PROJECT_MAP.get(openId) : undefined;

  /** 关闭后要把焦点还给那颗「查看项目详情」按钮，否则焦点掉回 body。 */
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const openDetail = useCallback((id: string) => {
    // 必须在弹层挂载前记录：挂载后焦点已经被弹层移走了。
    const active = document.activeElement;
    triggerRef.current = active instanceof HTMLElement ? active : null;
    setOpenId(id);
  }, []);

  const closeDetail = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    if (project) return;
    const target = triggerRef.current;
    triggerRef.current = null;
    if (target?.isConnected) target.focus();
  }, [project]);

  return (
    <main className={styles.page}>
      <div className={styles.bar}>
        <Link className={styles.back} to="/">
          <span aria-hidden="true">←</span> 回到那棵树
        </Link>
      </div>

      <ProjectShowcase onOpenDetail={openDetail} />

      {project ? (
        <ProjectDialog project={project} onClose={closeDetail} />
      ) : null}
    </main>
  );
}
