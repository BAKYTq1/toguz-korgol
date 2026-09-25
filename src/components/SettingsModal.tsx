import styles from './SettingsModal.module.css';
import { Lang, t } from '../i18n/translations';
import { AIDifficulty } from '../game/ai';
import { GameMode, Settings, Stats } from '../hooks/useGameStore';

interface SettingsModalProps {
  show: boolean;
  lang: Lang;
  settings: Settings;
  stats: Stats;
  onSettingsChange: (s: Partial<Settings>) => void;
  onResetStats: () => void;
  onClose: () => void;
}

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ky', label: 'Кыргызча' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

const DIFFICULTIES: { code: AIDifficulty; key: 'aiEasy' | 'aiMedium' | 'aiHard' }[] = [
  { code: 'easy', key: 'aiEasy' },
  { code: 'medium', key: 'aiMedium' },
  { code: 'hard', key: 'aiHard' },
];

const MODES: { code: GameMode; key: 'modeLocal' | 'modeAI' | 'modeOnline' }[] = [
  { code: 'local', key: 'modeLocal' },
  { code: 'ai', key: 'modeAI' },
  { code: 'online', key: 'modeOnline' },
];

export default function SettingsModal({
  show,
  lang,
  settings,
  stats,
  onSettingsChange,
  onResetStats,
  onClose,
}: SettingsModalProps) {
  if (!show) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <h3 className={styles.title}>{t(lang, 'settingsTitle')}</h3>

        {/* Language */}
        <label className={styles.label}>{t(lang, 'langLabel')}</label>
        <div className={styles.pills}>
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`${styles.pill} ${settings.lang === l.code ? styles.active : ''}`}
              onClick={() => onSettingsChange({ lang: l.code })}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Game mode */}
        <label className={styles.label}>{t(lang, 'modeLocal')}</label>
        <div className={styles.pills}>
          {MODES.map(m => (
            <button
              key={m.code}
              className={`${styles.pill} ${settings.gameMode === m.code ? styles.active : ''}`}
              onClick={() => onSettingsChange({ gameMode: m.code })}
            >
              {t(lang, m.key)}
            </button>
          ))}
        </div>

        {/* AI difficulty */}
        {settings.gameMode === 'ai' && (
          <>
            <label className={styles.label}>{t(lang, 'aiLabel')}</label>
            <div className={styles.pills}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.code}
                  className={`${styles.pill} ${settings.aiDifficulty === d.code ? styles.active : ''}`}
                  onClick={() => onSettingsChange({ aiDifficulty: d.code })}
                >
                  {t(lang, d.key)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Sound */}
        <label className={styles.label}>{t(lang, 'soundLabel')}</label>
        <div className={styles.pills}>
          <button
            className={`${styles.pill} ${settings.sound ? styles.active : ''}`}
            onClick={() => onSettingsChange({ sound: !settings.sound })}
          >
            {settings.sound ? '🔊 ON' : '🔇 OFF'}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.divider} />
        <label className={styles.label}>{t(lang, 'statsTitle')}</label>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{stats.wins}</span>
            <span className={styles.statKey}>{t(lang, 'statsWins')}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{stats.losses}</span>
            <span className={styles.statKey}>{t(lang, 'statsLosses')}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{stats.draws}</span>
            <span className={styles.statKey}>{t(lang, 'statsDraws')}</span>
          </div>
        </div>
        <button className={styles.resetBtn} onClick={onResetStats}>
          {t(lang, 'statsReset')}
        </button>

        <div className={styles.divider} />
        <button className={styles.closeBtn} onClick={onClose} autoFocus>
          {t(lang, 'rulesClose')}
        </button>
      </div>
    </div>
  );
}
