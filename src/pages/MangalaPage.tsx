import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chooseMove, type AIProfile, type Difficulty } from '../platform/ai';
import { common } from '../platform/common';
import { defineStrings } from '../platform/strings';
import { usePlatformLang } from '../platform/LangContext';
import type { Seat } from '../platform/game';
import Shell from '../platform/ui/Shell';
import RichText from '../platform/ui/RichText';
import MangalaBoard from '../games/mangala/MangalaBoard';
import { createInitialState, legalMoves, mangalaGame, playTraced, type MangalaState, type MoveTrace, type Slot } from '../games/mangala/engine';
import ui from '../platform/ui/ui.module.css';
import styles from '../platform/ui/GamePage.module.css';

const t = defineStrings({
  ru: {
    title: 'Мангала',
    subtitle: 'Тюркская игра с камнями — 6 лунок, 48 камней',
    yourTurn: 'Ваш ход',
    aiTurn: 'Компьютер думает…',
    turnOf: 'Ходит: {name}',
    again: 'Последний камень в казане — ещё ход!',
    captured: 'Взято камней: {n}',
    sweep: 'Ряд опустел: {name} забирает {n}',
    pit: 'Лунка {n}',
    store: 'Казан: {name}',
    final: '{a} : {b}',
    rulesText: `**Цель:** собрать в свой казан больше 24 из 48 камней.

**Ход:** возьмите все камни из любой своей лунки и разложите по одному против часовой стрелки. Как и в тогуз коргооле, **первый камень кладётся обратно** в ту же лунку, а одиночный камень переходит в следующую. Свой казан тоже получает камень, казан соперника пропускается.

**Ещё ход:** если последний камень упал в ваш казан — ходите снова.

**Чётное:** если последний камень сделал число камней в лунке соперника чётным — заберите их все.

**Пустая лунка:** если последний камень упал в пустую лунку на вашей стороне, а напротив есть камни — заберите и свой камень, и камни напротив.

**Конец:** когда на одной стороне не осталось камней, игрок с пустой стороной забирает все камни с другой стороны. Побеждает тот, у кого больше; 24:24 — ничья.`,
  },
  ky: {
    title: 'Мангала',
    subtitle: 'Таштар менен ойнолуучу түрк оюну — 6 чуңкур, 48 таш',
    yourTurn: 'Сиздин жүрүш',
    aiTurn: 'Компьютер ойлонууда…',
    turnOf: 'Жүрөт: {name}',
    again: 'Акыркы таш казанга түштү — дагы бир жүрүш!',
    captured: 'Алынган таштар: {n}',
    sweep: 'Катар бошоду: {name} {n} таш алат',
    pit: '{n}-чуңкур',
    store: 'Казан: {name}',
    final: '{a} : {b}',
    rulesText: `**Максат:** 48 таштын 24төн көбүн казаныңызга чогултуу.

**Жүрүш:** өз чуңкурларыңыздын биринен бардык ташты алып, саат жебесине каршы бирден таратыңыз. Тогуз коргоолдогудай эле **биринчи таш ошол эле чуңкурга калат**, ал эми жалгыз таш кийинки чуңкурга өтөт. Өз казаныңызга да таш түшөт, каршылаштын казаны өткөрүлүп жиберилет.

**Дагы жүрүш:** акыркы таш казаныңызга түшсө — кайра жүрөсүз.

**Жуп сан:** акыркы таш каршылаштын чуңкурундагы таштардын санын жуп кылса — баарын аласыз.

**Бош чуңкур:** акыркы таш өз тарабыңыздагы бош чуңкурга түшүп, каршысында таш болсо — өз ташыңызды да, каршысындагыларды да аласыз.

**Аягы:** бир тарапта таш калбаганда, бош тараптын ээси экинчи тараптагы бардык ташты алат. Көп чогулткан жеңет; 24:24 — тең чыгуу.`,
  },
  en: {
    title: 'Mangala',
    subtitle: 'The Turkic stone game — 6 pits, 48 stones',
    yourTurn: 'Your move',
    aiTurn: 'The computer is thinking…',
    turnOf: 'To move: {name}',
    again: 'Last stone in your store — move again!',
    captured: 'Stones captured: {n}',
    sweep: 'A row is empty: {name} takes {n}',
    pit: 'Pit {n}',
    store: 'Store: {name}',
    final: '{a} : {b}',
    rulesText: `**Goal:** collect more than 24 of the 48 stones in your store.

**Move:** lift every stone from one of your pits and sow them one by one counter-clockwise. As in Toguz Korgool, **the first stone goes back** into the same pit, and a lone stone moves to the next pit. Your own store receives stones; your opponent's store is skipped.

**Move again:** if your last stone lands in your store, you move again.

**Even:** if your last stone makes an opponent's pit even, take all of it.

**Empty pit:** if your last stone lands in an empty pit on your side and the pit opposite has stones, take your stone and the opposite ones.

**End:** when one side runs out of stones, the player whose side is empty takes everything left on the other side. Most stones wins; 24–24 is a draw.`,
  },
});

