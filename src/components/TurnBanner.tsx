import styles from './TurnBanner.module.css';
import { Lang, t } from '../i18n/translations';
import type { MPStatus } from '../hooks/useMultiplayer';

interface TurnBannerProps {
  current: 0 | 1;
  gameOver: boolean;
  lang: Lang;
  p1Name?: string;
  p2Name?: string;
  onlineStatus?: MPStatus | null;
  myPlayer?: 0 | 1 | null;
}

export default function TurnBanner({ current, gameOver, lang, p1Name, p2Name, onlineStatus, myPlayer }: TurnBannerProps) {
  const names = [p1Name ?? t(lang, 'player1'), p2Name ?? t(lang, 'player2')];

  if (gameOver) return <div className={styles.banner}>—</div>;

  if (onlineStatus) {
    const statusText = onlineStatus === 'connecting'
      ? t(lang, 'onlineConnecting')
      : onlineStatus === 'waiting'
        ? t(lang, 'waitingOpponent')
        : onlineStatus === 'disconnected'
          ? t(lang, 'opponentLeft')
          : onlineStatus === 'error'
            ? t(lang, 'connectError')
            : `${t(lang, 'onlineConnected')} · ${t(lang, current === myPlayer ? 'yourTurn' : 'opponentTurn')}`;

    return (
      <div className={styles.banner} role="status" aria-live="polite">
        <span className={`${styles.dot} ${styles[onlineStatus]}`} aria-hidden="true" />
        <span>{statusText}</span>
      </div>
    );
  }

  return <div className={styles.banner}>{t(lang, 'turnLabel')} <b>{names[current]}</b></div>;
}
