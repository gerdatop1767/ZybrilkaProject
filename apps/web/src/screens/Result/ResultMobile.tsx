import { useEffect, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { getTask, listTasksByNumber } from '../../lib/api.js';
import { toSampleTask } from '../../lib/taskAdapter.js';
import type { SampleTask, TaskVariant } from '../../data/sampleTask.js';
import { subjects } from '../../data/subjects.js';
import { userStats } from '../../data/sampleProgress.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { TaskChrome } from '../../ui/Training/TaskChrome.js';
import { ToolsPanelMobile } from '../../ui/Training/ToolsPanelMobile.js';
import { OtherVariantsSection } from '../../ui/Training/OtherVariantsSection.js';
import { useCountUp } from '../../lib/useCountUp.js';
import { Collapse, SlideUp } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './ResultMobile.module.css';

export interface ResultMobileProps {
  subjectId: string;
  taskNumber: number;
  taskId: string;
  correct: boolean;
  userAnswer: string;
}

const XP_REWARD = 20;

/**
 * Mobile Result screen (S1 Block 6, approved design —
 * mobile/05_correct.png / mobile/06_wrong.png): the same task chrome
 * (header, number strip, progress) as Training, with the middle card
 * replaced by the feedback state. Tools/other-variants stay collapsed
 * by default here too, matching the approved screenshots.
 */
export function ResultMobile({
  subjectId,
  taskNumber,
  taskId,
  correct,
  userAnswer,
}: ResultMobileProps) {
  const { navigate, back } = useNavigation();
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;
  // The router remounts this component (key={taskId}) whenever the task
  // or its correctness changes, so state starts fresh here.
  const [task, setTask] = useState<SampleTask | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const xp = useCountUp(correct ? XP_REWARD : 0, 500);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getTask(taskId), listTasksByNumber(subjectId, taskNumber)])
      .then(([fetchedTask, siblings]) => {
        if (cancelled) return;
        setTask(toSampleTask(fetchedTask, siblings));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, subjectId, taskNumber]);

  if (loadError) {
    return (
      <SlideUp className={styles.stack}>
        <p className="text-body-sm text-secondary">Не удалось загрузить результат.</p>
        <Button variant="secondary" onClick={back}>
          Назад
        </Button>
      </SlideUp>
    );
  }

  if (!task) {
    return (
      <SlideUp className={styles.stack}>
        <p className="text-body-sm text-secondary">Загрузка результата…</p>
      </SlideUp>
    );
  }

  function goToNext() {
    if (!task) return;
    const nextVariant = task.otherVariants[0];
    if (!nextVariant) return;
    navigate({
      screen: 'task',
      subjectId: task.subjectId,
      taskNumber: task.number,
      taskId: nextVariant.id,
    });
  }

  function handleSelectVariant(variant: TaskVariant) {
    if (!task) return;
    navigate({
      screen: 'task',
      subjectId: task.subjectId,
      taskNumber: task.number,
      taskId: variant.id,
    });
  }

  return (
    <SlideUp key={`${taskId}-${correct}`} className={styles.stack}>
      <TaskChrome subject={subject} task={task} onBack={back} />

      <div
        className={clsx(
          styles.feedbackCard,
          correct ? styles.feedbackCorrect : styles.feedbackWrong,
        )}
      >
        <span
          className={clsx(styles.feedbackIcon, correct ? styles.iconCorrect : styles.iconWrong)}
        >
          <Icon name={correct ? 'check' : 'close'} size={32} />
        </span>
        <p className="text-h2">{correct ? 'Правильно!' : 'Неправильно!'}</p>
        <p className="text-body-sm text-secondary">
          {correct ? 'Отличная работа!' : 'Не переживай, разберём вместе!'}
        </p>

        <div className={styles.statRow}>
          <span className={styles.statChip}>
            <Icon name="xp" size={16} className={styles.statIconGold} />+{Math.round(xp)} XP
          </span>
          <span className={styles.statChip}>
            <StreakBadge days={userStats.streakDays} size={18} />
            Серия {userStats.streakDays} дней
          </span>
          <span className={styles.statChip}>
            <Icon name="progress" size={16} className={styles.statIconBlue} />
            Время 1:24
          </span>
          <span className={styles.statChip}>
            <Icon name="star" size={16} className={styles.statIconGold} />
            Точность {userStats.accuracy}%
          </span>
        </div>

        <div className={styles.answerBlock}>
          <p className="text-body-sm text-secondary">Твой ответ:</p>
          <p
            className={clsx(
              styles.answerBox,
              correct ? styles.answerBoxCorrect : styles.answerBoxWrong,
            )}
          >
            {userAnswer || '—'}
            <Icon name={correct ? 'check' : 'close'} size={18} />
          </p>
          {!correct && (
            <>
              <p className="text-body-sm text-secondary">Правильный ответ:</p>
              <p className={clsx(styles.answerBox, styles.answerBoxReference)}>
                {task.correctAnswer}
              </p>
            </>
          )}
        </div>

        <Button variant="primary" fullWidth onClick={() => setSolutionOpen((v) => !v)}>
          <Icon name="showSolution" size={18} /> Показать решение
        </Button>
        <Collapse open={solutionOpen}>
          <div className={styles.solutionSteps}>
            {task.steps.map((step, i) => (
              <div key={i} className={styles.solutionStep}>
                <span className={styles.solutionStepIndex}>{i + 1}</span>
                <p className="text-body-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </Collapse>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={goToNext}>
            Следующее задание <Icon name="arrowRight" size={16} />
          </Button>
          <Button variant="secondary" onClick={back}>
            <Icon name="grid" size={16} /> К списку заданий
          </Button>
        </div>
      </div>

      <ToolsPanelMobile open={toolsOpen} onToggle={() => setToolsOpen((v) => !v)} />

      <OtherVariantsSection
        taskNumber={task.number}
        variants={task.otherVariants}
        open={otherOpen}
        onToggle={() => setOtherOpen((v) => !v)}
        onSelectVariant={handleSelectVariant}
        summarySubtitle="Похожее на это задание"
      />
    </SlideUp>
  );
}
