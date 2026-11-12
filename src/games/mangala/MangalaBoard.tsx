import { PITS_PER_SIDE, type Slot } from './engine';
import styles from './MangalaBoard.module.css';

interface MangalaBoardProps {
  pits: number[];
  stores: [number, number];
  /** Pits the player may pick right now. */
  playable: Set<number>;
  onPick: (pit: number) => void;
  /** Slot that just received a stone (during the sowing animation). */
  active: Slot | null;
  /** Pits emptied by the last capture. */
  captured: number[];
  labels: { pit: (n: number) => string; store: (seat: 0 | 1) => string };
}

const MAX_BEADS = 12;

function Beads({ count }: { count: number }) {
  return (
    <span className={styles.beads} style={{ gridTemplateColumns: `repeat(${count > 4 ? 3 : 2}, auto)` }}>
      {Array.from({ length: Math.min(count, MAX_BEADS) }, (_, i) => <span key={i} className={styles.bead} />)}
    </span>
  );
}

/**
 * Drawn in the same materials as the Toguz Korgool board. Seat 1 plays the cream row at the
 * bottom (pits 6..11, left to right); seat 0 the dark row, drawn right to left, so sowing runs
 * counter-clockwise. Seat 0's store is on the left, seat 1's on the right.
 */
export default function MangalaBoard({ pits, stores, playable, onPick, active, captured, labels }: MangalaBoardProps) {
  const top = Array.from({ length: PITS_PER_SIDE }, (_, i) => PITS_PER_SIDE - 1 - i);
  const bottom = Array.from({ length: PITS_PER_SIDE }, (_, i) => PITS_PER_SIDE + i);

  const pit = (index: number) => {
    const canPlay = playable.has(index);
    const number = (index % PITS_PER_SIDE) + 1;
    const className = [
      styles.pit,
      canPlay ? styles.playable : '',
      active === index ? styles.active : '',
      captured.includes(index) ? styles.captured : '',
    ].join(' ');
    return (
      <button key={index} type="button" className={className} disabled={!canPlay} onClick={() => onPick(index)} aria-label={`${labels.pit(number)}: ${pits[index]}`}>
        <span className={styles.count}>{pits[index]}</span>
        <span className={styles.well}><Beads count={pits[index]} /></span>
      </button>
    );
  };

  const store = (seat: 0 | 1) => (
    <div
      className={`${styles.store} ${seat === 0 ? styles.storeDark : styles.storeLight} ${active === `store${seat}` ? styles.active : ''}`}
      role="img"
      aria-label={`${labels.store(seat)}: ${stores[seat]}`}
    >
      <span className={styles.storeValue}>{stores[seat]}</span>
    </div>
  );

  return (
    <div className={styles.board}>
      {store(0)}
      <div className={styles.rows}>
        <div className={`${styles.panel} ${styles.dark}`}><div className={styles.row}>{top.map(pit)}</div></div>
        <div className={styles.hinge} aria-hidden="true" />
        <div className={`${styles.panel} ${styles.light}`}><div className={styles.row}>{bottom.map(pit)}</div></div>
      </div>
      {store(1)}
    </div>
  );
}
