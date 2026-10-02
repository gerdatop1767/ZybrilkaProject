import { useEffect, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
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

interface QuickScenario {
  id: 'random' | 'unseen' | 'byNumber';
  icon: IconName;
  label: string;
  description: string;
  accent: string;
}

/** The three obvious entry points the task-selection UX needs (not
 * buried in the generic mode grid below): an immediate random task, an
 * immediate unseen-only task, and the dedicated multi-number screen. */
const quickScenarios: readonly QuickScenario[] = [
  {
    id: 'random',
    icon: 'dice',
    label: 'Случайные задания',
    description: 'Любое задание по предмету',
    accent: 'var(--color-accent-primary)',
  },
  {
    id: 'unseen',
    icon: 'retry',
    label: 'Только нерешённые',
    description: 'Задания, которые ты ещё не встречал',
    accent: 'var(--color-success)',
  },
  {
    id: 'byNumber',
    icon: 'checklist',
    label: 'По номерам',
    description: 'Выбери конкретные номера и режим для каждого',
    accent: 'var(--chart-6)',
  },
];

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
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

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

  async function startQuickScenario(id: 'random' | 'unseen') {
    setStartError(null);
    setStarting(true);
    try {
      const task = await getRandomTask({
        subject: subjectId ?? undefined,
        collection: collectionSlug ?? undefined,
        unseen: id === 'unseen' || undefined,
      });
      navigate({
        screen: 'task',
        subjectId: task.subjectId,
        taskNumber: task.taskNumber,
        taskId: task.id,
        collectionSlug: collectionSlug ?? undefined,
        returnTo: { screen: 'training' },
      });
    } catch (error) {
      if (
        id === 'unseen' &&
        error instanceof ApiError &&
        (error.body as { error?: string })?.error === 'no_unseen_tasks'
      ) {
        setStartError('Нерешённых заданий по этому предмету больше нет — попробуй «Случайные».');
      } else {
        setStartError('Не нашлось подходящих заданий — попробуй другие фильтры.');
      }
    } finally {
      setStarting(false);
    }
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
        onChange={setSubjectId}
      />

      <div>
        <SectionHeader title="Быстрый старт" />
        <div className={styles.modeGrid}>
          {quickScenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={styles.modeCard}
              onClick={() => {
                if (scenario.id === 'byNumber') {
                  navigate({ screen: 'trainingByNumber' });
                } else {
                  void startQuickScenario(scenario.id);
                }
              }}
            >
              <span
                className={styles.modeIcon}
                style={{ ['--mode-accent' as string]: scenario.accent }}
              >
                <Icon name={scenario.icon} size={20} />
              </span>
              <span className={styles.modeText}>
                <span className="text-body">{scenario.label}</span>
                <span className="text-body-sm text-secondary">{scenario.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

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

      {modeId !== 'variant' && modeId !== 'mistakes' && (
        <Input
          label="Номер задания"
          placeholder="Например, 5 — необязательно"
          inputMode="numeric"
          value={taskNumberInput}
          onChange={(e) => setTaskNumberInput(e.target.value.replace(/\D/g, ''))}
        />
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
