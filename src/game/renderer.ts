/**
 * Canvas 2D renderer for Toguz Korgool.
 * Pure functions — no React, no state. Called from the Canvas component.
 */

import { GameState, ownerOf } from './engine';

export const BASE_W = 1120;
export const BASE_H = 460;
export const KAZAN_W = 108;
export const PANEL_W = BASE_W - KAZAN_W * 2;
export const PANEL_H = 196;
export const HINGE_GAP = 16;
export const PIT_W = 62;
export const PIT_H = 158;
export const PIT_MARGIN_X = 46;
export const PIT_SPACING = (PANEL_W - PIT_MARGIN_X * 2 - PIT_W) / 8;
export const BEAD_R = 12.5;

export interface RenderLayout {
  scale: number;
  offX: number;
  offY: number;
}

export function computeLayout(
  windowW: number,
  windowH: number,
  availTop: number,
  availBottom: number,
): RenderLayout {
  const availW = windowW * 0.95;
  const availH = windowH - availTop - availBottom;
  const scale = Math.min(availW / BASE_W, availH / BASE_H) * 0.96;
  const offX = (windowW - BASE_W * scale) / 2;
  const offY = availTop + (availH - BASE_H * scale) / 2;
  return { scale, offX, offY };
}

export function pitCenter(idx: number): { x: number; y: number } {
  const player = ownerOf(idx);
  const iInRow = player === 0 ? idx : idx - 9;
  // Counter-clockwise sowing direction:
  //   Player 1 (bottom row): idx 9 = leftmost, idx 17 = rightmost  → colFromLeft = iInRow
  //   Player 0 (top row):    idx 0 = rightmost, idx 8 = leftmost   → colFromLeft = 8 - iInRow
  // This way the sow sequence 9→10→…→17→0→1→…→8 moves:
  //   left-to-right along bottom, then right-to-left along top = counter-clockwise.
  const colFromLeft = player === 0 ? 8 - iInRow : iInRow;
  const x = KAZAN_W + PIT_MARGIN_X + PIT_W / 2 + colFromLeft * PIT_SPACING;
  const y = player === 0 ? PANEL_H / 2 : PANEL_H + HINGE_GAP + PANEL_H / 2;
  return { x, y };
}

export function kazanCenter(player: 0 | 1): { x: number; y: number } {
  return player === 0
    ? { x: BASE_W - KAZAN_W / 2, y: BASE_H / 2 }
    : { x: KAZAN_W / 2, y: BASE_H / 2 };
}

export function toScreen(p: { x: number; y: number }, layout: RenderLayout) {
  return { x: p.x * layout.scale + layout.offX, y: p.y * layout.scale + layout.offY };
}

export function toLogical(sx: number, sy: number, layout: RenderLayout) {
  return { x: (sx - layout.offX) / layout.scale, y: (sy - layout.offY) / layout.scale };
}

export function pitAt(lx: number, ly: number): number {
  for (let idx = 0; idx < 18; idx++) {
    const p = pitCenter(idx);
    if (Math.abs(lx - p.x) < PIT_W / 2 + 14 && Math.abs(ly - p.y) < PIT_H / 2 + 14) return idx;
  }
  return -1;
}

// ─── Grain (wood texture dots) ────────────────────────────────────────────────
interface GrainDot { x: number; y: number; r: number; a: number }
let grainCache: GrainDot[] | null = null;

function getGrain(): GrainDot[] {
  if (!grainCache) {
    grainCache = [];
    for (let i = 0; i < 160; i++) {
      grainCache.push({
        x: KAZAN_W + Math.random() * PANEL_W,
        y: Math.random() * (PANEL_H * 2 + HINGE_GAP),
        r: 0.6 + Math.random() * 1.4,
        a: 0.03 + Math.random() * 0.05,
      });
    }
  }
  return grainCache;
}

// ─── Shape helpers ─────────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function capsule(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - h / 2 + r);
  ctx.arcTo(cx - r, cy - h / 2, cx, cy - h / 2, r);
  ctx.arcTo(cx + r, cy - h / 2, cx + r, cy - h / 2 + r, r);
  ctx.lineTo(cx + r, cy + h / 2 - r);
  ctx.arcTo(cx + r, cy + h / 2, cx, cy + h / 2, r);
  ctx.arcTo(cx - r, cy + h / 2, cx - r, cy + h / 2 - r, r);
  ctx.closePath();
}

