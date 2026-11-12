/**
 * The contract every turn-based game on the platform implements. The same object drives the
 * AI, puzzles, and server-side validation of online games (functions/), so a game's rules are
 * written once and trusted everywhere.
 */
export type Seat = 0 | 1;
export type Outcome = Seat | 'draw';

export interface TurnBasedGame<S, M> {
  initialState(): S;
  toMove(state: S): Seat;
  legalMoves(state: S): M[];
  play(state: S, move: M): S;
  /** null while the game is still running. */
  outcome(state: S): Outcome | null;
  /** Heuristic score from `seat`'s point of view (higher is better). */
  evaluate(state: S, seat: Seat): number;
  isLegal(state: S, move: M): boolean;
}

export interface ReplayResult<S> {
  state: S;
  /** Index of the first illegal move, or -1 if every move was legal. */
  illegalAt: number;
}

/** Plays a recorded move list from the initial position, stopping at the first illegal move. */
export function replay<S, M>(game: TurnBasedGame<S, M>, moves: M[]): ReplayResult<S> {
  let state = game.initialState();
  for (let i = 0; i < moves.length; i++) {
    if (game.outcome(state) !== null || !game.isLegal(state, moves[i])) return { state, illegalAt: i };
    state = game.play(state, moves[i]);
  }
  return { state, illegalAt: -1 };
}

const WIN_SCORE = 1_000_000;

/** Alpha-beta search; returns the score of `state` for `seat`. */
export function search<S, M>(game: TurnBasedGame<S, M>, state: S, depth: number, seat: Seat, alpha = -Infinity, beta = Infinity): number {
  const outcome = game.outcome(state);
  if (outcome !== null) {
    if (outcome === 'draw') return 0;
    return outcome === seat ? WIN_SCORE + depth : -WIN_SCORE - depth;
  }
  const moves = game.legalMoves(state);
  if (depth === 0 || moves.length === 0) return game.evaluate(state, seat);

  const maximizing = game.toMove(state) === seat;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    const score = search(game, game.play(state, move), depth - 1, seat, alpha, beta);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/** Scores every legal move for the side to move with a `depth`-ply search. */
export function scoreMoves<S, M>(game: TurnBasedGame<S, M>, state: S, depth: number): { move: M; score: number }[] {
  const seat = game.toMove(state);
  return game.legalMoves(state).map(move => ({ move, score: search(game, game.play(state, move), depth - 1, seat) }));
}
