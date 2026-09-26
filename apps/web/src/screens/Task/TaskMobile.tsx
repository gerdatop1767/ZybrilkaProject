import { useRef, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { getTaskById, type TaskVariant } from '../../data/sampleTask.js';
import { subjects } from '../../data/subjects.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { DifficultyTag } from '../../ui/Training/DifficultyTag.js';
import { TaskChrome } from '../../ui/Training/TaskChrome.js';
import { ToolsPanelMobile, AnswerFieldTools } from '../../ui/Training/ToolsPanelMobile.js';
import { OtherVariantsSection } from '../../ui/Training/OtherVariantsSection.js';
import { Collapse, SlideUp } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './TaskMobile.module.css';

export interface TaskMobileProps {
  subjectId: string;
  taskNumber: number;
  taskId: string;
}

const mathSymbols = ['∞', '∪', '∩', '≤', '≥', '≠'];

// Brief "checking" state before the result appears — long enough to
// read as deliberate feedback, short enough to never feel slow.
const CHECKING_DELAY_MS = 450;

/**
 * Mobile Training/Task screen (S1 Block 6, approved design —
 * mobile/04_training.png + 04b_training_tools_hidden.png). 04b's
 * collapsed tools/variants state is the default; both are real
 * toggles, not two hardcoded screens.
 */
export function TaskMobile({ subjectId, taskId }: TaskMobileProps) {
  const { navigate, back } = useNavigation();
  const task = getTaskById(taskId);
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;

  const [answer, setAnswer] = useState('');
  const [checking, setChecking] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [fxOpen, setFxOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = answer.trim().length > 0 && !checking;

  function handleCheck() {
    if (!canSubmit) return;
    setChecking(true);
    const trimmedAnswer = answer.trim();
    const correct = trimmedAnswer === task.correctAnswer.trim();
    setTimeout(() => {
      navigate({
        screen: 'result',
        subjectId: task.subjectId,
        taskNumber: task.number,
        taskId: task.id,
        correct,
        userAnswer: trimmedAnswer,
      });
    }, CHECKING_DELAY_MS);
  }

  function handleSelectVariant(variant: TaskVariant) {
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

  return (
    <SlideUp key={task.id} className={styles.stack}>
      <TaskChrome subject={subject} task={task} onBack={back} />

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

        <p className={clsx('text-task', styles.condition)}>{task.condition}</p>

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
            <p className={clsx('text-body-sm', 'text-secondary', styles.hintText)}>{task.hint}</p>
          </Collapse>
        </div>

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
          Ответ можно вводить в виде интервала, объединения интервалов или чисел, например: (−∞; −1]
          ∪ [2; +∞)
        </p>

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
          <Button variant="secondary" onClick={back}>
            <Icon name="skip" size={16} /> Пропустить
          </Button>
          <Button variant="secondary" className={styles.showSolutionButton}>
            <Icon name="showSolution" size={16} /> Показать решение
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
