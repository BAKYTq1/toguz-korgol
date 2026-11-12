import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty } from '../platform/ai';
import { common } from '../platform/common';
import type { Seat } from '../platform/game';
import { usePlatformLang } from '../platform/LangContext';
import { defineStrings } from '../platform/strings';
import Shell from '../platform/ui/Shell';
import RichText from '../platform/ui/RichText';
import OrdoField from '../games/ordo/OrdoField';
import {
  createInitialState, DT, KHAN_POINTS, planThrow, PLANNERS, settle, Simulation, THROWS_PER_TURN, TURNS_PER_PLAYER,
  type Body, type OrdoState, type Throw,
} from '../games/ordo/engine';
import ui from '../platform/ui/ui.module.css';
import styles from '../platform/ui/GamePage.module.css';

const t = defineStrings({
  ru: {
    title: 'Ордо',
    subtitle: 'Игра в асыки по мотивам кыргызского ордо',
    yourThrow: 'Ваш бросок',
    throwOf: 'Бросает: {name}',
    aiAiming: 'Компьютер целится…',
    flying: 'Бросок!',
    again: 'Выбили {n}! Бросайте ещё',
    knocked: 'Выбито: {n}',
    missed: 'Мимо — ход переходит',
    khanOut: 'Хан выбит! +{n}',
    turns: 'Подход {n} из {total}',
    throwsLeft: 'бросков в подходе: {n}',
    hint: 'Нажмите на черту круга, чтобы встать в другое место. Потяните от саки назад и отпустите — чем дальше тянете, тем сильнее бросок. С клавиатуры: ← → место, ↑ ↓ направление, + − сила, пробел — бросок.',
    field: 'Круг ордо: хан в центре, вокруг него чүкө',
    adaptation: 'Это экранная адаптация для двоих. Настоящее ордо — командная игра на круге около 12 метров, со своими правилами подсчёта у федерации.',
    rulesText: `**Поле.** Круг — это земля государства. В центре стоит **хан**, вокруг него кольцом — **чүкө** (асыки), его стража.

**Бросок.** Встаньте на черту круга и бросьте **саку** — тяжёлую биту. Каждая чүкө, вылетевшая за черту, — **1 очко**.

**Ещё бросок.** Выбили хотя бы одну — бросайте снова, но не больше **${THROWS_PER_TURN} бросков** за подход.

**Хан.** Выбить хана из круга — **${KHAN_POINTS} очков** и конец игры. Пока стража стоит, к хану не пробиться.

**Конец.** Когда хан выбит или у обоих прошло по **${TURNS_PER_PLAYER} подходов**. Больше очков — победа.`,
  },
  ky: {
    title: 'Ордо',
    subtitle: 'Кыргыздын ордо оюнунун негизинде чүкө оюну',
    yourThrow: 'Сиздин ыргытуу',
    throwOf: 'Ыргытат: {name}',
    aiAiming: 'Компьютер мээлеп жатат…',
    flying: 'Ыргытуу!',
    again: '{n} чыгардыңыз! Дагы ыргытыңыз',
    knocked: 'Чыгарылды: {n}',
    missed: 'Тийген жок — кезек өтөт',
    khanOut: 'Хан чыгарылды! +{n}',
    turns: '{total} кезектин {n}-кезеги',
    throwsLeft: 'кезекте калган ыргытуу: {n}',
    hint: 'Башка жерге туруу үчүн тегеректин сызыгын басыңыз. Сакадан артка тартып коё бериңиз — канчалык алыс тартсаңыз, ошончолук катуу ыргытасыз. Клавиатура: ← → орун, ↑ ↓ багыт, + − күч, боштук — ыргытуу.',
    field: 'Ордонун тегереги: ортодо хан, айланасында чүкөлөр',
    adaptation: 'Бул эки кишиге арналган экрандык нуска. Чыныгы ордо — болжол менен 12 метрлик тегеректе ойнолуучу командалык оюн, федерациянын өз эсептөө эрежелери бар.',
    rulesText: `**Аянт.** Тегерек — мамлекеттин жери. Ортодо **хан** турат, анын айланасында шакек болуп **чүкөлөр** — анын кароолу.

**Ыргытуу.** Тегеректин сызыгына туруп, **саканы** ыргытыңыз. Сызыктан чыккан ар бир чүкө — **1 упай**.

**Дагы ыргытуу.** Жок дегенде бирөөнү чыгарсаңыз — кайра ыргытасыз, бирок бир кезекте **${THROWS_PER_TURN} ыргытуудан** ашпайт.

**Хан.** Ханды тегеректен чыгаруу — **${KHAN_POINTS} упай** жана оюндун аягы. Кароол турганда ханга жетүү мүмкүн эмес.

**Аягы.** Хан чыгарылганда же экөө тең **${TURNS_PER_PLAYER} кезектен** ойногондо. Көп упай — жеңиш.`,
  },
  en: {
    title: 'Ordo',
    subtitle: 'A knucklebone game based on the Kyrgyz Ordo',
    yourThrow: 'Your throw',
    throwOf: 'Throwing: {name}',
    aiAiming: 'The computer is aiming…',
    flying: 'Throw!',
    again: 'Knocked out {n}! Throw again',
    knocked: 'Knocked out: {n}',
    missed: 'Missed — the turn passes',
    khanOut: 'The khan is out! +{n}',
    turns: 'Turn {n} of {total}',
    throwsLeft: 'throws left this turn: {n}',
    hint: 'Tap the circle line to stand somewhere else. Pull back from the saka and let go — the further you pull, the harder the throw. Keyboard: ← → position, ↑ ↓ direction, + − power, space to throw.',
    field: 'The Ordo circle: the khan in the centre, surrounded by chükö',
    adaptation: 'This is an on-screen adaptation for two players. Real Ordo is a team game on a circle about 12 metres across, with its federation’s own scoring rules.',
    rulesText: `**The field.** The circle is the land of the state. The **khan** stands in the centre, ringed by **chükö** (knucklebones) — its guard.

**Throwing.** Stand on the circle line and throw the **saka**, the heavy striker. Each chükö knocked over the line scores **1 point**.

**Throw again.** Knock out at least one and you throw again — up to **${THROWS_PER_TURN} throws** per turn.

**The khan.** Knocking the khan out of the circle scores **${KHAN_POINTS} points** and ends the game. While the guard stands, the khan cannot be reached.

**The end.** When the khan is out, or both players have had **${TURNS_PER_PLAYER} turns**. Most points wins.`,
  },
});

