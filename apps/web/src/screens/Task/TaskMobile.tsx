import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { serializeMultiPartUserAnswer } from '@zybrilka/shared';
import { getTask, listTasksByNumber, submitAttempt } from '../../lib/api.js';
import { toSampleTask } from '../../lib/taskAdapter.js';
import { useTaskNavigation } from '../../lib/useTaskNavigation.js';
import type { TaskVariant } from '../../data/sampleTask.js';
import { subjects } from '../../data/subjects.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { DifficultyTag } from '../../ui/Training/DifficultyTag.js';
import { TaskChrome } from '../../ui/Training/TaskChrome.js';
import { ToolsPanelMobile, AnswerFieldTools } from '../../ui/Training/ToolsPanelMobile.js';
import { OtherVariantsSection } from '../../ui/Training/OtherVariantsSection.js';
import { Collapse, SlideUp } from '../../ui/motion/motion.js';
import { MathText } from '../../ui/MathText/MathText.js';
import { TaskIllustration } from '../../ui/TaskIllustration/TaskIllustration.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskMobile.module.css';

export interface TaskMobileProps {
  subjectId: string;
  taskNumber: number;
  taskId: string;
  collectionSlug?: string;
  variantId?: string;
}

const mathSymbols = ['∞', '∪', '∩', '≤', '≥', '≠'];

/**
 * Mobile Training/Task screen (S1 Block 6, approved design —
 * mobile/04_training.png + 04b_training_tools_hidden.png). 04b's
 * collapsed tools/variants state is the default; both are real
 * toggles, not two hardcoded screens.
 */
