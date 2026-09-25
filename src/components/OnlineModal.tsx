import { useState } from 'react';
import styles from './OnlineModal.module.css';
import { Lang, t } from '../i18n/translations';
import { MPState } from '../hooks/useMultiplayer';

interface OnlineModalProps {
  show: boolean;
  lang: Lang;
  mp: MPState;
  onConnect: (server: string, room: string) => void;
  onClose: () => void;
  onDisconnect: () => void;
  generateRoom: () => string;
}

export default function OnlineModal({
  show,
  lang,
  mp,
  onConnect,
  onClose,
  onDisconnect,
  generateRoom,
}: OnlineModalProps) {
  const [server, setServer] = useState('');
  const [room, setRoom] = useState('');

  if (!show) return null;

  const handleCreate = () => {
    const r = generateRoom();
    setRoom(r);
    onConnect(server.trim(), r);
  };

  const handleJoin = () => {
    onConnect(server.trim(), room.trim());
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <h3 className={styles.title}>{t(lang, 'onlineTitle')}</h3>
        <p className={styles.hint}>{t(lang, 'onlineHint')}</p>

        <label className={styles.label}>{t(lang, 'serverLabel')}</label>
        <input
          className={styles.input}
          value={server}
          onChange={e => setServer(e.target.value)}
          placeholder="wss://your-server.example.com"
          disabled={mp.status === 'playing'}
        />

        <label className={styles.label}>{t(lang, 'roomLabel')}</label>
        <input
          className={styles.input}
          value={room}
          onChange={e => setRoom(e.target.value.toUpperCase())}
          placeholder="ABCD"
          maxLength={12}
          disabled={mp.status === 'playing'}
        />

        <div className={styles.row}>
          <button className={styles.primaryBtn} onClick={handleCreate} disabled={mp.status === 'playing'}>
            {t(lang, 'createRoom')}
          </button>
          <button className={styles.secondaryBtn} onClick={handleJoin} disabled={mp.status === 'playing'}>
            {t(lang, 'joinRoom')}
          </button>
        </div>

        {mp.message && <div className={styles.status}>{mp.message}</div>}

        <div className={styles.footer}>
          {mp.status === 'playing' && (
            <button className={styles.disconnectBtn} onClick={onDisconnect}>
              Disconnect
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
