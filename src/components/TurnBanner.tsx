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
  aiPlayer?: 0 | 1 | null;
}

export default function TurnBanner({ current, gameOver, lang, p1Name, p2Name, onlineStatus, myPlayer, aiPlayer }: TurnBannerProps) {
  const names = [p1Name ?? t(lang, 'player1'), p2Name ?? t(lang, 'player2')];

  if (gameOver) {
    return <div className={styles.banner} data-hud="bottom" role="status">{t(lang, 'gameOver')}</div>;
  }

  if (onlineStatus) {
    const myTurn = current === myPlayer;
    const statusText = onlineStatus === 'connecting'
      ? t(lang, 'onlineConnecting')
      : onlineStatus === 'waiting'
        ? t(lang, 'waitingOpponent')
        : onlineStatus === 'disconnected'
          ? t(lang, 'opponentLeft')
          : onlineStatus === 'error'
            ? t(lang, 'connectError')
            : onlineStatus === 'idle'
              ? t(lang, 'onlineIdle')
              : t(lang, myTurn ? 'yourTurn' : 'opponentTurn');

    return (
      <div
        className={`${styles.banner} ${onlineStatus === 'playing' && myTurn ? styles.mine : ''}`}
        data-hud="bottom"
        role="status"
        aria-live="polite"
      >
        <span className={`${styles.dot} ${styles[onlineStatus]}`} aria-hidden="true" />
        <span>{statusText}</span>
      </div>
    );
  }

  if (aiPlayer !== null && aiPlayer !== undefined) {
    const aiTurn = current === aiPlayer;
    return (
      <div className={`${styles.banner} ${aiTurn ? '' : styles.mine}`} data-hud="bottom" role="status" aria-live="polite">
        {aiTurn && <span className={styles.thinking} aria-hidden="true"><i /><i /><i /></span>}
        <span>{t(lang, aiTurn ? 'aiThinking' : 'yourTurn')}</span>
      </div>
    );
  }

  return (
    <div className={styles.banner} data-hud="bottom" role="status" aria-live="polite">
      {t(lang, 'turnLabel')} <b>{names[current]}</b>
    </div>
  );
}
