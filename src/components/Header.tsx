import styles from './Header.module.css';
import { Lang, t } from '../i18n/translations';

interface HeaderProps {
  lang: Lang;
}

export default function Header({ lang }: HeaderProps) {
  return (
    <>
      <header className={styles.header}>
        <Tunduk />
        <h1 className={styles.title}>{t(lang, 'title')}</h1>
        <Tunduk />
      </header>
      <div className={styles.subtitle}>{t(lang, 'subtitle')}</div>
    </>
  );
}

function Tunduk() {
  return <div className={styles.tunduk} aria-hidden="true" />;
}
