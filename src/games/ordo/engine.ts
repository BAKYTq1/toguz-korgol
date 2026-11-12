/**
 * Ordo — a two-player screen adaptation of the Kyrgyz knucklebone game.
 *
 * The circle is the state's territory and the khan sits in its centre, guarded by a ring of
 * chükö (knucklebones). Players stand on the circle line and throw the heavy saka to knock the
 * guards out of the circle. Each chükö knocked out is a point; knocking out the khan is worth
 * KHAN_POINTS and ends the game. A throw that knocks something out earns another throw, up to
 * THROWS_PER_TURN in one turn (as in the traditional three strikes).
 * After TURNS_PER_PLAYER turns each, the higher score wins.
 *
 * Units: the circle has radius 1. Physics is a fixed-step simulation, so a throw always plays out
 * the same way — the computer plans with the same code that animates the board.
 */
import type { Outcome, Seat } from '../../platform/game';

export const KHAN_POINTS = 5;
export const TURNS_PER_PLAYER = 10;
export const GUARDS = 10;
export const THROWS_PER_TURN = 3;

export const DT = 1 / 120;
const RESTITUTION = 0.86;
const STOP_SPEED = 0.01;
const MAX_STEPS = 1800;
export const MAX_SPEED = 3.4;

export type Kind = 'chuko' | 'khan' | 'saka';

export interface Body {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
  f: number;
  /** Drawing angle for the bone's long axis. */
  angle: number;
  out: boolean;
}

export interface Throw {
  /** Where on the circle line the thrower stands (radians). */
  position: number;
  /** Throw direction (radians). */
  direction: number;
  /** 0..1 share of the maximum speed. */
  power: number;
}

export interface OrdoState {
  bodies: Body[];
  scores: [number, number];
  turnsLeft: [number, number];
  /** Throws still allowed in the current turn. */
  throwsLeft: number;
  current: Seat;
  outcome: Outcome | null;
}

export interface ThrowResult {
  state: OrdoState;
  knocked: Kind[];
  points: number;
  again: boolean;
}

/** Size, mass and sliding friction (deceleration, radius units per second²) of each piece. */
const SIZES: Record<Kind, { r: number; m: number; f: number }> = {
  chuko: { r: 0.035, m: 1, f: 3.8 },
  khan: { r: 0.045, m: 2.2, f: 5.5 },
  saka: { r: 0.05, m: 2.6, f: 1.4 },
};

export const SAKA_ID = -1;

function makeBody(id: number, kind: Kind, x: number, y: number, angle = 0): Body {
  return { id, kind, x, y, vx: 0, vy: 0, angle, out: false, ...SIZES[kind] };
}

export function createInitialState(starter: Seat = 0): OrdoState {
  const bodies: Body[] = [makeBody(0, 'khan', 0, 0)];
  const ring = 0.13;
  for (let i = 0; i < GUARDS; i++) {
    const a = (i / GUARDS) * Math.PI * 2 + Math.PI / GUARDS;
    bodies.push(makeBody(i + 1, 'chuko', Math.cos(a) * ring, Math.sin(a) * ring, a + Math.PI / 2));
  }
  return { bodies, scores: [0, 0], turnsLeft: [TURNS_PER_PLAYER, TURNS_PER_PLAYER], throwsLeft: THROWS_PER_TURN, current: starter, outcome: null };
}

/** Where the saka rests before a throw from `position`: just outside the line. */
export function sakaStart(position: number) {
  const d = 1 + SIZES.saka.r;
  return { x: Math.cos(position) * d, y: Math.sin(position) * d };
}

/** Keeps the throw pointing into the circle (within 80° of the centre). */
export function clampDirection(position: number, direction: number) {
  const inward = position + Math.PI;
  let delta = Math.atan2(Math.sin(direction - inward), Math.cos(direction - inward));
  const limit = (80 * Math.PI) / 180;
  delta = Math.max(-limit, Math.min(limit, delta));
  return inward + delta;
}

/** A running throw: call step() until done. Used both for animation and for planning. */
export class Simulation {
  bodies: Body[];
  steps = 0;

  constructor(state: OrdoState, shot: Throw) {
    this.bodies = state.bodies.filter(b => !b.out).map(b => ({ ...b }));
    const start = sakaStart(shot.position);
    const direction = clampDirection(shot.position, shot.direction);
    const speed = Math.max(0.05, Math.min(1, shot.power)) * MAX_SPEED;
    const saka = makeBody(SAKA_ID, 'saka', start.x, start.y, direction);
    saka.vx = Math.cos(direction) * speed;
    saka.vy = Math.sin(direction) * speed;
    this.bodies.push(saka);
  }

  get done() {
    return this.steps >= MAX_STEPS || this.bodies.every(b => b.vx === 0 && b.vy === 0);
  }

  step() {
    const bodies = this.bodies;
    for (const b of bodies) {
      const speed = Math.hypot(b.vx, b.vy);
      if (speed === 0) continue;
      const slowed = speed - b.f * DT;
      if (slowed <= STOP_SPEED) {
        b.vx = 0;
        b.vy = 0;
        continue;
      }
      b.vx *= slowed / speed;
      b.vy *= slowed / speed;
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      if (b.kind === 'chuko') b.angle += speed * DT * 3;
    }
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j]);
    }
    for (const b of bodies) {
      if (!b.out && Math.hypot(b.x, b.y) > 1 + b.r) b.out = true;
    }
    this.steps++;
  }

  run() {
    while (!this.done) this.step();
    return this;
  }
}

