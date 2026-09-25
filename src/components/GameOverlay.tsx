import styles from './GameOverlay.module.css';
import { Lang, t } from '../i18n/translations';

interface GameOverlayProps {
  show: boolean;
  winner: 0 | 1 | 'draw' | null;
  kazan: [number, number];
  lang: Lang;
  onRestart: () => void;
}

export default function GameOverlay({ show, winner, kazan, lang, onRestart }: GameOverlayProps) {
  if (!show) return null;

  let title = '';
  let text = '';

  if (winner === 'draw') {
    title = t(lang, 'draw');
    text = `${kazan[0]} — ${kazan[1]}`;
  } else if (winner === 0) {
    title = t(lang, 'player1wins');
    text = `${t(lang, 'player1')}: ${kazan[0]}, ${t(lang, 'player2')}: ${kazan[1]}`;
  } else if (winner === 1) {
    title = t(lang, 'player2wins');
    text = `${t(lang, 'player2')}: ${kazan[1]}, ${t(lang, 'player1')}: ${kazan[0]}`;
  }

  return (
    <div className={`${styles.overlay} ${show ? styles.show : ''}`} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{text}</p>
        <button className={styles.btn} onClick={onRestart} autoFocus>
          {t(lang, 'restart')}
        </button>
      </div>
    </div>
  );
}
