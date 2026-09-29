import { useEffect, useRef } from 'react';
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
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  // Keeps the active number in view on first open, Prev/Next, a number
  // click, Skip, and arriving from Result — without this the strip
  // always opens scrolled to its start, so e.g. task #15 of 19 renders
  // off-screen (audit Block 4). Deps are deliberately narrow (`active`
  // + the range's length, not the array itself, which is a fresh
  // reference on many unrelated re-renders): this must run only when
  // the active task or the loaded range actually changes, never on
  // every render, or a manual scroll away from the active number would
  // keep getting fought back into place.
  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active, range.length]);

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
            ref={entry.taskNumber === active ? activeButtonRef : undefined}
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
