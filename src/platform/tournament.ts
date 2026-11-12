/**
 * Tournament logic shared by every game: round-robin schedules, Swiss pairings and standings.
 * Pure functions over plain data, so the same code runs in the browser and in tests.
 *
 * In each pairing `a` moves first. `b === null` is a bye: `a` scores a win without playing.
 */
export type GameResult = 'a' | 'b' | 'draw';
export type Format = 'round-robin' | 'swiss';

export interface Pairing {
  a: string;
  b: string | null;
  result: GameResult | null;
}

export interface Round {
  pairings: Pairing[];
}

export interface Standing {
  id: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  /** Sum of the opponents' points. */
  buchholz: number;
  /** Sonneborn–Berger: points of beaten opponents plus half of drawn ones. */
  sonnebornBerger: number;
}

export const isBye = (pairing: Pairing) => pairing.b === null;

export function roundComplete(round: Round): boolean {
  return round.pairings.every(pairing => isBye(pairing) || pairing.result !== null);
}

/** Every player meets every other once (circle method); first moves alternate. */
export function roundRobin(ids: string[]): Round[] {
  const seats: (string | null)[] = ids.length % 2 === 0 ? ids.slice() : [...ids, null];
  const n = seats.length;
  const rounds: Round[] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairings: Pairing[] = [];
    for (let i = 0; i < n / 2; i++) {
      let a = seats[i];
      let b = seats[n - 1 - i];
      // Alternate who moves first, so nobody always starts.
      if ((i === 0 && r % 2 === 1) || (i > 0 && i % 2 === 1)) [a, b] = [b, a];
      if (a === null && b === null) continue;
      if (a === null) pairings.push({ a: b!, b: null, result: null });
      else pairings.push({ a, b, result: null });
    }
    rounds.push({ pairings });
    // Keep the first seat fixed and rotate the rest one step.
    seats.splice(1, 0, seats.pop()!);
  }
  return rounds;
}

/** A sensible number of Swiss rounds: enough to separate the leaders. */
export function suggestedSwissRounds(players: number): number {
  if (players < 2) return 0;
  return Math.min(players - 1, Math.ceil(Math.log2(players)) + (players > 8 ? 1 : 0));
}

export function standings(ids: string[], rounds: Round[]): Standing[] {
  const table = new Map<string, Standing>(
    ids.map(id => [id, { id, points: 0, played: 0, wins: 0, draws: 0, losses: 0, buchholz: 0, sonnebornBerger: 0 }]),
  );
  const games: { a: string; b: string; result: GameResult }[] = [];

  for (const round of rounds) {
    for (const pairing of round.pairings) {
      const a = table.get(pairing.a);
      if (!a) continue;
      if (pairing.b === null) {
        a.points += 1;
        continue;
      }
      const b = table.get(pairing.b);
      if (!b || pairing.result === null) continue;
      games.push({ a: pairing.a, b: pairing.b, result: pairing.result });
      a.played++;
      b.played++;
      if (pairing.result === 'draw') {
        a.points += 0.5;
        b.points += 0.5;
        a.draws++;
        b.draws++;
      } else {
        const [winner, loser] = pairing.result === 'a' ? [a, b] : [b, a];
        winner.points += 1;
        winner.wins++;
        loser.losses++;
      }
    }
  }

  for (const game of games) {
    const a = table.get(game.a)!;
    const b = table.get(game.b)!;
    a.buchholz += b.points;
    b.buchholz += a.points;
    if (game.result === 'draw') {
      a.sonnebornBerger += b.points / 2;
      b.sonnebornBerger += a.points / 2;
    } else if (game.result === 'a') {
      a.sonnebornBerger += b.points;
    } else {
      b.sonnebornBerger += a.points;
    }
  }

  const seed = new Map(ids.map((id, index) => [id, index]));
  return [...table.values()].sort((x, y) =>
    y.points - x.points ||
    y.buchholz - x.buchholz ||
    y.sonnebornBerger - x.sonnebornBerger ||
    y.wins - x.wins ||
    seed.get(x.id)! - seed.get(y.id)!,
  );
}

/**
 * Pairs the next Swiss round: players with equal scores meet, nobody meets the same opponent
 * twice while that can be avoided, and the bye goes to the lowest-ranked player without one.
 * `ids` is the seeding order (strongest first).
 */
export function swissRound(ids: string[], rounds: Round[]): Round {
  const ranking = standings(ids, rounds).map(entry => entry.id);
  const met = new Set<string>();
  const byes = new Set<string>();
  const firstMoves = new Map<string, number>(ids.map(id => [id, 0]));
  for (const round of rounds) {
    for (const { a, b } of round.pairings) {
      if (b === null) {
        byes.add(a);
        continue;
      }
      met.add(`${a}|${b}`);
      met.add(`${b}|${a}`);
      firstMoves.set(a, (firstMoves.get(a) ?? 0) + 1);
      firstMoves.set(b, (firstMoves.get(b) ?? 0) - 1);
    }
  }

  let pool = ranking.slice();
  const pairings: Pairing[] = [];
  if (pool.length % 2 === 1) {
    const byePlayer = [...pool].reverse().find(id => !byes.has(id)) ?? pool[pool.length - 1];
    pool = pool.filter(id => id !== byePlayer);
    pairings.push({ a: byePlayer, b: null, result: null });
  }

  const pairs = pairWithoutRematches(pool, met, { steps: 0 }) ?? pairInOrder(pool);
  for (const [x, y] of pairs) {
    // The player who has started fewer games moves first.
    const xFirst = (firstMoves.get(x) ?? 0) <= (firstMoves.get(y) ?? 0);
    pairings.unshift({ a: xFirst ? x : y, b: xFirst ? y : x, result: null });
  }
  // Top boards first, the bye last.
  const order = new Map(ranking.map((id, index) => [id, index]));
  const boardRank = (p: Pairing) => Math.min(order.get(p.a)!, p.b === null ? Infinity : order.get(p.b)!);
  pairings.sort((p, q) => (p.b === null ? 1 : 0) - (q.b === null ? 1 : 0) || boardRank(p) - boardRank(q));
  return { pairings };
}

const SEARCH_BUDGET = 200_000;

/**
 * Depth-first: pair the highest-ranked free player with the nearest-ranked opponent not met yet.
 * Gives up (null) when no such pairing exists or the search grows too large.
 */
function pairWithoutRematches(pool: string[], met: Set<string>, budget: { steps: number }): [string, string][] | null {
  if (pool.length === 0) return [];
  if (++budget.steps > SEARCH_BUDGET) return null;
  const [first, ...rest] = pool;
  for (let i = 0; i < rest.length; i++) {
    const opponent = rest[i];
    if (met.has(`${first}|${opponent}`)) continue;
    const remaining = rest.filter((_, j) => j !== i);
    const tail = pairWithoutRematches(remaining, met, budget);
    if (tail) return [[first, opponent], ...tail];
  }
  return null;
}

function pairInOrder(pool: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i + 1 < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]);
  return pairs;
}
