import type { TaskNumberProgress } from '../../data/sampleStatistics.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskNumberGrid.module.css';

export interface TaskNumberGridProps {
  rows: readonly TaskNumberProgress[];
  onSelect?: (number: number) => void;
}

const statusClass: Record<TaskNumberProgress['status'], string> = {
  strong: styles.strong ?? '',
  medium: styles.medium ?? '',
  weak: styles.weak ?? '',
  current: styles.current ?? '',
  untried: styles.untried ?? '',
};

/**
 * Full "Статистика → По заданиям" grid (mobile): every EGE task number
 * as its own tappable card — the same per-number data as the
 * "Общая" tab's `TaskNumberBars`, adapted from a horizontal bar strip
 * to a two-column card grid (desktop's own "Задания по номерам" is a
 * card grid too — see 02_task_numbers_desktop.png).
 */
export function TaskNumberGrid({ rows, onSelect }: TaskNumberGridProps) {
  return (
    <div className={styles.grid} role="list" aria-label="Прогресс по всем заданиям">
      {rows.map((row) => (
        <button
          key={row.number}
          type="button"
          className={clsx(styles.card, statusClass[row.status])}
          role="listitem"
          onClick={() => onSelect?.(row.number)}
        >
          <span className={styles.number}>№{row.number}</span>
          <span className={styles.percent}>
            {row.percent !== null ? `${row.percent}%` : 'Не решалось'}
          </span>
          <span className={styles.track}>
            {row.percent !== null && (
              <span className={styles.fill} style={{ width: `${row.percent}%` }} />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
