import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import type { StatsPeriod } from '../../data/sampleStatistics.js';
import { computeMistakesSummary, type Mistake } from '../../data/sampleMistakes.js';
import { getMistakes, getProgressDaily, getProgressSummary } from '../../lib/api.js';
import { toSampleMistake } from '../../lib/mistakeAdapter.js';
import { toDailyPoints } from '../../lib/progressAdapter.js';
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

const periodDays: Record<StatsPeriod, number> = { '7d': 7, '30d': 30, all: 90 };

/**
 * Desktop Statistics (S1 Block 6, approved design —
 * desktop/07_statistics.png): subject + period controls drive a real
 * fetch of `/progress/daily`, zero-filled to the requested window
 * (Block D) — no more seeded/synthetic series. "Сложные темы"/
 * "Распределение по темам" use the real `/mistakes` feed (same
 * `computeMistakesSummary` the Mistakes screens already use), not the
 * static sample set. Average time/level/XP have no backend metric at
 * all and show a neutral "—" rather than a fabricated number.
 */
export function StatisticsDesktop() {
  const { navigate } = useNavigation();
  const [subjectId, setSubjectId] = useState('math');
  const [period, setPeriod] = useState<StatsPeriod>('30d');

  const [realProgress, setRealProgress] = useState<ProgressSummary | null>(null);
  const [dailyItems, setDailyItems] = useState<
    Awaited<ReturnType<typeof getProgressDaily>>['items']
  >([]);
  const [mistakes, setMistakes] = useState<readonly Mistake[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getProgressSummary()
      .then((data) => {
        if (!cancelled) setRealProgress(data);
      })
      .catch(() => {
        // No backend data yet (or the request failed) — headline tiles
        // stay at their neutral zero state below.
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
  }, []);

  const days = periodDays[period];
  useEffect(() => {
    let cancelled = false;
    void getProgressDaily({ days })
      .then((res) => {
        if (!cancelled) setDailyItems(res.items);
      })
      .catch(() => {
        if (!cancelled) setDailyItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const solvedTotal = realProgress?.solvedTotal ?? 0;
  const correctTotal = realProgress?.correctTotal ?? 0;
  const correctPercent = realProgress ? Math.round(realProgress.accuracyPercent) : 0;

  const mistakesSummary = useMemo(() => computeMistakesSummary(mistakes), [mistakes]);
  const difficultTopics = useMemo(
    () => mistakesSummary.topicBreakdown.filter((row) => row.topic !== 'Остальные'),
    [mistakesSummary],
  );
  const points = useMemo(() => toDailyPoints(dailyItems, days), [dailyItems, days]);
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
          value={solvedTotal}
        />
        <StatTile
          icon="success"
          iconColor="var(--color-success)"
          label="Правильных ответов"
          value={correctPercent}
          suffix="%"
          deltaLabel={`${correctTotal} из ${solvedTotal}`}
        />
        <StatTile
          icon="time"
          iconColor="var(--color-warning)"
          label="Среднее время"
          value="—"
          deltaLabel="скоро"
        />
        <StatTile
          icon="progress"
          iconColor="var(--color-accent-secondary)"
          label="Текущий уровень"
          value="—"
          deltaLabel="скоро"
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
          {mistakesSummary.total === 0 ? (
            <p className="text-body-sm text-secondary">Пока нет данных об ошибках.</p>
          ) : (
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
          )}
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
          {difficultTopics.length === 0 ? (
            <p className="text-body-sm text-secondary">Пока нет данных об ошибках.</p>
          ) : (
            <RankedBarList
              items={difficultTopics.map((t) => ({
                label: t.topic,
                value: t.percent,
                color: t.color,
                displayValue: `${t.percent}%`,
              }))}
              maxValue={100}
            />
          )}
        </Card>
      </div>
    </FadeIn>
  );
}
