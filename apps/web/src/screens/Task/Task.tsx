import { useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { getTaskById } from '../../data/sampleTask.js';
import { subjects } from '../../data/subjects.js';
import { Button } from '../../ui/Button/Button.js';
import { Card } from '../../ui/Card/Card.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Input } from '../../ui/Input/Input.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { BottomSheet } from '../../ui/BottomSheet/BottomSheet.js';
import { clsx } from '../../lib/clsx.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './Task.module.css';

export interface TaskProps {
  taskId: string;
}

/**
 * Task (Design Spec Section 7 / 15): the real task-solving screen.
 * Subject-agnostic — everything about the task comes from `getTaskById`,
 * so a different subject's task renders through the same layout.
 * Seeded for now with one profile-math Part 1 item.
 */
// Brief "checking" state before the result appears — long enough to
// read as deliberate feedback, short enough to never feel slow.
const CHECKING_DELAY_MS = 450;

export function Task({ taskId }: TaskProps) {
  const { navigate, back } = useNavigation();
  const task = getTaskById(taskId);
  const subjectAccent = subjects.find((subject) => subject.id === task.subjectId)?.color;
  const [answer, setAnswer] = useState('');
  const [scratchOpen, setScratchOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const canSubmit = answer.trim().length > 0 && !checking;

  function handleSubmit() {
    if (!canSubmit) return;
    setChecking(true);
    const correct = answer.trim() === task.correctAnswer;
    setTimeout(() => {
      navigate({ screen: 'result', taskId: task.id, correct });
    }, CHECKING_DELAY_MS);
  }

  return (
    <SlideUp key={task.id} className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={back} aria-label="Назад">
          <Icon name="back" size={22} />
        </button>
        <div className={styles.headerText}>
          <p className="text-body-sm text-secondary">
            {task.subjectName} · {task.topic}
          </p>
          <div className={styles.metaRow}>
            <span className="text-body-sm">
              Задание {task.number} из {task.totalInSession}
            </span>
            <span className={styles.difficultyDots} aria-hidden="true">
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className={clsx(styles.dot, level <= task.difficulty && styles.dotFilled)}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      <ProgressBar
        value={(task.number / task.totalInSession) * 100}
        label={`Задание ${task.number} из ${task.totalInSession}`}
      />

      <Card
        className={styles.conditionCard}
        style={subjectAccent ? { ['--subject-accent' as string]: subjectAccent } : undefined}
      >
        <p className={clsx('text-task', styles.condition)}>{task.condition}</p>
      </Card>

      <div className={styles.answerRow}>
        <Input
          label="Ответ"
          placeholder="Введите число"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          wrapperClassName={styles.answerInput}
          inputMode="decimal"
          disabled={checking}
        />
      </div>

      <button type="button" className={styles.scratchButton} onClick={() => setScratchOpen(true)}>
        <Icon name="scratchboard" size={18} />
        Расширить поле
      </button>

      <Button
        variant="primary"
        fullWidth
        disabled={!canSubmit}
        loading={checking}
        onClick={handleSubmit}
      >
        Проверить
      </Button>

      <BottomSheet open={scratchOpen} onClose={() => setScratchOpen(false)} title="Расширить поле">
        <p className="text-body text-secondary">
          Математический черновик появится здесь в одном из следующих блоков.
        </p>
      </BottomSheet>
    </SlideUp>
  );
}
