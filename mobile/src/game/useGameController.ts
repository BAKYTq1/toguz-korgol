/**
 * Game state plus everything that happens on the board: sowing animation, the AI,
 * queued online moves and move confirmation. The rules themselves come from the shared engine.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  applyMove,
  createInitialState,
  getAIMove,
  legalMoves,
  ownerOf,
  type AIDifficulty,
  type GameState,
  type Player,
} from '../shared';

const STEP_MS = 120;
const FAST_STEP_MS = 80;
const AI_DELAY_MS = 520;

export interface MoveSelection {
  idx: number;
  /** Pit where the last stone lands. */
  landing: number;
  /** Stones the mover would add to their kazan. */
  gain: number;
  tuzduk: boolean;
}

export interface Animation {
  pits: number[];
  kazan: [number, number];
  /** Pit (or -1) the latest stone dropped into. */
  activePit: number;
}

export interface ScoreGain {
  player: Player;
  amount: number;
  key: number;
}

interface Options {
  aiPlayer: Player | null;
  aiDifficulty: AIDifficulty;
  /** Whether the person holding the phone may move now (their turn, not the AI's, opponent connected). */
  canHumanMove: (game: GameState) => boolean;
  confirmMoves: boolean;
  haptics: boolean;
  /** A move made on this device (not received from the opponent) — sent online if needed. */
  onLocalMove?: (idx: number) => void;
}

