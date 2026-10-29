import styles from './OnlineModal.module.css';
import { Lang, t } from '../i18n/translations';
import { MPState } from '../hooks/useMultiplayer';

interface OnlineModalProps {
  show: boolean;
  lang: Lang;
  mp: MPState;
  onClose: () => void;
  onDisconnect: () => void;
}

export default function OnlineModal({ show, lang, mp, onClose, onDisconnect }: OnlineModalProps) {
  if (!show) return null;

  const isSearching = mp.status === 'connecting' || mp.status === 'waiting';
  const isActive = isSearching || mp.status === 'playing';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <h3 className={styles.title}>{t(lang, 'playOnline')}</h3>
        <p className={styles.hint}>
          {isSearching ? t(lang, 'findOpponent') : t(lang, 'onlineHint')}
        </p>

        {mp.message && <div className={styles.status} role="status">{mp.message}</div>}

        <div className={styles.footer}>
          {isActive && (
            <button className={styles.disconnectBtn} onClick={onDisconnect}>
              {t(lang, 'cancelSearch')}
            </button>
          )}
          {(mp.status === 'disconnected' || mp.status === 'error') && (
            <button className={styles.disconnectBtn} onClick={onDisconnect}>
              {t(lang, 'disconnect')}
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>
            {t(lang, 'onlineClose')}
          </button>
        </div>
      </div>
    </div>
  );
}
