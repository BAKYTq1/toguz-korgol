/**
 * Board geometry for a portrait phone screen, in screen points.
 *
 * The two rows of the board stand as two columns side by side, with the kazans above and below,
 * so that the pits use the full width of the screen. Sowing still runs counter-clockwise:
 * the left column goes top → bottom, the right column bottom → top.
 */
import { ownerOf } from '../shared';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardLayout {
  width: number;
  height: number;
  /** Panel behind each player's column, indexed by player. */
  panels: [Rect, Rect];
  /** Kazan of each player, indexed by player. */
  kazans: [Rect, Rect];
  hinge: Rect;
  /** Pit ovals, indexed by pit. */
  pits: Rect[];
  /** Tap areas: the whole slot of each pit, label included. */
  hits: Rect[];
  /** Centre of each stone counter. */
  labels: Point[];
  beadR: number;
  kazanBeadR: number;
  labelFont: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function computeLayout(width: number, height: number, flipped: boolean): BoardLayout {
  // Very wide areas (tablets) keep a board shape instead of stretching the pits.
  const w = Math.min(width, height * 0.95);
  const ox = (width - w) / 2;
  const kazanH = clamp(height * 0.085, 30, 52);
  const gap = 6;
  const panelTop = kazanH + gap;
  const panelH = Math.max(0, height - 2 * (kazanH + gap));
  const hingeW = 6;
  const colW = (w - hingeW) / 2;
  const slot = panelH / 9;
  const pitH = slot * 0.74;
  const labelW = clamp(colW * 0.18, 26, 36);
  const pitW = Math.max(0, colW - labelW - 10);

  const leftPlayer = flipped ? 0 : 1;
  const columnX = (player: number) => (player === leftPlayer ? ox : ox + colW + hingeW);

  const pits: Rect[] = [];
  const hits: Rect[] = [];
  const labels: Point[] = [];
  for (let idx = 0; idx < 18; idx++) {
    const player = ownerOf(idx);
    const i = player === 0 ? idx : idx - 9;
    const left = player === leftPlayer;
    const row = left ? i : 8 - i;
    const colX = columnX(player);
    const slotY = panelTop + row * slot;
    // Counters sit on the outer edge of each column.
    const pitX = left ? colX + labelW + 4 : colX + 6;
    pits.push({ x: pitX, y: slotY + (slot - pitH) / 2, w: pitW, h: pitH });
    hits.push({ x: colX, y: slotY, w: colW, h: slot });
    labels.push({ x: left ? colX + labelW / 2 + 2 : colX + colW - labelW / 2 - 2, y: slotY + slot / 2 });
  }

  const panel = (player: number): Rect => ({ x: columnX(player), y: panelTop - 3, w: colW, h: panelH + 6 });
  const kazan = (player: number): Rect => ({ x: ox, y: player === leftPlayer ? 0 : height - kazanH, w, h: kazanH });

  return {
    width,
    height,
    panels: [panel(0), panel(1)],
    kazans: [kazan(0), kazan(1)],
    hinge: { x: ox + colW + 1, y: panelTop + 10, w: hingeW - 2, h: Math.max(0, panelH - 20) },
    pits,
    hits,
    labels,
    beadR: clamp(Math.min((pitH - 6) / 4, pitW / 17), 2, 9),
    kazanBeadR: clamp((kazanH - 16) / 5.2, 2, 5.5),
    labelFont: clamp(slot * 0.34, 10, 14),
  };
}

/** Positions of up to 14 visible stones inside a pit, relative to its centre: one or two rows. */
export function beadLayout(count: number, pit: Rect, r: number): Point[] {
  const cap = Math.min(count, 14);
  const rows = cap <= 7 ? 1 : 2;
  const perRow = Math.ceil(cap / rows);
  const step = perRow <= 1 ? 0 : Math.min(r * 2 + 2, (pit.w - r * 2 - pit.h * 0.5) / (perRow - 1));
  const out: Point[] = [];
  for (let i = 0; i < cap; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, cap - row * perRow);
    const rowY = rows === 1 ? 0 : row === 0 ? -(r + 1) : r + 1;
    out.push({ x: (col - (inRow - 1) / 2) * step, y: rowY });
  }
  return out;
}

/** Grid of stones inside a kazan (as many as fit; the score card shows the exact number). */
export function kazanLayout(k: Rect, count: number, r: number): Point[] {
  const step = r * 2 + 1.5;
  const cols = Math.max(0, Math.floor((k.w - 28) / step));
  const rows = Math.max(0, Math.floor((k.h - 12) / step));
  const show = Math.min(count, cols * rows);
  if (show === 0) return [];
  const usedRows = Math.ceil(show / cols);
  const startX = k.x + k.w / 2 - ((Math.min(show, cols) - 1) * step) / 2;
  const startY = k.y + k.h / 2 - ((usedRows - 1) * step) / 2;
  const out: Point[] = [];
  for (let i = 0; i < show; i++) {
    out.push({ x: startX + (i % cols) * step, y: startY + Math.floor(i / cols) * step });
  }
  return out;
}

const inside = (p: Point, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Pit under a point of the board view, or -1. */
export function pitAt(p: Point, l: BoardLayout): number {
  return l.hits.findIndex(r => inside(p, r));
}