type Mode = 'ai' | 'friend';
const AI_SEAT: Seat = 0;
const STEP_MS = 140;
const SETTINGS_KEY = 'mangala_settings';

const PROFILES: Record<Difficulty, AIProfile> = {
  easy: { depth: 1, slack: 25 },
  medium: { depth: 3, slack: 4 },
  hard: { depth: 7, slack: 0 },
};

function loadSettings(): { mode: Mode; difficulty: Difficulty } {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      mode: saved.mode === 'friend' ? 'friend' : 'ai',
      difficulty: ['easy', 'medium', 'hard'].includes(saved.difficulty) ? saved.difficulty : 'medium',
    };
  } catch {
    return { mode: 'ai', difficulty: 'medium' };
  }
}

function freshGame(starter: Seat): MangalaState {
  return { ...createInitialState(), current: starter };
}

/** Board snapshots for the sowing animation: lifting, then one stone per step. */
function sowingFrames(before: MangalaState, trace: MoveTrace) {
  const pits = before.pits.slice();
  const stores: [number, number] = [before.stores[0], before.stores[1]];
  pits[trace.from] = trace.leftBehind;
  const frames: { pits: number[]; stores: [number, number]; active: Slot }[] = [];
  for (const slot of trace.path) {
    if (slot === 'store0') stores[0]++;
    else if (slot === 'store1') stores[1]++;
    else pits[slot]++;
    frames.push({ pits: pits.slice(), stores: [stores[0], stores[1]], active: slot });
  }
  return frames;
}

