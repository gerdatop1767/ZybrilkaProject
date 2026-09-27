import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import {
  dailyActivity,
  sliceByPeriod,
  computeStatisticsSummary,
  computeDifficultTopics,
  type StatsPeriod,
} from '../../data/sampleStatistics.js';
import { computeMistakesSummary } from '../../data/sampleMistakes.js';
import { getProgressSummary } from '../../lib/api.js';
import type { ProgressSummary } from '@zybrilka/shared';
import { Card } from '../../ui/Card/Card.js';
import { Select } from '../../ui/Select/Select.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { Button } from '../../ui/Button/Button.js';
import { StatTile } from '../../ui/Statistics/StatTile.js';
import { BarChart } from '../../ui/Charts/BarChart.js';
import { LineChart } from '../../ui/Charts/LineChart.js';
import { DonutChart } from '../../ui/Charts/DonutChart.js';
import { RankedBarList } from '../../ui/Charts/RankedBarList.js';
import { FadeIn } from '../../ui/motion/motion.js';
import styles from './StatisticsDesktop.module.css';

const periodTabs = [
  { id: '7d', label: '7 дней' },
  { id: '30d', label: '30 дней' },
  { id: 'all', label: 'Все время' },
] as const;

/**
 * Desktop Statistics (S1 Block 6, approved design —
 * desktop/07_statistics.png): subject + period controls drive real
 * filtering of the same seeded daily-activity series feeding both
 * charts below, and "Сложные темы" shares its per-topic error
 * percentages with the Mistakes screen's own donut (data/
 * sampleMistakes.ts) rather than a second, divergent set of numbers.
 */
export function StatisticsDesktop() {
  const { navigate } = useNavigation();
  const [subjectId, setSubjectId] = useState('math');
  const [period, setPeriod] = useState<StatsPeriod>('30d');

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

  const mockSummary = useMemo(() => computeStatisticsSummary(), []);
  // Solved/correct counts are real attempt data; average time, level and
  // XP have no backend yet in this phase and stay on the demo profile.
  const summary = realProgress
    ? {
        ...mockSummary,
        solvedTotal: realProgress.solvedTotal,
        correctCount: realProgress.correctTotal,
        correctPercent: Math.round(realProgress.accuracyPercent),
      }
    : mockSummary;
  const difficultTopics = useMemo(() => computeDifficultTopics(), []);
  const mistakesSummary = useMemo(() => computeMistakesSummary(), []);
  const points = useMemo(() => sliceByPeriod(dailyActivity, period), [period]);
  const showEvery = points.length > 40 ? 10 : points.length > 14 ? 4 : 3;

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.shortName }));

  return (
    <FadeIn className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={`text-h1 ${styles.title}`}>Статистика</h1>
          <p className={`text-body-sm text-secondary ${styles.subtitle}`}>
            Твой прогресс, результаты и слабые темы
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.subjectSelect}>
            <Select options={subjectOptions} value={subjectId} onChange={setSubjectId} />
          </div>
          <Tabs
            items={periodTabs}
            activeId={period}
            onChange={(id) => setPeriod(id as StatsPeriod)}
            aria-label="Период статистики"
            className={styles.periodTabs}
          />
        </div>
      </div>

      <div className={styles.statsRow}>
        <StatTile
          icon="variant"
          iconColor="var(--color-accent-primary-end)"
          label="Решено заданий"
          value={summary.solvedTotal}
          deltaLabel={`+${summary.solvedDeltaPercent}% за последние 30 дней`}
          deltaDirection="up"
        />
        <StatTile
          icon="success"
          iconColor="var(--color-success)"
          label="Правильных ответов"
          value={summary.correctPercent}
          suffix="%"
          deltaLabel={`${summary.correctCount} из ${summary.solvedTotal}`}
        />
        <StatTile
          icon="time"
          iconColor="var(--color-warning)"
          label="Среднее время"
          value={formatDuration(summary.avgTimeSeconds)}
          deltaLabel={`${summary.avgTimeDeltaSeconds > 0 ? '+' : '−'}${Math.abs(summary.avgTimeDeltaSeconds)} сек по сравнению с прошлым месяцем`}
          deltaDirection={summary.avgTimeDeltaSeconds <= 0 ? 'up' : 'down'}
        />
        <StatTile
          icon="progress"
          iconColor="var(--color-accent-secondary)"
          label="Текущий уровень"
          value={summary.currentLevel}
          deltaLabel={`До ${summary.currentLevel + 1} уровня: ${summary.xpToNextLevel - summary.xpIntoLevel} XP`}
        />
      </div>

      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartHeaderText}>
              <p className="text-h3">Активность по дням</p>
              <p className="text-body-sm text-secondary">Количество решённых заданий</p>
            </div>
            <span className={styles.metricLabel}>Решённые задания</span>
          </div>
          <BarChart
            points={points.map((p) => ({ label: p.label, value: p.solved }))}
            labelEvery={showEvery}
          />
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHeaderRow}>
            <p className="text-h3">Распределение по темам</p>
          </div>
          <DonutChart
            ariaLabel="Распределение ошибок по темам"
            segments={mistakesSummary.topicBreakdown.map((s) => ({
              label: s.topic,
              value: s.count,
              percent: s.percent,
              color: s.color,
            }))}
            centerLabel={
              <>
                <p className="text-h2">{mistakesSummary.total}</p>
                <p className="text-body-sm text-secondary">заданий</p>
              </>
            }
          />
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartHeaderText}>
              <p className="text-h3">Динамика правильных ответов</p>
            </div>
            <span className={styles.metricLabel}>Процент правильных ответов</span>
          </div>
          <LineChart
            points={points.map((p) => ({ label: p.label, value: p.accuracyPercent }))}
            labelEvery={showEvery}
          />
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.chartHeaderText}>
              <p className="text-h3">Сложные темы</p>
              <p className="text-body-sm text-secondary">
                Темы, в которых чаще всего бывают ошибки
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate({ screen: 'mistakes' })}>
              Показать все
            </Button>
          </div>
          <RankedBarList
            items={difficultTopics.map((t) => ({
              label: t.topic,
              value: t.errorPercent,
              color: t.color,
              displayValue: `${t.errorPercent}%`,
            }))}
            maxValue={100}
          />
        </Card>
      </div>
    </FadeIn>
  );
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} мин ${seconds} сек`;
}
