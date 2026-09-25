/**
 * Toguz Korgool — Game Engine
 *
 * Board layout:
 *   pits[0..8]   = Player 0 row (top)
 *   pits[9..17]  = Player 1 row (bottom)
 *
 * Sowing direction: 0→1→…→17→0 (counter-clockwise on a physical board)
 *
 * Rules summary:
 *  - Each player has 9 pits. The board starts with 9 stones per pit (162 total).
 *  - On your turn, pick any non-empty pit in your row and sow its stones one-by-one.
 *  - If the last stone lands in an opponent's pit making it even → capture to your kazan.
 *  - If the last stone makes an opponent's pit = 3 AND you have no tuzduk yet → that pit
 *    becomes your tuzduk (permanent toll gate). Tuzduk cannot be the opponent's last pit
 *    (index 8 for player0, index 17 for player1) and cannot mirror the opponent's tuzduk.
 *  - Stones landing in a tuzduk pit go directly to the pit owner's kazan.
 *  - Game ends when one player cannot move, or a player reaches ≥82 stones.
 *  - Player with more stones wins; 81-81 is a draw.
 */

export const TOTAL_STONES = 162;
export const WIN_THRESHOLD = 82;

export type Player = 0 | 1;

export interface SowStep {
  pit: number;       // index 0-17 where a stone was placed (or tuzduk → kazan)
  toKazan: Player | -1; // -1 if placed in pit, otherwise the kazan index
}

export interface MoveResult {
  steps: SowStep[];
  captured: boolean;
  tuzdukCreated: boolean;
  ended: boolean;
  winner: Player | 'draw' | null;
}

export interface GameState {
  pits: number[];         // 18 values
  kazan: [number, number];
  tuzduk: [number, number]; // -1 if none
  current: Player;
  moveCount: number;
  gameOver: boolean;
  winner: Player | 'draw' | null;
}

export function ownerOf(idx: number): Player {
  return idx <= 8 ? 0 : 1;
}

export function nextIdx(idx: number): number {
  return (idx + 1) % 18;
}

export function createInitialState(): GameState {
  return {
    pits: new Array(18).fill(9),
    kazan: [0, 0],
    tuzduk: [-1, -1],
    current: 0,
    moveCount: 0,
    gameOver: false,
    winner: null,
  };
}

export function legalMoves(state: GameState, player: Player): number[] {
  const start = player === 0 ? 0 : 9;
  const end = player === 0 ? 8 : 17;
  const moves: number[] = [];
  for (let i = start; i <= end; i++) {
    if (state.pits[i] > 1) moves.push(i); // need at least 2 stones to sow (1 stays)
  }
  return moves;
}

