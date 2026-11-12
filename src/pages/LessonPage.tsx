import { useMemo, useState } from 'react';
import { legalMoves } from '../game/engine';
import { LESSONS, lessonState } from '../learn/lessons';
import { completeLesson } from '../learn/progress';
import { learnText } from '../learn/strings';
import ToguzDiagram from '../learn/ToguzDiagram';
import { useToguzPlayback } from '../learn/useToguzPlayback';
import { usePlatformLang } from '../platform/LangContext';
import { Link } from '../platform/router';
import Shell from '../platform/ui/Shell';
import RichText from '../platform/ui/RichText';
import NotFoundPage from './NotFoundPage';
import ui from '../platform/ui/ui.module.css';
import styles from './LessonPage.module.css';

type Outcome = 'success' | 'retry' | null;

export default function LessonPage({ params }: { params: Record<string, string> }) {
  const index = LESSONS.findIndex(lesson => lesson.id === params.lessonId);
  if (index === -1) return <NotFoundPage />;
  return <Lesson key={params.lessonId} index={index} />;
}

function Lesson({ index }: { index: number }) {
  const [lang] = usePlatformLang();
  const lesson = LESSONS[index];
  const nextLesson = LESSONS[index + 1];
  const [stepIndex, setStepIndex] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [finished, setFinished] = useState(false);
  const step = lesson.steps[stepIndex];
  const playback = useToguzPlayback(lessonState(step.position));
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);

  const goTo = (next: number) => {
    setStepIndex(next);
    setOutcome(null);
    playback.reset(lessonState(lesson.steps[next].position));
  };

  const taskOpen = Boolean(step.task) && outcome === null && !playback.busy;
  const playable = useMemo(
    () => new Set(taskOpen ? legalMoves(playback.state, 1) : []),
    [taskOpen, playback.state],
  );

  const onPick = (move: number) => {
    const task = step.task;
    if (!task) return;
    playback.play(move, () => {
      const right = task.accept.includes(move);
      setOutcome(right ? 'success' : 'retry');
      if (right && stepIndex === lesson.steps.length - 1) {
        completeLesson(lesson.id);
        setFinished(true);
      }
    });
  };

  const isLast = stepIndex === lesson.steps.length - 1;
  const canAdvance = !step.task || outcome === 'success';

  const advance = () => {
    if (!isLast) {
      goTo(stepIndex + 1);
      return;
    }
    completeLesson(lesson.id);
    setFinished(true);
  };

  return (
    <Shell>
      <section className={ui.section}>
        <div className={ui.stack}>
          <Link to="/learn" className={ui.muted}>← {t('allLessons')}</Link>
          <span className={ui.eyebrow}>{t('lessonN', { n: index + 1 })} · {t('stepOf', { n: stepIndex + 1, total: lesson.steps.length })}</span>
          <h1 className={ui.h1}>{lesson.title[lang]}</h1>
        </div>

        <div className={styles.progress} aria-hidden="true">
          {lesson.steps.map((_, i) => <span key={i} className={i <= stepIndex ? styles.filled : ''} />)}
        </div>

        <RichText text={step.text[lang]} className={ui.lead} />

        <ToguzDiagram
          view={playback.view}
          playable={playable}
          onPick={onPick}
          active={playback.active}
          highlight={outcome === null && !playback.busy ? step.highlight : []}
          flash={playback.flash}
          labels={{ pit: n => t('pit', { n }), kazan: p => t(p === 1 ? 'kazanYou' : 'kazanOpp'), tuzduk: t('tuzduk') }}
        />

        <div aria-live="polite" className={ui.stack}>
          {step.task && outcome === null && !playback.busy && <p className={ui.notice}>{t('yourTurn')}</p>}
          {step.task && outcome === 'success' && <p className={ui.notice}><strong>{step.task.success[lang]}</strong></p>}
          {step.task && outcome === 'retry' && <p className={ui.errorBox}>{step.task.retry[lang]}</p>}
          {finished && <p className={ui.notice}><strong>{t('lessonDone')}</strong></p>}
        </div>

        <div className={ui.row}>
          {stepIndex > 0 && (
            <button type="button" className={ui.btn} onClick={() => goTo(stepIndex - 1)}>{t('prev')}</button>
          )}
          {outcome === 'retry' && (
            <button type="button" className={ui.btn} onClick={() => goTo(stepIndex)}>{t('tryAgain')}</button>
          )}
          {!finished && canAdvance && (
            <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={advance}>
              {isLast ? t('finishLesson') : t('next')}
            </button>
          )}
          {finished && (nextLesson ? (
            <Link to={`/learn/${nextLesson.id}`} className={`${ui.btn} ${ui.primary}`}>{t('nextLesson')}: {nextLesson.title[lang]}</Link>
          ) : (
            <Link to="/puzzles/capture-1" className={`${ui.btn} ${ui.primary}`}>{t('toPuzzles')}</Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
