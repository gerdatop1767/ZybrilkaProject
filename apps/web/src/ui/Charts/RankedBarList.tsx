import styles from './RankedBarList.module.css';

export interface RankedBarItem {
  label: string;
  value: number;
  color: string;
  /** Value shown at the row's end; falls back to `value`. */
  displayValue?: string;
}

export interface RankedBarListProps {
  items: readonly RankedBarItem[];
  /** Bar fill is `value / maxValue`; defaults to the largest item's value. */
  maxValue?: number;
  className?: string;
}

/**
 * Ranked mini-bar list (Statistics "Сложные темы" / Mistakes "Самые
 * частые ошибки"): numbered rows with a proportional horizontal bar.
 */
export function RankedBarList({ items, maxValue, className }: RankedBarListProps) {
  const max = maxValue ?? Math.max(1, ...items.map((i) => i.value));

  return (
    <ol className={`${styles.list} ${className ?? ''}`}>
      {items.map((item, i) => (
        <li key={item.label} className={styles.row}>
          <span className={styles.rank}>{i + 1}</span>
          <span className={styles.barCell}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.track}>
              <span
                className={styles.fill}
                style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
              />
            </span>
          </span>
          <span className={styles.value}>{item.displayValue ?? item.value}</span>
        </li>
      ))}
    </ol>
  );
}
