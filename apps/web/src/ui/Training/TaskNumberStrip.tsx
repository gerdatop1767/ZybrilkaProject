import { useRef } from 'react';
import { Icon } from '../Icon/Icon.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskNumberStrip.module.css';

export interface TaskNumberStripEntry {
  taskId: string;
  taskNumber: number;
}

export interface TaskNumberStripProps {
  /** The current task's number — highlighted, never assumed to be in
   * `range` (e.g. reached via a cross-source sibling with no ordered
   * context: it still renders, just unclickable). */
  active: number;
  /** The real ordered task list for the current source/variant — no
   * default: an empty array renders just the active number with no
   * siblings, rather than inventing a fake 11-19 range. */
  range: readonly TaskNumberStripEntry[];
  onSelect: (entry: TaskNumberStripEntry) => void;
}

/**
 * Mobile's EGE task-number strip (S1 Block 6 — Training screenshots):
 * scrolls the row by one screenful per arrow tap, matching the
 * approved "‹ 11 12 13 14 [15] 16 17 18 19 ›" composition. The arrows
 * only scroll this row horizontally — real prev/next task stepping is
 * a separate affordance (see TaskChrome's round buttons).
 */
export function TaskNumberStrip({ active, range, onSelect }: TaskNumberStripProps) {
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
        {range.map((entry) => (
          <button
            key={entry.taskId}
            type="button"
            className={clsx(styles.number, entry.taskNumber === active && styles.numberActive)}
            aria-current={entry.taskNumber === active ? 'true' : undefined}
            onClick={() => onSelect(entry)}
          >
            {entry.taskNumber}
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
