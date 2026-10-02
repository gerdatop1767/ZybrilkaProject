import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { startRealTask } from '../../lib/startTraining.js';
import { computeMistakesSummary, type Mistake } from '../../data/sampleMistakes.js';
import {
  getMistakes,
  getProgressByTaskNumber,
  getProgressByTopic,
  getProgressSummary,
  getTaskNumberStatisticsDetail,
} from '../../lib/api.js';
import { toSampleMistake } from '../../lib/mistakeAdapter.js';
import { toTaskNumberProgress } from '../../lib/progressAdapter.js';
import type {
  ProgressByTopicResponse,
  ProgressSummary,
  TaskNumberStatisticsDetail,
} from '@zybrilka/shared';
import { Card } from '../../ui/Card/Card.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { BackRow } from '../../ui/BackRow/BackRow.js';
import { StatTile } from '../../ui/Statistics/StatTile.js';
import { TaskNumberBars } from '../../ui/Statistics/TaskNumberBars.js';
import { TaskNumberGrid } from '../../ui/Statistics/TaskNumberGrid.js';
import { TaskNumberDetailPanel } from '../../ui/Statistics/TaskNumberDetailPanel.js';
import { TopicProgressRow } from '../../ui/Statistics/TopicProgressRow.js';
import { NewMockExamCard } from '../../ui/Statistics/MockExamCard.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { DonutChart } from '../../ui/Charts/DonutChart.js';
import { FadeIn } from '../../ui/motion/motion.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './StatisticsMobile.module.css';

const subTabs = [
  { id: 'overview', label: 'Общая' },
  { id: 'byTask', label: 'По заданиям' },
  { id: 'byTopic', label: 'По темам' },
  { id: 'exams', label: 'Пробники' },
  { id: 'achievements', label: 'Достижения' },
  { id: 'rating', label: 'Рейтинг' },
];

const DEFAULT_SUBJECT_ID = 'math';

/**
 * Mobile Statistics (S1 Block 6, approved design —
 * mobile/07_statistics.png): the "Общая" sub-tab reproduces the
 * approved composition in full. The other three sub-tabs are real,
 * switchable tabs with no approved screenshot yet, so — per the same
 * rule already applied to desktop "Учебный центр"/"Меню" — they show
 * the neutral WIP placeholder rather than an invented layout.
 *
 * Every number here is real (Block D): task-number/topic X/Y from the
 * same by-task-number/by-topic endpoints Subject uses, the errors
 * donut from the real `/mistakes` feed. Level/XP/streak/average-time
 * and mock exams have no backend metric behind them at all — they show
 * a neutral "—"/empty state rather than fabricated numbers.
 */
