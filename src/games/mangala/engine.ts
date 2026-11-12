/**
 * Mangala — the Turkic sowing game of the same family as Toguz Korgool.
 *
 * Board layout:
 *   pits[0..5]  = player 0 row (top), pits[6..11] = player 1 row (bottom)
 *   stores[p]   = player p's treasury
 *
 * Sowing runs 0→…→5→store0→6→…→11→store1→0 and skips the opponent's store.
 *
 * Rules:
 *  - 48 stones, 4 in each pit. Pick a non-empty pit on your side.
 *  - As in Toguz Korgool, the first stone goes back into the pit you lifted; a lone stone moves on.
 *  - Last stone in your own store → you move again.
 *  - Last stone makes an opponent's pit even → you take that pit.
 *  - Last stone lands in an empty pit of yours while the opposite pit has stones → you take both.
 *  - When one side has no stones left, the game ends and the player whose side ran out
 *    takes every stone still on the other side. More than 24 wins; 24–24 is a draw.
 */
import type { Outcome, Seat, TurnBasedGame } from '../../platform/game';

export const PITS_PER_SIDE = 6;
export const STONES_PER_PIT = 4;
export const TOTAL_STONES = PITS_PER_SIDE * 2 * STONES_PER_PIT;

/** A sowing position: a pit index 0..11, or a store written as 'store0' / 'store1'. */
export type Slot = number | 'store0' | 'store1';

export interface MangalaState {
  pits: number[];
  stores: [number, number];
  current: Seat;
  outcome: Outcome | null;
}

export interface MoveTrace {
  /** Pit the stones were lifted from. */
  from: number;
  /** Stones left in `from` right after lifting (1, or 0 for a lone stone). */
  leftBehind: number;
  /** Every slot that received a stone, in order. */
  path: Slot[];
  capture: { pits: number[]; stones: number } | null;
  extraTurn: boolean;
  /** Stones collected when one side ran out, and by whom. */
  sweep: { seat: Seat; stones: number } | null;
}

export const ownerOf = (pit: number): Seat => (pit < PITS_PER_SIDE ? 0 : 1);
export const oppositeOf = (pit: number) => 2 * PITS_PER_SIDE - 1 - pit;
const firstPit = (seat: Seat) => (seat === 0 ? 0 : PITS_PER_SIDE);
const sidePits = (seat: Seat) => Array.from({ length: PITS_PER_SIDE }, (_, i) => firstPit(seat) + i);

export function createInitialState(): MangalaState {
  return {
    pits: new Array(PITS_PER_SIDE * 2).fill(STONES_PER_PIT),
    stores: [0, 0],
    current: 0,
    outcome: null,
  };
}

export function legalMoves(state: MangalaState): number[] {
  if (state.outcome !== null) return [];
  return sidePits(state.current).filter(pit => state.pits[pit] > 0);
}

/** The slot after `slot` when `seat` is sowing. */
function nextSlot(slot: Slot, seat: Seat): Slot {
  if (slot === 'store0') return PITS_PER_SIDE;
  if (slot === 'store1') return 0;
  if (slot === PITS_PER_SIDE - 1) return seat === 0 ? 'store0' : PITS_PER_SIDE;
  if (slot === 2 * PITS_PER_SIDE - 1) return seat === 1 ? 'store1' : 0;
  return slot + 1;
}

export function playTraced(state: MangalaState, from: number): { state: MangalaState; trace: MoveTrace } {
  const seat = state.current;
  const opponent: Seat = seat === 0 ? 1 : 0;
  const pits = state.pits.slice();
  const stores: [number, number] = [state.stores[0], state.stores[1]];

  const lifted = pits[from];
  const toSow = lifted === 1 ? 1 : lifted - 1;
  pits[from] = lifted === 1 ? 0 : 1;
  const leftBehind = pits[from];

  const path: Slot[] = [];
  let slot: Slot = from;
  for (let i = 0; i < toSow; i++) {
    slot = nextSlot(slot, seat);
    path.push(slot);
    if (slot === 'store0') stores[0]++;
    else if (slot === 'store1') stores[1]++;
    else pits[slot]++;
  }

  let capture: MoveTrace['capture'] = null;
  const extraTurn = slot === (seat === 0 ? 'store0' : 'store1');
  if (typeof slot === 'number') {
    if (ownerOf(slot) === opponent && pits[slot] % 2 === 0) {
      capture = { pits: [slot], stones: pits[slot] };
      stores[seat] += pits[slot];
      pits[slot] = 0;
    } else if (ownerOf(slot) === seat && pits[slot] === 1 && pits[oppositeOf(slot)] > 0) {
      const opposite = oppositeOf(slot);
      capture = { pits: [slot, opposite], stones: 1 + pits[opposite] };
      stores[seat] += capture.stones;
      pits[slot] = 0;
      pits[opposite] = 0;
    }
  }

  let sweep: MoveTrace['sweep'] = null;
  let outcome: Outcome | null = null;
  const emptySide = ([0, 1] as const).find(side => sidePits(side).every(pit => pits[pit] === 0));
  if (emptySide !== undefined) {
    const other: Seat = emptySide === 0 ? 1 : 0;
    const stones = sidePits(other).reduce((sum, pit) => sum + pits[pit], 0);
    for (const pit of sidePits(other)) pits[pit] = 0;
    stores[emptySide] += stones;
    sweep = { seat: emptySide, stones };
    outcome = stores[0] === stores[1] ? 'draw' : stores[0] > stores[1] ? 0 : 1;
  }

  return {
    state: {
      pits,
      stores,
      current: outcome !== null || extraTurn ? seat : opponent,
      outcome,
    },
    trace: { from, leftBehind, path, capture, extraTurn, sweep },
  };
}

export function evaluate(state: MangalaState, seat: Seat): number {
  const opponent: Seat = seat === 0 ? 1 : 0;
  const onSide = (side: Seat) => sidePits(side).reduce((sum, pit) => sum + state.pits[pit], 0);
  return (state.stores[seat] - state.stores[opponent]) * 10 + (onSide(seat) - onSide(opponent));
}

export const mangalaGame: TurnBasedGame<MangalaState, number> = {
  initialState: createInitialState,
  toMove: state => state.current,
  legalMoves,
  play: (state, move) => playTraced(state, move).state,
  outcome: state => state.outcome,
  evaluate,
  isLegal: (state, move) => Number.isInteger(move) && legalMoves(state).includes(move),
};
