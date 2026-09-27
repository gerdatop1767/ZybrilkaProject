import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { sampleTask } from '../../data/sampleTask.js';
import { userStats } from '../../data/sampleProgress.js';
import {
  taskNumberProgress as mockTaskNumberProgress,
  topicMasteryRows,
  mockExams,
  computeDifficultTopics,
} from '../../data/sampleStatistics.js';
import { getProgressSummary } from '../../lib/api.js';
import { toTaskNumberProgress } from '../../lib/progressAdapter.js';
import type { ProgressSummary } from '@zybrilka/shared';
import { Card } from '../../ui/Card/Card.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { StatTile } from '../../ui/Statistics/StatTile.js';
import { TaskNumberBars } from '../../ui/Statistics/TaskNumberBars.js';
import { TaskNumberGrid } from '../../ui/Statistics/TaskNumberGrid.js';
import { TopicProgressRow } from '../../ui/Statistics/TopicProgressRow.js';
import { MockExamCard, NewMockExamCard } from '../../ui/Statistics/MockExamCard.js';
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
];

/**
 * Mobile Statistics (S1 Block 6, approved design —
 * mobile/07_statistics.png): the "Общая" sub-tab reproduces the
 * approved composition in full. The other three sub-tabs are real,
 * switchable tabs with no approved screenshot yet, so — per the same
 * rule already applied to desktop "Учебный центр"/"Меню" — they show
 * the neutral WIP placeholder rather than an invented layout.
 */
export function StatisticsMobile() {
  const { navigate } = useNavigation();
  const [subTab, setSubTab] = useState('overview');
  const subject = subjects.find((s) => s.id === sampleTask.subjectId) ?? subjects[0]!;
  const [realProgress, setRealProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getProgressSummary()
      .then((data) => {
        if (!cancelled) setRealProgress(data);
      })
      .catch(() => {
        // No backend data yet (or the request failed) — screen stays on
        // the demo profile numbers below.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const difficultTopics = useMemo(() => computeDifficultTopics(), []);
  const taskNumberProgress = useMemo(
    () => (realProgress ? toTaskNumberProgress(realProgress.byTaskNumber) : mockTaskNumberProgress),
    [realProgress],
  );
  const solvedTotal = realProgress?.solvedTotal ?? userStats.solvedTotal;
  const accuracyPercent = realProgress
    ? Math.round(realProgress.accuracyPercent)
    : userStats.accuracy;
  const avgExamPercent = Math.round(
    mockExams.reduce((sum, e) => sum + e.percent, 0) / mockExams.length,
  );

  function openTask(taskNumber: number) {
    navigate({
      screen: 'task',
      subjectId: sampleTask.subjectId,
      taskNumber,
      taskId: sampleTask.id,
    });
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

      <Tabs items={subTabs} activeId={subTab} onChange={setSubTab} aria-label="Раздел статистики" />

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
            <TaskNumberGrid rows={taskNumberProgress} onSelect={openTask} />
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
              {topicMasteryRows.map((row) => (
                <TopicProgressRow
                  key={row.topic}
                  icon={row.icon}
                  topic={row.topic}
                  masteryPercent={row.masteryPercent}
                  onSelect={() => openTask(sampleTask.number)}
                />
              ))}
            </div>
          </Card>
          <Card className={styles.donutCard}>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Распределение ошибок по темам</p>
            </div>
            <DonutChart
              ariaLabel="Распределение ошибок по темам"
              size={160}
              segments={difficultTopics.map((t) => ({
                label: t.topic,
                value: t.errorPercent,
                percent: t.errorPercent,
                color: t.color,
              }))}
              centerLabel={
                <>
                  <p className="text-h3">{difficultTopics.length}</p>
                  <p className="text-body-sm text-secondary">тем</p>
                </>
              }
            />
          </Card>
        </FadeIn>
      )}

      {subTab === 'exams' && (
        <FadeIn className={styles.stack}>
          <Card className={styles.summaryCard}>
            <CircularProgress
              value={avgExamPercent}
              variant={avgExamPercent >= 75 ? 'success' : avgExamPercent < 60 ? 'error' : 'default'}
              size={72}
              label="Средний результат"
            >
              <span className="text-body" style={{ fontWeight: 700 }}>
                {avgExamPercent}%
              </span>
            </CircularProgress>
            <div>
              <p className="text-body" style={{ fontWeight: 700 }}>
                {mockExams.length} пробника решено
              </p>
              <p className="text-body-sm text-secondary">средний результат</p>
            </div>
          </Card>
          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Решённые пробники</p>
            </div>
            <div className={styles.examGrid}>
              {mockExams.map((exam) => (
                <MockExamCard key={exam.id} exam={exam} />
              ))}
              <NewMockExamCard />
            </div>
          </Card>
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
              deltaLabel={`${realProgress?.correctTotal ?? Math.round((accuracyPercent / 100) * solvedTotal)} верных`}
            />
            <StatTile
              icon="xp"
              iconColor="var(--color-gold)"
              label="Текущая серия"
              value={userStats.streakDays}
              suffix=" дней"
            />
            <StatTile
              icon="time"
              iconColor="var(--color-accent-primary)"
              label="Среднее время"
              value="2:14"
              deltaLabel="на задание"
            />
          </div>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Прогресс по заданиям (1–19)</p>
            </div>
            <TaskNumberBars rows={taskNumberProgress} onSelect={openTask} />
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
              {topicMasteryRows.map((row) => (
                <TopicProgressRow
                  key={row.topic}
                  icon={row.icon}
                  topic={row.topic}
                  masteryPercent={row.masteryPercent}
                  onSelect={() => openTask(sampleTask.number)}
                />
              ))}
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
              {mockExams.map((exam) => (
                <MockExamCard key={exam.id} exam={exam} />
              ))}
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
