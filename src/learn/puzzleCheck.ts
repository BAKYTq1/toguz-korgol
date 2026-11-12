/**
 * Toguz Korgool puzzles: what each kind asks, and how a position qualifies as one.
 * The same checks generate puzzles (scripts/generate-puzzles.ts) and grade them in tests and UI.
 */
import { applyMove, legalMoves, type GameState, type Player } from '../game/engine';

export type PuzzleKind = 'capture' | 'tuzduk' | 'foresight';

export interface PuzzleData {
  id: string;
  kind: PuzzleKind;
  solution: number;
  pits: number[];
  kazan: [number, number];
  tuzduk: [number, number];
  moveCount: number;
}

/** In puzzles the solver always plays the bottom row (player 1), as in the game. */
export const SOLVER: Player = 1;

export function puzzleState(puzzle: Pick<PuzzleData, 'pits' | 'kazan' | 'tuzduk' | 'moveCount'>): GameState {
  return {
    pits: puzzle.pits.slice(),
    kazan: [puzzle.kazan[0], puzzle.kazan[1]],
    tuzduk: [puzzle.tuzduk[0], puzzle.tuzduk[1]],
    current: SOLVER,
    moveCount: puzzle.moveCount,
    gameOver: false,
    winner: null,
  };
}

export interface MoveFacts {
  move: number;
  /** Stones the mover gains with this move. */
  gain: number;
  tuzduk: boolean;
  /** Mover's kazan lead after the opponent's strongest reply (by stones). */
  netAfterReply: number;
}

export function moveFacts(state: GameState, move: number): MoveFacts {
  const me = state.current;
  const opp: Player = me === 0 ? 1 : 0;
  const { nextState, result } = applyMove(state, move);
  const lead = (s: GameState) => s.kazan[me] - s.kazan[opp];
  let netAfterReply = lead(nextState);
  if (!nextState.gameOver) {
    for (const reply of legalMoves(nextState, opp)) {
      netAfterReply = Math.min(netAfterReply, lead(applyMove(nextState, reply).nextState));
    }
  }
  return { move, gain: result.gained[me], tuzduk: result.tuzdukCreated, netAfterReply };
}

/** The single right answer for `kind` in this position, or null if the position does not fit. */
export function solve(state: GameState, kind: PuzzleKind): number | null {
  if (state.gameOver) return null;
  const facts = legalMoves(state, state.current).map(move => moveFacts(state, move));
  if (facts.length < 3) return null;
  const bestNet = Math.max(...facts.map(f => f.netAfterReply));
  const byGain = [...facts].sort((x, y) => y.gain - x.gain);
  const byNet = [...facts].sort((x, y) => y.netAfterReply - x.netAfterReply);

  if (kind === 'tuzduk') {
    const makers = facts.filter(f => f.tuzduk);
    if (makers.length !== 1 || makers[0].netAfterReply < bestNet - 4) return null;
    return makers[0].move;
  }

  if (kind === 'capture') {
    const [best, second] = byGain;
    if (best.gain < 10 || second.gain > best.gain - 6 || best.tuzduk) return null;
    // The greedy answer must also be sound: no other move ends up better after the reply.
    if (best.netAfterReply < bestNet) return null;
    return best.move;
  }

  // foresight: the move that looks best right now is a mistake; another one is clearly better.
  const [best, second] = byNet;
  const greedy = byGain[0];
  if (best.netAfterReply - second.netAfterReply < 6) return null;
  if (greedy.move === best.move || greedy.gain <= best.gain || best.netAfterReply - greedy.netAfterReply < 6) return null;
  return best.move;
}

export function classifyPuzzle(state: GameState): { kind: PuzzleKind; solution: number } | null {
  for (const kind of ['tuzduk', 'foresight', 'capture'] as PuzzleKind[]) {
    const solution = solve(state, kind);
    if (solution !== null) return { kind, solution };
  }
  return null;
}
