/** Toguz Korgool as a platform game (see src/platform/game.ts). The rules live in engine.ts. */
import type { TurnBasedGame } from '../platform/game';
import { applyMove, createInitialState, evaluate, legalMoves, type GameState } from './engine';

export const toguzGame: TurnBasedGame<GameState, number> = {
  initialState: createInitialState,
  toMove: state => state.current,
  legalMoves: state => (state.gameOver ? [] : legalMoves(state, state.current)),
  play: (state, move) => applyMove(state, move).nextState,
  outcome: state => (state.gameOver ? state.winner : null),
  evaluate,
  isLegal: (state, move) =>
    !state.gameOver && Number.isInteger(move) && legalMoves(state, state.current).includes(move),
};
