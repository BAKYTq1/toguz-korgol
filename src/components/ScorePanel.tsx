import styles from './ScorePanel.module.css';
import { Lang, t } from '../i18n/translations';
import { WIN_THRESHOLD } from '../game/engine';

interface ScorePanelProps {
  player: 0 | 1;
  score: number;
  tuzdukPit: number; // -1 if none
  isActive: boolean;
  lang: Lang;
  name?: string;
  /** Screen side, next to this player's kazan / row. */
  side: 'left' | 'right';
  isMe?: boolean;
}

export default function ScorePanel({ player, score, tuzdukPit, isActive, lang, name, side, isMe = false }: ScorePanelProps) {
  const label = name ?? t(lang, player === 0 ? 'player1' : 'player2');
  const tuzdukDisplay = tuzdukPit !== -1
    ? `${t(lang, 'tuzdukLabel')}${tuzdukPit <= 8 ? tuzdukPit + 1 : tuzdukPit - 9 + 1}`
    : '';
  const progress = Math.min(100, (score / WIN_THRESHOLD) * 100);

  return (
    <div
      className={`${styles.panel} ${player === 0 ? styles.dark : styles.light} ${styles[side]} ${isActive ? styles.active : ''} ${isMe ? styles.me : ''}`}
      data-hud="top"
      aria-live="polite"
    >
      <div className={styles.name} title={label}>
        <span className={styles.chip} aria-hidden="true" />
        <span className={styles.nameText}>{label}</span>
      </div>
      <div className={styles.score}>
        {score}
        <span>/{WIN_THRESHOLD}</span>
      </div>
      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.tuzduk}>{tuzdukDisplay}</div>
    </div>
  );
}
