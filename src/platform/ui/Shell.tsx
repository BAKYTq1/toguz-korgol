import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { common } from '../common';
import { LANGS } from '../lang';
import { usePlatformLang } from '../LangContext';
import { Link, useLocation } from '../router';
import { preloadFirebase } from '../../lib/firebase';
import type { ProfileStats } from '../../lib/profile';
import Icon from '../../components/Icon';
import { RamHorn } from './Ornament';
import styles from './Shell.module.css';

const AccountModal = lazy(() => import('../../components/AccountModal'));

function readLocalStats(): ProfileStats {
  try {
    const saved = JSON.parse(localStorage.getItem('tk_stats') || 'null');
    if (saved && typeof saved.wins === 'number') return saved;
  } catch {
    // Fall through to empty stats.
  }
  return { wins: 0, losses: 0, draws: 0 };
}

const NAV = [
  { to: '/', key: 'navGames', match: (p: string) => p === '/' },
  { to: '/learn', key: 'navLearn', match: (p: string) => p.startsWith('/learn') || p.startsWith('/puzzles') },
  { to: '/tournaments', key: 'navTournaments', match: (p: string) => p.startsWith('/tournaments') },
  { to: '/school', key: 'navSchool', match: (p: string) => p.startsWith('/school') },
] as const;

/** Page frame for every platform page: top bar, language switch, profile, scrolling content. */
export default function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const [lang, setLang] = usePlatformLang();
  const { path } = useLocation();
  const [showAccount, setShowAccount] = useState(false);
  const s = (key: Parameters<typeof common>[1]) => common(lang, key);

  useEffect(() => {
    document.title = `${common(lang, 'brand')} — ${common(lang, 'brandTag')}`;
  }, [lang]);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" className={styles.brand} aria-label={s('brand')}>
          <span className={styles.tunduk} aria-hidden="true" />
          <span className={styles.brandText}>{s('brand')}</span>
        </Link>
        <nav className={styles.nav} aria-label={s('brand')}>
          {NAV.map(item => (
            <Link key={item.to} to={item.to} className={styles.navLink} aria-current={item.match(path) ? 'page' : undefined}>
              {s(item.key)}
            </Link>
          ))}
        </nav>
        <div className={styles.tools}>
          <div className={styles.langs} role="group" aria-label="Language">
            {LANGS.map(option => (
              <button key={option.id} type="button" aria-pressed={lang === option.id} onClick={() => setLang(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.profile}
            aria-label={s('navProfile')}
            onClick={() => {
              preloadFirebase();
              setShowAccount(true);
            }}
          >
            <Icon name="user" size={18} />
            <span className={styles.profileLabel}>{s('navProfile')}</span>
          </button>
        </div>
      </header>

      <main className={`${styles.main} ${wide ? styles.wide : ''}`}>{children}</main>

      <footer className={styles.footer}>
        <RamHorn size={36} />
        <span>{s('brand')}</span>
      </footer>

      {showAccount && (
        <Suspense fallback={null}>
          <AccountModal show lang={lang} sessionBusy={false} localStats={readLocalStats()} onClose={() => setShowAccount(false)} />
        </Suspense>
      )}
    </div>
  );
}
