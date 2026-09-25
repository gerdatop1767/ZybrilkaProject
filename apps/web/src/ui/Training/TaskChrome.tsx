import { Icon } from '../Icon/Icon.js';
import { SubjectTile } from '../SubjectTile/SubjectTile.js';
import { TaskNumberStrip } from './TaskNumberStrip.js';
import { ProgressBar } from '../Progress/ProgressBar.js';
import type { Subject } from '../../data/subjects.js';
import type { SampleTask } from '../../data/sampleTask.js';
import styles from './TaskChrome.module.css';

export interface TaskChromeProps {
  subject: Subject;
  task: SampleTask;
  onBack: () => void;
}

/**
 * The header + task-number strip + session-progress bar shared by
 * mobile Training and Result (S1 Block 6, approved design) — visually
 * and structurally identical across both screenshots, so it lives
 * once rather than being duplicated per screen.
 */
export function TaskChrome({ subject, task, onBack }: TaskChromeProps) {
  const progressPercent = (task.indexInSession / task.totalInSession) * 100;

  return (
    <>
      <div className={styles.header}>
        <button type="button" className={styles.iconButton} aria-label="Назад" onClick={onBack}>
          <Icon name="back" size={20} />
        </button>
        <SubjectTile glyph={subject.glyph} color={subject.color} size={40} />
        <div className={styles.headerText}>
          <p className="text-body" style={{ fontWeight: 700 }}>
            {subject.shortName}
          </p>
          <p className="text-body-sm text-secondary">Задание №{task.number}</p>
        </div>
        <button type="button" className={styles.iconButton} aria-label="В избранное">
          <Icon name="favorite" size={20} />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Сохранить">
          <Icon name="bookmark" size={20} />
        </button>
      </div>

      <TaskNumberStrip active={task.number} onSelect={() => undefined} />

      <div>
        <div className={styles.progressRow}>
          <span className="text-body-sm text-secondary">
            Задание {task.indexInSession} из {task.totalInSession}
          </span>
          <span className="text-body-sm text-secondary">{Math.round(progressPercent)}%</span>
        </div>
        <ProgressBar value={progressPercent} label="Прогресс тренировки" />
      </div>
    </>
  );
}
