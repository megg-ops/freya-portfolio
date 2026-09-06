import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  AWARDS,
  CONTACT,
  EDUCATION,
  EXPERIENCE,
  PROFILE,
  RESEARCH,
  SKILLS,
} from "../content/profile";
import { PROJECTS } from "../content/projects";
import { asset } from "../lib/asset";
import styles from "./ResumePage.module.css";

/**
 * 一页纸创意 CV，进场时像一张三折信纸被打开。
 *
 * 折线就是分栏线——展开动作和版式结构是同一件事，而不是给一个普通页面
 * 套动画壳子。左右两翼绕各自的折边向外转开，中缝那一栏始终在原位，所以
 * 纸的宽度不变，视觉上是「摊开」而不是「长出来」。
 *
 * 无障碍：prefers-reduced-motion 下直接呈现展开态，不播动画；移动端放弃
 * 「一页」，改成单栏堆叠可滚动，否则 A4 缩到 390px 宽根本读不了。
 *
 * ⚠️ 面板里的内容与版式是待定的第一版，只为看展开效果。取舍（技能压缩、
 * 时间线是否保留、实习怎么表述）还没有定，改动预期集中在这个文件。
 */
/** 弹出与展开必须分两段：叠在一起播的话，折叠态根本来不及被看见。 */
type Stage = "hidden" | "popped" | "opened";

const POP_AT = 80;
const UNFOLD_AT = 760;

export function ResumePage() {
  const [stage, setStage] = useState<Stage>("hidden");

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage("opened");
      return;
    }
    const pop = window.setTimeout(() => setStage("popped"), POP_AT);
    const unfold = window.setTimeout(() => setStage("opened"), UNFOLD_AT);
    return () => {
      window.clearTimeout(pop);
      window.clearTimeout(unfold);
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}>
        <Link className={styles.back} to="/">
          <span aria-hidden="true">←</span> 回到那棵树
        </Link>
        <button
          className={styles.refold}
          type="button"
          onClick={() => {
            // 只收折页、不把纸收回去，重看的是展开这一下
            setStage("popped");
            window.setTimeout(() => setStage("opened"), 420);
          }}
        >
          再展开一次
        </button>
      </div>

      <div className={styles.stage}>
        <article
          className={styles.sheet}
          data-popped={stage !== "hidden" ? "true" : undefined}
          data-opened={stage === "opened" ? "true" : undefined}
          aria-label={`${PROFILE.name} 的一页履历`}
        >
          {/* 左翼 */}
          <section className={`${styles.panel} ${styles.wingLeft}`}>
            <div className={styles.panelInner}>
              <img
                className={styles.portrait}
                src={asset("/assets/freya-spring-cutout-clean.webp")}
                alt=""
                loading="eager"
                decoding="async"
              />
              <h1 className={styles.name}>
                {PROFILE.name}
                <span className={styles.dot}>.</span>
              </h1>
              <p className={styles.role}>{PROFILE.role}</p>
              <p className={styles.status}>{PROFILE.status}</p>
              <p className={styles.statement}>{PROFILE.statement}</p>

              <h2 className={styles.blockTitle}>教育</h2>
              {EDUCATION.map((entry) => (
                <div className={styles.entry} key={entry.degree}>
                  <p className={styles.entryHead}>{entry.school}</p>
                  <p className={styles.entryMeta}>
                    {entry.degree} · {entry.period}
                  </p>
                  <p className={styles.entryFacts}>
                    {entry.facts.slice(0, 2).join(" · ")}
                  </p>
                </div>
              ))}

              <h2 className={styles.blockTitle}>联系</h2>
              <p className={styles.contact}>{CONTACT.email}</p>
              <p className={styles.contact}>github.com/{CONTACT.github.label}</p>
            </div>
          </section>

          {/* 中缝：折页打开后才露出来的主栏 */}
          <section className={`${styles.panel} ${styles.spine}`}>
            <div className={styles.panelInner}>
              <h2 className={styles.blockTitle}>项目</h2>
              <ul className={styles.projects}>
                {[...PROJECTS].reverse().map((project) => (
                  <li key={project.id}>
                    <Link
                      className={styles.projectLink}
                      to={`/projects/${project.id}`}
                    >
                      <span className={styles.projectName}>{project.name}</span>
                      <span className={styles.projectDate}>
                        {project.dateLabel}
                      </span>
                      <span className={styles.projectTagline}>
                        {project.tagline}
                      </span>
                      {project.status ? (
                        <span className={styles.projectStatus}>
                          {project.status}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>

              <h2 className={styles.blockTitle}>奖项</h2>
              <ul className={styles.awards}>
                {AWARDS.slice(0, 3).map((award) => (
                  <li key={award}>{award}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 右翼 */}
          <section className={`${styles.panel} ${styles.wingRight}`}>
            <div className={styles.panelInner}>
              <h2 className={styles.blockTitle}>实习</h2>
              {EXPERIENCE.map((entry) => (
                <div className={styles.entry} key={entry.org}>
                  <p className={styles.entryHead}>
                    {entry.org} · {entry.role}
                  </p>
                  <p className={styles.entryMeta}>{entry.period}</p>
                  <p className={styles.entryBody}>{entry.points[0]}</p>
                </div>
              ))}

              <h2 className={styles.blockTitle}>研究</h2>
              <div className={styles.entry}>
                <p className={styles.entryHead}>{RESEARCH.title}</p>
                <p className={styles.entryMeta}>
                  {RESEARCH.period} · {RESEARCH.role} · {RESEARCH.award}
                </p>
                <p className={styles.entryBody}>{RESEARCH.points[2]}</p>
              </div>

              <h2 className={styles.blockTitle}>能力</h2>
              {SKILLS.map((group) => (
                <div className={styles.skillGroup} key={group.domain}>
                  <p className={styles.skillDomain}>{group.domain}</p>
                  <p className={styles.skillItems}>
                    {group.items.slice(0, 4).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>

      <p className={styles.note}>
        学校按公开口径写为 985 / 211。需要完整履历或可下载的 PDF，
        <Link to="/contact">来信</Link>告诉我。
      </p>
    </main>
  );
}
