import { useEffect, useState } from 'react';
import type { CollectionListItem, ProgressByTopicResponse } from '@zybrilka/shared';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { startRealTask } from '../../lib/startTraining.js';
import { getProgressByTaskNumber, getProgressByTopic, listCollections } from '../../lib/api.js';
import {
  getSubjectContent,
  taskSources,
  type SubjectModeId,
  type TaskSourceId,
  type TaskSourceGlyph,
} from '../../data/subjectContent.js';
import { BackRow, type BackRowProps } from '../../ui/BackRow/BackRow.js';
import { Card } from '../../ui/Card/Card.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import type { IconName } from '../../ui/Icon/icons.js';
import { Select } from '../../ui/Select/Select.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { clsx } from '../../lib/clsx.js';
import styles from './SubjectDesktop.module.css';

const sourceGlyphIcon: Record<TaskSourceGlyph, IconName> = {
  document: 'variant',
  bank: 'bank',
  book: 'reference',
  star: 'star',
};

/** Sentinel Select value for "Общий банк" (no collection filter) — Select's
 * own value type is `string | null`, and `null` there means "nothing
 * picked yet", not a deliberate "every source" choice, so this needs its
 * own explicit, always-visible option instead of just an empty selection. */
const ALL_SOURCES_VALUE = '__all__';

function sourceSelectOptions(collections: readonly CollectionListItem[]) {
  return [
    { value: ALL_SOURCES_VALUE, label: 'Общий банк' },
    ...collections.map((item) => ({ value: item.collection.slug, label: item.collection.title })),
  ];
}

export interface SubjectDesktopProps {
  subjectId: string;
  from?: 'subjectCatalog' | 'learningCenter';
  /** Pre-selects the "Источник" filter (e.g. arriving back from a task
   * opened under a specific collection) — see navigation.tsx. */
  collectionSlug?: string;
}

interface TaskNumberSummary {
  number: number;
  solved: number;
  total: number;
}

type TopicProgressItem = ProgressByTopicResponse['items'][number];

const modes: readonly { id: SubjectModeId; label: string; caption: string; icon: IconName }[] = [
  { id: 'topics', label: 'Темы', caption: 'Все темы по номерам', icon: 'reference' },
  {
    id: 'byNumber',
    label: 'Задания по номерам',
    caption: 'Выбрать конкретное задание',
    icon: 'checklist',
  },
  { id: 'variants', label: 'Варианты', caption: 'Полные варианты ЕГЭ', icon: 'variant' },
  { id: 'random', label: 'Случайные задания', caption: 'Тренировка без тем', icon: 'smart' },
  { id: 'favorites', label: 'Избранное', caption: 'Сохранённые задания', icon: 'favorite' },
];

/**
 * Desktop Subject page (approved references: 01_MATH…09_HISTORY_
 * DESKTOP.png) — one generic component for every subject. Per-subject
 * differences (topics, tagline, task-number count) come entirely from
 * `data/subjectContent.ts`; adding a 10th subject means adding data
 * there, never copying this component. `mode` and the topic/number
 * drill-downs are local state, not global routes — there's nothing
 * here a deep link needs to restore, and it keeps this screen's own
 * back-stack (topic/number → list) independent of the app router's.
 */