export function applyMove(state: GameState, startIdx: number): { nextState: GameState; result: MoveResult } {
  // Deep copy
  const pits = state.pits.slice();
  const kazan: [number, number] = [state.kazan[0], state.kazan[1]];
  const tuzduk: [number, number] = [state.tuzduk[0], state.tuzduk[1]];
  const player = state.current;
  const opponent: Player = player === 0 ? 1 : 0;

  const stones = pits[startIdx];
  pits[startIdx] = 1; // one stone always stays in the source pit

  let pos = startIdx;
  const steps: SowStep[] = [];
  let captured = false;
  let tuzdukCreated = false;

  for (let s = 0; s < stones - 1; s++) {
    pos = nextIdx(pos);

    const isTuzduk0 = tuzduk[0] === pos;
    const isTuzduk1 = tuzduk[1] === pos;

    if (isTuzduk0) {
      kazan[0] += 1;
      steps.push({ pit: pos, toKazan: 0 });
    } else if (isTuzduk1) {
      kazan[1] += 1;
      steps.push({ pit: pos, toKazan: 1 });
    } else {
      pits[pos] += 1;
      steps.push({ pit: pos, toKazan: -1 });
    }
  }

  const lastPos = pos;
  const lastWasTuzduk = tuzduk[0] === lastPos || tuzduk[1] === lastPos;

  if (!lastWasTuzduk && ownerOf(lastPos) === opponent) {
    const count = pits[lastPos];

    // Capture: even count
    if (count > 0 && count % 2 === 0) {
      kazan[player] += count;
      pits[lastPos] = 0;
      captured = true;
    }
    // Tuzduk creation: exactly 3 stones, no existing tuzduk for this player
    else if (count === 3 && tuzduk[player] === -1 && state.moveCount > 0) {
      const forbidden = player === 0 ? 17 : 8;
      // Mirror check: cannot be the mirrored position of opponent's tuzduk
      const opponentTuzduk = tuzduk[opponent];
      const mirror = opponentTuzduk === -1
        ? -1
        : opponentTuzduk <= 8
          ? opponentTuzduk + 9
          : opponentTuzduk - 9;

      if (lastPos !== forbidden && lastPos !== mirror) {
        tuzduk[player] = lastPos;
        kazan[player] += 3;
        pits[lastPos] = 0;
        tuzdukCreated = true;
      }
    }
  }

  const moveCount = state.moveCount + 1;
  const nextPlayer = opponent;

  // Check end conditions
  let ended = false;
  let winner: Player | 'draw' | null = null;

  // Check if next player has no moves
  const tempNextMoves = legalMovesRaw(pits, nextPlayer);
  if (tempNextMoves.length === 0) {
    // Current player sweeps remaining stones
    const currentStart = player === 0 ? 0 : 9;
    const currentEnd = player === 0 ? 8 : 17;
    for (let i = currentStart; i <= currentEnd; i++) {
      kazan[player] += pits[i];
      pits[i] = 0;
    }
    // Also sweep nextPlayer's remaining
    const nextStart = nextPlayer === 0 ? 0 : 9;
    const nextEnd = nextPlayer === 0 ? 8 : 17;
    for (let i = nextStart; i <= nextEnd; i++) {
      if (ownerOf(i) === nextPlayer) {
        kazan[nextPlayer] += pits[i];
        pits[i] = 0;
      }
    }
    ended = true;
  }

  if (!ended && (kazan[player] >= WIN_THRESHOLD || kazan[opponent] >= WIN_THRESHOLD)) {
    ended = true;
  }

  if (!ended && kazan[0] + kazan[1] === TOTAL_STONES) {
    ended = true;
  }

  if (ended) {
    if (kazan[0] > kazan[1]) winner = 0;
    else if (kazan[1] > kazan[0]) winner = 1;
    else winner = 'draw';
  }

  const nextState: GameState = {
    pits,
    kazan,
    tuzduk,
    current: ended ? player : nextPlayer,
    moveCount,
    gameOver: ended,
    winner,
  };

  return {
    nextState,
    result: { steps, captured, tuzdukCreated, ended, winner },
  };
}

function legalMovesRaw(pits: number[], player: Player): number[] {
  const start = player === 0 ? 0 : 9;
  const end = player === 0 ? 8 : 17;
  const moves: number[] = [];
  for (let i = start; i <= end; i++) {
    if (pits[i] > 1) moves.push(i); // need at least 2 stones to sow (1 stays)
  }
  return moves;
}

/** Evaluate board from the perspective of a player (for AI) */
export function evaluate(state: GameState, player: Player): number {
  const opp: Player = player === 0 ? 1 : 0;
  let score = (state.kazan[player] - state.kazan[opp]) * 10;

  // Bonus for having a tuzduk
  if (state.tuzduk[player] !== -1) score += 25;
  if (state.tuzduk[opp] !== -1) score -= 25;

  // Bonus for more legal moves (mobility)
  score += legalMoves(state, player).length * 2;
  score -= legalMoves(state, opp).length * 2;

  // Bonus for pits that could make tuzduk
  if (state.tuzduk[player] === -1) {
    const oppStart = opp === 0 ? 0 : 9;
    const oppEnd = opp === 0 ? 8 : 17;
    for (let i = oppStart; i <= oppEnd; i++) {
      if (state.pits[i] === 2) score += 3; // one more stone away from tuzduk
    }
  }

  return score;
}
