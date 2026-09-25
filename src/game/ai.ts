/**
 * Toguz Korgool — AI opponent
 *
 * Three difficulty levels:
 *   easy   — random legal move
 *   medium — 1-ply greedy (best immediate gain)
 *   hard   — minimax with alpha-beta pruning (depth 4)
 */

import { GameState, Player, applyMove, evaluate, legalMoves } from './engine';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export function getAIMove(state: GameState, difficulty: AIDifficulty): number {
  const moves = legalMoves(state, state.current);
  if (moves.length === 0) return -1;

  switch (difficulty) {
    case 'easy':
      return moves[Math.floor(Math.random() * moves.length)];

    case 'medium':
      return greedyMove(state, moves);

    case 'hard':
      return minimaxMove(state, moves, 4);

    default:
      return moves[0];
  }
}

function greedyMove(state: GameState, moves: number[]): number {
  const player = state.current;
  let bestScore = -Infinity;

  for (const move of moves) {
    const { nextState } = applyMove(state, move);
    const score = evaluate(nextState, player);
    if (score > bestScore) bestScore = score;
  }

  // Add slight randomness to avoid being predictable
  const topMoves = moves.filter(m => {
    const { nextState } = applyMove(state, m);
    return Math.abs(evaluate(nextState, player) - bestScore) < 5;
  });

  return topMoves[Math.floor(Math.random() * topMoves.length)] ?? moves[0];
}

function minimaxMove(state: GameState, moves: number[], depth: number): number {
  const player = state.current;
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const { nextState } = applyMove(state, move);
    const score = minimax(nextState, depth - 1, -Infinity, Infinity, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player
): number {
  if (depth === 0 || state.gameOver) {
    return evaluate(state, aiPlayer);
  }

  const moves = legalMoves(state, state.current);
  if (moves.length === 0) return evaluate(state, aiPlayer);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { nextState } = applyMove(state, move);
      const ev = minimax(nextState, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { nextState } = applyMove(state, move);
      const ev = minimax(nextState, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
