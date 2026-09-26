import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import type { TaskPublic } from '@zybrilka/shared';
import { getTask, listTasksByNumber, submitAttempt } from '../../lib/api.js';
import { toSampleTask } from '../../lib/taskAdapter.js';
import { subjects } from '../../data/subjects.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { DesktopToolsCard } from '../../ui/Training/DesktopToolsCard.js';
import { SessionProgressCard } from '../../ui/Training/SessionProgressCard.js';
import { SessionTaskListCard } from '../../ui/Training/SessionTaskListCard.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { Collapse, FadeIn } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskDesktop.module.css';

export interface TaskDesktopProps {
  subjectId: string;
  taskNumber: number;
  taskId: string;
}

/**
 * Desktop Training screen (S1 Block 6, approved design —
 * desktop/04_training.png): a three-part composition — breadcrumb +
 * task card in the main column, "Инструменты" / "Прогресс в теме" /
 * "Другие задания" in the sidebar. Structurally its own layout, not a
 * scaled mobile screen.
 */
export function TaskDesktop({ subjectId, taskNumber, taskId }: TaskDesktopProps) {
  const { navigate, back } = useNavigation();
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;

  // The router remounts this component (key={taskId}) on every task
  // change, so state starts fresh here — no manual reset-on-taskId-change
  // effect needed.
  const [task, setTask] = useState<ReturnType<typeof toSampleTask> | null>(null);
  const [siblings, setSiblings] = useState<readonly TaskPublic[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [answer, setAnswer] = useState('');
  const [checking, setChecking] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getTask(taskId), listTasksByNumber(subjectId, taskNumber)])
      .then(([fetchedTask, fetchedSiblings]) => {
        if (cancelled) return;
        setSiblings(fetchedSiblings);
        setTask(toSampleTask(fetchedTask, fetchedSiblings));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, subjectId, taskNumber]);

  function handleSelectSession(index: number) {
    const sibling = siblings[index - 1];
    if (!sibling) return;
    navigate({
      screen: 'task',
      subjectId: sibling.subjectId,
      taskNumber: sibling.taskNumber,
      taskId: sibling.id,
    });
  }

  const canSubmit = answer.trim().length > 0 && !checking && task !== null;
  const progressPercent = task ? (task.indexInSession / task.totalInSession) * 100 : 0;

  function handleCheck() {
    if (!canSubmit || !task) return;
    setChecking(true);
    const trimmedAnswer = answer.trim();
    void submitAttempt(task.id, { answer: trimmedAnswer })
      .then((result) => {
        navigate({
          screen: 'result',
          subjectId: task.subjectId,
          taskNumber: task.number,
          taskId: task.id,
          correct: result.correct,
          userAnswer: trimmedAnswer,
        });
      })
      .finally(() => setChecking(false));
  }

  if (loadError) {
    return (
      <FadeIn className={styles.page}>
        <p className="text-body-sm text-secondary">Не удалось загрузить задание.</p>
        <Button variant="secondary" onClick={back}>
          Назад
        </Button>
      </FadeIn>
    );
  }

  if (!task) {
    return (
      <FadeIn className={styles.page}>
        <p className="text-body-sm text-secondary">Загрузка задания…</p>
      </FadeIn>
    );
  }

  return (
    <FadeIn key={task.id} className={styles.page}>
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.backButton} onClick={back} aria-label="Назад">
          <Icon name="back" size={18} />
        </button>
        <span>{subject.shortName}</span>
        <Icon name="chevronRight" size={14} />
        <span>Тренировка</span>
        <Icon name="chevronRight" size={14} />
        <span className={styles.breadcrumbCurrent}>Задание {task.indexInSession}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <div className={styles.progressHeader}>
            <button
              type="button"
              className={styles.roundButton}
              onClick={back}
              aria-label="Предыдущее задание"
            >
              <Icon name="back" size={18} />
            </button>
            <div className={styles.progressHeaderBar}>
              <span className="text-body-sm">
                Задание {task.indexInSession} из {task.totalInSession}
              </span>
              <ProgressBar value={progressPercent} label="Прогресс тренировки" />
            </div>
            <span className={styles.timer}>
              <Icon name="time" size={16} /> 00:12:34
            </span>
            <button type="button" className={styles.roundButton} aria-label="Следующее задание">
              <Icon name="arrowRight" size={18} />
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.metaRow}>
              <span className={styles.currentChip}>Задание {task.indexInSession}</span>
              <span className={styles.metaChip}>{task.topic}</span>
              <span className={styles.metaChip}>Показательные уравнения</span>
              <span className={styles.metaChip}>
                {task.difficultyLabel === 'Сложное' ? 'Базовый уровень' : task.difficultyLabel}
              </span>
              <span className={styles.metaSpacer} />
              <button type="button" className={styles.iconButton} aria-label="Сохранить">
                <Icon name="bookmark" size={18} />
              </button>
              <button type="button" className={styles.iconButton} aria-label="Ещё">
                <Icon name="more" size={18} />
              </button>
            </div>

            <p className="text-h3" style={{ marginTop: 'var(--space-2)' }}>
              Условие
            </p>
            <p className={clsx('text-task', styles.condition)}>{task.condition}</p>

            <button
              type="button"
              className={styles.hintToggle}
              aria-expanded={hintOpen}
              aria-label="Показать подсказку"
              onClick={() => setHintOpen((v) => !v)}
            >
              <Icon name="hint" size={16} /> Подсказка
              <Icon name={hintOpen ? 'chevronUp' : 'chevronDown'} size={16} />
            </button>
            <Collapse open={hintOpen}>
              <p className={clsx('text-body-sm', 'text-secondary', styles.hintText)}>{task.hint}</p>
            </Collapse>

            <div>
              <p
                className="text-body-sm"
                style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}
              >
                Введите ответ
              </p>
              <div className={styles.answerRow}>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.answerInput}
                  placeholder="Ваш ответ..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={checking}
                  aria-label="Ответ"
                />
                <button
                  type="button"
                  className={styles.keyboardButton}
                  aria-label="Клавиатура"
                  onClick={() => inputRef.current?.focus()}
                >
                  <Icon name="keyboard" size={18} />
                </button>
              </div>
              <p className={clsx('text-body-sm', 'text-secondary', styles.answerHelp)}>
                Можно использовать: ∪ для объединения, ∩ для пересечения, ∞, дроби, скобки.
                <br />
                Например: (−∞; 1] ∪ [3; ∞)
              </p>
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={back}>
                <Icon name="skip" size={16} /> Пропустить
              </Button>
              <Button
                variant="primary"
                loading={checking}
                disabled={!canSubmit}
                onClick={handleCheck}
              >
                Проверить ответ <Icon name="arrowRight" size={18} />
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <DesktopToolsCard onSelectHint={() => setHintOpen((v) => !v)} />
          <SessionProgressCard
            sessionTasks={task.sessionTasks}
            totalInSession={task.totalInSession}
          />
          <SessionTaskListCard
            title="Другие задания"
            sessionTasks={task.sessionTasks}
            onSelect={handleSelectSession}
          />
        </div>
      </div>
    </FadeIn>
  );
}
