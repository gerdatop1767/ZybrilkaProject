import { CircularProgress } from '../Progress/CircularProgress.js';
import type { SessionTask } from '../../data/sampleTask.js';
import styles from './SessionProgressCard.module.css';

export interface SessionProgressCardProps {
  sessionTasks: readonly SessionTask[];
  totalInSession: number;
}

/**
 * Desktop's "Прогресс в теме" ring card (S1 Block 6 — Training screen
 * only; Result replaces this with the "Результат" card).
 */
export function SessionProgressCard({ sessionTasks, totalInSession }: SessionProgressCardProps) {
  const correct = sessionTasks.filter((t) => t.status === 'correct').length;
  const incorrect = sessionTasks.filter((t) => t.status === 'incorrect').length;
  const remaining = totalInSession - correct - incorrect;
  const answered = correct + incorrect;

  return (
    <div className={styles.card}>
      <p className="text-h3">Прогресс в теме</p>
      <div className={styles.body}>
        <CircularProgress value={(answered / totalInSession) * 100} size={88} strokeWidth={8}>
          <span className={styles.ringText}>
            <span className="text-h3">
              {answered}/{totalInSession}
            </span>
            <span className="text-label text-secondary">заданий</span>
          </span>
        </CircularProgress>
        <div className={styles.legend}>
          <span className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'var(--color-success)' }} />
            {correct} верно
          </span>
          <span className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'var(--color-error)' }} />
            {incorrect} неверно
          </span>
          <span className={styles.legendRow}>
            <span className={styles.dot} style={{ background: 'var(--color-accent-secondary)' }} />
            {remaining} осталось
          </span>
        </div>
      </div>
    </div>
  );
}
