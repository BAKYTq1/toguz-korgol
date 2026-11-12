import { describe, expect, it } from 'vitest';
import { roundRobin, standings, suggestedSwissRounds, swissRound, type GameResult, type Round } from './tournament';

const players = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

function meetings(rounds: Round[]) {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const { a, b } of round.pairings) {
      if (b === null) continue;
      const key = [a, b].sort().join('|');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

describe('round robin', () => {
  for (const n of [2, 3, 4, 5, 8, 9]) {
    it(`pairs everyone exactly once with ${n} players`, () => {
      const ids = players(n);
      const rounds = roundRobin(ids);
      const counts = meetings(rounds);
      expect(counts.size).toBe((n * (n - 1)) / 2);
      expect([...counts.values()].every(c => c === 1)).toBe(true);
      for (const round of rounds) {
        const seen = round.pairings.flatMap(p => (p.b ? [p.a, p.b] : [p.a]));
        expect(new Set(seen).size).toBe(seen.length);
        expect(seen.length).toBe(n);
      }
    });
  }

  it('balances first moves', () => {
    const rounds = roundRobin(players(6));
    const firsts = new Map<string, number>();
    for (const round of rounds) for (const p of round.pairings) firsts.set(p.a, (firsts.get(p.a) ?? 0) + 1);
    for (const count of firsts.values()) expect(count).toBeGreaterThanOrEqual(2);
  });
});

describe('standings', () => {
  it('scores wins, draws and byes and breaks ties by Buchholz', () => {
    const rounds: Round[] = [
      { pairings: [{ a: 'p1', b: 'p2', result: 'a' }, { a: 'p3', b: 'p4', result: 'draw' }, { a: 'p5', b: null, result: null }] },
      { pairings: [{ a: 'p1', b: 'p3', result: 'b' }, { a: 'p2', b: 'p5', result: 'a' }, { a: 'p4', b: null, result: null }] },
    ];
    const table = standings(players(5), rounds);
    const byId = Object.fromEntries(table.map(s => [s.id, s]));
    expect(byId.p3.points).toBe(1.5);
    expect(byId.p4.points).toBe(1.5);
    expect(byId.p1.points).toBe(1);
    expect(byId.p5.points).toBe(1);
    // p3 met p4 (1.5) and p1 (1) → 2.5; p4 met only p3 (1.5).
    expect(byId.p3.buchholz).toBe(2.5);
    expect(table[0].id).toBe('p3');
  });

  it('ignores games without a result yet', () => {
    const table = standings(['x', 'y'], [{ pairings: [{ a: 'x', b: 'y', result: null }] }]);
    expect(table.every(s => s.points === 0 && s.played === 0)).toBe(true);
  });
});

describe('swiss', () => {
  function simulate(n: number, roundsToPlay: number, seed = 7) {
    const ids = players(n);
    const rounds: Round[] = [];
    let s = seed;
    const random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < roundsToPlay; r++) {
      const round = swissRound(ids, rounds);
      for (const p of round.pairings) {
        if (p.b === null) continue;
        const roll = random();
        p.result = (roll < 0.45 ? 'a' : roll < 0.9 ? 'b' : 'draw') as GameResult;
      }
      rounds.push(round);
    }
    return { ids, rounds };
  }

  for (const n of [4, 7, 10, 16, 33]) {
    it(`avoids rematches and repeated byes with ${n} players`, () => {
      const { ids, rounds } = simulate(n, suggestedSwissRounds(n));
      expect([...meetings(rounds).values()].every(c => c === 1)).toBe(true);
      const byes = rounds.flatMap(r => r.pairings.filter(p => p.b === null).map(p => p.a));
      expect(new Set(byes).size).toBe(byes.length);
      for (const round of rounds) {
        const seen = round.pairings.flatMap(p => (p.b ? [p.a, p.b] : [p.a]));
        expect(seen.sort()).toEqual([...ids].sort());
      }
    });
  }

  it('pairs leaders with each other', () => {
    const ids = players(4);
    const first: Round = { pairings: [{ a: 'p1', b: 'p2', result: 'a' }, { a: 'p3', b: 'p4', result: 'a' }] };
    const second = swissRound(ids, [first]);
    const top = second.pairings[0];
    expect([top.a, top.b].sort()).toEqual(['p1', 'p3']);
  });

  it('still produces a full round when rematches cannot be avoided', () => {
    const { rounds } = simulate(4, 5);
    expect(rounds[4].pairings).toHaveLength(2);
  });
});
