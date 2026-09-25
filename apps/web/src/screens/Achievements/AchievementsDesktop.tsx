import { useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import {
  achievements,
  computeAchievementsSummary,
  countByCategory,
  type Achievement,
  type AchievementCategory,
} from '../../data/sampleAchievements.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { AchievementCardDesktop } from '../../ui/Achievements/AchievementCardDesktop.js';
import { colorForAchievement } from '../../ui/Achievements/achievementColors.js';
import { formatDateShort } from '../../lib/formatDate.js';
import { FadeIn } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './AchievementsDesktop.module.css';

type FilterId = 'all' | AchievementCategory;

const categoryOrder: readonly AchievementCategory[] = [
  'general',
  'math',
  'russian',
  'english',
  'streak',
];
const categoryLabel: Record<AchievementCategory, string> = {
  general: 'Общие достижения',
  math: 'Математика',
  russian: 'Русский язык',
  english: 'Английский язык',
  streak: 'Достижения серии',
};
const filterLabel: Record<FilterId, string> = {
  all: 'Все',
  ...categoryLabel,
};

/**
 * Desktop Достижения (S1 Block 6, approved design —
 * desktop/09_achievements.png): filter chips with real computed
 * counts, achievements grouped into sections when "Все" is active, and
 * a sidebar with a progress ring, recent unlocks and the nearest
 * locked goal — all derived from `data/sampleAchievements.ts`.
 */
export function AchievementsDesktop() {
  const { navigate } = useNavigation();
  const [filter, setFilter] = useState<FilterId>('all');

  const summary = useMemo(() => computeAchievementsSummary(), []);
  const groups = useMemo(() => buildGroups(achievements, filter), [filter]);

  const recent = useMemo(
    () =>
      achievements
        .filter((a) => a.unlocked && a.unlockedAt)
        .sort((a, b) => (b.unlockedAt! > a.unlockedAt! ? 1 : -1))
        .slice(0, 4),
    [],
  );

  const nextGoal = useMemo(
    () =>
      achievements
        .filter((a) => !a.unlocked)
        .sort((a, b) => b.progress / b.target - a.progress / a.target)[0],
    [],
  );

  return (
    <FadeIn className={styles.page}>
      <div>
        <h1 className="text-h1">Достижения</h1>
        <p className="text-body-sm text-secondary">
          Решай задания, развивайся и открывай новые награды!
        </p>
      </div>

      <div className={styles.filterRow}>
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
          Все {achievements.length}
        </Chip>
        {categoryOrder.map((category) => (
          <Chip key={category} selected={filter === category} onClick={() => setFilter(category)}>
            {filterLabel[category]} {countByCategory(category)}
          </Chip>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.sections}>
          {groups.map((group) => (
            <div key={group.category}>
              {group.showHeader && (
                <div className={styles.sectionHeaderRow}>
                  <p className="text-h3">{categoryLabel[group.category]}</p>
                </div>
              )}
              <div className={styles.cardsGrid}>
                {group.items.map((a) => (
                  <AchievementCardDesktop key={a.id} achievement={a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.progressCard}>
            <div className={styles.progressRingBox}>
              <CircularProgress value={summary.unlockedPercent} size={100} strokeWidth={10}>
                <span style={{ color: 'var(--color-gold)' }}>
                  <Icon name="star" size={20} />
                </span>
              </CircularProgress>
              <div className={styles.progressRingCenter}>
                <p className="text-h2">{summary.unlockedCount}</p>
                <p className="text-body-sm text-secondary">из {summary.total}</p>
              </div>
            </div>
            <div>
              <p className={clsx('text-h2', styles.progressPercent)}>{summary.unlockedPercent}%</p>
              <p className="text-body-sm text-secondary">достижений получено</p>
            </div>
          </Card>

          <Card>
            <p className="text-h3">Последние достижения</p>
            <div className={styles.recentList}>
              {recent.map((a) => {
                const color = colorForAchievement(a);
                return (
                  <div key={a.id} className={styles.recentRow}>
                    <span className={styles.recentIcon} style={{ ['--accent' as string]: color }}>
                      <Icon name={a.icon} size={16} />
                    </span>
                    <span className={styles.recentBody}>
                      <p className="text-body-sm">{a.title}</p>
                    </span>
                    <span className={clsx('text-body-sm', styles.recentDate)}>
                      {a.unlockedAt && formatDateShort(a.unlockedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {nextGoal && (
            <Card className={styles.nextGoalCard}>
              <p className="text-h3">Следующая цель</p>
              <div className={styles.nextGoalRow}>
                <span
                  className={styles.nextGoalIcon}
                  style={{ ['--accent' as string]: colorForAchievement(nextGoal) }}
                >
                  <Icon name={nextGoal.icon} size={22} />
                </span>
                <span className={styles.recentBody}>
                  <p className="text-body" style={{ fontWeight: 700 }}>
                    {nextGoal.title}
                  </p>
                  <p className="text-body-sm text-secondary">{nextGoal.description}</p>
                  <p className="text-body-sm text-secondary">
                    {nextGoal.progress} / {nextGoal.target}
                  </p>
                </span>
              </div>
              <Button variant="primary" fullWidth onClick={() => navigate({ screen: 'training' })}>
                Перейти к тренировке <Icon name="arrowRight" size={16} />
              </Button>
            </Card>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

interface AchievementGroup {
  category: AchievementCategory;
  showHeader: boolean;
  items: readonly Achievement[];
}

function buildGroups(items: readonly Achievement[], filter: FilterId): readonly AchievementGroup[] {
  if (filter === 'all') {
    return categoryOrder
      .map((category) => ({
        category,
        showHeader: true,
        items: items.filter((a) => a.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }
  return [
    { category: filter, showHeader: false, items: items.filter((a) => a.category === filter) },
  ];
}
