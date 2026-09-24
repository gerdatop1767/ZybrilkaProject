import { useEffect, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { getTaskById } from '../../data/sampleTask.js';
import { Button } from '../../ui/Button/Button.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { FeedbackState } from '../../ui/FeedbackState/FeedbackState.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { Collapse, FadeIn, SlideUp } from '../../ui/motion/motion.js';
import styles from './Result.module.css';

export interface ResultProps {
  taskId: string;
  correct: boolean;
}

/**
 * Result (Design Spec Section 7 / 14): the correct/incorrect branch of
 * the core loop. Error styling stays deliberately calm — FeedbackState's
 * `error` variant is a soft tint, never anything punishing.
 *
 * Reveal is staggered (FeedbackState → XP/topic → explanation) rather
 * than everything appearing at once, and the topic-mastery bar animates
 * up from 0 on mount instead of snapping to its final value — the
 * "XP/progress feedback animates" step of the core loop.
 */
export function Result({ taskId, correct }: ResultProps) {
  const { navigate, back } = useNavigation();
  const task = getTaskById(taskId);
  const [masteryValue, setMasteryValue] = useState(0);

  useEffect(() => {
    if (!correct) return;
    const id = requestAnimationFrame(() => setMasteryValue(64));
    return () => cancelAnimationFrame(id);
  }, [correct]);

  return (
    <SlideUp key={`${taskId}-${correct}`} className={styles.stack}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={back}>
          <Icon name="close" size={18} />
        </Button>
      </div>

      <FeedbackState
        variant={correct ? 'success' : 'error'}
        title={correct ? 'Правильно!' : 'Неверно'}
        description={
          correct ? 'Отличная работа! +15 XP' : `Правильный ответ: ${task.correctAnswer}`
        }
      />

      <FadeIn delayMs={80}>
        {correct && (
          <Card className={styles.xpRow}>
            <span className="text-body-sm text-secondary">Опыт за задание</span>
            <span className={styles.xpValue}>+15 XP</span>
          </Card>
        )}

        <Card className={correct ? styles.metaCardSpacing : undefined}>
          <div className={styles.metaRow}>
            <Chip accentColor="var(--color-accent-secondary)">Тема: {task.topic}</Chip>
            {!correct && <Chip accentColor="var(--color-warning)">Ошибка в вычислении</Chip>}
          </div>
        </Card>
      </FadeIn>

      <Collapse open>
        <Card>
          <p className="text-h3">Пояснение</p>
          <p className="text-explanation text-secondary">{task.explanation}</p>
        </Card>
      </Collapse>

      {!correct && (
        <Card>
          <div className={styles.header}>
            <Icon name="hint" size={18} />
            <p className="text-body-sm text-secondary">
              Подсказка: подставляй значение переменной по шагам, не сокращая вычисление сразу.
            </p>
          </div>
        </Card>
      )}

      {correct && <ProgressBar value={masteryValue} label="Точность по теме" />}

      <div className={styles.actions}>
        {!correct && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate({ screen: 'task', taskId: task.id })}
          >
            Похожее задание
          </Button>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate({ screen: 'task', taskId: task.id })}
        >
          Следующее задание
        </Button>
      </div>
    </SlideUp>
  );
}
