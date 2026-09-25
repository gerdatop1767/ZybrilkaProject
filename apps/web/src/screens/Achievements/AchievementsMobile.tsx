import { useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { sampleTask } from '../../data/sampleTask.js';
import { userStats } from '../../data/sampleProgress.js';
import {
  achievements,
  computeAchievementsSummary,
  type Achievement,
} from '../../data/sampleAchievements.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { StatTile } from '../../ui/Statistics/StatTile.js';
import { AchievementCardMobile } from '../../ui/Achievements/AchievementCardMobile.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './AchievementsMobile.module.css';

const subTabs = [
  { id: 'all', label: 'Все' },
  { id: 'learning', label: 'Обучение' },
  { id: 'streak', label: 'Серия' },
  { id: 'accuracy', label: 'Точность' },
  { id: 'speed', label: 'Скорость' },
];

const accuracyIds = new Set(['accuracy-80', 'master-90', 'perfect-week']);
const speedIds = new Set(['speedster']);

function matchesSubTab(a: Achievement, tab: string): boolean {
  if (tab === 'all') return true;
  if (tab === 'streak') return a.category === 'streak';
  if (tab === 'accuracy') return accuracyIds.has(a.id);
  if (tab === 'speed') return speedIds.has(a.id);
  // 'learning' — everything else: subject mastery + general non-accuracy/speed items.
  return a.category !== 'streak' && !accuracyIds.has(a.id) && !speedIds.has(a.id);
}

function buildStreakDays(): readonly { label: string; active: boolean; isToday: boolean }[] {
  const today = new Date('2026-09-25T00:00:00Z');
  const days = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push({
      label: `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
      active: true,
      isToday: false,
    });
  }
  days.push({ label: 'Сегодня', active: true, isToday: true });
  return days;
}

/**
 * Mobile Достижения (S1 Block 6, approved design —
 * mobile/09_achievements.png): level card with XP progress, the
 * streak-day strip, and a filterable achievement grid — the same
 * `data/sampleAchievements.ts` the desktop screen reads.
 */
export function AchievementsMobile() {
  const { navigate } = useNavigation();
  const subject = subjects.find((s) => s.id === sampleTask.subjectId) ?? subjects[0]!;
  const [subTab, setSubTab] = useState('all');

  const summary = useMemo(() => computeAchievementsSummary(), []);
  const streakDays = useMemo(() => buildStreakDays(), []);
  const filtered = useMemo(() => achievements.filter((a) => matchesSubTab(a, subTab)), [subTab]);
  const xpPercent = Math.round((userStats.xp / userStats.xpToNextLevel) * 100);

  return (
    <SlideUp className={styles.stack}>
      <SubjectHeaderMobile
        subject={subject}
        title="Достижения"
        trailing={
          <button type="button" className={styles.trailingButton} aria-label="Настройки">
            <Icon name="settings" size={20} />
          </button>
        }
      />

      <div className={styles.levelCard}>
        <div className={styles.levelHex}>
          <div className={styles.levelHexShape}>
            <p className="text-h2">{userStats.level}</p>
            <p className="text-body-sm">уровень</p>
          </div>
        </div>
        <div className={styles.levelBody}>
          <p className="text-body" style={{ fontWeight: 700 }}>
            Продолжаешь в том же духе!
          </p>
          <ProgressBar value={xpPercent} label="Прогресс уровня" />
          <p className="text-body-sm text-secondary">
            {userStats.xp} / {userStats.xpToNextLevel} XP
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatTile
          className={styles.statTile}
          icon="flame"
          iconColor="var(--color-error)"
          label="дней подряд"
          value={userStats.streakDays}
        />
        <StatTile
          className={styles.statTile}
          icon="target"
          iconColor="var(--color-gold)"
          label="решено задач"
          value={userStats.solvedTotal}
        />
        <StatTile
          className={styles.statTile}
          icon="star"
          iconColor="var(--color-warning)"
          label="точность"
          value={userStats.accuracy}
          suffix="%"
        />
        <StatTile
          className={styles.statTile}
          icon="progress"
          iconColor="var(--color-accent-secondary)"
          label="ср. время"
          value="2:14"
        />
      </div>

      <div className={styles.streakStrip}>
        {streakDays.map((day, i) => (
          <div key={i} className={styles.streakDay}>
            <span
              className={`${styles.streakCircle} ${
                day.isToday ? styles.streakToday : day.active ? styles.streakCircleActive : ''
              }`}
            >
              <Icon name={day.isToday ? 'gift' : 'flame'} size={18} />
            </span>
            <span className={styles.streakLabel}>{day.label}</span>
          </div>
        ))}
      </div>

      <div>
        <div className={styles.sectionHeaderRow}>
          <p className="text-h3">
            Мои достижения ({summary.unlockedCount}/{summary.total})
          </p>
        </div>
        <Tabs
          items={subTabs}
          activeId={subTab}
          onChange={setSubTab}
          aria-label="Категория достижений"
        />
      </div>

      <div className={styles.cardsGrid}>
        {filtered.map((a) => (
          <AchievementCardMobile key={a.id} achievement={a} />
        ))}
      </div>

      <button
        type="button"
        className={styles.ratingLink}
        onClick={() => navigate({ screen: 'rating' })}
      >
        <Icon name="crown" size={20} />
        <span className={styles.ratingLinkLabel}>Рейтинг</span>
        <Icon name="chevronRight" size={18} />
      </button>
    </SlideUp>
  );
}
