import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

import styles from "./PaperPage.module.css";

interface PaperPageProps {
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
}

/** 履历、联系与未知路由共用的纸面版式，保持与日光首屏同一套色与质感。 */
export function PaperPage({ eyebrow, title, lead, children }: PaperPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.sheet}>
        <Link className={styles.back} to="/">
          <span aria-hidden="true">←</span> 回到那棵树
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </header>

        {children}
      </div>
    </main>
  );
}
