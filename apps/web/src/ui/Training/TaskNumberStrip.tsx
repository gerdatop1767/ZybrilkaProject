import { useRef } from 'react';
import { Icon } from '../Icon/Icon.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskNumberStrip.module.css';

export interface TaskNumberStripProps {
  active: number;
  range?: readonly number[];
  onSelect: (n: number) => void;
}

const defaultRange = [11, 12, 13, 14, 15, 16, 17, 18, 19];

/**
 * Mobile's EGE task-number strip (S1 Block 6 — Training screenshots):
 * scrolls the row by one screenful per arrow tap, matching the
 * approved "‹ 11 12 13 14 [15] 16 17 18 19 ›" composition.
 */
export function TaskNumberStrip({ active, range = defaultRange, onSelect }: TaskNumberStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.arrow}
        aria-label="Предыдущие номера заданий"
        onClick={() => scrollBy(-160)}
      >
        <Icon name="chevronLeft" size={20} />
      </button>
      <div className={styles.scroller} ref={scrollerRef}>
        {range.map((n) => (
          <button
            key={n}
            type="button"
            className={clsx(styles.number, n === active && styles.numberActive)}
            aria-current={n === active ? 'true' : undefined}
            onClick={() => onSelect(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.arrow}
        aria-label="Следующие номера заданий"
        onClick={() => scrollBy(160)}
      >
        <Icon name="chevronRight" size={20} />
      </button>
    </div>
  );
}
