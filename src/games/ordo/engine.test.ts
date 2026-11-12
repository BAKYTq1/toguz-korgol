import { describe, expect, it } from 'vitest';
import {
  createInitialState, GUARDS, KHAN_POINTS, planThrow, PLANNERS, playThrow, SAKA_ID, Simulation, TURNS_PER_PLAYER,
  type Body, type OrdoState,
} from './engine';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** A test board; a khan is added out of the way unless the board has one (no khan = game over). */
function withBodies(bodies: Partial<Body>[], base = createInitialState()): OrdoState {
  const all = bodies.some(b => b.kind === 'khan') ? bodies : [...bodies, { kind: 'khan' as const, r: 0.045, m: 2.2, f: 3.6, x: 0.2, y: 0.6 }];
  return {
    ...base,
    bodies: all.map((b, i) => ({ id: i, kind: 'chuko', x: 0, y: 0, vx: 0, vy: 0, r: 0.035, m: 1, f: 2.6, angle: 0, out: false, ...b })),
  };
}

describe('ordo setup', () => {
  it('starts with the khan in the centre behind a closed ring of guards', () => {
    const state = createInitialState();
    expect(state.bodies.filter(b => b.kind === 'khan')).toHaveLength(1);
    expect(state.bodies.filter(b => b.kind === 'chuko')).toHaveLength(GUARDS);
    // Neighbouring guards are closer than the saka is wide, so the khan cannot be hit directly.
    const guards = state.bodies.filter(b => b.kind === 'chuko');
    const gap = Math.hypot(guards[0].x - guards[1].x, guards[0].y - guards[1].y) - 2 * guards[0].r;
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(0.1);
  });
});

describe('ordo physics', () => {
  it('is deterministic', () => {
    const shot = { position: 0.4, direction: 0.4 + Math.PI, power: 0.9 };
    const a = new Simulation(createInitialState(), shot).run().bodies;
    const b = new Simulation(createInitialState(), shot).run().bodies;
    expect(a).toEqual(b);
  });

  it('conserves momentum in a collision', () => {
    const state = withBodies([{ x: 0, y: 0 }]);
    const sim = new Simulation(state, { position: 0, direction: Math.PI, power: 0.5 });
    const saka = sim.bodies.find(b => b.id === SAKA_ID)!;
    const chuko = sim.bodies.find(b => b.kind === 'chuko')!;
    const momentum = () => [saka, chuko].reduce((p, b) => [p[0] + b.m * b.vx, p[1] + b.m * b.vy], [0, 0]);
    // Step to just before contact, then compare across it.
    for (let i = 0; i < 2000 && Math.hypot(saka.x - chuko.x, saka.y - chuko.y) > saka.r + chuko.r + 0.03; i++) sim.step();
    const before = momentum();
    for (let i = 0; i < 8; i++) sim.step();
    const after = momentum();
    const lost = Math.hypot(before[0] - after[0], before[1] - after[1]);
    // Only friction may take momentum away: at most total mass × deceleration × time.
    expect(lost).toBeLessThan((saka.m * saka.f + chuko.m * chuko.f) * (8 / 120) + 1e-9);
    expect(chuko.vx).toBeLessThan(0); // the chükö was sent on, away from the thrower
  });

  it('knocks a lone chükö near the line out with a straight throw', () => {
    const state = withBodies([{ x: -0.85, y: 0 }]);
    const result = playThrow(state, { position: 0, direction: Math.PI, power: 0.9 });
    expect(result.knocked).toEqual(['chuko']);
    expect(result.points).toBe(1);
    expect(result.again).toBe(true);
    expect(result.state.current).toBe(state.current);
  });

  it('ends the turn after the third throw even when it scores', () => {
    const state = { ...withBodies([{ x: -0.85, y: 0 }, { x: -0.85, y: 0.5 }]), throwsLeft: 1 };
    const result = playThrow(state, { position: 0, direction: Math.PI, power: 0.9 });
    expect(result.points).toBe(1);
    expect(result.again).toBe(false);
    expect(result.state.current).toBe(1);
    expect(result.state.throwsLeft).toBe(3);
  });

  it('passes the turn after a miss', () => {
    const state = withBodies([{ x: -0.85, y: 0 }]);
    const result = playThrow(state, { position: 0, direction: Math.PI + 1.2, power: 0.3 });
    expect(result.points).toBe(0);
    expect(result.state.current).toBe(1);
    expect(result.state.turnsLeft).toEqual([TURNS_PER_PLAYER - 1, TURNS_PER_PLAYER]);
  });

  it('ends the game when the khan is knocked out', () => {
    const state = withBodies([{ kind: 'khan', r: 0.045, m: 2.2, f: 3.6, x: -0.85, y: 0 }, { x: 0.2, y: 0.3 }]);
    const result = playThrow(state, { position: 0, direction: Math.PI, power: 1 });
    expect(result.knocked).toContain('khan');
    expect(result.points).toBeGreaterThanOrEqual(KHAN_POINTS);
    expect(result.state.outcome).toBe(0);
    expect(result.again).toBe(false);
  });

  it('ends after every player has used their turns', () => {
    let state = createInitialState();
    let throws = 0;
    while (state.outcome === null && throws < 200) {
      state = playThrow(state, { position: throws, direction: throws + Math.PI + 1.3, power: 0.2 }).state;
      throws++;
    }
    expect(state.outcome).toBe('draw');
    expect(throws).toBe(TURNS_PER_PLAYER * 2);
  });
});

describe('ordo computer', () => {
  it('a strong computer finds the knock-out on an easy board', () => {
    const state = withBodies([{ x: 0.5, y: 0.6 }, { x: 0, y: 0, kind: 'khan', r: 0.045, m: 2.2, f: 3.6 }, { x: 0.1, y: 0.13 }]);
    let hits = 0;
    for (let seed = 1; seed <= 5; seed++) {
      if (playThrow(state, planThrow(state, PLANNERS.hard, seeded(seed))).points > 0) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(4);
  });

  it('plays whole games to the end', () => {
    const random = seeded(42);
    let state = createInitialState();
    for (let i = 0; i < 200 && state.outcome === null; i++) {
      state = playThrow(state, planThrow(state, PLANNERS.easy, random)).state;
    }
    expect(state.outcome).not.toBeNull();
  });
});