export function SubjectDesktop({ subjectId, from, collectionSlug }: SubjectDesktopProps) {
  const { navigate } = useNavigation();
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;
  const content = getSubjectContent(subject.id);

  const [mode, setMode] = useState<SubjectModeId>('topics');
  const [selectedTopic, setSelectedTopic] = useState<TopicProgressItem | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [collections, setCollections] = useState<readonly CollectionListItem[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [byNumberSlug, setByNumberSlug] = useState<string | null>(collectionSlug ?? null);
  const [randomSlug, setRandomSlug] = useState<string | null>(collectionSlug ?? null);
  const [topicsSlug, setTopicsSlug] = useState<string | null>(collectionSlug ?? null);
  const [taskNumbers, setTaskNumbers] = useState<readonly TaskNumberSummary[]>(() =>
    Array.from({ length: content.taskNumberCount }, (_, i) => ({
      number: i + 1,
      solved: 0,
      total: 0,
    })),
  );
  const [topics, setTopics] = useState<readonly TopicProgressItem[]>([]);

  const solved = Math.round((subject.taskCount * subject.mastery) / 100);
  const friendRank = 1 + (hashCode(subject.id) % 12);

  // Real collections for this subject — "Источник" always offers "Общий
  // банк" plus whatever collections/variants exist, generically, never a
  // hardcoded publisher. An unreachable API just leaves the list empty:
  // every mode still works against the aggregate bank.
  useEffect(() => {
    let cancelled = false;
    void listCollections()
      .then((items) => {
        if (cancelled) return;
        setCollections(items.filter((item) => item.collection.subjectId === subject.id));
        setCollectionsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setCollectionsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  // A slug carried in from the route (or picked earlier) might name a
  // collection that no longer exists/isn't published for this subject —
  // derived (not synced via an effect) so it falls back to "Общий банк"
  // the moment the real list loads, without a set-state-in-effect round trip.
  const knownSlugs = new Set(collections.map((item) => item.collection.slug));
  const effectiveByNumberSlug =
    collectionsLoaded && byNumberSlug && !knownSlugs.has(byNumberSlug) ? null : byNumberSlug;
  const effectiveRandomSlug =
    collectionsLoaded && randomSlug && !knownSlugs.has(randomSlug) ? null : randomSlug;
  const effectiveTopicsSlug =
    collectionsLoaded && topicsSlug && !knownSlugs.has(topicsSlug) ? null : topicsSlug;

  // Real X/Y per number (Block A) — re-fetched whenever the selected
  // source changes. Numbers with no task in the current scope keep
  // total=0 rather than being dropped, so the grid never shrinks/jumps.
  useEffect(() => {
    let cancelled = false;
    void getProgressByTaskNumber({
      subject: subject.id,
      collection: effectiveByNumberSlug ?? undefined,
    })
      .then((res) => {
        if (cancelled) return;
        const byNumber = new Map(res.items.map((item) => [item.taskNumber, item]));
        setTaskNumbers(
          Array.from({ length: content.taskNumberCount }, (_, i) => {
            const number = i + 1;
            const row = byNumber.get(number);
            return { number, solved: row?.completed ?? 0, total: row?.total ?? 0 };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTaskNumbers(
            Array.from({ length: content.taskNumberCount }, (_, i) => ({
              number: i + 1,
              solved: 0,
              total: 0,
            })),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [subject.id, effectiveByNumberSlug, content.taskNumberCount]);

  // Real topics (Block D) — the DB's own topics table, never the static
  // per-subject design content, whose ids/names are a different,
  // incompatible taxonomy. A topic with no published task in the
  // current scope simply doesn't appear rather than showing a fake 0/0.
  useEffect(() => {
    let cancelled = false;
    void getProgressByTopic({
      subject: subject.id,
      collection: effectiveTopicsSlug ?? undefined,
    })
      .then((res) => {
        if (!cancelled) setTopics(res.items);
      })
      .catch(() => {
        if (!cancelled) setTopics([]);
      });
    return () => {
      cancelled = true;
    };
  }, [subject.id, effectiveTopicsSlug]);

  function startTraining(taskNumber: number, collection?: string) {
    startRealTask(navigate, { subject: subject.id, taskNumber, collection });
  }

  function startTopicTraining(topic: TopicProgressItem) {
    startRealTask(navigate, {
      subject: subject.id,
      topic: topic.topicId,
      collection: effectiveTopicsSlug ?? undefined,
    });
  }

  const parentLabel = from === 'learningCenter' ? 'К учебному центру' : 'К предметам';
  const parentScreen: 'subjectCatalog' | 'learningCenter' = from ?? 'subjectCatalog';
  const backProps: BackRowProps = selectedTopic
    ? { onBack: () => setSelectedTopic(null), label: subject.shortName }
    : selectedNumber
      ? { onBack: () => setSelectedNumber(null), label: 'Задания по номерам' }
      : { to: { screen: parentScreen }, label: parentLabel };

  return (
    <div>
      <BackRow {...backProps} />

      <div className={styles.hero}>
        <div
          className={styles.heroIllustration}
          style={{ ['--subject-accent' as string]: subject.color }}
        >
          <img
            src={`/branding/v2/subjects/${subject.id}.png`}
            alt=""
            aria-hidden="true"
            className={styles.heroImg}
          />
        </div>
        <div className={styles.heroText}>
          <h1 className="text-h1">{subject.shortName}</h1>
          <p className="text-body-sm text-secondary">{content.tagline}</p>
          <div className={styles.heroStats}>
            <span className={styles.heroStat}>
              <Icon name="target" size={16} />
              <strong>{solved}</strong> заданий решено
            </span>
            <span className={styles.heroStat}>
              <Icon name="progress" size={16} />
              <strong>{subject.mastery}%</strong> средняя точность
            </span>
            <span className={styles.heroStat}>
              <Icon name="crown" size={16} />
              <strong>{friendRank}</strong> место среди друзей
            </span>
          </div>
        </div>
      </div>

      <div className={styles.modes}>
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.modeButton, mode === item.id && styles.modeButtonActive)}
            onClick={() => {
              setMode(item.id);
              setSelectedTopic(null);
              setSelectedNumber(null);
            }}
          >
            <Icon name={item.icon} size={18} />
            <span>
              <span className={styles.modeLabel}>{item.label}</span>
              <span className={styles.modeCaption}>{item.caption}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          {mode === 'topics' && !selectedTopic && (
            <TopicsList
              topics={topics}
              collections={collections}
              selectedSlug={effectiveTopicsSlug}
              onSourceChange={setTopicsSlug}
              onSelect={setSelectedTopic}
            />
          )}
          {mode === 'topics' && selectedTopic && (
            <TopicDetail
              subjectName={subject.shortName}
              topic={selectedTopic}
              onStart={() => startTopicTraining(selectedTopic)}
            />
          )}
          {mode === 'byNumber' && selectedNumber === null && (
            <TaskNumberGrid
              numbers={taskNumbers}
              collections={collections}
              selectedSlug={effectiveByNumberSlug}
              onSourceChange={setByNumberSlug}
              onSelect={setSelectedNumber}
            />
          )}
          {mode === 'byNumber' && selectedNumber !== null && (
            <TaskNumberDetail
              subjectName={subject.shortName}
              number={selectedNumber}
              collections={collections}
              selectedSlug={effectiveByNumberSlug}
              summary={taskNumbers.find((n) => n.number === selectedNumber)!}
              onStart={() => startTraining(selectedNumber, effectiveByNumberSlug ?? undefined)}
            />
          )}
          {mode === 'variants' && (
            <VariantBuilder taskNumberCount={content.taskNumberCount} onStart={startTraining} />
          )}
          {mode === 'random' && (
            <RandomModeCard
              collections={collections}
              selectedSlug={effectiveRandomSlug}
              onSourceChange={setRandomSlug}
              onStart={() => startTraining(1, effectiveRandomSlug ?? undefined)}
            />
          )}
          {mode === 'favorites' && (
            <ModePlaceholder
              icon="favorite"
              title="Избранное"
              note="Сохранённые задания появятся здесь, как только ты добавишь первое."
            />
          )}
        </div>

        <div className={styles.sidebar}>
          <Card>
            <p className="text-h3">Твой прогресс</p>
            <div className={styles.progressRing}>
              <CircularProgress value={subject.mastery} size={110} strokeWidth={10}>
                <span className="text-h2">{subject.mastery}%</span>
              </CircularProgress>
            </div>
            <p className="text-body-sm text-secondary" style={{ textAlign: 'center' }}>
              {solved} из {subject.taskCount} заданий решено
            </p>
          </Card>

          <Card>
            <p className="text-h3">Быстрый старт</p>
            <div className={styles.quickList}>
              <button type="button" className={styles.quickRow} onClick={() => startTraining(1)}>
                <Icon name="play" size={18} />
                <span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    Продолжить
                  </p>
                  <p className="text-body-sm text-secondary">Тема {content.topics[0]!.title}</p>
                </span>
                <Icon name="arrowRight" size={16} className={styles.quickArrow} />
              </button>
              <button
                type="button"
                className={styles.quickRow}
                onClick={() => {
                  setMode('random');
                  setSelectedTopic(null);
                  setSelectedNumber(null);
                }}
              >
                <Icon name="smart" size={18} />
                <span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    Случайное задание
                  </p>
                  <p className="text-body-sm text-secondary">Любая тема</p>
                </span>
                <Icon name="arrowRight" size={16} className={styles.quickArrow} />
              </button>
              <button
                type="button"
                className={styles.quickRow}
                onClick={() => {
                  setMode('variants');
                  setSelectedTopic(null);
                  setSelectedNumber(null);
                }}
              >
                <Icon name="variant" size={18} />
                <span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    Решить вариант
                  </p>
                  <p className="text-body-sm text-secondary">Полный вариант ЕГЭ</p>
                </span>
                <Icon name="arrowRight" size={16} className={styles.quickArrow} />
              </button>
            </div>
          </Card>

          <Card>
            <p className="text-h3">Последние решения</p>
            <div className={styles.recentList}>
              {content.topics.slice(0, 4).map((topic, index) => {
                const correct = (hashCode(`${subject.id}:${topic.id}`) + index) % 3 !== 0;
                return (
                  <div key={topic.id} className={styles.recentRow}>
                    <Icon
                      name={correct ? 'success' : 'errorCircle'}
                      size={18}
                      className={correct ? styles.recentSuccess : styles.recentError}
                    />
                    <span className={styles.recentBody}>
                      <p className="text-body-sm" style={{ fontWeight: 700 }}>
                        Задание {topic.number}
                      </p>
                      <p className="text-body-sm text-secondary">{topic.title}</p>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function hashCode(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function TopicsList({
  topics,
  collections,
  selectedSlug,
  onSourceChange,
  onSelect,
}: {
  topics: readonly TopicProgressItem[];
  collections: readonly CollectionListItem[];
  selectedSlug: string | null;
  onSourceChange: (slug: string | null) => void;
  onSelect: (topic: TopicProgressItem) => void;
}) {
  return (
    <Card>
      <div className={styles.numberGridHeader}>
        <div>
          <p className="text-h3">Темы ЕГЭ</p>
          <p className="text-body-sm text-secondary">Реальные темы из базы заданий</p>
        </div>
        <div className={styles.sourceSelect}>
          <span className="text-body-sm text-secondary">Источник:</span>
          <Select
            options={sourceSelectOptions(collections)}
            value={selectedSlug ?? ALL_SOURCES_VALUE}
            onChange={(value) => onSourceChange(value === ALL_SOURCES_VALUE ? null : value)}
            sheetTitle="Источник"
          />
        </div>
      </div>
      <div className={styles.topicList}>
        {topics.length === 0 && (
          <p className="text-body-sm text-secondary">В этом источнике пока нет тем.</p>
        )}
        {topics.map((topic) => {
          const percent = topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;
          return (
            <button
              key={topic.topicId}
              type="button"
              className={styles.topicRow}
              onClick={() => onSelect(topic)}
            >
              <span className={styles.topicBody}>
                <p className="text-body" style={{ fontWeight: 700 }}>
                  {topic.topicName}
                </p>
              </span>
              <span className={styles.topicStats}>
                <span className="text-body-sm text-secondary">
                  {topic.completed} / {topic.total} решено
                </span>
                <ProgressBar value={percent} />
              </span>
              <Icon name="chevronRight" size={18} className={styles.topicArrow} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function TopicDetail({
  subjectName,
  topic,
  onStart,
}: {
  subjectName: string;
  topic: TopicProgressItem;
  onStart: () => void;
}) {
  const percent = topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;
  return (
    <Card>
      <p className="text-h2">{topic.topicName}</p>
      <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-1)' }}>
        {subjectName}
      </p>
      <div className={styles.topicDetailStats}>
        <span className="text-body-sm text-secondary">
          {topic.completed} / {topic.total} решено
        </span>
        <ProgressBar value={percent} />
      </div>
      <Button
        variant="primary"
        onClick={onStart}
        disabled={topic.total === 0}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Начать тренировку <Icon name="arrowRight" size={16} />
      </Button>
    </Card>
  );
}

function TaskNumberGrid({
  numbers,
  collections,
  selectedSlug,
  onSourceChange,
  onSelect,
}: {
  numbers: readonly TaskNumberSummary[];
  collections: readonly CollectionListItem[];
  selectedSlug: string | null;
  onSourceChange: (slug: string | null) => void;
  onSelect: (number: number) => void;
}) {
  return (
    <Card>
      <div className={styles.numberGridHeader}>
        <div>
          <p className="text-h3">Задания по номерам</p>
          <p className="text-body-sm text-secondary">Выбери номер задания ЕГЭ</p>
        </div>
        <div className={styles.sourceSelect}>
          <span className="text-body-sm text-secondary">Источник:</span>
          <Select
            options={sourceSelectOptions(collections)}
            value={selectedSlug ?? ALL_SOURCES_VALUE}
            onChange={(value) => onSourceChange(value === ALL_SOURCES_VALUE ? null : value)}
            sheetTitle="Источник"
          />
        </div>
      </div>
      <div className={styles.numberGrid}>
        {numbers.map((item) => (
          <button
            key={item.number}
            type="button"
            className={styles.numberTile}
            disabled={item.total === 0}
            onClick={() => {
              if (item.total > 0) onSelect(item.number);
            }}
          >
            <span className={styles.numberValue}>№{item.number}</span>
            <span className="text-body-sm text-secondary">
              {item.total > 0 ? `${item.solved}/${item.total}` : 'Нет заданий'}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function TaskNumberDetail({
  subjectName,
  number,
  collections,
  selectedSlug,
  summary,
  onStart,
}: {
  subjectName: string;
  number: number;
  collections: readonly CollectionListItem[];
  selectedSlug: string | null;
  summary: TaskNumberSummary;
  onStart: () => void;
}) {
  const sourceLabel =
    collections.find((c) => c.collection.slug === selectedSlug)?.collection.title ?? 'Общий банк';
  const percent = summary.total > 0 ? (summary.solved / summary.total) * 100 : 0;
  return (
    <Card>
      <p className="text-h2">Задание №{number}</p>
      <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-1)' }}>
        {subjectName} · источник: {sourceLabel} · доступно заданий этого номера: {summary.total}
      </p>
      <div className={styles.topicDetailStats}>
        <span className="text-body-sm text-secondary">
          {summary.total > 0
            ? `${summary.solved} / ${summary.total} решено`
            : 'Нет доступных заданий в этом источнике'}
        </span>
        <ProgressBar value={percent} />
      </div>
      <Button
        variant="primary"
        onClick={onStart}
        disabled={summary.total === 0}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Начать тренировку по №{number} <Icon name="arrowRight" size={16} />
      </Button>
    </Card>
  );
}

function RandomModeCard({
  collections,
  selectedSlug,
  onSourceChange,
  onStart,
}: {
  collections: readonly CollectionListItem[];
  selectedSlug: string | null;
  onSourceChange: (slug: string | null) => void;
  onStart: () => void;
}) {
  return (
    <Card className={styles.placeholderCard}>
      <span className={styles.placeholderIcon}>
        <Icon name="smart" size={28} />
      </span>
      <p className="text-h3">Случайные задания</p>
      <p className="text-body-sm text-secondary">
        Тренировка вперемешку по всем темам — источник задаёт, откуда они берутся
      </p>
      <div className={styles.sourceSelect} style={{ marginTop: 'var(--space-4)' }}>
        <span className="text-body-sm text-secondary">Источник:</span>
        <Select
          options={sourceSelectOptions(collections)}
          value={selectedSlug ?? ALL_SOURCES_VALUE}
          onChange={(value) => onSourceChange(value === ALL_SOURCES_VALUE ? null : value)}
          sheetTitle="Источник"
        />
      </div>
      <Button variant="primary" onClick={onStart} style={{ marginTop: 'var(--space-4)' }}>
        Начать случайное задание <Icon name="arrowRight" size={16} />
      </Button>
    </Card>
  );
}

function VariantBuilder({
  taskNumberCount,
  onStart,
}: {
  taskNumberCount: number;
  onStart: (firstNumber: number) => void;
}) {
  const allNumbers = Array.from({ length: taskNumberCount }, (_, i) => i + 1);
  const [source, setSource] = useState<TaskSourceId>('fipi');
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const activeSource = taskSources.find((s) => s.id === source)!;

  function toggleNumber(number: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allNumbers));
  }

  function reset() {
    setSelected(new Set());
  }

  const allSelected = selected.size === allNumbers.length;
  const sortedSelected = [...selected].sort((a, b) => a - b);

  return (
    <Card>
      <p className="text-h3">Полные варианты ЕГЭ</p>
      <p className="text-body-sm text-secondary">
        Собери собственный вариант из нужных заданий и источников
      </p>

      <p className={styles.builderStepLabel}>1. Выбери источник</p>
      <div className={styles.sourceGrid}>
        {taskSources.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.sourceCard, source === item.id && styles.sourceCardActive)}
            onClick={() => setSource(item.id)}
          >
            <Icon name={sourceGlyphIcon[item.glyph]} size={20} />
            <span className="text-body-sm" style={{ fontWeight: 700 }}>
              {item.cardTitle}
            </span>
            <span className="text-body-sm text-secondary">{item.cardCaption}</span>
          </button>
        ))}
      </div>

      <div className={styles.builderStepHeader}>
        <p className={styles.builderStepLabel}>2. Выбери номера заданий</p>
        <button
          type="button"
          className={styles.selectAllRow}
          onClick={() => (allSelected ? reset() : selectAll())}
        >
          <span className={clsx(styles.checkbox, allSelected && styles.checkboxChecked)}>
            {allSelected && <Icon name="check" size={14} />}
          </span>
          Выбрать всё
        </button>
      </div>
      <div className={styles.numberChipGrid}>
        {allNumbers.map((number) => (
          <button
            key={number}
            type="button"
            className={clsx(styles.numberChip, selected.has(number) && styles.numberChipActive)}
            onClick={() => toggleNumber(number)}
          >
            {number}
          </button>
        ))}
      </div>

      <div className={styles.builderSummary}>
        <Icon name="variant" size={18} />
        <span className={styles.builderSummaryBody}>
          <p className="text-body-sm" style={{ fontWeight: 700 }}>
            Выбрано {selected.size} заданий
          </p>
          <p className="text-body-sm text-secondary">
            {selected.size > 0 ? `Номера: ${sortedSelected.join(', ')}` : 'Номера не выбраны'} ·
            Источник: {activeSource.cardTitle}
          </p>
        </span>
        <Button variant="secondary" onClick={reset} disabled={selected.size === 0}>
          <Icon name="retry" size={16} /> Сбросить
        </Button>
      </div>

      <Button
        variant="primary"
        fullWidth
        disabled={selected.size === 0}
        onClick={() => onStart(sortedSelected[0]!)}
        style={{ marginTop: 'var(--space-4)' }}
      >
        <Icon name="play" size={16} /> Собрать вариант и начать решать
      </Button>
    </Card>
  );
}

function ModePlaceholder({
  icon,
  title,
  note,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  note: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className={styles.placeholderCard}>
      <span className={styles.placeholderIcon}>
        <Icon name={icon} size={28} />
      </span>
      <p className="text-h3">{title}</p>
      <p className="text-body-sm text-secondary">{note}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} style={{ marginTop: 'var(--space-4)' }}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
