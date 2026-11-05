import { useEffect, useState, type FormEvent } from 'react';
import styles from './OnlineModal.module.css';
import { Lang, t } from '../i18n/translations';
import { MPState, ROOM_CODE_LENGTH, normalizeRoomCode } from '../hooks/useMultiplayer';

interface OnlineModalProps {
  show: boolean;
  lang: Lang;
  mp: MPState;
  /** Code from an invite link, shown pre-filled. */
  initialCode?: string;
  onQuickMatch: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onClose: () => void;
  onDisconnect: () => void;
}

export function inviteLink(code: string) {
  return `${window.location.origin}${window.location.pathname}?room=${code}`;
}

export default function OnlineModal({
  show,
  lang,
  mp,
  initialCode = '',
  onQuickMatch,
  onCreateRoom,
  onJoinRoom,
  onClose,
  onDisconnect,
}: OnlineModalProps) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!show) return null;

  const isSearching = mp.status === 'connecting' || mp.status === 'waiting';
  const isActive = isSearching || mp.status === 'playing';
  const hostingFriendRoom = mp.status === 'waiting' && mp.isPrivate && mp.myPlayer === 0 && mp.room;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (http, old browsers); the code stays visible to copy by hand.
    }
  };

  const share = async (roomCode: string) => {
    const url = inviteLink(roomCode);
    const text = `${t(lang, 'inviteText')} ${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t(lang, 'title'), text, url });
        return;
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return;
      }
    }
    await copyText(`${text}\n${url}`);
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (normalized.length === ROOM_CODE_LENGTH) onJoinRoom(normalized);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="online-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.box}>
        <h3 className={styles.title} id="online-title">{t(lang, 'playOnline')}</h3>

        {hostingFriendRoom ? (
          <>
            <p className={styles.hint}>{t(lang, 'waitingFriend')}</p>
            <div className={styles.codeCard}>
              <span className={styles.codeLabel}>{t(lang, 'roomCodeTitle')}</span>
              <button className={styles.code} onClick={() => void copyText(mp.room!)} aria-label={t(lang, 'copyCode')}>
                {mp.room}
              </button>
              <div className={styles.row}>
                <button className={styles.secondaryBtn} onClick={() => void copyText(mp.room!)}>
                  {copied ? t(lang, 'copied') : t(lang, 'copyCode')}
                </button>
                <button className={styles.primaryBtn} onClick={() => void share(mp.room!)}>
                  {t(lang, 'shareInvite')}
                </button>
              </div>
            </div>
            <div className={styles.waitingLine} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              {t(lang, 'waitingOpponent')}
            </div>
          </>
        ) : isActive ? (
          <div className={styles.waitingLine} role="status">
            {mp.status !== 'playing' && <span className={styles.spinner} aria-hidden="true" />}
            {mp.status === 'playing' ? t(lang, 'onlineConnected') : mp.message || t(lang, 'onlineConnecting')}
          </div>
        ) : (
          <>
            <section className={styles.option}>
              <h4 className={styles.optionTitle}>{t(lang, 'quickMatch')}</h4>
              <p className={styles.hint}>{t(lang, 'quickMatchHint')}</p>
              <button className={styles.primaryBtn} onClick={onQuickMatch} autoFocus={!initialCode}>
                {t(lang, 'findOpponent')}
              </button>
            </section>

            <div className={styles.or}><span>{t(lang, 'orLabel')}</span></div>

            <section className={styles.option}>
              <h4 className={styles.optionTitle}>{t(lang, 'friendRoom')}</h4>
              <p className={styles.hint}>{t(lang, 'friendRoomHint')}</p>
              <button className={styles.secondaryBtn} onClick={onCreateRoom}>
                {t(lang, 'createFriendRoom')}
              </button>
              <form className={styles.joinRow} onSubmit={handleJoin}>
                <input
                  className={styles.codeInput}
                  value={code}
                  onChange={e => setCode(normalizeRoomCode(e.target.value))}
                  placeholder="ABC23"
                  aria-label={t(lang, 'roomLabel')}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={ROOM_CODE_LENGTH}
                  autoFocus={Boolean(initialCode)}
                />
                <button type="submit" className={styles.primaryBtn} disabled={code.length !== ROOM_CODE_LENGTH}>
                  {t(lang, 'joinByCode')}
                </button>
              </form>
            </section>

            {(mp.status === 'error' || mp.status === 'disconnected') && mp.message && (
              <div className={styles.status} role="alert">{mp.message}</div>
            )}
          </>
        )}

        <div className={styles.footer}>
          {isSearching && (
            <button className={styles.disconnectBtn} onClick={onDisconnect}>
              {t(lang, 'cancelSearch')}
            </button>
          )}
          {mp.status === 'playing' && (
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
