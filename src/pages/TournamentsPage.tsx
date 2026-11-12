import { useEffect, useState, type FormEvent } from 'react';
import { TOURNAMENT_GAMES, gameById, type GameId } from '../platform/catalog';
import { common } from '../platform/common';
import { MAX_PLAYERS, myTournaments, startTournament, type Tournament } from '../platform/data/tournaments';
import { firebaseConfigured } from '../lib/firebase';
import { usePlatformLang } from '../platform/LangContext';
import { Link, navigate } from '../platform/router';
import { suggestedSwissRounds, type Format } from '../platform/tournament';
import Shell from '../platform/ui/Shell';
import { tt } from './tournamentStrings';
import ui from '../platform/ui/ui.module.css';
import styles from './TournamentsPage.module.css';

function parseNames(raw: string) {
  return raw.split('\n').map(line => line.trim()).filter(Boolean);
}

export default function TournamentsPage() {
  const [lang] = usePlatformLang();
  const t = (key: Parameters<typeof tt>[1], vars?: Record<string, string | number>) => tt(lang, key, vars);
  const [name, setName] = useState('');
  const [game, setGame] = useState<GameId>('toguz-korgool');
  const [format, setFormat] = useState<Format>('round-robin');
  const [namesRaw, setNamesRaw] = useState('');
  const [rounds, setRounds] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mine, setMine] = useState<Tournament[] | null>(null);

  useEffect(() => {
    if (!firebaseConfigured) return;
    let active = true;
    myTournaments()
      .then(list => { if (active) setMine(list); })
      .catch(() => { if (active) setMine([]); });
    return () => { active = false; };
  }, []);

  const names = parseNames(namesRaw);
  const swissRounds = rounds ?? suggestedSwissRounds(Math.max(names.length, 2));

  const validate = () => {
    if (names.length < 2) return t('tooFew');
    if (names.length > MAX_PLAYERS) return t('tooMany', { max: MAX_PLAYERS });
    const seen = new Set<string>();
    for (const entry of names) {
      const key = entry.toLocaleLowerCase();
      if (seen.has(key)) return t('duplicate', { name: entry });
      seen.add(key);
    }
    return '';
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem || !name.trim()) return;
    setBusy(true);
    try {
      const id = await startTournament({ name, game, format, names, swissRounds });
      navigate(`/tournaments/${id}`);
    } catch (err) {
      console.error(err);
      setError(common(lang, 'error'));
      setBusy(false);
    }
  };

  return (
    <Shell>
      <section className={ui.stack}>
        <h1 className={ui.h1}>{t('title')}</h1>
        <p className={ui.lead}>{t('lead')}</p>
      </section>

      {!firebaseConfigured && <p className={ui.errorBox}>{t('unavailable')}</p>}

      <div className={styles.layout}>
        <form className={`${ui.card} ${styles.form}`} onSubmit={submit}>
          <h2 className={ui.h2}>{t('create')}</h2>

          <label className={ui.field}>
            <span className={ui.label}>{t('name')}</span>
            <input className={ui.input} value={name} maxLength={80} required placeholder={t('namePlaceholder')} onChange={e => setName(e.target.value)} />
          </label>

          <div className={ui.field}>
            <span className={ui.label}>{t('game')}</span>
            <div className={ui.segmented} role="group" aria-label={t('game')}>
              {TOURNAMENT_GAMES.map(option => (
                <button key={option.id} type="button" aria-pressed={game === option.id} onClick={() => setGame(option.id)}>
                  {option.name[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className={ui.field}>
            <span className={ui.label}>{t('format')}</span>
            <div className={ui.segmented} role="group" aria-label={t('format')}>
              <button type="button" aria-pressed={format === 'round-robin'} onClick={() => setFormat('round-robin')}>{t('roundRobin')}</button>
              <button type="button" aria-pressed={format === 'swiss'} onClick={() => setFormat('swiss')}>{t('swiss')}</button>
            </div>
            <span className={ui.muted}>{format === 'round-robin' ? t('roundRobinHint') : t('swissHint')}</span>
          </div>

          {format === 'swiss' && (
            <label className={ui.field}>
              <span className={ui.label}>{t('rounds')}</span>
              <input
                className={ui.input}
                type="number"
                min={1}
                max={Math.max(1, names.length - 1)}
                value={swissRounds}
                onChange={e => setRounds(Math.max(1, Number(e.target.value) || 1))}
                style={{ maxWidth: 120 }}
              />
            </label>
          )}

          <label className={ui.field}>
            <span className={ui.label}>{t('players')} · {names.length}</span>
            <textarea className={ui.input} rows={8} value={namesRaw} onChange={e => setNamesRaw(e.target.value)} />
            <span className={ui.muted}>{t('playersHint', { max: MAX_PLAYERS })}</span>
          </label>

          {error && <p className={ui.errorBox}>{error}</p>}

          <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={busy || !firebaseConfigured}>
            {busy ? t('creating') : t('createButton')}
          </button>
        </form>

        <section className={ui.stack} aria-labelledby="mine-title">
          <h2 id="mine-title" className={ui.h2}>{t('mine')}</h2>
          {mine === null && firebaseConfigured && <p className={ui.muted}>{common(lang, 'loading')}</p>}
          {mine !== null && mine.length === 0 && <p className={ui.muted}>{t('none')}</p>}
          {mine?.map(entry => (
            <Link key={entry.id} to={`/tournaments/${entry.id}`} className={ui.card}>
              <span className={ui.h3}>{entry.name}</span>
              <span className={ui.row}>
                <span className={`${ui.pill} ${ui.pillDim}`}>{gameById(entry.game)?.name[lang]}</span>
                <span className={`${ui.pill} ${entry.status === 'finished' ? ui.pillGold : ''}`}>
                  {entry.status === 'finished' ? t('finished') : t('running')}
                </span>
                <span className={ui.muted}>{entry.players.length} · {entry.format === 'swiss' ? t('swiss') : t('roundRobin')}</span>
              </span>
            </Link>
          ))}
        </section>
      </div>
    </Shell>
  );
}
