import type { Player } from '../game/engine';
import styles from './ToguzDiagram.module.css';

export interface DiagramView {
  pits: number[];
  kazan: [number, number];
  tuzduk: [number, number];
}

interface ToguzDiagramProps {
  view: DiagramView;
  playable?: Set<number>;
  onPick?: (pit: number) => void;
  /** Pit (or kazan, as 'k0' / 'k1') that just received a stone. */
  active?: number | 'k0' | 'k1' | null;
  highlight?: number[];
  flash?: number[];
  labels: { pit: (n: number) => string; kazan: (player: Player) => string; tuzduk: string };
}

const MAX_BEADS = 12;

/**
 * The Toguz Korgool board as the game draws it — the opponent's dark row above, the learner's
 * cream row below, teal korgools — so a lesson looks like the board the learner will play on.
 * The opponent's row is drawn right to left so sowing runs counter-clockwise.
 */
export default function ToguzDiagram({ view, playable, onPick, active = null, highlight = [], flash = [], labels }: ToguzDiagramProps) {
  const top = Array.from({ length: 9 }, (_, i) => 8 - i);
  const bottom = Array.from({ length: 9 }, (_, i) => 9 + i);

  const pit = (index: number) => {
    const count = view.pits[index];
    const tuzdukOf = view.tuzduk[0] === index ? 0 : view.tuzduk[1] === index ? 1 : -1;
    const canPlay = playable?.has(index) ?? false;
    const className = [
      styles.pit,
      canPlay ? styles.playable : '',
      highlight.includes(index) ? styles.highlight : '',
      active === index ? styles.active : '',
      flash.includes(index) ? styles.flash : '',
      tuzdukOf !== -1 ? styles.tuzduk : '',
    ].join(' ');
    const number = (index % 9) + 1;
    const label = `${labels.pit(number)}: ${count}${tuzdukOf !== -1 ? `, ${labels.tuzduk}` : ''}`;
    const content = (
      <>
        <span className={styles.count}>{tuzdukOf !== -1 ? '×' : count}</span>
        <span className={styles.well}>
          {tuzdukOf === -1 && (
            <span className={styles.beads}>
              {Array.from({ length: Math.min(count, MAX_BEADS) }, (_, i) => <span key={i} className={styles.bead} />)}
            </span>
          )}
        </span>
        <span className={styles.number}>{number}</span>
      </>
    );
    return canPlay ? (
      <button key={index} type="button" className={className} onClick={() => onPick?.(index)} aria-label={label}>
        {content}
      </button>
    ) : (
      <div key={index} className={className} role="img" aria-label={label}>
        {content}
      </div>
    );
  };

  const kazan = (player: Player) => (
    <div
      className={`${styles.kazan} ${player === 0 ? styles.kazanDark : styles.kazanLight} ${active === `k${player}` ? styles.kazanActive : ''}`}
      role="img"
      aria-label={`${labels.kazan(player)}: ${view.kazan[player]}`}
    >
      <span className={styles.kazanName}>{labels.kazan(player)}</span>
      <span className={styles.kazanValue}>{view.kazan[player]}</span>
    </div>
  );

  return (
    <div className={styles.board}>
      {kazan(0)}
      <div className={`${styles.panel} ${styles.dark}`}>
        <div className={styles.row}>{top.map(pit)}</div>
      </div>
      <div className={styles.hinge} aria-hidden="true" />
      <div className={`${styles.panel} ${styles.light}`}>
        <div className={styles.row}>{bottom.map(pit)}</div>
      </div>
      {kazan(1)}
    </div>
  );
}
