import styles from './TurnBanner.module.css';
import { Lang, t } from '../i18n/translations';

interface TurnBannerProps {
  current: 0 | 1;
  gameOver: boolean;
  lang: Lang;
  p1Name?: string;
  p2Name?: string;
}

export default function TurnBanner({ current, gameOver, lang, p1Name, p2Name }: TurnBannerProps) {
  const names = [
    p1Name ?? t(lang, 'player1'),
    p2Name ?? t(lang, 'player2'),
  ];

  return (
    <div className={styles.banner}>
      {gameOver
        ? '—'
        : <>{t(lang, 'turnLabel')} <b>{names[current]}</b></>
      }
    </div>
  );
}
