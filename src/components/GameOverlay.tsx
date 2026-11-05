import styles from './GameOverlay.module.css';
import { Lang, t } from '../i18n/translations';

interface GameOverlayProps {
  show: boolean;
  winner: 0 | 1 | 'draw' | null;
  kazan: [number, number];
  names: [string, string];
  /** The viewer's seat in AI/online games, null for two players on one device. */
  me: 0 | 1 | null;
  lang: Lang;
  onRestart: () => void;
}

export default function GameOverlay({ show, winner, kazan, names, me, lang, onRestart }: GameOverlayProps) {
  if (!show || winner === null) return null;

  let title: string;
  let mood: 'win' | 'lose' | 'draw';
  if (winner === 'draw') {
    title = t(lang, 'draw');
    mood = 'draw';
  } else if (me !== null) {
    mood = winner === me ? 'win' : 'lose';
    title = t(lang, mood === 'win' ? 'youWin' : 'youLose');
  } else {
    mood = 'win';
    title = t(lang, winner === 0 ? 'player1wins' : 'player2wins');
  }

  const order: (0 | 1)[] = winner === 1 ? [1, 0] : [0, 1];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className={`${styles.box} ${styles[mood]}`}>
        <div className={styles.emblem} aria-hidden="true">{mood === 'win' ? '✦' : mood === 'draw' ? '◈' : '◇'}</div>
        <h2 className={styles.title} id="game-over-title">{title}</h2>
        <div className={styles.scores}>
          {order.map(player => (
            <div key={player} className={`${styles.scoreRow} ${winner === player ? styles.winnerRow : ''}`}>
              <span className={styles.scoreName}>{names[player]}</span>
              <span className={styles.scoreValue}>{kazan[player]}</span>
            </div>
          ))}
        </div>
        <button className={styles.btn} onClick={onRestart} autoFocus>
          {t(lang, 'restart')}
        </button>
      </div>
    </div>
  );
}