function collide(a: Body, b: Body) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const overlap = a.r + b.r - dist;
  if (overlap <= 0 || dist === 0) return;
  const nx = dx / dist;
  const ny = dy / dist;
  const inv = 1 / a.m + 1 / b.m;
  // Push apart in proportion to the inverse masses.
  a.x -= nx * overlap * (1 / a.m) / inv;
  a.y -= ny * overlap * (1 / a.m) / inv;
  b.x += nx * overlap * (1 / b.m) / inv;
  b.y += ny * overlap * (1 / b.m) / inv;
  const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (approach <= 0) return;
  const impulse = ((1 + RESTITUTION) * approach) / inv;
  a.vx -= (impulse / a.m) * nx;
  a.vy -= (impulse / a.m) * ny;
  b.vx += (impulse / b.m) * nx;
  b.vy += (impulse / b.m) * ny;
}

/** Applies a finished simulation to the game: scoring, extra throws, turns and the end. */
export function settle(state: OrdoState, sim: Simulation): ThrowResult {
  const seat = state.current;
  const knocked = sim.bodies.filter(b => b.out && b.id !== SAKA_ID).map(b => b.kind);
  const points = knocked.reduce((sum, kind) => sum + (kind === 'khan' ? KHAN_POINTS : 1), 0);
  const scores: [number, number] = [state.scores[0], state.scores[1]];
  scores[seat] += points;
  // The saka is picked up after every throw; knocked-out pieces leave the game.
  const bodies = sim.bodies
    .filter(b => b.id !== SAKA_ID && !b.out)
    .map(b => ({ ...b, vx: 0, vy: 0 }));

  const turnsLeft: [number, number] = [state.turnsLeft[0], state.turnsLeft[1]];
  const khanOut = !bodies.some(b => b.kind === 'khan');
  const again = points > 0 && !khanOut && state.throwsLeft > 1;
  let current = seat;
  if (!again) {
    turnsLeft[seat]--;
    current = seat === 0 ? 1 : 0;
  }
  const finished = khanOut || (turnsLeft[0] <= 0 && turnsLeft[1] <= 0) || (!again && turnsLeft[current] <= 0);
  const outcome: Outcome | null = finished ? (scores[0] === scores[1] ? 'draw' : scores[0] > scores[1] ? 0 : 1) : null;
  return {
    state: {
      bodies,
      scores,
      turnsLeft,
      throwsLeft: again ? state.throwsLeft - 1 : THROWS_PER_TURN,
      current: finished ? seat : current,
      outcome,
    },
    knocked,
    points,
    again: again && !finished,
  };
}

export function playThrow(state: OrdoState, shot: Throw): ThrowResult {
  return settle(state, new Simulation(state, shot).run());
}

/** Value of a throw for planning: points, with the khan's guards worth a little extra once thin. */
function throwValue(state: OrdoState, shot: Throw): number {
  const result = playThrow(state, shot);
  return result.points + (result.again ? 0.3 : 0);
}

export interface Planner {
  candidates: number;
  /** Execution error in radians (standard deviation of the aim) and in power. */
  aimError: number;
  powerError: number;
}

export const PLANNERS: Record<'easy' | 'medium' | 'hard', Planner> = {
  easy: { candidates: 25, aimError: 0.07, powerError: 0.2 },
  medium: { candidates: 120, aimError: 0.028, powerError: 0.08 },
  hard: { candidates: 320, aimError: 0.014, powerError: 0.04 },
};

function gaussian(random: () => number) {
  const u = Math.max(1e-9, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/**
 * The computer tries throws aimed at the pieces still in the circle, keeps the best one, and
 * then throws it with a hand that is as steady as its level allows.
 */
export function planThrow(state: OrdoState, planner: Planner, random = Math.random): Throw {
  const targets = state.bodies.filter(b => !b.out);
  let best: Throw | null = null;
  let bestValue = -Infinity;
  for (let i = 0; i < planner.candidates; i++) {
    const target = targets[Math.floor(random() * targets.length)];
    const position = random() * Math.PI * 2;
    const start = sakaStart(position);
    // Aim at the target, sometimes slightly off-centre for a cut.
    const offset = (random() - 0.5) * target.r * 2.6;
    const toward = Math.atan2(target.y - start.y, target.x - start.x);
    const direction = toward + Math.atan2(offset, Math.hypot(target.x - start.x, target.y - start.y));
    const power = 0.55 + random() * 0.45;
    const shot = { position, direction: clampDirection(position, direction), power };
    const value = throwValue(state, shot) + random() * 0.01;
    if (value > bestValue) {
      bestValue = value;
      best = shot;
    }
  }
  const chosen = best ?? { position: 0, direction: Math.PI, power: 0.8 };
  return {
    position: chosen.position,
    direction: clampDirection(chosen.position, chosen.direction + gaussian(random) * planner.aimError),
    power: Math.max(0.1, Math.min(1, chosen.power + gaussian(random) * planner.powerError)),
  };
}