type Mode = 'ai' | 'friend';
type Phase = 'aim' | 'flying' | 'ai' | 'over';
const AI_SEAT: Seat = 1;
const SPEED = 1.4;
const SETTINGS_KEY = 'ordo_settings';

/** Players stand on opposite sides: seat 0 at the bottom, seat 1 at the top. */
const defaultAim = (seat: Seat): Throw => {
  const position = seat === 0 ? Math.PI / 2 : -Math.PI / 2;
  return { position, direction: position + Math.PI, power: 0.75 };
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

export default function OrdoPage() {
  const [lang] = usePlatformLang();
  const [settings, setSettings] = useState(loadSettings);
  const [gamesStarted, setGamesStarted] = useState(0);
  const [game, setGame] = useState<OrdoState>(() => createInitialState(0));
  const [view, setView] = useState<Body[]>(game.bodies);
  const [aim, setAim] = useState<Throw | null>(() => defaultAim(0));
  const [phase, setPhase] = useState<Phase>('aim');
  const [note, setNote] = useState('');
  const frame = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const vsAI = settings.mode === 'ai';
  const names = useMemo<Record<Seat, string>>(
    () => (vsAI ? { 0: common(lang, 'you'), 1: common(lang, 'ai') } : { 0: common(lang, 'player1'), 1: common(lang, 'player2') }),
    [vsAI, lang],
  );
  const c = (key: Parameters<typeof common>[1], vars?: Record<string, string | number>) => common(lang, key, vars);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // The choice still applies for this visit.
    }
  }, [settings]);

  const stopAll = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stopAll, []);

  const nextPhase = useCallback((state: OrdoState, mode: Mode) => {
    if (state.outcome !== null) {
      setPhase('over');
      setAim(null);
    } else if (mode === 'ai' && state.current === AI_SEAT) {
      setPhase('ai');
      setAim(null);
    } else {
      setPhase('aim');
      setAim(defaultAim(state.current));
    }
  }, []);

  const throwSaka = useCallback((shot: Throw) => {
    if (phase === 'flying' || game.outcome !== null) return;
    const sim = new Simulation(game, shot);
    setAim(null);
    setPhase('flying');
    setNote('');
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      carry += Math.min(0.1, (now - last) / 1000) * SPEED;
      last = now;
      while (carry >= DT && !sim.done) {
        sim.step();
        carry -= DT;
      }
      setView(sim.bodies.map(b => ({ ...b })));
      if (!sim.done) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      frame.current = null;
      const result = settle(game, sim);
      setGame(result.state);
      setView(result.state.bodies);
      const chuko = result.knocked.filter(kind => kind === 'chuko').length;
      // Say whose throw it was, so the computer's miss is not read as yours.
      const who = settings.mode === 'ai' && game.current === AI_SEAT ? `${common(lang, 'ai')}: ` : '';
      if (result.knocked.includes('khan')) setNote(who + t(lang, 'khanOut', { n: result.points }));
      else if (result.again) setNote(who + t(lang, 'again', { n: chuko }));
      else if (chuko > 0) setNote(who + t(lang, 'knocked', { n: chuko }));
      else setNote(who + t(lang, 'missed'));
      nextPhase(result.state, settings.mode);
    };
    frame.current = requestAnimationFrame(tick);
  }, [phase, game, lang, nextPhase, settings.mode]);

  // The computer aims (shown briefly), then throws.
  useEffect(() => {
    if (phase !== 'ai') return;
    const think = setTimeout(() => {
      const shot = planThrow(game, PLANNERS[settings.difficulty]);
      setAim(shot);
      timers.current.push(setTimeout(() => throwSaka(shot), 700));
    }, 450);
    timers.current.push(think);
    return () => clearTimeout(think);
  }, [phase, game, settings.difficulty, throwSaka]);

  /** A rematch alternates who starts; changing the mode or level starts over with seat 0. */
  const newGame = (nextSettings?: typeof settings) => {
    stopAll();
    const index = nextSettings ? 0 : gamesStarted + 1;
    const mode = (nextSettings ?? settings).mode;
    const state = createInitialState(index % 2 === 0 ? 0 : 1);
    setGamesStarted(index);
    if (nextSettings) setSettings(nextSettings);
    setGame(state);
    setView(state.bodies);
    setNote('');
    nextPhase(state, mode);
  };

  let status: string;
  if (game.outcome !== null) {
    if (game.outcome === 'draw') status = c('draw');
    else if (vsAI) status = game.outcome === AI_SEAT ? c('loss') : c('win');
    else status = c('winsName', { name: names[game.outcome] });
  } else if (phase === 'flying') {
    status = t(lang, 'flying');
  } else if (phase === 'ai') {
    status = t(lang, 'aiAiming');
  } else {
    status = vsAI ? t(lang, 'yourThrow') : t(lang, 'throwOf', { name: names[game.current] });
  }

  const turnNumber = TURNS_PER_PLAYER - game.turnsLeft[game.current] + 1;

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
              <span className={styles.scoreValue}>{game.scores[seat]}</span>
            </div>
          ))}
        </div>

        <OrdoField
          bodies={view}
          aim={aim}
          interactive={phase === 'aim'}
          onAim={setAim}
          onThrow={throwSaka}
          label={t(lang, 'field')}
        />

        <div className={styles.statusRow} aria-live="polite">
          <strong className={styles.status}>{status}</strong>
          {note && <span className={ui.pill}>{note}</span>}
          {game.outcome === null && (
            <span className={ui.muted}>
              {t(lang, 'turns', { n: Math.min(turnNumber, TURNS_PER_PLAYER), total: TURNS_PER_PLAYER })} · {t(lang, 'throwsLeft', { n: game.throwsLeft })}
            </span>
          )}
          <span className={styles.spacer} />
          <button type="button" className={`${ui.btn} ${game.outcome !== null ? ui.primary : ''}`} onClick={() => newGame()}>
            {game.outcome !== null ? c('playAgain') : c('newGame')}
          </button>
        </div>
        {phase === 'aim' && <p className={ui.muted}>{t(lang, 'hint')}</p>}
      </section>

      <details className={`${ui.card} ${styles.rules}`}>
        <summary className={ui.h3}>{c('rules')}</summary>
        <RichText text={t(lang, 'rulesText')} />
        <p className={ui.muted}>{t(lang, 'adaptation')}</p>
      </details>
    </Shell>
  );
}
