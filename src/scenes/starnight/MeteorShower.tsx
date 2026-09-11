import { useEffect, useState, type CSSProperties } from "react";
import styles from "./StarnightScene.module.css";

// A small, staggered shower above the landscape; no pointer or frame listeners.
const METEORS = [
  [81, 12, 115, 0], [61, 29, 84, 1.2], [96, 36, 145, 2.1],
  [48, 8, 96, 4.6], [72, 47, 120, 5.4], [91, 5, 75, 7.1],
  [37, 26, 105, 8.4],
];

export function MeteorShower({ paused }: { paused: boolean }) {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return <div className={styles.shower} aria-hidden="true" data-paused={paused || hidden}>
    {METEORS.map(([x, y, length, delay], i) => <span key={i} className={styles.shootingStar}
      style={{ left: `${x}%`, top: `${y}%`, width: `${length}px`, "--meteor-delay": `${delay}s` } as CSSProperties} />)}
  </div>;
}
