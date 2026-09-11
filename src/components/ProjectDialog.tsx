import { useCallback, useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";

import { PROJECTS, type Project } from "../content/projects";
import { PROJECT_FLOWS } from "../content/project-flows";
import { ProjectFlow } from "./ProjectFlow";
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

/**
 * 内容里的条目多写成 `**小标题**：说明`。拆成两层只是换呈现，
 * 原文一个字都不删——说明句仍然完整显示，只是降一级字重。
 */
function splitEntry(text: string): { title: string | null; desc: string } {
  const match = /^\*\*([^*]+)\*\*[：:]\s*([\s\S]+)$/.exec(text);
  if (!match) return { title: null, desc: text };
  return { title: match[1], desc: match[2] };
}

/** 决策、功能与结果采用不同呈现，标题与解释分层。 */
function EntryList({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone?: "outcome" | "decision";
}) {
  if (items.length === 0) return null;

  /** 决策清单编号，其余用圆点；序号在这里算，样式只管呈现。 */
  const numbered = tone === "decision";

  return (
    <section className={styles.section} data-tone={tone}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <ul className={styles.cards} data-tone={tone}>
        {items.map((item, i) => {
          const entry = splitEntry(item);
          return (
            <li className={styles.card} key={item}>
              <span className={styles.cardMark} aria-hidden="true">
                {numbered ? `${i + 1}.` : "•"}
              </span>
              {entry.title ? (
                <p className={styles.cardTitle}>{entry.title}</p>
              ) : null}
              <p
                className={
                  entry.title
                    ? styles.cardDesc
                    : `${styles.cardDesc} ${styles.cardDescWide}`
                }
              >
                <RichText text={entry.desc} />
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 技术栈：按分组横向铺开，层名当行首标签。只是排版，不是流程。 */
function TechStack({ project }: { project: Project }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>技术栈</h3>
      <dl className={styles.stack}>
        {project.tech.map((group) => (
          <div className={styles.layer} key={group.label}>
            <dt className={styles.layerLabel}>{group.label}</dt>
            <dd className={styles.nodes}>
              {group.items.map((item) => (
                <span className={styles.node} key={item}>
                  {item}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const index = PROJECTS.findIndex((item) => item.id === project.id);
  const previous = index > 0 ? PROJECTS[index - 1] : null;
  const next = index < PROJECTS.length - 1 ? PROJECTS[index + 1] : null;
  const flow = PROJECT_FLOWS[project.id];

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

        <div className={styles.intro}>
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
            <p className={styles.enName}>{project.enName}</p>
            <p className={styles.summary}>{project.summary}</p>
            <ul className={styles.quickLinks} aria-label="项目证据入口">
              {project.evidence.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noreferrer noopener">
                    {item.kind === "repo" ? "查看代码" : item.kind === "live" ? "打开 Demo" : "阅读文档"} ↗
                  </a>
                </li>
              ))}
            </ul>
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
        </div>

        <div className={styles.body}>
          {/* 先明确问题，再读决策、实现和结果；阅读顺序不依赖屏幕宽度。 */}
          <div className={styles.split}>
            <div className={styles.column}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>要解决的问题</h3>
                <p className={styles.paragraph}>
                  <RichText text={project.why} />
                </p>
              </section>
            </div>

            <div className={styles.column}>
              <section className={`${styles.section} ${styles.aside}`}>
                <h3 className={styles.sectionTitle}>给谁用</h3>
                <p className={styles.paragraph}>{project.users}</p>
              </section>
            </div>
          </div>

          <EntryList title="关键决策与取舍" items={project.tradeoffs} tone="decision" />
          <EntryList title="方案如何落地" items={project.features} />

          {flow ? (
            <section className={`${styles.section} ${styles.flowSection}`}>
              <h3 className={styles.sectionTitle}>流程与实现</h3>
              <ProjectFlow flow={flow} id={project.id} />
            </section>
          ) : null}

          <EntryList
            title="结果与待验证"
            items={project.outcomes}
            tone="outcome"
          />
          <EntryList title="下一步验证与迭代" items={project.nextSteps} />

          <TechStack project={project} />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>链接</h3>
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
                链接整理中。想看具体实现或产出，欢迎
                <Link to="/contact">来信</Link>，我直接发给你。
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
