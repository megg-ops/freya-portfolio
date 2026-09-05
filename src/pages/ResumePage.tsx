import { Link } from "react-router-dom";

import {
  AWARDS,
  EDUCATION,
  EXPERIENCE,
  PROFILE,
  RESEARCH,
  SKILLS,
  TIMELINE,
} from "../content/profile";
import { PROJECTS } from "../content/projects";
import { PaperPage } from "./PaperPage";
import styles from "./ResumePage.module.css";

export function ResumePage() {
  return (
    <PaperPage
      eyebrow="Résumé · 年轮"
      title={PROFILE.name}
      lead={PROFILE.statement}
    >
      <p className={styles.status}>
        {PROFILE.role} · {PROFILE.status}
      </p>

      <section className={styles.block} aria-labelledby="resume-timeline">
        <h2 className={styles.blockTitle} id="resume-timeline">
          一圈一圈长出来的
        </h2>
        <ol className={styles.timeline}>
          {TIMELINE.map((entry) => (
            <li className={styles.ring} key={`${entry.period}-${entry.title}`}>
              <span className={styles.ringPeriod}>{entry.period}</span>
              <span className={styles.ringKind} data-kind={entry.kind}>
                {entry.kind}
              </span>
              <span className={styles.ringTitle}>
                {entry.title}
                {entry.detail ? (
                  <em className={styles.ringDetail}>{entry.detail}</em>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block} aria-labelledby="resume-education">
        <h2 className={styles.blockTitle} id="resume-education">
          教育
        </h2>
        <div className={styles.cards}>
          {EDUCATION.map((entry) => (
            <article className={styles.card} key={entry.degree}>
              <h3 className={styles.cardTitle}>{entry.school}</h3>
              <p className={styles.cardMeta}>
                {entry.degree} · {entry.period}
              </p>
              <ul className={styles.factList}>
                {entry.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.note}>
          学校按公开口径写为 985 / 211，需要具体校名与成绩单可以来信索取。
        </p>
      </section>

      <section className={styles.block} aria-labelledby="resume-experience">
        <h2 className={styles.blockTitle} id="resume-experience">
          实习
        </h2>
        {EXPERIENCE.map((entry) => (
          <article className={styles.card} key={entry.org}>
            <h3 className={styles.cardTitle}>
              {entry.org} · {entry.role}
            </h3>
            <p className={styles.cardMeta}>{entry.period}</p>
            <ul className={styles.factList}>
              {entry.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {entry.boundaries ? (
              <ul className={styles.boundaryList}>
                {entry.boundaries.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <section className={styles.block} aria-labelledby="resume-projects">
        <h2 className={styles.blockTitle} id="resume-projects">
          项目
        </h2>
        <ul className={styles.projectList}>
          {[...PROJECTS].reverse().map((project) => (
            <li key={project.id}>
              <Link className={styles.projectLink} to={`/projects/${project.id}`}>
                <span className={styles.projectName}>{project.name}</span>
                <span className={styles.projectTagline}>{project.tagline}</span>
                <span className={styles.projectMeta}>
                  {project.dateLabel}
                  {project.status ? ` · ${project.status}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="resume-research">
        <h2 className={styles.blockTitle} id="resume-research">
          研究
        </h2>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>{RESEARCH.title}</h3>
          <p className={styles.cardMeta}>
            {RESEARCH.period} · {RESEARCH.role} · {RESEARCH.award}
          </p>
          <ul className={styles.factList}>
            {RESEARCH.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className={styles.block} aria-labelledby="resume-skills">
        <h2 className={styles.blockTitle} id="resume-skills">
          能力
        </h2>
        <div className={styles.skills}>
          {SKILLS.map((group) => (
            <div className={styles.skillGroup} key={group.domain}>
              <h3 className={styles.skillDomain}>{group.domain}</h3>
              <ul className={styles.chips}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.block} aria-labelledby="resume-awards">
        <h2 className={styles.blockTitle} id="resume-awards">
          奖项与证书
        </h2>
        <ul className={styles.factList}>
          {AWARDS.map((award) => (
            <li key={award}>{award}</li>
          ))}
        </ul>
      </section>

      <aside className={styles.cta}>
        <p>需要一份可下载的 PDF 简历，或者具体项目的完整材料？</p>
        <Link className={styles.ctaLink} to="/contact">
          给我来信 →
        </Link>
      </aside>
    </PaperPage>
  );
}
