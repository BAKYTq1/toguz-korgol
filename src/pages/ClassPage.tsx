import { useEffect, useState, type FormEvent } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { LESSONS } from '../learn/lessons';
import { forgetClass, useJoinedClasses, useProgress } from '../learn/progress';
import { TOGUZ_PUZZLES } from '../learn/toguzPuzzles';
import { TOURNAMENT_GAMES, type GameId } from '../platform/catalog';
import { common } from '../platform/common';
import { joinByCode, leaveClass, openClass, removeStudent, watchStudents, type SchoolClass, type Student } from '../platform/data/classes';
import { startTournament } from '../platform/data/tournaments';
import { usePlatformLang } from '../platform/LangContext';
import { Link, navigate } from '../platform/router';
import { suggestedSwissRounds, type Format } from '../platform/tournament';
import Shell from '../platform/ui/Shell';
import { st } from './schoolStrings';
import { tt } from './tournamentStrings';
import ui from '../platform/ui/ui.module.css';
import styles from './ClassPage.module.css';

const lessonIds = new Set(LESSONS.map(lesson => lesson.id));
const puzzleIds = new Set(TOGUZ_PUZZLES.map(puzzle => puzzle.id));

export default function ClassPage({ params }: { params: Record<string, string> }) {
  const [lang] = usePlatformLang();
  const t = (key: Parameters<typeof st>[1], vars?: Record<string, string | number>) => st(lang, key, vars);
  const c = (key: Parameters<typeof common>[1]) => common(lang, key);
  const code = params.code.toUpperCase();
  const [state, setState] = useState<{ schoolClass: SchoolClass | null; uid: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseConfigured) {
      setState({ schoolClass: null, uid: '' });
      return;
    }
    let active = true;
    openClass(code)
      .then(result => { if (active) setState(result); })
      .catch(err => {
        console.error(err);
        if (active) setError(common(lang, 'error'));
      });
    return () => { active = false; };
  }, [code, lang]);

  if (error) return <Shell><p className={ui.errorBox}>{error}</p></Shell>;
  if (!state) return <Shell><p className={ui.muted}>{c('loading')}</p></Shell>;
  if (!state.schoolClass) {
    return (
      <Shell>
        <section className={ui.stack}>
          <p className={ui.lead}>{t('noClass')}</p>
          <Link to="/school" className={ui.btn} style={{ width: 'fit-content' }}>← {t('title')}</Link>
        </section>
      </Shell>
    );
  }

  const schoolClass = state.schoolClass;
  return (
    <Shell wide={schoolClass.teacherUid === state.uid}>
      <section className={ui.stack}>
        <Link to="/school" className={ui.muted}>← {t('title')}</Link>
        <h1 className={ui.h1}>{schoolClass.name}</h1>
        {schoolClass.teacherName && <p className={ui.muted}>{t('teacherOf', { name: schoolClass.teacherName })}</p>}
      </section>
      {schoolClass.teacherUid === state.uid ? <TeacherView schoolClass={schoolClass} /> : <StudentView schoolClass={schoolClass} />}
    </Shell>
  );
}