// ─── Board panels ──────────────────────────────────────────────────────────────
export function drawPanels(ctx: CanvasRenderingContext2D) {
  // Top panel (dark)
  let g: CanvasGradient = ctx.createLinearGradient(0, 0, 0, PANEL_H);
  g.addColorStop(0, '#2a251c');
  g.addColorStop(0.5, '#171310');
  g.addColorStop(1, '#0c0a08');
  roundRect(ctx, KAZAN_W, 0, PANEL_W, PANEL_H, 20);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.stroke();

  // Bottom panel (cream)
  const y2 = PANEL_H + HINGE_GAP;
  g = ctx.createLinearGradient(0, y2, 0, y2 + PANEL_H);
  g.addColorStop(0, '#f2ecd8');
  g.addColorStop(0.55, '#e1dabf');
  g.addColorStop(1, '#cbc3a4');
  roundRect(ctx, KAZAN_W, y2, PANEL_W, PANEL_H, 20);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.stroke();

  // Hinge
  g = ctx.createLinearGradient(0, PANEL_H, 0, PANEL_H + HINGE_GAP);
  g.addColorStop(0, '#5c5c5c');
  g.addColorStop(0.5, '#a8a8a8');
  g.addColorStop(1, '#5c5c5c');
  roundRect(ctx, KAZAN_W + 20, PANEL_H, PANEL_W - 40, HINGE_GAP, 6);
  ctx.fillStyle = g;
  ctx.fill();
  [KAZAN_W + 70, BASE_W - KAZAN_W - 70].forEach(px => {
    ctx.beginPath();
    ctx.arc(px, PANEL_H + HINGE_GAP / 2, 8, 0, Math.PI * 2);
    const rg = ctx.createRadialGradient(px - 3, PANEL_H + HINGE_GAP / 2 - 3, 1, px, PANEL_H + HINGE_GAP / 2, 9);
    rg.addColorStop(0, '#e8e8e8');
    rg.addColorStop(1, '#7a7a7a');
    ctx.fillStyle = rg;
    ctx.fill();
  });

  // Kazans (left + right)
  ([0, 1] as const).forEach(player => {
    const k = kazanCenter(player);
    const dark = player === 0;
    roundRect(ctx, k.x - KAZAN_W / 2 + 8, 10, KAZAN_W - 16, BASE_H - 20, 22);
    const kg = ctx.createLinearGradient(0, 0, 0, BASE_H);
    if (dark) { kg.addColorStop(0, '#221e17'); kg.addColorStop(1, '#0c0a08'); }
    else { kg.addColorStop(0, '#efe9d6'); kg.addColorStop(1, '#d2cab0'); }
    ctx.fillStyle = kg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    ctx.stroke();

    capsule(ctx, k.x, k.y, KAZAN_W - 40, BASE_H - 70);
    ctx.fillStyle = dark ? '#050403' : '#c7bd9c';
    ctx.fill();
  });
}

export function drawGrain(ctx: CanvasRenderingContext2D) {
  getGrain().forEach(g => {
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    const onBlack = g.y < PANEL_H;
    ctx.fillStyle = onBlack
      ? `rgba(255,255,255,${g.a})`
      : `rgba(0,0,0,${g.a * 1.4})`;
    ctx.fill();
  });
}

