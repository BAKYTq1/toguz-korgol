import { createContext, useContext, useId } from 'react';
import type { GameId } from '../catalog';

/** Prefix for this drawing's gradient ids (ids must be unique per SVG; see GameArt). */
const Ids = createContext('');

/** Returns a function giving `url(#…)` for one of this drawing's gradients. */
function usePaint() {
  const prefix = useContext(Ids);
  return (name: string) => `url(#${prefix}-${name})`;
}

/**
 * Catalogue previews, drawn in the materials of the games themselves: the dark and cream board
 * halves with teal korgools for the sowing games, the knucklebone circle for Ordo.
 */
export default function GameArt({ id }: { id: GameId }) {
  // Unique per instance: if two SVGs shared ids and the first were hidden (display: none),
  // the browser would stop painting those gradients in the visible one too.
  const prefix = useId().replace(/:/g, '');
  const gid = (name: string) => `${prefix}-${name}`;
  return (
    <Ids.Provider value={prefix}>
      <svg viewBox="0 0 240 120" width="100%" role="presentation" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={gid('bead')} cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#a6efe6" />
            <stop offset="0.45" stopColor="#3aa39c" />
            <stop offset="1" stopColor="#12504b" />
          </radialGradient>
          <linearGradient id={gid('cream')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1ead3" />
            <stop offset="1" stopColor="#d9cfae" />
          </linearGradient>
          <linearGradient id={gid('hinge')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9dcdf" />
            <stop offset="1" stopColor="#5d6166" />
          </linearGradient>
          <radialGradient id={gid('steppe')} cx="50%" cy="40%" r="75%">
            <stop offset="0" stopColor="#6a5434" />
            <stop offset="1" stopColor="#2e2416" />
          </radialGradient>
          <linearGradient id={gid('bone')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbf3e1" />
            <stop offset="1" stopColor="#c4ad80" />
          </linearGradient>
        </defs>
        {id === 'ordo' ? <Ordo /> : id === 'shatra' ? <Shatra /> : <Sowing pits={id === 'mangala' ? 6 : 9} stores={id === 'mangala'} />}
      </svg>
    </Ids.Provider>
  );
}

// Fixed, irregular counts so the boards look mid-game rather than freshly set.
const TOP = [3, 5, 2, 4, 1, 6, 3, 2, 4];
const BOTTOM = [4, 2, 5, 3, 1, 4, 2, 6, 3];

function Beads({ cx, cy, n, rows }: { cx: number; cy: number; n: number; rows: number }) {
  const paint = usePaint();
  const shown = Math.min(n, rows * 2);
  return (
    <>
      {Array.from({ length: shown }, (_, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const usedRows = Math.ceil(shown / 2);
        return <circle key={i} cx={cx + (col - 0.5) * 6.2 + (shown % 2 && i === shown - 1 ? 3.1 : 0)} cy={cy + (row - (usedRows - 1) / 2) * 6.2} r={2.9} fill={paint('bead')} />;
      })}
    </>
  );
}

function Sowing({ pits, stores }: { pits: number; stores: boolean }) {
  const paint = usePaint();
  const left = stores ? 42 : 12;
  const right = stores ? 198 : 228;
  const step = (right - left) / pits;
  const w = Math.min(step * 0.62, stores ? 20 : 16);
  const h = stores ? w : w * 2.05;
  const rowY = [31, 89];
  return (
    <g>
      <rect x={left - 6} y="6" width={right - left + 12} height="52" rx="9" fill="#14110e" />
      <rect x={left - 6} y="62" width={right - left + 12} height="52" rx="9" fill={paint('cream')} />
      <rect x={left} y="57.5" width={right - left} height="5" rx="2.5" fill={paint('hinge')} />
      {stores && (
        <>
          <rect x="6" y="10" width="26" height="100" rx="13" fill="#050403" stroke="#2f8f89" strokeOpacity="0.5" />
          <rect x="208" y="10" width="26" height="100" rx="13" fill="#d9cfae" />
          <Beads cx={19} cy={60} n={6} rows={3} />
          <Beads cx={221} cy={60} n={8} rows={4} />
        </>
      )}
      {[0, 1].map(row =>
        Array.from({ length: pits }, (_, i) => {
          const cx = left + step * (i + 0.5);
          const cy = rowY[row];
          const n = (row === 0 ? TOP : BOTTOM)[i];
          return (
            <g key={`${row}-${i}`}>
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                rx={w / 2}
                fill={row === 0 ? '#050403' : '#ab9f7e'}
                stroke={row === 0 ? '#2f8f89' : 'none'}
                strokeOpacity="0.6"
              />
              <Beads cx={cx} cy={cy} n={n} rows={stores ? 2 : 3} />
            </g>
          );
        }),
      )}
    </g>
  );
}

function Ordo() {
  const paint = usePaint();
  const ring = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2 + 0.3);
  return (
    <g>
      <rect x="0" y="0" width="240" height="120" rx="12" fill={paint('steppe')} />
      <circle cx="120" cy="60" r="50" fill="none" stroke="#f2e6cc" strokeOpacity="0.7" strokeWidth="1.6" />
      {ring.map((a, i) => {
        const x = 120 + Math.cos(a) * 13;
        const y = 60 + Math.sin(a) * 13;
        return <ellipse key={i} cx={x} cy={y} rx="4.6" ry="2.9" fill={paint('bone')} transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} />;
      })}
      <circle cx="120" cy="60" r="5" fill="#b9bec2" stroke="#d4af37" strokeWidth="0.8" />
      {/* A guard already knocked out, and the saka on its way. */}
      <ellipse cx="182" cy="96" rx="4.6" ry="2.9" fill={paint('bone')} transform="rotate(30 182 96)" />
      <ellipse cx="120" cy="104" rx="6.5" ry="4" fill="#d9b25a" />
      <path d="M120 98 L120 82" stroke="#57c2b8" strokeWidth="1.4" strokeDasharray="3 3" />
    </g>
  );
}

function Shatra() {
  const paint = usePaint();
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      cells.push(<rect key={`${r}-${c}`} x={64 + c * 16} y={20 + r * 16} width="16" height="16" fill={(r + c) % 2 ? '#14110e' : '#d9cfae'} />);
    }
  }
  return (
    <g>
      <rect x="0" y="0" width="240" height="120" rx="12" fill="#1a1512" />
      {cells}
      <rect x="64" y="20" width="112" height="80" fill="none" stroke="#d4af37" strokeOpacity="0.5" />
      <circle cx="88" cy="44" r="5" fill={paint('bead')} />
      <circle cx="152" cy="76" r="5" fill="#f2e6cc" />
    </g>
  );
}
