import { useCallback, useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";

import { PROJECTS, type Project } from "../content/projects";
import { RichText } from "./RichText";
import { useFocusTrap } from "./useFocusTrap";
import styles from "./ProjectDialog.module.css";

interface ProjectDialogProps {
  project: Project;
  onClose: () => void;
}

const EVIDENCE_HINT: Record<string, string> = {
  repo: "代码仓库",
  live: "可直接体验",
  doc: "文档",
};

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone?: "boundary";
}) {
  if (items.length === 0) return null;

  return (
    <section className={tone === "boundary" ? styles.boundarySection : styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const index = PROJECTS.findIndex((item) => item.id === project.id);
  const previous = index > 0 ? PROJECTS[index - 1] : null;
  const next = index < PROJECTS.length - 1 ? PROJECTS[index + 1] : null;

  const close = useCallback(() => onClose(), [onClose]);
  useFocusTrap(panelRef, close, true);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className={styles.scrim} onClick={close}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button className={styles.close} type="button" onClick={close}>
          收起<span aria-hidden="true"> ✕</span>
        </button>

        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <time dateTime={project.dateTime}>{project.dateLabel}</time>
            {project.status ? (
              <span className={styles.statusChip}>{project.status}</span>
            ) : null}
          </p>
          <h2 className={styles.title} id={titleId}>
            {project.name}
          </h2>
          <p className={styles.tagline}>{project.tagline}</p>
          <p className={styles.summary}>{project.summary}</p>
        </header>

        {project.cover ? (
          <img
            className={styles.cover}
            src={project.cover.src}
            alt={project.cover.alt}
            loading="lazy"
            decoding="async"
          />
        ) : null}

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>问题与用户</h3>
            <p className={styles.paragraph}>{project.problem}</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>我的角色</h3>
            <p className={styles.paragraph}>{project.role}</p>
          </section>

          <Section title="关键产品决策" items={project.decisions} />
          <Section title="工作流程" items={project.process} />
          <Section title="成果" items={project.outcomes} />
          <Section title="实际边界" items={project.boundaries} tone="boundary" />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>技术栈</h3>
            <ul className={styles.chips}>
              {project.tech.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>证据入口</h3>
            {project.evidence.length > 0 ? (
              <ul className={styles.evidence}>
                {project.evidence.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer noopener">
                      {item.label}
                      <span className={styles.evidenceHint}>
                        {EVIDENCE_HINT[item.kind]} ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.paragraph}>
                该项目目前不公开代码或线上入口。需要看具体实现和产出，欢迎
                <Link to="/contact">来信</Link>，我单独发给你。
              </p>
            )}
          </section>
        </div>

        <nav className={styles.pager} aria-label="项目切换">
          {previous ? (
            <Link className={styles.pagerLink} to={`/projects/${previous.id}`}>
              <span className={styles.pagerHint}>更早一步</span>
              {previous.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              className={`${styles.pagerLink} ${styles.pagerNext}`}
              to={`/projects/${next.id}`}
            >
              <span className={styles.pagerHint}>再长一点</span>
              {next.name}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </div>
  );
}