export function TaskMobile({
  subjectId,
  taskNumber,
  taskId,
  collectionSlug,
  variantId,
}: TaskMobileProps) {
  const { navigate, back } = useNavigation();
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;
  const taskNav = useTaskNavigation({ subjectId, taskId, collectionSlug, variantId });

  // The router remounts this component (key={taskId}) on every task
  // change, so state starts fresh here — no manual reset-on-taskId-change
  // effect needed.
  const [task, setTask] = useState<ReturnType<typeof toSampleTask> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [answer, setAnswer] = useState('');
  const [partAnswers, setPartAnswers] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [fxOpen, setFxOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const isMultiPart = task?.answerType === 'multi_part' && task.answerParts !== null;
  const canSubmit = isMultiPart
    ? task!.answerParts!.every((p) => (partAnswers[p.id] ?? '').trim().length > 0) && !checking
    : answer.trim().length > 0 && !checking && task !== null;

  function handleCheck() {
    if (!canSubmit || !task) return;
    setChecking(true);
    const submittedAnswer = isMultiPart ? { ...partAnswers } : answer.trim();
    const userAnswerForResult = isMultiPart
      ? serializeMultiPartUserAnswer(submittedAnswer as Record<string, string>)
      : (submittedAnswer as string);
    void submitAttempt(task.id, { answer: submittedAnswer })
      .then((result) => {
        navigate({
          screen: 'result',
          subjectId: task.subjectId,
          taskNumber: task.number,
          taskId: task.id,
          correct: result.correct,
          userAnswer: userAnswerForResult,
          collectionSlug,
          variantId: taskNav.variantId ?? undefined,
        });
      })
      .finally(() => setChecking(false));
  }

  function handleSelectVariant(variant: TaskVariant) {
    if (!task) return;
    // Cross-source sibling ("Похожие задания на эту тему") — explicitly
    // drop the current source/variant context, same as TaskDesktop's
    // handleSelectSession.
    navigate({
      screen: 'task',
      subjectId: task.subjectId,
      taskNumber: task.number,
      taskId: variant.id,
    });
  }

  function insertSymbol(symbol: string) {
    setAnswer((prev) => prev + symbol);
    inputRef.current?.focus();
  }

  if (loadError) {
    return (
      <SlideUp className={styles.stack}>
        <p className="text-body-sm text-secondary">Не удалось загрузить задание.</p>
        <Button variant="secondary" onClick={back}>
          Назад
        </Button>
      </SlideUp>
    );
  }

  if (!task) {
    return (
      <SlideUp className={styles.stack}>
        <p className="text-body-sm text-secondary">Загрузка задания…</p>
      </SlideUp>
    );
  }

  return (
    <SlideUp key={task.id} className={styles.stack}>
      <TaskChrome
        subject={subject}
        task={task}
        onBack={back}
        numberStripRange={taskNav.orderedTasks}
        onSelectNumber={taskNav.goTo}
        previous={taskNav.previous}
        next={taskNav.next}
        onGoTo={taskNav.goTo}
      />

      <div className={styles.card}>
        <div className={styles.metaRow}>
          <DifficultyTag label={task.difficultyLabel} />
          <span className={styles.metaChip}>
            <Icon name="reference" size={12} /> {task.source}
          </span>
          <span className={styles.metaChip}>
            <Icon name="topic" size={12} /> {task.topic}
          </span>
          <span className={styles.metaCode}>
            {task.code} <Icon name="info" size={14} />
          </span>
        </div>

        <div className={clsx('text-task', styles.condition)}>
          <MathText text={task.condition} />
        </div>
        <TaskIllustration
          subjectId={task.subjectId}
          taskNumber={task.number}
          imageUrl={task.imageUrl}
          className={styles.taskImage}
        />

        {task.hint && (
          <div className={styles.hintWrap}>
            <button
              type="button"
              className={styles.hintSummary}
              aria-expanded={hintOpen}
              onClick={() => setHintOpen((v) => !v)}
            >
              <Icon name="hint" size={18} className={styles.hintIcon} />
              <span className="text-body-sm" style={{ flex: 1, textAlign: 'left' }}>
                Подсказка
              </span>
              <Icon name={hintOpen ? 'chevronUp' : 'chevronDown'} size={18} />
            </button>
            <Collapse open={hintOpen}>
              <div className={clsx('text-body-sm', 'text-secondary', styles.hintText)}>
                <MathText text={task.hint} />
              </div>
            </Collapse>
          </div>
        )}

        {isMultiPart ? (
          <div className={styles.multiPartFields}>
            {task.answerParts!.map((part) => (
              <div key={part.id} className={styles.answerRow}>
                <span className={styles.multiPartLabel}>{part.label})</span>
                <input
                  type="text"
                  className={styles.answerInput}
                  placeholder="Ваш ответ..."
                  value={partAnswers[part.id] ?? ''}
                  onChange={(e) =>
                    setPartAnswers((prev) => ({ ...prev, [part.id]: e.target.value }))
                  }
                  disabled={checking}
                  aria-label={`Ответ ${part.label})`}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={styles.answerRow}>
              <input
                ref={inputRef}
                type="text"
                className={styles.answerInput}
                placeholder="Введите ответ..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={checking}
                aria-label="Ответ"
              />
              <AnswerFieldTools
                fxOpen={fxOpen}
                onToggleFx={() => setFxOpen((v) => !v)}
                toolsOpen={toolsOpen}
                onToggleTools={() => setToolsOpen((v) => !v)}
              />
            </div>
            <Collapse open={fxOpen}>
              <div className={styles.symbolRow}>
                {mathSymbols.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className={styles.symbolButton}
                    onClick={() => insertSymbol(symbol)}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </Collapse>
            <p className={clsx('text-body-sm', 'text-secondary', styles.answerHelp)}>
              Ответ можно вводить в виде интервала, объединения интервалов или чисел, например: (−∞;
              −1] ∪ [2; +∞)
            </p>
          </>
        )}

        <Button
          variant="primary"
          fullWidth
          loading={checking}
          disabled={!canSubmit}
          onClick={handleCheck}
        >
          Проверить ответ <Icon name="arrowRight" size={18} />
        </Button>
        <div className={styles.secondaryActions}>
          <Button
            variant="secondary"
            fullWidth
            disabled={!taskNav.next}
            onClick={() => taskNav.next && taskNav.goTo(taskNav.next)}
          >
            <Icon name="skip" size={16} /> Пропустить
          </Button>
        </div>
      </div>

      <ToolsPanelMobile open={toolsOpen} onToggle={() => setToolsOpen((v) => !v)} hideSummary />

      <OtherVariantsSection
        taskNumber={task.number}
        variants={task.otherVariants}
        open={otherOpen}
        onToggle={() => setOtherOpen((v) => !v)}
        onSelectVariant={handleSelectVariant}
        summarySubtitle="Похожие задания на эту тему"
      />
    </SlideUp>
  );
}
