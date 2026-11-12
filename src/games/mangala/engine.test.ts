import { describe, expect, it } from 'vitest';
import { replay } from '../../platform/game';
import { chooseMove } from '../../platform/ai';
import { createInitialState, mangalaGame, playTraced, TOTAL_STONES, type MangalaState } from './engine';

const total = (s: MangalaState) => s.pits.reduce((a, b) => a + b, 0) + s.stores[0] + s.stores[1];

function position(pits: number[], stores: [number, number], current: 0 | 1 = 0): MangalaState {
  return { pits, stores, current, outcome: null };
}

describe('mangala sowing', () => {
  it('puts the first stone back and sows the rest', () => {
    const { state, trace } = playTraced(createInitialState(), 0);
    expect(state.pits.slice(0, 4)).toEqual([1, 5, 5, 5]);
    expect(trace.path).toEqual([1, 2, 3]);
    expect(state.current).toBe(1);
  });

  it('moves a lone stone to the next pit', () => {
    // The opposite pit (10) is empty, so landing in empty pit 1 captures nothing.
    const start = position([1, 0, 0, 0, 0, 3, 4, 4, 4, 4, 0, 4], [12, 12]);
    const { state } = playTraced(start, 0);
    expect(state.pits[0]).toBe(0);
    expect(state.pits[1]).toBe(1);
  });

  it('gives another turn when the last stone reaches your own store', () => {
    // Pit 3 holds 4: one stays, the other three go to 4, 5 and the store.
    const { state, trace } = playTraced(createInitialState(), 3);
    expect(trace.path).toEqual([4, 5, 'store0']);
    expect(trace.extraTurn).toBe(true);
    expect(state.current).toBe(0);
    expect(state.stores[0]).toBe(1);
  });

  it("skips the opponent's store", () => {
    const start = position([0, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 0], [19, 19], 0);
    const { trace } = playTraced(start, 5); // one stays, eight go round to pit 0
    expect(trace.path).toEqual(['store0', 6, 7, 8, 9, 10, 11, 0]);
  });

  it('captures an even opponent pit', () => {
    // Pit 5 holds 3: one stays, one goes to the store, the last makes pit 6 even (4).
    const start = position([0, 0, 0, 0, 0, 3, 3, 4, 4, 4, 4, 4], [10, 9], 0);
    const { state, trace } = playTraced(start, 5);
    expect(trace.capture).toEqual({ pits: [6], stones: 4 });
    expect(state.pits[6]).toBe(0);
    expect(state.stores[0]).toBe(10 + 1 + 4);
  });

  it('captures from an empty own pit together with the opposite pit', () => {
    const start = position([2, 0, 0, 0, 0, 1, 4, 4, 4, 4, 4, 4], [10, 9], 0);
    const { state, trace } = playTraced(start, 0); // one stays in 0, one lands in empty pit 1
    expect(trace.capture).toEqual({ pits: [1, 10], stones: 5 });
    expect(state.pits[1]).toBe(0);
    expect(state.pits[10]).toBe(0);
  });

  it('ends when a side is empty and gives the other side to the player who ran out', () => {
    const start = position([0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2], [20, 16], 0);
    const { state, trace } = playTraced(start, 5); // lone stone to store0; side 0 is now empty
    expect(trace.sweep).toEqual({ seat: 0, stones: 12 });
    expect(state.stores).toEqual([33, 16]);
    expect(state.outcome).toBe(0);
  });
});

describe('mangala as a platform game', () => {
  it('keeps 48 stones through full AI-vs-AI games and always finishes', () => {
    for (let game = 0; game < 30; game++) {
      let seed = game + 1;
      const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      let state = mangalaGame.initialState();
      const moves: number[] = [];
      for (let ply = 0; ply < 400 && mangalaGame.outcome(state) === null; ply++) {
        const move = chooseMove(mangalaGame, state, { depth: 1 + (ply % 2), slack: 20 }, random)!;
        moves.push(move);
        state = mangalaGame.play(state, move);
        expect(total(state)).toBe(TOTAL_STONES);
      }
      expect(mangalaGame.outcome(state)).not.toBeNull();
      expect(replay(mangalaGame, moves)).toEqual({ state, illegalAt: -1 });
    }
  });

  it('rejects moves from the wrong side', () => {
    const state = mangalaGame.initialState();
    expect(mangalaGame.isLegal(state, 7)).toBe(false);
    expect(replay(mangalaGame, [7]).illegalAt).toBe(0);
  });
});