function TeacherView({ schoolClass }: { schoolClass: SchoolClass }) {
  const [lang] = usePlatformLang();
  const t = (key: Parameters<typeof st>[1], vars?: Record<string, string | number>) => st(lang, key, vars);
  const c = (key: Parameters<typeof common>[1]) => common(lang, key);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [game, setGame] = useState<GameId>('toguz-korgool');
  const [format, setFormat] = useState<Format>('round-robin');
  const [starting, setStarting] = useState(false);
  const link = `${window.location.origin}/school/${schoolClass.code}`;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    watchStudents(schoolClass.code, list => { if (active) setStudents(list); }, err => {
      console.error(err);
      if (active) setError(common(lang, 'error'));
    }).then(stop => {
      if (active) unsubscribe = stop;
      else stop();
    }).catch(() => { if (active) setError(common(lang, 'error')); });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [schoolClass.code, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(c('copy'), link);
    }
  };

  const remove = async (student: Student) => {
    if (!window.confirm(t('confirmRemove', { name: student.name }))) return;
    try {
      await removeStudent(schoolClass.code, student.uid);
    } catch (err) {
      console.error(err);
      setError(c('error'));
    }
  };

  const startClassTournament = async (event: FormEvent) => {
    event.preventDefault();
    if (!students || students.length < 2) return;
    setStarting(true);
    try {
      // Students who have solved more go first in the seeding.
      const seeded = [...students].sort((a, b) => (b.lessons.length + b.puzzles.length) - (a.lessons.length + a.puzzles.length));
      const id = await startTournament({
        name: `${schoolClass.name} — ${t('tournament')}`,
        game,
        format,
        names: uniqueNames(seeded.map(s => s.name)),
        swissRounds: suggestedSwissRounds(seeded.length),
        classCode: schoolClass.code,
      });
      navigate(`/tournaments/${id}`);
    } catch (err) {
      console.error(err);
      setError(c('error'));
      setStarting(false);
    }
  };

  const today = new Date().toDateString();
  const lastActive = (millis: number | null) => {
    if (!millis) return t('never');
    const date = new Date(millis);
    return date.toDateString() === today ? t('today') : date.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'ky' ? 'ky-KG' : 'ru-RU');
  };

  return (
    <>
      <section className={`${ui.card} ${styles.invite}`}>
        <h2 className={ui.h3}>{t('inviteTitle')}</h2>
        <p className={ui.muted}>{t('inviteText')}</p>
        <div className={styles.inviteRow}>
          <code className={styles.bigCode}>{schoolClass.code}</code>
          <span className={styles.link}>{link}</span>
          <button type="button" className={`${ui.btn} ${ui.small}`} onClick={copy}>{copied ? c('copied') : c('copy')}</button>
        </div>
        <p className={ui.muted}>{c('signInHint')}</p>
      </section>

      {error && <p className={ui.errorBox}>{error}</p>}

      <section className={ui.stack} aria-labelledby="students-title">
        <div className={ui.row}>
          <h2 id="students-title" className={ui.h2}>{t('students')}</h2>
          {students && <span className={ui.pill}>{students.length}</span>}
        </div>
        {students === null ? (
          <p className={ui.muted}>{c('loading')}</p>
        ) : students.length === 0 ? (
          <p className={ui.notice}>{t('noStudents')}</p>
        ) : (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>{t('studentName')}</th>
                  <th className={ui.num}>{t('lessons')}</th>
                  <th className={ui.num}>{t('puzzles')}</th>
                  <th className={ui.num}>{t('lastActive')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const lessons = student.lessons.filter(id => lessonIds.has(id)).length;
                  const puzzles = student.puzzles.filter(id => puzzleIds.has(id)).length;
                  return (
                    <tr key={student.uid}>
                      <td><strong>{student.name}</strong></td>
                      <td className={ui.num}>
                        <Meter value={lessons} total={lessonIds.size} />
                      </td>
                      <td className={ui.num}>
                        <Meter value={puzzles} total={puzzleIds.size} />
                      </td>
                      <td className={ui.num}>{lastActive(student.updatedAt)}</td>
                      <td className={ui.num}>
                        <button type="button" className={`${ui.btn} ${ui.small} ${ui.danger}`} onClick={() => remove(student)}>{t('remove')}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form className={ui.card} onSubmit={startClassTournament}>
        <h2 className={ui.h2}>{t('tournament')}</h2>
        <p className={ui.muted}>{t('tournamentText')}</p>
        <div className={ui.row}>
          <div className={ui.segmented} role="group">
            {TOURNAMENT_GAMES.map(option => (
              <button key={option.id} type="button" aria-pressed={game === option.id} onClick={() => setGame(option.id)}>{option.name[lang]}</button>
            ))}
          </div>
          <div className={ui.segmented} role="group">
            <button type="button" aria-pressed={format === 'round-robin'} onClick={() => setFormat('round-robin')}>{tt(lang, 'roundRobin')}</button>
            <button type="button" aria-pressed={format === 'swiss'} onClick={() => setFormat('swiss')}>{tt(lang, 'swiss')}</button>
          </div>
        </div>
        {students && students.length < 2 && <p className={ui.muted}>{t('tournamentNeed')}</p>}
        <button type="submit" className={`${ui.btn} ${ui.primary}`} style={{ width: 'fit-content' }} disabled={starting || !students || students.length < 2}>
          {t('startTournament')}
        </button>
      </form>
    </>
  );
}

/** Two students with the same name get a number, so the tournament table stays readable. */
function uniqueNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map(name => {
    const key = name.trim().toLocaleLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    return count === 1 ? name : `${name} (${count})`;
  });
}

function Meter({ value, total }: { value: number; total: number }) {
  return (
    <span className={styles.meter}>
      <span className={styles.meterBar} aria-hidden="true">
        <span style={{ width: `${total ? (100 * value) / total : 0}%` }} />
      </span>
      {value}/{total}
    </span>
  );
}

function StudentView({ schoolClass }: { schoolClass: SchoolClass }) {
  const [lang] = usePlatformLang();
  const t = (key: Parameters<typeof st>[1], vars?: Record<string, string | number>) => st(lang, key, vars);
  const c = (key: Parameters<typeof common>[1]) => common(lang, key);
  const joined = useJoinedClasses().some(entry => entry.code === schoolClass.code);
  const progress = useProgress();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const join = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(await joinByCode(schoolClass.code, name, { noClass: t('noClass'), error: c('error') }));
    setBusy(false);
  };

  const leave = async () => {
    try {
      await leaveClass(schoolClass.code);
    } catch (err) {
      console.error(err);
    }
    forgetClass(schoolClass.code);
  };

  if (!joined) {
    return (
      <form className={ui.card} onSubmit={join} style={{ maxWidth: 520 }}>
        <h2 className={ui.h2}>{t('joinThis', { name: schoolClass.name })}</h2>
        <label className={ui.field}>
          <span className={ui.label}>{t('studentName')}</span>
          <input className={ui.input} required maxLength={40} value={name} onChange={e => setName(e.target.value)} />
        </label>
        {error && <p className={ui.errorBox}>{error}</p>}
        <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={busy}>{t('join')}</button>
      </form>
    );
  }

  return (
    <section className={ui.card} style={{ maxWidth: 620 }}>
      <p className={ui.notice}>{t('youAreIn')}</p>
      <p className={ui.lead}>
        {t('yourProgress', {
          lessons: progress.lessons.filter(id => lessonIds.has(id)).length,
          lessonsTotal: lessonIds.size,
          puzzles: progress.puzzles.filter(id => puzzleIds.has(id)).length,
          puzzlesTotal: puzzleIds.size,
        })}
      </p>
      <div className={ui.row}>
        <Link to="/learn" className={`${ui.btn} ${ui.primary}`}>{t('continueLearning')}</Link>
        <button type="button" className={`${ui.btn} ${ui.small} ${ui.danger}`} onClick={leave}>{t('leave')}</button>
      </div>
    </section>
  );
}