export function StatisticsMobile() {
  const { navigate } = useNavigation();
  const [subTab, setSubTab] = useState('overview');
  const subject = subjects.find((s) => s.id === DEFAULT_SUBJECT_ID) ?? subjects[0]!;
  const [realProgress, setRealProgress] = useState<ProgressSummary | null>(null);
  const [taskNumberItems, setTaskNumberItems] = useState<
    Awaited<ReturnType<typeof getProgressByTaskNumber>>['items']
  >([]);
  const [topics, setTopics] = useState<ProgressByTopicResponse['items']>([]);
  const [mistakes, setMistakes] = useState<readonly Mistake[]>([]);
  const [selectedTaskNumber, setSelectedTaskNumber] = useState<number | null>(null);
  const [detail, setDetail] = useState<TaskNumberStatisticsDetail | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void getProgressSummary()
      .then((data) => {
        if (!cancelled) setRealProgress(data);
      })
      .catch(() => {
        // No backend data yet (or the request failed) — headline tiles
        // stay at their neutral zero/dash state below.
      });
    void getProgressByTaskNumber({ subject: subject.id })
      .then((res) => {
        if (!cancelled) setTaskNumberItems(res.items);
      })
      .catch(() => {
        if (!cancelled) setTaskNumberItems([]);
      });
    void getProgressByTopic({ subject: subject.id })
      .then((res) => {
        if (!cancelled) setTopics(res.items);
      })
      .catch(() => {
        if (!cancelled) setTopics([]);
      });
    void getMistakes()
      .then((items) => {
        if (!cancelled) setMistakes(items.map(toSampleMistake));
      })
      .catch(() => {
        if (!cancelled) setMistakes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const difficultTopics = useMemo(
    () =>
      mistakes.length > 0
        ? computeMistakesSummary(mistakes).topicBreakdown.filter((row) => row.topic !== 'Остальные')
        : [],
    [mistakes],
  );
  const taskNumberProgress = useMemo(
    () => toTaskNumberProgress(taskNumberItems),
    [taskNumberItems],
  );
  const solvedTotal = realProgress?.solvedTotal ?? 0;
  const accuracyPercent = realProgress ? Math.round(realProgress.accuracyPercent) : 0;

  function openDetail(taskNumber: number) {
    setSelectedTaskNumber(taskNumber);
  }

  function openTopic(topic: ProgressByTopicResponse['items'][number]) {
    startRealTask(navigate, { subject: subject.id, topic: topic.topicId });
  }

  useEffect(() => {
    if (selectedTaskNumber === null) return;
    let cancelled = false;
    void getTaskNumberStatisticsDetail(subject.id, selectedTaskNumber)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [subject.id, selectedTaskNumber]);

  // The detail fetch above only ever resolves for the number it was
  // started for — once the selection changes, a previous result (if
  // any) is stale and must not flash before the new fetch resolves.
  const displayedDetail = detail && detail.taskNumber === selectedTaskNumber ? detail : undefined;

  if (selectedTaskNumber !== null) {
    return (
      <SlideUp className={styles.stack}>
        <BackRow label="Статистика" onBack={() => setSelectedTaskNumber(null)} />
        <Card className={styles.cardHeaderRow}>
          <p className="text-h3">№{selectedTaskNumber}</p>
        </Card>
        <TaskNumberDetailPanel taskNumber={selectedTaskNumber} detail={displayedDetail} />
      </SlideUp>
    );
  }

  return (
    <SlideUp className={styles.stack}>
      <SubjectHeaderMobile
        subject={subject}
        title="Статистика"
        trailing={
          <button type="button" className={styles.trailingButton} aria-label="Выбрать период">
            <Icon name="calendar" size={20} />
          </button>
        }
      />

      <Tabs
        items={subTabs}
        activeId={subTab}
        onChange={setSubTab}
        aria-label="Раздел статистики"
        scrollable
      />

      {subTab === 'byTask' && (
        <FadeIn className={styles.stack}>
          <Card className={styles.summaryCard}>
            <CircularProgress value={accuracyPercent} size={72} label="Твой прогресс">
              <span className="text-body" style={{ fontWeight: 700 }}>
                {accuracyPercent}%
              </span>
            </CircularProgress>
            <div>
              <p className="text-body" style={{ fontWeight: 700 }}>
                {solvedTotal} из {subject.taskCount}
              </p>
              <p className="text-body-sm text-secondary">заданий решено</p>
            </div>
          </Card>
          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Задания по номерам</p>
            </div>
            <p className="text-body-sm text-secondary" style={{ marginTop: 'calc(var(--space-2) * -1)' }}>
              Нажми на номер задания, чтобы посмотреть подробную статистику
            </p>
            <TaskNumberGrid rows={taskNumberProgress} onSelect={openDetail} />
          </Card>
        </FadeIn>
      )}

      {subTab === 'byTopic' && (
        <FadeIn className={styles.stack}>
          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Темы ЕГЭ</p>
            </div>
            <div className={styles.topicList}>
              {topics.length === 0 && (
                <p className="text-body-sm text-secondary">Пока нет данных по темам.</p>
              )}
              {topics.map((topic) => {
                const percent =
                  topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;
                return (
                  <TopicProgressRow
                    key={topic.topicId}
                    icon="topic"
                    topic={topic.topicName}
                    masteryPercent={percent}
                    onSelect={() => openTopic(topic)}
                  />
                );
              })}
            </div>
          </Card>
          <Card className={styles.donutCard}>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Распределение ошибок по темам</p>
            </div>
            {difficultTopics.length === 0 ? (
              <p className="text-body-sm text-secondary">Пока нет данных об ошибках.</p>
            ) : (
              <DonutChart
                ariaLabel="Распределение ошибок по темам"
                size={160}
                segments={difficultTopics.map((t) => ({
                  label: t.topic,
                  value: t.percent,
                  percent: t.percent,
                  color: t.color,
                }))}
                centerLabel={
                  <>
                    <p className="text-h3">{difficultTopics.length}</p>
                    <p className="text-body-sm text-secondary">тем</p>
                  </>
                }
              />
            )}
          </Card>
        </FadeIn>
      )}

      {subTab === 'exams' && (
        <FadeIn className={styles.stack}>
          <Card className={styles.summaryCard}>
            <CircularProgress value={0} size={72} label="Средний результат">
              <span className="text-body" style={{ fontWeight: 700 }}>
                —
              </span>
            </CircularProgress>
            <div>
              <p className="text-body" style={{ fontWeight: 700 }}>
                0 пробников решено
              </p>
              <p className="text-body-sm text-secondary">пробные варианты ещё не поддерживаются</p>
            </div>
          </Card>
          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Решённые пробники</p>
            </div>
            <div className={styles.examGrid}>
              <NewMockExamCard />
            </div>
          </Card>
        </FadeIn>
      )}

      {subTab === 'achievements' && (
        <FadeIn className={styles.stack}>
          {/* No achievements backend exists yet (unlock logic,
              categories, progress tracking) — the same honest
              placeholder the standalone Достижения screen already
              shows, never fabricated unlock data. */}
          <WipPlaceholder title="Достижения" note="Экран в разработке — следующий блок." />
        </FadeIn>
      )}

      {subTab === 'rating' && (
        <FadeIn className={styles.stack}>
          {/* No leaderboard backend exists yet (ranking aggregation,
              persistent user profiles) — same honest placeholder the
              standalone Рейтинг screen already shows. */}
          <WipPlaceholder title="Рейтинг" note="Экран в разработке — следующий блок." />
        </FadeIn>
      )}

      {subTab === 'overview' && (
        <>
          <div className={styles.statsGrid}>
            <StatTile
              icon="variant"
              iconColor="var(--color-accent-primary-end)"
              label="Решено заданий"
              value={solvedTotal}
              deltaLabel={`из ${subject.taskCount}`}
            />
            <StatTile
              icon="progress"
              iconColor="var(--color-accent-secondary)"
              label="Точность"
              value={accuracyPercent}
              suffix="%"
              deltaLabel={`${realProgress?.correctTotal ?? 0} верных`}
            />
            <StatTile
              icon="xp"
              iconColor="var(--color-gold)"
              label="Текущая серия"
              value="—"
              deltaLabel="скоро"
            />
            <StatTile
              icon="time"
              iconColor="var(--color-accent-primary)"
              label="Среднее время"
              value="—"
              deltaLabel="скоро"
            />
          </div>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Прогресс по заданиям</p>
            </div>
            <TaskNumberBars rows={taskNumberProgress} onSelect={openDetail} />
          </Card>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Прогресс по темам</p>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => navigate({ screen: 'subjectCatalog' })}
              >
                Все темы <Icon name="chevronRight" size={14} />
              </button>
            </div>
            <div className={styles.topicList}>
              {topics.length === 0 && (
                <p className="text-body-sm text-secondary">Пока нет данных по темам.</p>
              )}
              {topics.map((topic) => {
                const percent =
                  topic.total > 0 ? Math.round((topic.completed / topic.total) * 100) : 0;
                return (
                  <TopicProgressRow
                    key={topic.topicId}
                    icon="topic"
                    topic={topic.topicName}
                    masteryPercent={percent}
                    onSelect={() => openTopic(topic)}
                  />
                );
              })}
            </div>
          </Card>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Решённые пробники</p>
              <span className={styles.linkButton}>
                Все пробники <Icon name="chevronRight" size={14} />
              </span>
            </div>
            <div className={styles.examScroller}>
              <NewMockExamCard />
            </div>
          </Card>

          <button
            type="button"
            className={styles.mistakesLink}
            onClick={() => navigate({ screen: 'mistakes' })}
          >
            <Icon name="mistakes" size={20} />
            <span className={styles.mistakesLinkLabel}>Мои ошибки</span>
            <Icon name="chevronRight" size={18} />
          </button>

          <button
            type="button"
            className={styles.mistakesLink}
            onClick={() => navigate({ screen: 'about' })}
          >
            <Icon name="info" size={20} />
            <span className={styles.mistakesLinkLabel}>О проекте</span>
            <Icon name="chevronRight" size={18} />
          </button>
        </>
      )}
    </SlideUp>
  );
}
