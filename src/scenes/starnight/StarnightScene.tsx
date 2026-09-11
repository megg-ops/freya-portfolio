import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { asset } from "../../lib/asset";
import { useFocusTrap } from "../../components/useFocusTrap";
import { MeteorTrail } from "./MeteorTrail";
import { MeteorShower } from "./MeteorShower";
import { GALAXIES, type StarNote } from "./night-notes";
import styles from "./StarnightScene.module.css";

// Decorative spiral dust; accessible HTML buttons carry all interactions.
function GalaxyDust({ id }: { id: string }) {
  return <svg className={styles.dust} viewBox="0 0 320 220" aria-hidden="true">
    <defs><radialGradient id={`halo-${id}`}><stop stopColor="currentColor" stopOpacity=".15" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient></defs>
    <ellipse cx="160" cy="107" rx="145" ry="90" fill={`url(#halo-${id})`} />
    {Array.from({ length: 220 }, (_, i) => {
      const t = (i % 110) / 110;
      const angle = t * Math.PI * 3.3 + (i >= 110 ? Math.PI : 0);
      const radius = 8 + t * 125;
      return <circle key={i} cx={160 + Math.cos(angle) * radius + Math.sin(i * 127.1) * 8}
        cy={107 + Math.sin(angle) * radius * .49 + Math.cos(i * 43.7) * 7}
        r={i % 11 === 0 ? 1.15 : .65} fill="currentColor" opacity={.15 + (1 - t) * .42} />;
    })}
    <path className={styles.connection} d="M 55 125 L 156 64 L 263 119" />
  </svg>;
}

export function StarnightScene() {
  const [selected, setSelected] = useState<StarNote | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [showNames, setShowNames] = useState(false);
  const [still, setStill] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    document.documentElement.dataset.world = "stars";
    return () => { delete document.documentElement.dataset.world; };
  }, []);
  useEffect(() => {
    if (selected && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [selected]);
  function openNote(note: StarNote, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setVisited((previous) => new Set(previous).add(note.id));
    setSelected(note);
  }
  const closeNote = useCallback(() => {
    dialogRef.current?.close();
    setSelected(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);
  useFocusTrap(dialogRef, closeNote, selected !== null);
  return <main className={styles.scene} data-still={still} data-names={showNames}>
    <img className={styles.landscape} src={asset("assets/night-campsite-v1.webp")}
      alt="星空下的露营车亮着暖灯，女孩在椅子上看星星，柴犬蜷睡在脚边。"
      fetchPriority="high" onError={() => setImageFailed(true)} />
    <div className={styles.shade} aria-hidden="true" />
    <MeteorShower paused={still || selected !== null} />
    <MeteorTrail paused={still || selected !== null} />
    <header className={styles.header}>
      <Link className={styles.brand} to="/" aria-label="Freya，回到日光首页">Freya<span>夜间营地</span></Link>
      <Link className={styles.daylight} to="/"><span aria-hidden="true">☼</span> 回到日光</Link>
    </header>
    <div className={styles.intro}>
      <p className={styles.chapter}>今晚，停在这里。</p>
      <h1>还有一些想法，<br />留给星空。</h1>
      <p className={styles.invitation}>点亮一颗星，拾起一段灵感。</p>
    </div>
    <section className={styles.sky} aria-label="探索星系">
      {GALAXIES.map((galaxy) => <section className={styles.galaxy} key={galaxy.id}
        aria-labelledby={`galaxy-${galaxy.id}`} style={{ "--galaxy-color": galaxy.color } as CSSProperties}>
        <h2 id={`galaxy-${galaxy.id}`} className={styles.galaxyName}>{galaxy.name}<span>{galaxy.subtitle}</span></h2>
        <div className={styles.orbit}>
          <GalaxyDust id={galaxy.id} />
          {galaxy.notes.map((note, i) => <button key={note.id} type="button" className={styles.star}
            style={{ left: `${[55, 156, 263][i] / 3.2}%`, top: `${[125, 64, 119][i] / 2.2}%`, "--delay": `${i * -.9}s` } as CSSProperties}
            aria-label={`${note.title}，${galaxy.name}${visited.has(note.id) ? "，已探索" : ""}`}
            aria-haspopup="dialog" data-visited={visited.has(note.id)}
            onClick={(event) => openNote(note, event.currentTarget)}>
            <span className={styles.starLight} aria-hidden="true" /><span className={styles.starLabel}>{note.title}</span>
          </button>)}
        </div>
      </section>)}
    </section>
    <footer className={styles.footer}>
      <div className={styles.footnote}><span className={styles.location}>山野之间 · 不急着抵达</span>
        <span>已拾起 {visited.size} / 9 颗星</span>
        {imageFailed && <span role="status">营地插画暂未加载，星系仍可探索。</span>}
      </div>
      <div className={styles.controls}>
        <button type="button" aria-pressed={showNames} onClick={() => setShowNames(!showNames)}>星名{showNames ? "已展开" : "导览"}</button>
        <button type="button" aria-pressed={still} onClick={() => setStill(!still)}>{still ? "让星光流动" : "让星空静下来"}</button>
      </div>
    </footer>
    <dialog className={styles.note} ref={dialogRef} aria-labelledby="night-note-title"
      onCancel={(event) => { event.preventDefault(); closeNote(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeNote();
      }}>
      <button type="button" className={styles.close} onClick={closeNote} aria-label="收起短笺，回到星空">×</button>
      <span className={styles.noteStar} aria-hidden="true">✦</span>
      <p className={styles.noteCategory}>{selected?.category}
        {selected ? <> · <time dateTime={selected.dateTime}>{selected.time}</time></> : null}</p>
      <h2 id="night-note-title">{selected?.title}</h2>
      <p className={styles.noteVenue}>{selected?.venue}</p>
      <p className={styles.noteBody}>{selected?.body}</p>
      <button type="button" className={styles.return} onClick={closeNote}>收好这张短笺，继续看星星 <span aria-hidden="true">↗</span></button>
    </dialog>
  </main>;
}
