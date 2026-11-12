import { LESSONS } from '../learn/lessons';
import { TOGUZ_PUZZLES } from '../learn/toguzPuzzles';
import { useJoinedClasses, useProgress } from '../learn/progress';
import { KIND_KEY, learnText } from '../learn/strings';
import { usePlatformLang } from '../platform/LangContext';
import { Link } from '../platform/router';
import Shell from '../platform/ui/Shell';
import type { PuzzleKind } from '../learn/puzzleCheck';
import ui from '../platform/ui/ui.module.css';
import styles from './LearnPage.module.css';

export default function LearnPage() {
  const [lang] = usePlatformLang();
  const progress = useProgress();
  const classes = useJoinedClasses();
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);

  return (
    <Shell>
      <section className={ui.stack}>
        <h1 className={ui.h1}>{t('title')}</h1>
        <p className={ui.lead}>{t('lead')}</p>
      </section>

      <section className={ui.section} aria-labelledby="lessons-title">
        <div className={ui.row}>
          <h2 id="lessons-title" className={ui.h2}>{t('lessons')}</h2>
          <span className={ui.pill}>{progress.lessons.filter(id => LESSONS.some(l => l.id === id)).length} / {LESSONS.length}</span>
        </div>
        <ol className={styles.lessons}>
          {LESSONS.map((lesson, i) => {
            const done = progress.lessons.includes(lesson.id);
            return (
              <li key={lesson.id}>
                <Link to={`/learn/${lesson.id}`} className={`${ui.card} ${styles.lesson}`}>
                  <span className={`${styles.badge} ${done ? styles.badgeDone : ''}`} aria-hidden="true">{done ? '✓' : i + 1}</span>
                  <span className={styles.lessonText}>
                    <span className={ui.h3}>{lesson.title[lang]}</span>
                    <span className={ui.muted}>{lesson.summary[lang]}</span>
                  </span>
                  {done && <span className={`${ui.pill} ${ui.pillGold}`}>{t('done')}</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={ui.section} aria-labelledby="puzzles-title">
        <div className={ui.row}>
          <h2 id="puzzles-title" className={ui.h2}>{t('puzzles')}</h2>
          <span className={ui.pill}>{progress.puzzles.filter(id => TOGUZ_PUZZLES.some(p => p.id === id)).length} / {TOGUZ_PUZZLES.length}</span>
        </div>
        {(['capture', 'tuzduk', 'foresight'] as PuzzleKind[]).map(kind => (
          <div key={kind} className={ui.stack}>
            <span className={ui.eyebrow}>{t(KIND_KEY[kind])}</span>
            <div className={styles.puzzles}>
              {TOGUZ_PUZZLES.map((puzzle, index) => puzzle.kind === kind && (
                <Link
                  key={puzzle.id}
                  to={`/puzzles/${puzzle.id}`}
                  className={`${styles.puzzle} ${progress.puzzles.includes(puzzle.id) ? styles.solved : ''}`}
                  aria-label={`${t('puzzleN', { n: index + 1, total: TOGUZ_PUZZLES.length })}${progress.puzzles.includes(puzzle.id) ? ` — ${t('solved')}` : ''}`}
                >
                  {progress.puzzles.includes(puzzle.id) ? '✓' : index + 1}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={ui.card}>
        <h2 className={ui.h3}>{t('classes')}</h2>
        {classes.length > 0 ? (
          classes.map(entry => (
            <Link key={entry.code} to={`/school/${entry.code}`} className={ui.muted}>{t('classesText', { name: entry.name })}</Link>
          ))
        ) : (
          <>
            <p className={ui.muted}>{t('joinClass')}</p>
            <Link to="/school" className={`${ui.btn} ${ui.small}`} style={{ width: 'fit-content' }}>{t('joinButton')}</Link>
          </>
        )}
      </section>
    </Shell>
  );
}
