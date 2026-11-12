import styles from './Ornament.module.css';

/**
 * Кочкор мүйүз — the ram's-horn motif of Kyrgyz felt and embroidery: two horns curling away
 * from a shared stem. Drawn as a divider with lines running out to both sides.
 */
export function RamHorn({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 22) / 48} viewBox="0 0 48 22" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M24 19 C24 10 33 5 39.5 8.5 C44.5 11.2 43.6 18.4 38.6 18.6 C34.9 18.8 33.8 14.4 36.6 13.2
           M24 19 C24 10 15 5 8.5 8.5 C3.5 11.2 4.4 18.4 9.4 18.6 C13.1 18.8 14.2 14.4 11.4 13.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 2.6 L26.2 5.2 L24 7.8 L21.8 5.2 Z" fill="currentColor" />
    </svg>
  );
}

export function Divider() {
  return (
    <div className={styles.divider} role="separator">
      <span className={styles.line} />
      <RamHorn size={58} />
      <span className={styles.line} />
    </div>
  );
}
