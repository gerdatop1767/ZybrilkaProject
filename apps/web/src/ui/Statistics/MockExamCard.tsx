import { CircularProgress } from '../Progress/CircularProgress.js';
import { Icon } from '../Icon/Icon.js';
import type { MockExam } from '../../data/sampleStatistics.js';
import styles from './MockExamCard.module.css';

export function MockExamCard({ exam, onSelect }: { exam: MockExam; onSelect?: () => void }) {
  const variant = exam.percent >= 75 ? 'success' : exam.percent < 60 ? 'error' : 'default';
  return (
    <button type="button" className={styles.card} onClick={onSelect}>
      <span className={styles.label}>{exam.label}</span>
      <span className={styles.date}>{exam.date}</span>
      <CircularProgress value={exam.percent} variant={variant} size={64} label={exam.label}>
        <span className="text-body-sm" style={{ fontWeight: 700 }}>
          {exam.percent}%
        </span>
      </CircularProgress>
      <span className={styles.fraction}>
        {exam.correct} из {exam.total}
      </span>
    </button>
  );
}

export function NewMockExamCard({ onSelect }: { onSelect?: () => void }) {
  return (
    <button type="button" className={styles.newCard} onClick={onSelect}>
      <Icon name="add" size={22} />
      <span className="text-body-sm">Новый пробник</span>
    </button>
  );
}
