import type { TaskNumberProgress } from '../../data/sampleStatistics.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskNumberBars.module.css';

export interface TaskNumberBarsProps {
  rows: readonly TaskNumberProgress[];
  onSelect?: (number: number) => void;
}

const statusClass: Record<TaskNumberProgress['status'], string> = {
  strong: styles.strong ?? '',
  medium: styles.medium ?? '',
  weak: styles.weak ?? '',
  current: styles.current ?? '',
  untried: '',
};

/**
 * "Прогресс по заданиям (1–19)" (mobile Statistics): a horizontally
 * scrollable per-task-number bar row, colour-banded by accuracy —
 * matches the approved screenshot's green/orange/red/purple-current
 * bars exactly, driven by real per-number data.
 */
export function TaskNumberBars({ rows, onSelect }: TaskNumberBarsProps) {
  return (
    <div className={styles.scroller} role="list" aria-label="Прогресс по заданиям с 1 по 19">
      {rows.map((row) => (
        <button
          key={row.number}
          type="button"
          className={styles.col}
          role="listitem"
          onClick={() => onSelect?.(row.number)}
          aria-label={
            row.percent === null
              ? `Задание ${row.number}, не решалось`
              : `Задание ${row.number}: ${row.percent}%`
          }
        >
          <span className={styles.percentLabel} style={{ color: percentColor(row.status) }}>
            {row.percent !== null ? `${row.percent}%` : ''}
          </span>
          <span className={styles.barTrack}>
            {row.percent !== null && (
              <span
                className={clsx(styles.bar, statusClass[row.status])}
                style={{ height: `${row.percent}%` }}
              />
            )}
          </span>
          <span className={styles.number}>{row.number}</span>
        </button>
      ))}
    </div>
  );
}

function percentColor(status: TaskNumberProgress['status']) {
  switch (status) {
    case 'strong':
      return 'var(--color-success)';
    case 'medium':
      return 'var(--color-warning)';
    case 'weak':
      return 'var(--color-error)';
    case 'current':
      return 'var(--color-accent-primary-end)';
    default:
      return 'var(--color-text-secondary)';
  }
}
