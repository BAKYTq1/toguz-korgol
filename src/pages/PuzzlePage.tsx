import { useMemo, useState } from 'react';
import { legalMoves } from '../game/engine';
import { moveFacts, puzzleState, SOLVER, type MoveFacts } from '../learn/puzzleCheck';
import { solvePuzzle, useProgress } from '../learn/progress';
import { KIND_KEY, learnText } from '../learn/strings';
import ToguzDiagram from '../learn/ToguzDiagram';
import { TOGUZ_PUZZLES } from '../learn/toguzPuzzles';
import { useToguzPlayback } from '../learn/useToguzPlayback';
import { usePlatformLang } from '../platform/LangContext';
import { Link } from '../platform/router';
import Shell from '../platform/ui/Shell';
import NotFoundPage from './NotFoundPage';
import ui from '../platform/ui/ui.module.css';

const ASK = { capture: 'askCapture', tuzduk: 'askTuzduk', foresight: 'askForesight' } as const;

export default function PuzzlePage({ params }: { params: Record<string, string> }) {
  const index = TOGUZ_PUZZLES.findIndex(puzzle => puzzle.id === params.puzzleId);
  if (index === -1) return <NotFoundPage />;
  return <Puzzle key={params.puzzleId} index={index} />;
}

function Puzzle({ index }: { index: number }) {
  const [lang] = usePlatformLang();
  const puzzle = TOGUZ_PUZZLES[index];
  const start = useMemo(() => puzzleState(puzzle), [puzzle]);
  const playback = useToguzPlayback(start);
  const progress = useProgress();
  const [attempt, setAttempt] = useState<{ facts: MoveFacts; right: boolean } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);

  const open = attempt === null && !playback.busy;
  const playable = useMemo(() => new Set(open ? legalMoves(playback.state, SOLVER) : []), [open, playback.state]);

  const onPick = (move: number) => {
    const facts = moveFacts(start, move);
    playback.play(move, () => {
      const right = move === puzzle.solution;
      setAttempt({ facts, right });
      // A puzzle counts as solved only when found without looking at the answer.
      if (right && !revealed) solvePuzzle(puzzle.id);
    });
  };

  const retry = () => {
    setAttempt(null);
    playback.reset(start);
  };

  const prev = TOGUZ_PUZZLES[index - 1];
  const next = TOGUZ_PUZZLES[index + 1];
  const solvedBefore = progress.puzzles.includes(puzzle.id);

  return (
    <Shell>
      <section className={ui.section}>
        <div className={ui.stack}>
          <Link to="/learn" className={ui.muted}>← {t('title')}</Link>
          <div className={ui.row}>
            <span className={ui.eyebrow}>{t('puzzleN', { n: index + 1, total: TOGUZ_PUZZLES.length })}</span>
            <span className={ui.pill}>{t(KIND_KEY[puzzle.kind])}</span>
            {solvedBefore && <span className={`${ui.pill} ${ui.pillGold}`}>✓ {t('solved')}</span>}
          </div>
          <h1 className={ui.h2}>{t(ASK[puzzle.kind])}</h1>
        </div>

        <ToguzDiagram
          view={playback.view}
          playable={playable}
          onPick={onPick}
          active={playback.active}
          highlight={revealed && attempt === null ? [puzzle.solution] : []}
          flash={playback.flash}
          labels={{ pit: n => t('pit', { n }), kazan: p => t(p === 1 ? 'kazanYou' : 'kazanOpp'), tuzduk: t('tuzduk') }}
        />

        <div aria-live="polite" className={ui.stack}>
          {open && !revealed && <p className={ui.notice}>{t('yourTurn')}</p>}
          {revealed && attempt === null && <p className={ui.notice}>{t('answerIs', { n: (puzzle.solution % 9) + 1 })}</p>}
          {attempt && (
            <div className={attempt.right ? ui.notice : ui.errorBox}>
              <strong>{attempt.right ? t('right') : t('wrong')}</strong>{' '}
              {attempt.facts.tuzduk ? t('gainedTuzduk') : t('gained', { n: attempt.facts.gain })}{' '}
              {puzzle.kind === 'foresight' && t('afterReply', { n: attempt.facts.netAfterReply > 0 ? `+${attempt.facts.netAfterReply}` : attempt.facts.netAfterReply })}
            </div>
          )}
        </div>

        <div className={ui.row}>
          {attempt && !attempt.right && <button type="button" className={ui.btn} onClick={retry}>{t('tryAgain')}</button>}
          {attempt && !attempt.right && !revealed && (
            <button type="button" className={ui.btn} onClick={() => { setRevealed(true); retry(); }}>{t('showAnswer')}</button>
          )}
          {prev && <Link to={`/puzzles/${prev.id}`} className={ui.btn}>← {t('prevPuzzle')}</Link>}
          {next && (
            <Link to={`/puzzles/${next.id}`} className={`${ui.btn} ${attempt?.right ? ui.primary : ''}`}>{t('nextPuzzle')} →</Link>
          )}
        </div>
      </section>
    </Shell>
  );
}
