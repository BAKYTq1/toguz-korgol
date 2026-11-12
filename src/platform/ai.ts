/** A difficulty-graded opponent that works for any platform game. */
import { scoreMoves, type TurnBasedGame } from './game';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AIProfile {
  /** Search depth in plies. */
  depth: number;
  /** Moves scoring within this margin of the best are picked at random, to vary play. */
  slack: number;
}

export function chooseMove<S, M>(game: TurnBasedGame<S, M>, state: S, profile: AIProfile, random = Math.random): M | null {
  const scored = scoreMoves(game, state, profile.depth);
  if (scored.length === 0) return null;
  const best = Math.max(...scored.map(entry => entry.score));
  const candidates = scored.filter(entry => entry.score >= best - profile.slack);
  return candidates[Math.floor(random() * candidates.length)].move;
}
