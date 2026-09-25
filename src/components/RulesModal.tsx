import styles from './RulesModal.module.css';
import { Lang, t } from '../i18n/translations';

interface RulesModalProps {
  show: boolean;
  lang: Lang;
  onClose: () => void;
}

export default function RulesModal({ show, lang, onClose }: RulesModalProps) {
  if (!show) return null;

  const raw = t(lang, 'rulesText');

  // Simple markdown-like bold renderer
  const paragraphs = raw.split('\n\n').filter(Boolean);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t(lang, 'rulesTitle')}>
      <div className={styles.box}>
        <h3 className={styles.title}>{t(lang, 'rulesTitle')}</h3>
        <div className={styles.content}>
          {paragraphs.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </div>
        <button className={styles.closeBtn} onClick={onClose} autoFocus>
          {t(lang, 'rulesClose')}
        </button>
      </div>
    </div>
  );
}
