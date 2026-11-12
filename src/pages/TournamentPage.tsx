import { useEffect, useMemo, useState } from 'react';
import { gameById } from '../platform/catalog';
import { common } from '../platform/common';
import { deleteTournament, updateTournament, watchTournament, type Tournament } from '../platform/data/tournaments';
import { firebaseConfigured } from '../lib/firebase';
import { usePlatformLang } from '../platform/LangContext';
import { Link, navigate } from '../platform/router';
import { roundComplete, standings, swissRound, type GameResult, type Round } from '../platform/tournament';
import Shell from '../platform/ui/Shell';
import { tt } from './tournamentStrings';
import ui from '../platform/ui/ui.module.css';
import styles from './TournamentPage.module.css';

const RESULT_LABEL: Record<GameResult, string> = { a: '1 – 0', draw: '½ – ½', b: '0 – 1' };
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.5', '½').replace(/^0½$/, '½'));

export default function TournamentPage({ params }: { params: Record<string, string> }) {
  const [lang] = usePlatformLang();
  const t = (key: Parameters<typeof tt>[1], vars?: Record<string, string | number>) => tt(lang, key, vars);
  const c = (key: Parameters<typeof common>[1]) => common(lang, key);
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [viewer, setViewer] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) {
      setTournament(null);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let active = true;
    watchTournament(
      params.id,
      (next, uid) => {
        if (!active) return;
        setTournament(next);
        setViewer(uid);
      },
      err => {
        console.error(err);
        if (active) setError(c('error'));
      },
    )
      .then(stop => {
        if (active) unsubscribe = stop;
        else stop();
      })
      .catch(() => { if (active) setError(c('error')); });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [params.id, lang]);

  const names = useMemo(() => new Map(tournament?.players.map(p => [p.id, p.name]) ?? []), [tournament]);
  const table = useMemo(
    () => (tournament ? standings(tournament.players.map(p => p.id), tournament.rounds) : []),
    [tournament],
  );

  if (tournament === undefined && !error) {
    return <Shell><p className={ui.muted}>{c('loading')}</p></Shell>;
  }
  if (!tournament) {
    return (
      <Shell>
        <section className={ui.stack}>
          <p className={error ? ui.errorBox : ui.lead}>{error || t('notFound')}</p>
          <Link to="/tournaments" className={ui.btn} style={{ width: 'fit-content' }}>← {t('title')}</Link>
        </section>
      </Shell>
    );
  }

  const isOwner = viewer !== null && viewer === tournament.ownerUid;
  const running = tournament.status === 'running';
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  const playedRounds = tournament.rounds.filter(roundComplete).length;
  const allComplete = tournament.rounds.every(roundComplete);
  const canPairNext = isOwner && running && tournament.format === 'swiss' && lastRound && roundComplete(lastRound) && tournament.rounds.length < tournament.plannedRounds;
  const canFinish = isOwner && running && allComplete && !canPairNext;

  const save = async (changes: Parameters<typeof updateTournament>[1]) => {
    setSaving(true);
    setError('');
    try {
      await updateTournament(tournament.id, changes);
    } catch (err) {
      console.error(err);
      setError(c('error'));
    } finally {
      setSaving(false);
    }
  };

  const setResult = (roundIndex: number, boardIndex: number, result: GameResult) => {
    const rounds: Round[] = tournament.rounds.map((round, r) => ({
      pairings: round.pairings.map((pairing, b) => {
        if (r !== roundIndex || b !== boardIndex) return pairing;
        // Tapping the recorded result again clears it.
        return { ...pairing, result: pairing.result === result ? null : result };
      }),
    }));
    setTournament({ ...tournament, rounds });
    void save({ rounds });
  };

  const pairNext = () => {
    const rounds = [...tournament.rounds, swissRound(tournament.players.map(p => p.id), tournament.rounds)];
    setTournament({ ...tournament, rounds });
    void save({ rounds });
  };

  const remove = async () => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteTournament(tournament.id);
      navigate('/tournaments');
    } catch (err) {
      console.error(err);
      setError(c('error'));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(c('copy'), window.location.href);
    }
  };

  const game = gameById(tournament.game);
  const roundsToShow = tournament.rounds.map((round, index) => ({ round, index })).reverse();

  return (
    <Shell wide>
      <section className={ui.stack}>
        <Link to="/tournaments" className={ui.muted}>← {t('title')}</Link>
        <h1 className={ui.h1}>{tournament.name}</h1>
        <div className={ui.row}>
          {game && <span className={`${ui.pill} ${ui.pillDim}`}>{game.name[lang]}</span>}
          <span className={`${ui.pill} ${ui.pillDim}`}>{tournament.format === 'swiss' ? t('swiss') : t('roundRobin')}</span>
          <span className={`${ui.pill} ${running ? '' : ui.pillGold}`}>
            {running ? t('roundsDone', { n: Math.min(playedRounds + 1, tournament.plannedRounds), total: tournament.plannedRounds }) : t('finished')}
          </span>
          {tournament.classCode && <Link to={`/school/${tournament.classCode}`} className={`${ui.pill} ${ui.pillDim}`}>{t('fromClass')}</Link>}
          <button type="button" className={`${ui.btn} ${ui.small}`} onClick={copyLink}>{copied ? c('copied') : c('copy')}</button>
        </div>
        {isOwner && running && <p className={ui.notice}>{t('organizer')} {t('share')}</p>}
        {!running && table[0] && <p className={`${ui.notice} ${styles.winner}`}>{t('winner', { name: names.get(table[0].id) ?? '' })}</p>}
        {error && <p className={ui.errorBox}>{error}</p>}
      </section>

      <div className={styles.layout}>
        <section className={ui.stack} aria-labelledby="standings-title">
          <h2 id="standings-title" className={ui.h2}>{t('standings')}</h2>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.num}>{t('place')}</th>
                  <th>{t('player')}</th>
                  <th className={ui.num}>{t('points')}</th>
                  <th className={ui.num}>{t('wdl')}</th>
                  <th className={ui.num} title={t('buchholzHelp')}>{t('buchholz')}</th>
                  <th className={ui.num} title={t('buchholzHelp')}>{t('sb')}</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr key={row.id}>
                    <td className={ui.num}>{i + 1}</td>
                    <td><strong>{names.get(row.id)}</strong></td>
                    <td className={ui.num}><strong className={styles.points}>{fmt(row.points)}</strong></td>
                    <td className={ui.num}>{row.wins}-{row.draws}-{row.losses}</td>
                    <td className={ui.num}>{fmt(row.buchholz)}</td>
                    <td className={ui.num}>{fmt(row.sonnebornBerger)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={ui.muted}>{t('buchholzHelp')}</p>
        </section>

        <section className={ui.stack}>
          <div className={ui.row}>
            {canPairNext && (
              <button type="button" className={`${ui.btn} ${ui.primary}`} disabled={saving} onClick={pairNext}>
                {t('pairNext', { n: tournament.rounds.length + 1 })}
              </button>
            )}
            {canFinish && (
              <button type="button" className={`${ui.btn} ${ui.primary}`} disabled={saving} onClick={() => save({ status: 'finished' })}>
                {t('finish')}
              </button>
            )}
          </div>

          {roundsToShow.map(({ round, index }) => (
            <div key={index} className={ui.card}>
              <h3 className={ui.h3}>{t('roundN', { n: index + 1 })}</h3>
              <ol className={styles.pairings}>
                {round.pairings.map((pairing, board) => (
                  <li key={board} className={styles.pairing}>
                    <span className={styles.boardNo}>{pairing.b === null ? '—' : board + 1}</span>
                    {pairing.b === null ? (
                      <span className={styles.players}><strong>{names.get(pairing.a)}</strong> <span className={ui.muted}>{t('bye')}</span></span>
                    ) : (
                      <>
                        <span className={styles.players}>
                          <span title={t('firstMove')}><strong>{names.get(pairing.a)}</strong> <span className={styles.first} aria-label={t('firstMove')}>●</span></span>
                          <span className={ui.muted}>—</span>
                          <strong>{names.get(pairing.b)}</strong>
                        </span>
                        {isOwner && running ? (
                          <span className={styles.results} role="group">
                            {(['a', 'draw', 'b'] as GameResult[]).map(result => (
                              <button
                                key={result}
                                type="button"
                                aria-pressed={pairing.result === result}
                                onClick={() => setResult(index, board, result)}
                              >
                                {RESULT_LABEL[result]}
                              </button>
                            ))}
                          </span>
                        ) : (
                          <span className={pairing.result ? styles.result : ui.muted}>
                            {pairing.result ? RESULT_LABEL[pairing.result] : t('pending')}
                          </span>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {isOwner && (
            <button type="button" className={`${ui.btn} ${ui.small} ${ui.danger}`} style={{ width: 'fit-content' }} onClick={remove}>
              {t('delete')}
            </button>
          )}
        </section>
      </div>
    </Shell>
  );
}
