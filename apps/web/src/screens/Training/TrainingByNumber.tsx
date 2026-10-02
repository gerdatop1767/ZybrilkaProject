import { useEffect, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { getSubjectContent } from '../../data/subjectContent.js';
import { ApiError, getRandomTask, listCollections } from '../../lib/api.js';
import type { CollectionListItem } from '@zybrilka/shared';
import { BackRow } from '../../ui/BackRow/BackRow.js';
import { Button } from '../../ui/Button/Button.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Select } from '../../ui/Select/Select.js';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './TrainingByNumber.module.css';

/** Independent per-number choice — a user can mix both across their
 * selected numbers in one training run. 'random' draws from the whole
 * published pool for that number (ignoring any selected Сборник);
 * 'unseen' uses the real backend `unseen` filter (GET
 * /tasks/random?unseen=true), scoped to the selected Сборник. */
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

const subjectSelectOptions = subjects.map((subject) => ({
  value: subject.id,
  label: subject.name,
}));

/**
 * Тренировка → По номерам: its own real screen, not a cramped block
 * inside Training — a user picks one or more task numbers (№1…№19) and,
 * independently per number, 🎲 Случайное or 🔄 Только нерешённые,
 * optionally shuffles the solving order, then starts. Reuses exactly
 * the same `getRandomTask`/real `unseen` filter and
 * `customOrderedTasks` task-navigation mechanism Training/Subject's
 * "Собери вариант" already use — no second task-selection mechanism.
 * One shared component for desktop/mobile (same business logic, the
 * layout itself is already responsive), matching Training.tsx's own
 * precedent.
 */
export function TrainingByNumber() {
  const { navigate } = useNavigation();
  const [subjectId, setSubjectId] = useState('math');
  const [collections, setCollections] = useState<readonly CollectionListItem[]>([]);
  const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<number, ByNumberMode>>({});
  const [shuffleOrder, setShuffleOrder] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listCollections()
      .then((items) => {
        if (!cancelled) setCollections(items);
      })
      .catch(() => {
        // "Сборник" simply stays empty/unavailable — по номерам still
        // works without it (draws from the whole bank).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A number not valid for the newly selected subject (e.g. №19 after
  // switching to a subject with fewer numbers) must not stay silently
  // selected — the chip grid below it won't even render that number.
  function selectSubject(id: string) {
    setSubjectId(id);
    const max = getSubjectContent(id).taskNumberCount;
    setSelection((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([n]) => Number(n) <= max)),
    );
  }

  function toggleNumber(number: number) {
    setSelection((prev) => {
      if (number in prev) {
        const next = { ...prev };
        delete next[number];
        return next;
      }
      return { ...prev, [number]: 'random' };
    });
  }

  function setNumberMode(number: number, mode: ByNumberMode) {
    setSelection((prev) => (number in prev ? { ...prev, [number]: mode } : prev));
  }

  async function handleStart() {
    setStartError(null);
    const numbers = Object.keys(selection).map(Number);
    if (numbers.length === 0) {
      setStartError('Выбери хотя бы один номер задания.');
      return;
    }
    const orderedNumbers = shuffleOrder ? shuffled(numbers) : numbers.slice().sort((a, b) => a - b);

    setStarting(true);
    try {
      // Resolved one at a time (not Promise.all) so a `no_unseen_tasks`
      // on one number stops immediately with an honest, specific
      // message — never silently swapping in a random task for it, and
      // never discarding tasks already fetched for earlier numbers.
      const tasks: Awaited<ReturnType<typeof getRandomTask>>[] = [];
      for (const number of orderedNumbers) {
        const mode = selection[number]!;
        try {
          const task = await getRandomTask({
            subject: subjectId,
            taskNumber: number,
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
        returnTo: { screen: 'trainingByNumber' },
      });
    } finally {
      setStarting(false);
    }
  }

  const sortedSelected = Object.keys(selection)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <SlideUp className={styles.stack}>
      <BackRow to={{ screen: 'training' }} label="Тренировка" />
      <h1 className="text-h1">По номерам</h1>
      <p className="text-body-sm text-secondary">
        Выбери один или несколько номеров — для каждого можно задать свой режим подбора.
      </p>

      <Select
        label="Предмет"
        options={subjectSelectOptions}
        value={subjectId}
        onChange={selectSubject}
      />

      {collections.length > 0 && (
        <div>
          <SectionHeader title="Сборник" />
          <Select
            options={collections.map((c) => ({
              value: c.collection.slug,
              label: c.collection.title,
            }))}
            value={collectionSlug}
            onChange={(slug) => setCollectionSlug(slug === collectionSlug ? null : slug)}
            placeholder="Все источники"
          />
        </div>
      )}

      <div>
        <SectionHeader title="Номера заданий" />
        <div className={styles.chipRow}>
          {Array.from(
            { length: getSubjectContent(subjectId).taskNumberCount },
            (_, i) => i + 1,
          ).map((number) => (
            <Chip key={number} selected={number in selection} onClick={() => toggleNumber(number)}>
              №{number}
            </Chip>
          ))}
        </div>
      </div>

      {sortedSelected.length > 0 && (
        <div>
          <SectionHeader title="Режим для каждого номера" />
          <div className={styles.modeList}>
            {sortedSelected.map((number) => {
              const mode = selection[number]!;
              return (
                <div key={number} className={styles.modeRow}>
                  <span className="text-body-sm" style={{ fontWeight: 700 }}>
                    №{number}
                  </span>
                  <div className={styles.chipRow}>
                    <Chip
                      icon="dice"
                      selected={mode === 'random'}
                      onClick={() => setNumberMode(number, 'random')}
                    >
                      Случайное
                    </Chip>
                    <Chip
                      icon="retry"
                      selected={mode === 'unseen'}
                      onClick={() => setNumberMode(number, 'unseen')}
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
