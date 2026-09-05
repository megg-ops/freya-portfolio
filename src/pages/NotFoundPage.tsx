import { Link, useLocation } from "react-router-dom";

import { PaperPage } from "./PaperPage";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  const location = useLocation();

  return (
    <PaperPage
      eyebrow="404"
      title="这根枝条上没有长出东西"
      lead={`没有找到 ${location.pathname} 这个地址。可能是链接抄漏了一段，也可能是这部分还没长出来。`}
    >
      <ul className={styles.links}>
        <li>
          <Link to="/">回到日光首屏，从根系挑一个项目</Link>
        </li>
        <li>
          <Link to="/resume">看看履历</Link>
        </li>
        <li>
          <Link to="/contact">给我来信</Link>
        </li>
      </ul>
    </PaperPage>
  );
}
