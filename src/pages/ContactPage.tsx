import { useState } from "react";

import { CONTACT } from "../content/profile";
import { PaperPage } from "./PaperPage";
import styles from "./ContactPage.module.css";

type CopyState = "idle" | "copied" | "failed";

const mailtoHref = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  CONTACT.mailSubject,
)}&body=${encodeURIComponent(CONTACT.mailBody)}`;

export function ContactPage() {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const copyEmail = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(CONTACT.email);
      setCopyState("copied");
    } catch {
      // 不伪装成功：复制失败时明确告诉访客手动选中地址。
      setCopyState("failed");
    }
  };

  return (
    <PaperPage
      eyebrow="Mailbox · 来信"
      title="信箱"
    >
      <div className={styles.grid}>
        <section className={styles.primary} aria-labelledby="contact-mail">
          <h2 className={styles.blockTitle} id="contact-mail">
            写邮件给我
          </h2>
          <p className={styles.address}>{CONTACT.email}</p>
          <div className={styles.actions}>
            <a className={styles.button} href={mailtoHref}>
              打开邮件应用
            </a>
            <button className={styles.ghost} type="button" onClick={copyEmail}>
              复制邮箱地址
            </button>
          </div>
          <p className={styles.status} role="status">
            {copyState === "copied"
              ? "已复制到剪贴板。"
              : copyState === "failed"
                ? "浏览器拒绝了复制操作，请手动选中上面的地址。"
                : ""}
          </p>
        </section>

        <section className={styles.secondary} aria-labelledby="contact-elsewhere">
          <h2 className={styles.blockTitle} id="contact-elsewhere">
            其他地方
          </h2>
          <ul className={styles.links}>
            <li>
              <a
                href={CONTACT.github.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub · {CONTACT.github.label}
                <span className={styles.linkHint}>↗</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </PaperPage>
  );
}
