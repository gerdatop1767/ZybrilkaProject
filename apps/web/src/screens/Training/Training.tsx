import { useEffect, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { getSubjectContent } from '../../data/subjectContent.js';
import {
  ApiError,
  getRandomTask,
  getVariant,
  listCollections,
  startLearningSession,
} from '../../lib/api.js';
import type { CollectionListItem } from '@zybrilka/shared';
import {
  applyLearningSessionResponse,
  useLearningSessionContext,
} from '../../lib/learningSessionContext.js';
import { Button } from '../../ui/Button/Button.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Icon } from '../../ui/Icon/Icon.js';
import type { IconName } from '../../ui/Icon/icons.js';
import { Input } from '../../ui/Input/Input.js';
import { Select } from '../../ui/Select/Select.js';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader.js';
import { clsx } from '../../lib/clsx.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './Training.module.css';

/** Independent per-number choice in "По номерам" — a user can mix both
 * across their selected numbers in one training run. 'random' mirrors
 * the pre-existing "Рандом" behavior (whole published pool, ignoring
 * any selected Сборник); 'unseen' uses the real backend `unseen` filter
 * (GET /tasks/random?unseen=true), scoped to the selected Сборник like
 * before. */
type ByNumberMode = 'random' | 'unseen';

/** Fisher-Yates — only ever reorders which already-selected numbers the
 * user solves first; never affects which task is picked for a number
 * (that stays exactly `getRandomTask`/the real `unseen` filter). */
function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

interface TrainingMode {
  id: string;
  icon: IconName;
  label: string;
  description: string;
  /** One of the existing status/accent tokens — never a new color. */
  accent: string;
}

const trainingModes: readonly TrainingMode[] = [
  {
    id: 'topic',
    icon: 'topic',
    label: 'По теме',
    description: 'Выбери конкретную тему для практики',
    accent: 'var(--color-accent-primary)',
  },
  {
    id: 'mistakes',
    icon: 'mistakes',
    label: 'Мои ошибки',
    description: 'Разбери задания, где были ошибки',
    accent: 'var(--color-error)',
  },
  {
    id: 'review',
    icon: 'star',
    label: 'Повторение',
    description: 'Закрепи то, что уже решал',
    accent: 'var(--color-warning)',
  },
  {
    id: 'byNumber',
    icon: 'checklist',
    label: 'По номерам',
    description: 'Выбери номер задания и как его подобрать',
    accent: 'var(--chart-6)',
  },
  {
    id: 'smart',
    icon: 'smart',
    label: 'Умная тренировка',
    description: 'Подбор заданий под твой прогресс',
    accent: 'var(--color-success)',
  },
  {
    id: 'variant',
    icon: 'variant',
    label: 'Вариант',
    description: 'Полный вариант ЕГЭ на время',
    accent: 'var(--color-accent-secondary)',
  },
];

const difficultyOptions = [
  { value: '1', label: 'Лёгкий' },
  { value: '2', label: 'Средний' },
  { value: '3', label: 'Сложный' },
];

const quantityOptions = ['5', '10', '20'];

const subjectSelectOptions = subjects.map((subject) => ({
  value: subject.id,
  label: subject.name,
}));

/**
 * Training (Design Spec Section 7): the setup screen before solving —
 * subject, mode, difficulty and quantity, then into Task.
 *
 * Wired to the real API (S3.2): "Сборник" + "Номер задания" scope
 * которое реальное задание запускается через
 * GET /tasks/random?collection=&taskNumber=; "Вариант" mode opens
 * position 1 of the selected real, ordered exam via GET /variants/:id.
 * "Сложность"/"Количество заданий" stay visual-only for now (as they
 * already were before this real-data wiring — no multi-task session
 * queue exists yet), and "Мои ошибки" jumps straight to the already-
 * real Mistakes screen instead of fetching a task.
 */
export function Training() {
  const { navigate } = useNavigation();
  const { setSession } = useLearningSessionContext();
  const [subjectId, setSubjectId] = useState<string | null>('math');
  const [modeId, setModeId] = useState('topic');
  const [difficulty, setDifficulty] = useState('2');
  const [quantity, setQuantity] = useState('10');
  const [collections, setCollections] = useState<readonly CollectionListItem[]>([]);
  const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [taskNumberInput, setTaskNumberInput] = useState('');
  const [byNumberSelection, setByNumberSelection] = useState<Record<number, ByNumberMode>>({});
  const [shuffleOrder, setShuffleOrder] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // A number not valid for the newly selected subject (e.g. №19 after
  // switching to a subject with fewer numbers) must not stay silently
  // selected — the chip grid below it won't even render that number.
  function selectSubject(id: string) {
    setSubjectId(id);
    const max = getSubjectContent(id).taskNumberCount;
    setByNumberSelection((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([n]) => Number(n) <= max)),
    );
  }

  function toggleByNumber(number: number) {
    setByNumberSelection((prev) => {
      if (number in prev) {
        const next = { ...prev };
        delete next[number];
        return next;
      }
      return { ...prev, [number]: 'random' };
    });
  }

  function setByNumberMode(number: number, mode: ByNumberMode) {
    setByNumberSelection((prev) => (number in prev ? { ...prev, [number]: mode } : prev));
  }

  useEffect(() => {
    let cancelled = false;
    void listCollections()
      .then((items) => {
        if (!cancelled) setCollections(items);
      })
      .catch(() => {
        // "Сборник" simply stays empty/unavailable — по заданиям/по
        // теме still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCollection = collections.find((c) => c.collection.slug === collectionSlug) ?? null;

  function handleSelectCollection(slug: string) {
    setCollectionSlug(slug === collectionSlug ? null : slug);
    setVariantId(null);
  }

  async function handleStart() {
    setStartError(null);
    if (modeId === 'mistakes') {
      navigate({ screen: 'mistakes' });
      return;
    }

    setStarting(true);
    try {
      if (modeId === 'smart') {
        const response = await startLearningSession({
          subjectId: subjectId ?? undefined,
          limit: Number(quantity),
        });
        const outcome = applyLearningSessionResponse(response, setSession, navigate);
        if (outcome === 'none') {
          setStartError('Не нашлось подходящих заданий для умной тренировки.');
        }
        return;
      }

      if (modeId === 'byNumber') {
        const numbers = Object.keys(byNumberSelection).map(Number);
        if (numbers.length === 0) {
          setStartError('Выбери хотя бы один номер задания.');
          return;
        }
        const orderedNumbers = shuffleOrder
          ? shuffled(numbers)
          : numbers.slice().sort((a, b) => a - b);

        // Resolved one at a time (not Promise.all) so a `no_unseen_tasks`
        // on one number stops immediately with an honest, specific
        // message — never silently swapping in a random task for it, and
        // never discarding tasks already fetched for earlier numbers.
        const tasks: Awaited<ReturnType<typeof getRandomTask>>[] = [];
        for (const number of orderedNumbers) {
          const mode = byNumberSelection[number]!;
          try {
            const task = await getRandomTask({
              subject: subjectId ?? undefined,
              taskNumber: number,
              // 'random' explicitly draws from the whole published pool
              // for this number, not just the currently selected
              // "Сборник" — 'unseen' keeps today's scoped behavior.
              collection: mode === 'random' ? undefined : (collectionSlug ?? undefined),
              unseen: mode === 'unseen' || undefined,
            });
            tasks.push(task);
          } catch (error) {
            if (
              error instanceof ApiError &&
              (error.body as { error?: string })?.error === 'no_unseen_tasks'
            ) {
              setStartError(
                `Для №${number} больше нет нерешённых заданий. Можно сменить режим на «Случайное» для этого номера.`,
              );
            } else {
              setStartError('Не нашлось подходящих заданий — попробуй другие номера или режимы.');
            }
            return;
          }
        }

        const first = tasks[0]!;
        navigate({
          screen: 'task',
          subjectId: first.subjectId,
          taskNumber: first.taskNumber,
          taskId: first.id,
          customOrderedTasks: tasks.map((t) => ({ taskId: t.id, taskNumber: t.taskNumber })),
          returnTo: { screen: 'training' },
        });
        return;
      }

      if (modeId === 'variant') {
        if (!variantId) {
          setStartError('Выбери вариант, чтобы начать.');
          return;
        }
        const detail = await getVariant(variantId);
        const first = detail.tasks.find((t) => t.position === 1) ?? detail.tasks[0];
        if (!first) {
          setStartError('В этом варианте пока нет заданий.');
          return;
        }
        navigate({
          screen: 'task',
          subjectId: first.task.subjectId,
          taskNumber: first.task.taskNumber,
          taskId: first.task.id,
          collectionSlug: collectionSlug ?? undefined,
          variantId: variantId ?? undefined,
          returnTo: { screen: 'training' },
        });
        return;
      }

      const taskNumber = taskNumberInput.trim() ? Number(taskNumberInput.trim()) : undefined;
      if (taskNumber !== undefined && (!Number.isInteger(taskNumber) || taskNumber < 1)) {
        setStartError('Номер задания должен быть положительным числом.');
        return;
      }
      const task = await getRandomTask({
        subject: subjectId ?? undefined,
        collection: collectionSlug ?? undefined,
        taskNumber,
      });
      navigate({
        screen: 'task',
        subjectId: task.subjectId,
        taskNumber: task.taskNumber,
        taskId: task.id,
        collectionSlug: collectionSlug ?? undefined,
        returnTo: { screen: 'training' },
      });
    } catch {
      setStartError('Не нашлось подходящих заданий — попробуй другие фильтры.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <SlideUp className={styles.stack}>
      <h1 className="text-h1">Тренировка</h1>

      <Select
        label="Предмет"
        options={subjectSelectOptions}
        value={subjectId}
        onChange={selectSubject}
      />

      <div>
        <SectionHeader title="Режим тренировки" />
        <div className={styles.modeGrid}>
          {trainingModes.map((mode) => {
            const selected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                className={clsx(styles.modeCard, selected && styles.modeCardSelected)}
                aria-pressed={selected}
                onClick={() => setModeId(mode.id)}
              >
                <span
                  className={styles.modeIcon}
                  style={{ ['--mode-accent' as string]: mode.accent }}
                >
                  <Icon name={mode.icon} size={20} />
                </span>
                <span className={styles.modeText}>
                  <span className="text-body">{mode.label}</span>
                  <span className="text-body-sm text-secondary">{mode.description}</span>
                </span>
                {selected && (
                  <span className={styles.modeCheck}>
                    <Icon name="check" size={20} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {collections.length > 0 && (
        <div>
          <SectionHeader title="Сборник" />
          <Select
            options={collections.map((c) => ({
              value: c.collection.slug,
              label: c.collection.title,
            }))}
            value={collectionSlug}
            onChange={handleSelectCollection}
            placeholder="Все источники"
          />
        </div>
      )}

      {modeId === 'variant' && selectedCollection && selectedCollection.variants.length > 0 && (
        <div>
          <SectionHeader title="Вариант" />
          <div className={styles.chipRow}>
            {selectedCollection.variants.map((v) => (
              <Chip key={v.id} selected={v.id === variantId} onClick={() => setVariantId(v.id)}>
                Вариант {v.variantNumber}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {modeId !== 'variant' && modeId !== 'mistakes' && modeId !== 'byNumber' && (
        <Input
          label="Номер задания"
          placeholder="Например, 5 — необязательно"
          inputMode="numeric"
          value={taskNumberInput}
          onChange={(e) => setTaskNumberInput(e.target.value.replace(/\D/g, ''))}
        />
      )}

      {modeId === 'byNumber' && (
        <>
          <div>
            <SectionHeader title="Номера заданий" />
            <p className="text-body-sm text-secondary" style={{ marginTop: '-4px' }}>
              Выбери один или несколько номеров — для каждого можно задать свой режим подбора.
            </p>
            <div className={styles.chipRow}>
              {Array.from(
                { length: getSubjectContent(subjectId ?? 'math').taskNumberCount },
                (_, i) => i + 1,
              ).map((number) => (
                <Chip
                  key={number}
                  selected={number in byNumberSelection}
                  onClick={() => toggleByNumber(number)}
                >
                  №{number}
                </Chip>
              ))}
            </div>
          </div>

          {Object.keys(byNumberSelection).length > 0 && (
            <div>
              <SectionHeader title="Режим для каждого номера" />
              <div className={styles.byNumberModeList}>
                {Object.keys(byNumberSelection)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((number) => {
                    const mode = byNumberSelection[number]!;
                    return (
                      <div key={number} className={styles.byNumberModeRow}>
                        <span className="text-body-sm" style={{ fontWeight: 700 }}>
                          №{number}
                        </span>
                        <div className={styles.chipRow}>
                          <Chip
                            icon="dice"
                            selected={mode === 'random'}
                            onClick={() => setByNumberMode(number, 'random')}
                          >
                            Случайное
                          </Chip>
                          <Chip
                            icon="retry"
                            selected={mode === 'unseen'}
                            onClick={() => setByNumberMode(number, 'unseen')}
                          >
                            Только нерешённые
                          </Chip>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <Chip
                icon="shuffle"
                selected={shuffleOrder}
                onClick={() => setShuffleOrder((v) => !v)}
                className={styles.shuffleChip}
              >
                Перемешать порядок
              </Chip>
            </div>
          )}
        </>
      )}

      <div>
        <SectionHeader title="Сложность" />
        <div className={styles.chipRow}>
          {difficultyOptions.map((option) => (
            <Chip
              key={option.value}
              selected={option.value === difficulty}
              onClick={() => setDifficulty(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Количество заданий" />
        <div className={styles.chipRow}>
          {quantityOptions.map((option) => (
            <Chip key={option} selected={option === quantity} onClick={() => setQuantity(option)}>
              {option}
            </Chip>
          ))}
        </div>
      </div>

      <Card>
        <p className="text-body-sm text-secondary">
          {trainingModes.find((mode) => mode.id === modeId)?.label} ·{' '}
          {difficultyOptions.find((option) => option.value === difficulty)?.label} · {quantity}{' '}
          заданий
        </p>
      </Card>

      {startError && (
        <p className="text-body-sm" style={{ color: 'var(--color-error)' }}>
          {startError}
        </p>
      )}

      <Button variant="primary" fullWidth loading={starting} onClick={() => void handleStart()}>
        Начать тренировку
      </Button>
    </SlideUp>
  );
}