export default function MangalaPage() {
  const [lang] = usePlatformLang();
  const [settings, setSettings] = useState(loadSettings);
  const [gamesStarted, setGamesStarted] = useState(0);
  const [game, setGame] = useState<MangalaState>(() => freshGame(1));
  const [view, setView] = useState<{ pits: number[]; stores: [number, number]; active: Slot | null }>(() => ({
    pits: game.pits,
    stores: game.stores,
    active: null,
  }));
  const [captured, setCaptured] = useState<number[]>([]);
  const [animating, setAnimating] = useState(false);
  const [note, setNote] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const c = (key: Parameters<typeof common>[1], vars?: Record<string, string | number>) => common(lang, key, vars);
  const vsAI = settings.mode === 'ai';
  const names = useMemo<Record<Seat, string>>(
    () => (vsAI ? { 0: common(lang, 'ai'), 1: common(lang, 'you') } : { 0: common(lang, 'player2'), 1: common(lang, 'player1') }),
    [vsAI, lang],
  );

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // The choice still applies for this visit.
    }
  }, [settings]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const play = useCallback((move: number) => {
    if (animating || game.outcome !== null || !mangalaGame.isLegal(game, move)) return;
    const { state: next, trace } = playTraced(game, move);
    const frames = sowingFrames(game, trace);
    setAnimating(true);
    setCaptured([]);
    setNote('');
    setView({ pits: game.pits.map((n, i) => (i === trace.from ? trace.leftBehind : n)), stores: game.stores, active: trace.from });
    frames.forEach((frame, i) => {
      timers.current.push(setTimeout(() => setView(frame), STEP_MS * (i + 1)));
    });
    timers.current.push(setTimeout(() => {
      setGame(next);
      setView({ pits: next.pits, stores: next.stores, active: null });
      setCaptured(trace.capture?.pits ?? []);
      if (trace.sweep && trace.sweep.stones > 0) setNote(t(lang, 'sweep', { name: names[trace.sweep.seat], n: trace.sweep.stones }));
      else if (trace.capture) setNote(t(lang, 'captured', { n: trace.capture.stones }));
      else if (trace.extraTurn && next.outcome === null) setNote(t(lang, 'again'));
      setAnimating(false);
    }, STEP_MS * (frames.length + 1)));
  }, [animating, game, lang, names]);

  // The computer replies once the board has settled.
  useEffect(() => {
    if (!vsAI || animating || game.outcome !== null || game.current !== AI_SEAT) return;
    const timer = setTimeout(() => {
      const move = chooseMove(mangalaGame, game, PROFILES[settings.difficulty]);
      if (move !== null) play(move);
    }, 550);
    return () => clearTimeout(timer);
  }, [vsAI, animating, game, settings.difficulty, play]);

  /** A rematch alternates who starts; changing the mode or level starts over with you first. */
  const newGame = (nextSettings?: typeof settings) => {
    clearTimers();
    const index = nextSettings ? 0 : gamesStarted + 1;
    const state = freshGame(index % 2 === 0 ? 1 : 0);
    setGamesStarted(index);
    if (nextSettings) setSettings(nextSettings);
    setGame(state);
    setView({ pits: state.pits, stores: state.stores, active: null });
    setCaptured([]);
    setNote('');
    setAnimating(false);
  };

  const humanToMove = !animating && game.outcome === null && (!vsAI || game.current !== AI_SEAT);
  const playable = useMemo(() => new Set(humanToMove ? legalMoves(game) : []), [humanToMove, game]);

  let status: string;
  if (game.outcome !== null) {
    if (game.outcome === 'draw') status = c('draw');
    else if (vsAI) status = game.outcome === AI_SEAT ? c('loss') : c('win');
    else status = c('winsName', { name: names[game.outcome] });
  } else if (vsAI) {
    status = game.current === AI_SEAT ? t(lang, 'aiTurn') : t(lang, 'yourTurn');
  } else {
    status = t(lang, 'turnOf', { name: names[game.current] });
  }

  return (
    <Shell>
      <section className={ui.section}>
        <div className={styles.head}>
          <div className={ui.stack}>
            <h1 className={ui.h1}>{t(lang, 'title')}</h1>
            <p className={ui.muted}>{t(lang, 'subtitle')}</p>
          </div>
          <div className={styles.controls}>
            <div className={ui.segmented} role="group">
              <button type="button" aria-pressed={vsAI} onClick={() => newGame({ ...settings, mode: 'ai' })}>{c('vsAI')}</button>
              <button type="button" aria-pressed={!vsAI} onClick={() => newGame({ ...settings, mode: 'friend' })}>{c('vsFriend')}</button>
            </div>
            {vsAI && (
              <div className={ui.segmented} role="group">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => (
                  <button key={level} type="button" aria-pressed={settings.difficulty === level} onClick={() => newGame({ ...settings, difficulty: level })}>
                    {c(level)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.scores}>
          {([0, 1] as Seat[]).map(seat => (
            <div key={seat} className={`${styles.score} ${game.current === seat && game.outcome === null ? styles.toMove : ''}`}>
              <span className={styles.scoreName}>{names[seat]}</span>
              <span className={styles.scoreValue}>{view.stores[seat]}</span>
            </div>
          ))}
        </div>

        <MangalaBoard
          pits={view.pits}
          stores={view.stores}
          playable={playable}
          onPick={play}
          active={view.active}
          captured={captured}
          labels={{ pit: n => t(lang, 'pit', { n }), store: seat => t(lang, 'store', { name: names[seat] }) }}
        />

        <div className={styles.statusRow} aria-live="polite">
          <strong className={styles.status}>{status}</strong>
          {note && <span className={ui.pill}>{note}</span>}
          <span className={styles.spacer} />
          <button type="button" className={`${ui.btn} ${game.outcome !== null ? ui.primary : ''}`} onClick={() => newGame()}>
            {game.outcome !== null ? c('playAgain') : c('newGame')}
          </button>
        </div>

        {game.outcome !== null && (
          <p className={ui.lead}>{t(lang, 'final', { a: `${names[1]} ${game.stores[1]}`, b: `${game.stores[0]} ${names[0]}` })}</p>
        )}
      </section>

      <details className={`${ui.card} ${styles.rules}`}>
        <summary className={ui.h3}>{c('rules')}</summary>
        <RichText text={t(lang, 'rulesText')} />
      </details>
    </Shell>
  );
}
