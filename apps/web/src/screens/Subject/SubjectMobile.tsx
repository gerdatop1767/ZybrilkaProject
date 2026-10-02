import { useEffect, useState } from 'react';
import type { CollectionListItem, ProgressByTopicResponse, TaskPublic } from '@zybrilka/shared';
import { useNavigation, type Route } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { startCustomVariant, startRealTask } from '../../lib/startTraining.js';
import { getProgressByTopic, listCollections } from '../../lib/api.js';
import { getSubjectContent, type SubjectModeId } from '../../data/subjectContent.js';
import { Card } from '../../ui/Card/Card.js';
import { Button } from '../../ui/Button/Button.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Icon } from '../../ui/Icon/Icon.js';
import type { IconName } from '../../ui/Icon/icons.js';
import { Select } from '../../ui/Select/Select.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { FavoritesList } from '../../ui/Favorites/FavoritesList.js';
import { clsx } from '../../lib/clsx.js';
import { FadeIn, SlideUp } from '../../ui/motion/motion.js';
import styles from './SubjectMobile.module.css';

/** See SubjectDesktop.tsx for why "Общий банк" needs its own sentinel value. */
const ALL_SOURCES_VALUE = '__all__';

function sourceSelectOptions(collections: readonly CollectionListItem[]) {
  return [
    { value: ALL_SOURCES_VALUE, label: 'Общий банк' },
    ...collections.map((item) => ({ value: item.collection.slug, label: item.collection.title })),
  ];
}

const modes: readonly { id: SubjectModeId; label: string; icon: IconName }[] = [
  { id: 'topics', label: 'Темы', icon: 'reference' },
  { id: 'variants', label: 'Варианты', icon: 'variant' },
  { id: 'random', label: 'Случайные', icon: 'smart' },
  { id: 'favorites', label: 'Избранное', icon: 'favorite' },
];

export interface SubjectMobileProps {
  subjectId: string;
  from?: 'subjectCatalog' | 'learningCenter';
  /** Pre-selects the "Источник" filter — see SubjectDesktopProps. */
  collectionSlug?: string;
  /** Opens straight into this mode tab (e.g. Result's "К списку
   * заданий" wants "По номерам") instead of the default "Темы". */
  initialMode?: SubjectModeId;
}

type TopicProgressItem = ProgressByTopicResponse['items'][number];

/**
 * Mobile Subject page — the same generic per-subject component
 * SubjectDesktop is (data comes from `data/subjectContent.ts`, never
 * hardcoded per subject), restacked into one vertical column instead
 * of desktop's main+sidebar grid: hero, a horizontally scrollable mode
 * switcher, the active mode's content, then the desktop sidebar's
 * three cards (progress ring, quick start, recent solves) in order
 * below it. No approved mobile screenshot exists for this screen, so
 * it stays a functional adaptation rather than an invented layout.
 */