// ─── Pit well ──────────────────────────────────────────────────────────────────
export function drawPitWell(
  ctx: CanvasRenderingContext2D,
  idx: number,
  options: {
    lifted?: boolean;
    isTuzduk?: boolean;
    invalidFlash?: number; // 0-1 alpha
    perfNow?: number;
  } = {},
) {
  const p = pitCenter(idx);
  const dark = ownerOf(idx) === 0;
  const { lifted = false, isTuzduk = false, invalidFlash = 0, perfNow = 0 } = options;

  ctx.save();
  if (lifted) {
    ctx.translate(p.x, p.y);
    ctx.scale(1.07, 1.07);
    ctx.translate(-p.x, -p.y);
  }

  capsule(ctx, p.x, p.y, PIT_W, PIT_H);
  const g = ctx.createLinearGradient(p.x, p.y - PIT_H / 2, p.x, p.y + PIT_H / 2);
  if (dark) {
    g.addColorStop(0, '#020201');
    g.addColorStop(0.5, '#0c0906');
    g.addColorStop(1, '#020201');
  } else {
    g.addColorStop(0, '#9c9273');
    g.addColorStop(0.5, '#b3a884');
    g.addColorStop(1, '#9c9273');
  }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)';
  ctx.stroke();

  capsule(ctx, p.x, p.y, PIT_W, PIT_H);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(87,194,184,0.14)';
  ctx.stroke();

  if (lifted) {
    capsule(ctx, p.x, p.y, PIT_W, PIT_H);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(77,182,173,0.85)';
    ctx.stroke();
  }

  if (isTuzduk) {
    const pulse = 0.5 + Math.sin(perfNow / 280) * 0.25;
    capsule(ctx, p.x, p.y, PIT_W + 10, PIT_H + 10);
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(212,175,55,${0.55 + pulse * 0.3})`;
    ctx.stroke();
  }

  if (invalidFlash > 0) {
    capsule(ctx, p.x, p.y, PIT_W, PIT_H);
    ctx.fillStyle = `rgba(181,41,47,${invalidFlash * 0.55})`;
    ctx.fill();
  }

  ctx.restore();
}

// ─── Bead ──────────────────────────────────────────────────────────────────────
export function drawBead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  const hues = ['#2f8f89', '#3aa39c', '#256f6a'];
  const c = hues[seed % 3];

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.75, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  ctx.restore();

  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
  g.addColorStop(0, '#8fdbd3');
  g.addColorStop(0.35, c);
  g.addColorStop(1, '#123c39');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
}

function beadLayout(count: number): { dx: number; dy: number }[] {
  const cap = Math.min(count, 14);
  const cols = cap <= 7 ? 1 : 2;
  const perCol = Math.ceil(cap / cols);
  const positions: { dx: number; dy: number }[] = [];
  for (let i = 0; i < cap; i++) {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const colOffset = cols === 1 ? 0 : col === 0 ? -15 : 15;
    const spanH = PIT_H - 30;
    const t = perCol <= 1 ? 0.5 : row / (perCol - 1);
    const y = -spanH / 2 + t * spanH;
    positions.push({ dx: colOffset + (row % 2 === 0 ? -3 : 3), dy: y });
  }
  return positions;
}

export function drawPitStones(
  ctx: CanvasRenderingContext2D,
  idx: number,
  count: number,
  lifted = false,
) {
  if (count <= 0) return;
  const p = pitCenter(idx);
  ctx.save();
  if (lifted) {
    ctx.translate(p.x, p.y);
    ctx.scale(1.07, 1.07);
    ctx.translate(-p.x, -p.y);
  }
  beadLayout(count).forEach((o, i) => drawBead(ctx, p.x + o.dx, p.y + o.dy, BEAD_R, idx + i));
  ctx.restore();
}

export function drawKazanStones(ctx: CanvasRenderingContext2D, player: 0 | 1, count: number) {
  if (count <= 0) return;
  const k = kazanCenter(player);
  // Kazan capsule inner area: width ≈ KAZAN_W-40, height ≈ BASE_H-70
  const innerW = KAZAN_W - 44;
  const innerH = BASE_H - 76;
  const r = BEAD_R * 0.88;
  // Grid packing inside the capsule
  const cols = Math.floor(innerW / (r * 2 + 2));
  const rows = Math.floor(innerH / (r * 2 + 2));
  const maxShow = cols * rows;
  const show = Math.min(count, maxShow);
  const startX = k.x - (cols - 1) * (r * 2 + 2) / 2;
  const startY = k.y - (rows - 1) * (r * 2 + 2) / 2;
  for (let i = 0; i < show; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (r * 2 + 2);
    const y = startY + row * (r * 2 + 2);
    drawBead(ctx, x, y, r, i);
  }
}

export function drawLabel(ctx: CanvasRenderingContext2D, idx: number, count: number) {
  const empty = count <= 0;
  const p = pitCenter(idx);
  const ly = p.y - PIT_H / 2 - 16;
  ctx.font = '800 15px Manrope, system-ui, sans-serif';
  const txt = String(count);
  const tw = ctx.measureText(txt).width;
  roundRect(ctx, p.x - tw / 2 - 7, ly - 11, tw + 14, 22, 11);
  ctx.fillStyle = empty ? 'rgba(10,8,6,0.45)' : 'rgba(10,8,6,0.8)';
  ctx.fill();
  ctx.strokeStyle = empty ? 'rgba(87,194,184,0.25)' : 'rgba(87,194,184,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = empty ? 'rgba(255,248,232,0.45)' : '#fff8e8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, p.x, ly + 1);
}

// ─── Flying beads ──────────────────────────────────────────────────────────────
export interface FlyingBead {
  id: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  t0: number;
  dur: number;
  done: boolean;
  onArrive: () => void;
}

let flyId = 0;
export function createFlyingBead(
  from: { x: number; y: number },
  to: { x: number; y: number },
  dur: number,
  onArrive: () => void,
): FlyingBead {
  return { id: flyId++, from, to, t0: 0, dur, done: false, onArrive };
}

export function drawFlyingBead(ctx: CanvasRenderingContext2D, f: FlyingBead, now: number) {
  const t = Math.min(1, (now - f.t0) / f.dur);
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const mx = f.from.x + (f.to.x - f.from.x) * ease;
  const my = f.from.y + (f.to.y - f.from.y) * ease;
  const arc = Math.sin(t * Math.PI) * 38;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(mx, my, BEAD_R * 0.7, BEAD_R * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${0.22 * (1 - Math.abs(0.5 - t) * 0.6)})`;
  ctx.fill();
  ctx.restore();

  const landSquash = t > 0.92 ? 1 - (t - 0.92) * 1.5 : 1;
  ctx.save();
  ctx.translate(mx, my - arc);
  ctx.scale(1, landSquash);
  drawBead(ctx, 0, 0, BEAD_R * 1.08, 1);
  ctx.restore();
}

