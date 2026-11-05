import styles from './MoveConfirmBar.module.css';
import { Lang, t } from '../i18n/translations';
import type { MoveSelection } from './Board';

interface MoveConfirmBarProps {
  selection: MoveSelection;
  lang: Lang;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function MoveConfirmBar({ selection, lang, onConfirm, onCancel }: MoveConfirmBarProps) {
  const pitNumber = selection.idx <= 8 ? selection.idx + 1 : selection.idx - 8;

  return (
    <div className={styles.bar} role="group" aria-label={t(lang, 'confirmMove')}>
      <div className={styles.info} aria-live="polite">
        <b>{t(lang, 'pitNumber')}{pitNumber}</b>
        {selection.gain > 0 && (
          <span className={styles.gain}>
            {t(lang, 'previewCapture')} +{selection.gain}{selection.tuzduk ? ` · ${t(lang, 'previewTuzduk')}` : ''}
          </span>
        )}
        {selection.gain <= 0 && <span className={styles.muted}>{t(lang, 'previewTapAgain')}</span>}
      </div>
      <button className={styles.cancel} onClick={onCancel}>{t(lang, 'cancelMove')}</button>
      <button className={styles.confirm} onClick={onConfirm} autoFocus>{t(lang, 'confirmMove')}</button>
    </div>
  );
}