export function SubjectMobile({ subjectId, collectionSlug, initialMode }: SubjectMobileProps) {
  const { navigate, back } = useNavigation();
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;
  const content = getSubjectContent(subject.id);

  const [mode, setMode] = useState<SubjectModeId>(initialMode ?? 'topics');
  const [selectedTopic, setSelectedTopic] = useState<TopicProgressItem | null>(null);
  const [collections, setCollections] = useState<readonly CollectionListItem[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [randomSlug, setRandomSlug] = useState<string | null>(collectionSlug ?? null);
  const [topicsSlug, setTopicsSlug] = useState<string | null>(collectionSlug ?? null);
  const [topics, setTopics] = useState<readonly TopicProgressItem[]>([]);

  const solved = Math.round((subject.taskCount * subject.mastery) / 100);

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

  // Derived, not synced via an effect — see SubjectDesktop.tsx for why.
  const knownSlugs = new Set(collections.map((item) => item.collection.slug));
  const effectiveRandomSlug =
    collectionsLoaded && randomSlug && !knownSlugs.has(randomSlug) ? null : randomSlug;
  const effectiveTopicsSlug =
    collectionsLoaded && topicsSlug && !knownSlugs.has(topicsSlug) ? null : topicsSlug;

  // Real topics (Block D) — see SubjectDesktop.tsx for why the static
  // per-subject content topics can't be reused here.
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

  // Where Task's back arrow returns — this subject page in whichever
  // mode/source is currently active (audit Block 3), so Subject → Task
  // → Back lands back here instead of falling through to Home.
  function currentReturnTo(): Route {
    const slug =
      mode === 'random'
        ? (effectiveRandomSlug ?? undefined)
        : mode === 'topics'
          ? (effectiveTopicsSlug ?? undefined)
          : (collectionSlug ?? undefined);
    return { screen: 'subject', subjectId: subject.id, collectionSlug: slug, initialMode: mode };
  }

  function startTraining(taskNumber: number, collection?: string) {
    startRealTask(navigate, {
      subject: subject.id,
      taskNumber,
      collection,
      returnTo: currentReturnTo(),
    });
  }

  function startVariant(taskNumbers: readonly number[], collection?: string) {
    startCustomVariant(navigate, {
      subject: subject.id,
      taskNumbers,
      collection,
      returnTo: currentReturnTo(),
    });
  }

  function startTopicTraining(topic: TopicProgressItem) {
    startRealTask(navigate, {
      subject: subject.id,
      topic: topic.topicId,
      collection: effectiveTopicsSlug ?? undefined,
      returnTo: currentReturnTo(),
    });
  }

  function handleSelectFavorite(task: TaskPublic) {
    navigate({
      screen: 'task',
      subjectId: task.subjectId,
      taskNumber: task.taskNumber,
      taskId: task.id,
      returnTo: currentReturnTo(),
    });
  }

  function selectMode(id: SubjectModeId) {
    setMode(id);
    setSelectedTopic(null);
  }

  function handleBack() {
    if (selectedTopic) {
      setSelectedTopic(null);
      return;
    }
    back();
  }

  const headerTitle = selectedTopic ? selectedTopic.topicName : subject.shortName;

  return (
    <SlideUp className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="Назад" onClick={handleBack}>
          <Icon name="back" size={20} />
        </button>
        <p className="text-body" style={{ fontWeight: 700 }}>
          {headerTitle}
        </p>
      </div>

      {!selectedTopic && (
        <>
          <Card className={styles.hero} style={{ ['--subject-accent' as string]: subject.color }}>
            <span className={styles.heroThumb}>
              <img
                src={`/branding/v2/subjects/${subject.id}.png`}
                alt=""
                aria-hidden="true"
                className={styles.heroImg}
              />
            </span>
            <p className="text-h2">{subject.shortName}</p>
            <p className="text-body-sm text-secondary">{content.tagline}</p>
            <div className={styles.heroStats}>
              <span className={styles.heroStat}>
                <Icon name="target" size={14} />
                <strong>{solved}</strong> решено
              </span>
              <span className={styles.heroStat}>
                <Icon name="progress" size={14} />
                <strong>{subject.mastery}%</strong> точность
              </span>
            </div>
          </Card>

          <div className={styles.modeRow}>
            {modes.map((item) => (
              <Chip
                key={item.id}
                icon={item.icon}
                selected={mode === item.id}
                onClick={() => selectMode(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
        </>
      )}

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
      {mode === 'variants' && (
        <VariantBuilder
          taskNumberCount={content.taskNumberCount}
          collections={collections}
          onStart={startVariant}
        />
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
        <Card>
          <p className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>
            Избранное
          </p>
          <FavoritesList subjectId={subject.id} onSelect={handleSelectFavorite} />
        </Card>
      )}

      {!selectedTopic && (
        <>
          <Card>
            <p className="text-h3">Твой прогресс</p>
            <div className={styles.progressRing}>
              <CircularProgress value={subject.mastery} size={96} strokeWidth={9}>
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
                onClick={() => selectMode('random')}
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
                onClick={() => selectMode('variants')}
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
            <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-2)' }}>
              Пока нет данных о недавних решениях.
            </p>
          </Card>
        </>
      )}
    </SlideUp>
  );
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
      <p className="text-h3">Темы ЕГЭ</p>
      <p className="text-body-sm text-secondary">Реальные темы из базы заданий</p>
      <div className={styles.sourceSelect}>
        <span className="text-body-sm text-secondary">Источник:</span>
        <Select
          options={sourceSelectOptions(collections)}
          value={selectedSlug ?? ALL_SOURCES_VALUE}
          onChange={(value) => onSourceChange(value === ALL_SOURCES_VALUE ? null : value)}
          sheetTitle="Источник"
        />
      </div>
      <div className={styles.topicList}>
        {topics.length === 0 && (
          <p className="text-body-sm text-secondary">В этом источнике пока нет тем.</p>
        )}
        {topics.map((topic, index) => {
          const percent = topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;
          return (
            <FadeIn key={topic.topicId} delayMs={index * 25}>
              <button type="button" className={styles.topicRow} onClick={() => onSelect(topic)}>
                <span className={styles.topicBody}>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    {topic.topicName}
                  </p>
                  <span className={styles.topicStatsRow}>
                    <ProgressBar value={percent} className={styles.topicBar} />
                    <span className="text-label text-secondary">
                      {topic.completed}/{topic.total}
                    </span>
                  </span>
                </span>
                <Icon name="chevronRight" size={18} className={styles.topicArrow} />
              </button>
            </FadeIn>
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
      <p className="text-h3">{topic.topicName}</p>
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
        fullWidth
        onClick={onStart}
        disabled={topic.total === 0}
        style={{ marginTop: 'var(--space-4)' }}
      >
        Начать тренировку <Icon name="arrowRight" size={16} />
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
        <Icon name="smart" size={26} />
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
      <Button variant="primary" fullWidth onClick={onStart} style={{ marginTop: 'var(--space-4)' }}>
        Начать случайное задание <Icon name="arrowRight" size={16} />
      </Button>
    </Card>
  );
}

function VariantBuilder({
  taskNumberCount,
  collections,
  onStart,
}: {
  taskNumberCount: number;
  collections: readonly CollectionListItem[];
  onStart: (taskNumbers: readonly number[], collection?: string) => void;
}) {
  const allNumbers = Array.from({ length: taskNumberCount }, (_, i) => i + 1);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const activeSourceLabel =
    collections.find((item) => item.collection.slug === selectedSlug)?.collection.title ??
    'Общий банк';

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
      <div className={styles.sourceSelect}>
        <Select
          options={sourceSelectOptions(collections)}
          value={selectedSlug ?? ALL_SOURCES_VALUE}
          onChange={(value) => setSelectedSlug(value === ALL_SOURCES_VALUE ? null : value)}
          sheetTitle="Источник"
        />
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
            Источник: {activeSourceLabel}
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
        onClick={() => onStart(sortedSelected, selectedSlug ?? undefined)}
        style={{ marginTop: 'var(--space-4)' }}
      >
        <Icon name="play" size={16} /> Собрать вариант и начать решать
      </Button>
    </Card>
  );
}