export function useGameController(options: Options) {
  const optionsRef = useRef(options);
  const [game, setGame] = useState<GameState>(createInitialState);
  const gameRef = useRef(game);

  const [animation, setAnimation] = useState<Animation | null>(null);
  const animatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);

  // A selection belongs to the board it was made on; any move or restart drops it.
  const [selectionState, setSelectionState] = useState<{ game: GameState; selection: MoveSelection } | null>(null);
  const selection = selectionState?.game === game ? selectionState.selection : null;
  const selectionRef = useRef(selection);
  const setSelection = useCallback((value: MoveSelection | null) => {
    setSelectionState(value ? { game: gameRef.current, selection: value } : null);
  }, []);

  // Event handlers and timers read the latest values through refs.
  useLayoutEffect(() => {
    optionsRef.current = options;
    gameRef.current = game;
    selectionRef.current = selection;
  });
  const [lastMove, setLastMove] = useState<{ from: number; to: number } | null>(null);
  const [gains, setGains] = useState<ScoreGain[]>([]);
  const [invalidPit, setInvalidPit] = useState<{ idx: number; key: number } | null>(null);

  const remoteQueueRef = useRef<number[]>([]);
  const [queueTick, setQueueTick] = useState(0);

  const haptic = useCallback((kind: 'tap' | 'error' | 'success') => {
    if (!optionsRef.current.haptics) return;
    const run = kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(kind === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success);
    void run.catch(() => undefined);
  }, []);

  /** Plays a move with the sowing animation. Returns false if the move is not legal now. */
  const executeMove = useCallback((idx: number, remote = false) => {
    const current = gameRef.current;
    if (animatingRef.current || current.gameOver) return false;
    if (ownerOf(idx) !== current.current || current.pits[idx] <= 0) return false;

    const { nextState, result } = applyMove(current, idx);
    if (!remote) optionsRef.current.onLocalMove?.(idx);
    haptic('tap');
    setSelection(null);

    const stones = current.pits[idx];
    const pits = current.pits.slice();
    pits[idx] = stones === 1 ? 0 : 1; // the first stone goes back unless it is alone
    const kazan: [number, number] = [current.kazan[0], current.kazan[1]];
    animatingRef.current = true;
    const generation = ++generationRef.current;
    setAnimation({ pits: pits.slice(), kazan: [...kazan], activePit: idx });

    const steps = result.steps;
    const stepMs = steps.length > 14 ? FAST_STEP_MS : STEP_MS;
    let i = 0;

    const finish = () => {
      animatingRef.current = false;
      timerRef.current = null;
      setAnimation(null);
      setGame(nextState);
      const lastStep = steps[steps.length - 1];
      setLastMove({ from: idx, to: lastStep ? lastStep.pit : idx });
      const key = Date.now();
      const newGains = ([0, 1] as const)
        .filter(player => result.gained[player] > 0)
        .map(player => ({ player, amount: result.gained[player], key: key + player }));
      if (newGains.length) setGains(newGains);
      if (result.captured || result.tuzdukCreated) haptic('success');
    };

    const tick = () => {
      if (generation !== generationRef.current) return; // cancelled by a restart
      if (i >= steps.length) {
        finish();
        return;
      }
      const step = steps[i++];
      if (step.toKazan !== -1) kazan[step.toKazan] += 1;
      else pits[step.pit] += 1;
      setAnimation({ pits: pits.slice(), kazan: [...kazan], activePit: step.pit });
      timerRef.current = setTimeout(tick, stepMs);
    };
    timerRef.current = setTimeout(tick, stepMs);
    return true;
  }, [haptic, setSelection]);

  const restart = useCallback(() => {
    generationRef.current++;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    animatingRef.current = false;
    remoteQueueRef.current = [];
    setAnimation(null);
    setSelection(null);
    setLastMove(null);
    setGains([]);
    setGame(createInitialState());
  }, [setSelection]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /** Opponent's move from the network; waits for the current animation to finish. */
  const playRemoteMove = useCallback((idx: number) => {
    remoteQueueRef.current.push(idx);
    setQueueTick(n => n + 1);
  }, []);

  useEffect(() => {
    if (animatingRef.current || animation || remoteQueueRef.current.length === 0) return;
    const idx = remoteQueueRef.current.shift()!;
    if (!executeMove(idx, true)) console.warn('Ignored an online move that does not fit the local board', idx);
  }, [game, animation, queueTick, executeMove]);

  // AI turn
  const { aiPlayer, aiDifficulty } = options;
  useEffect(() => {
    if (aiPlayer === null || game.gameOver || animation || game.current !== aiPlayer) return;
    if (legalMoves(game, game.current).length === 0) return;
    const timer = setTimeout(() => {
      const idx = getAIMove(gameRef.current, aiDifficulty);
      if (idx !== -1) executeMove(idx);
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [game, animation, aiPlayer, aiDifficulty, executeMove]);

  const flashInvalid = useCallback((idx: number) => {
    setInvalidPit({ idx, key: Date.now() });
    haptic('error');
  }, [haptic]);

  /** Tap on a pit (or -1 for empty space). */
  const tapPit = useCallback((idx: number) => {
    const current = gameRef.current;
    if (animatingRef.current || current.gameOver) return;
    if (idx === -1) {
      setSelection(null);
      return;
    }
    if (!optionsRef.current.canHumanMove(current)) return;
    if (ownerOf(idx) !== current.current || current.pits[idx] <= 0) {
      flashInvalid(idx);
      setSelection(null);
      return;
    }
    if (!optionsRef.current.confirmMoves) {
      executeMove(idx);
      return;
    }
    // A second tap on the selected pit confirms it.
    if (selectionRef.current?.idx === idx) {
      executeMove(idx);
      return;
    }
    const { nextState, result } = applyMove(current, idx);
    const lastStep = result.steps[result.steps.length - 1];
    haptic('tap');
    setSelection({
      idx,
      landing: lastStep ? lastStep.pit : idx,
      gain: nextState.kazan[current.current] - current.kazan[current.current],
      tuzduk: result.tuzdukCreated,
    });
  }, [executeMove, flashInvalid, haptic, setSelection]);

  const confirmSelection = useCallback(() => {
    if (selection) executeMove(selection.idx);
  }, [selection, executeMove]);

  const clearSelection = useCallback(() => setSelection(null), [setSelection]);

  return {
    game,
    animation,
    selection,
    lastMove,
    gains,
    invalidPit,
    tapPit,
    confirmSelection,
    clearSelection,
    restart,
    playRemoteMove,
  };
}