export function drawDragBeads(
  ctx: CanvasRenderingContext2D,
  dragPt: { x: number; y: number },
  count: number,
  perfNow: number,
) {
  const n = Math.min(count, 6);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + perfNow / 500;
    drawBead(ctx, dragPt.x + Math.cos(a) * 13, dragPt.y + Math.sin(a) * 13 - 6, BEAD_R, i);
  }
}

// Full scene render — called every rAF
export function renderScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  visualPits: number[],
  visualKazan: [number, number],
  flying: FlyingBead[],
  now: number,
  options: {
    dragIdx?: number;
    dragPt?: { x: number; y: number } | null;
    dragCount?: number;
    invalidFlashes?: Record<number, number>;
  } = {},
) {
  const { dragIdx = -1, dragPt = null, dragCount = 0, invalidFlashes = {} } = options;

  drawPanels(ctx);
  drawGrain(ctx);
  drawKazanStones(ctx, 0, visualKazan[0]);
  drawKazanStones(ctx, 1, visualKazan[1]);

  for (let idx = 0; idx < 18; idx++) {
    const flashStart = invalidFlashes[idx];
    const flashAlpha = flashStart ? Math.max(0, 1 - (now - flashStart) / 260) : 0;
    drawPitWell(ctx, idx, {
      lifted: idx === dragIdx,
      isTuzduk: state.tuzduk[0] === idx || state.tuzduk[1] === idx,
      invalidFlash: flashAlpha,
      perfNow: now,
    });
  }

  for (let idx = 0; idx < 18; idx++) {
    if (idx === dragIdx) continue;
    const count = visualPits[idx];
    drawPitStones(ctx, idx, count);
    drawLabel(ctx, idx, count);
  }

  flying.forEach(f => drawFlyingBead(ctx, f, now));

  if (dragIdx >= 0 && dragPt) {
    drawDragBeads(ctx, dragPt, dragCount, now);
  }
}
