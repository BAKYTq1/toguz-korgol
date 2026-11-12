import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMove, type GameState, type MoveResult } from '../game/engine';
import type { DiagramView } from './ToguzDiagram';

const STEP_MS = 120;

/** Plays a move on a diagram stone by stone, then reports the engine's result. */
export function useToguzPlayback(initial: GameState) {
  const [state, setState] = useState(initial);
  const [view, setView] = useState<DiagramView>(initial);
  const [active, setActive] = useState<number | 'k0' | 'k1' | null>(null);
  const [flash, setFlash] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const reset = useCallback((next: GameState) => {
    clear();
    setState(next);
    setView(next);
    setActive(null);
    setFlash([]);
    setBusy(false);
  }, []);

  const play = useCallback((move: number, onDone: (next: GameState, result: MoveResult) => void) => {
    if (busy) return;
    const { nextState, result } = applyMove(state, move);
    const pits = state.pits.slice();
    const kazan: [number, number] = [state.kazan[0], state.kazan[1]];
    pits[move] = state.pits[move] === 1 ? 0 : 1;
    setBusy(true);
    setFlash([]);
    setView({ pits: pits.slice(), kazan: [kazan[0], kazan[1]], tuzduk: state.tuzduk });
    setActive(move);
    result.steps.forEach((step, i) => {
      if (step.toKazan === -1) pits[step.pit]++;
      else kazan[step.toKazan]++;
      const frame = { pits: pits.slice(), kazan: [kazan[0], kazan[1]] as [number, number], tuzduk: state.tuzduk };
      const target = step.toKazan === -1 ? step.pit : (`k${step.toKazan}` as const);
      timers.current.push(setTimeout(() => {
        setView(frame);
        setActive(target);
      }, STEP_MS * (i + 1)));
    });
    timers.current.push(setTimeout(() => {
      const last = result.steps[result.steps.length - 1]?.pit;
      setState(nextState);
      setView(nextState);
      setActive(null);
      setFlash((result.captured || result.tuzdukCreated) && last !== undefined ? [last] : []);
      setBusy(false);
      onDone(nextState, result);
    }, STEP_MS * (result.steps.length + 1) + 150));
  }, [busy, state]);

  return { state, view, active, flash, busy, play, reset };
}
