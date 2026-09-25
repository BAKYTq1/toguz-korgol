import styles from './ScorePanel.module.css';
import { Lang, t } from '../i18n/translations';

interface ScorePanelProps {
  player: 0 | 1;
  score: number;
  tuzdukPit: number; // -1 if none
  isActive: boolean;
  lang: Lang;
  name?: string;
}

export default function ScorePanel({ player, score, tuzdukPit, isActive, lang, name }: ScorePanelProps) {
  const label = name ?? t(lang, player === 0 ? 'player1' : 'player2');
  const tuzdukDisplay = tuzdukPit !== -1
    ? `${t(lang, 'tuzdukLabel')}${player === 0 ? tuzdukPit - 9 + 1 : tuzdukPit + 1}`
    : '';

  return (
    <div
      className={`${styles.panel} ${player === 0 ? styles.dark : styles.light} ${isActive ? styles.active : ''}`}
    >
      <div className={styles.name}>{label}</div>
      <div className={styles.score}>
        {score}
        <span>/162</span>
      </div>
      {tuzdukDisplay && <div className={styles.tuzduk}>{tuzdukDisplay}</div>}
    </div>
  );
}
