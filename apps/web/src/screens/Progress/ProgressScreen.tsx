import { subjects } from '../../data/subjects.js';
import {
  recentActivity,
  topicMastery,
  userStats,
  weeklyActivity,
  weekdayLabels,
} from '../../data/sampleProgress.js';
import { Card } from '../../ui/Card/Card.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader.js';
import { clsx } from '../../lib/clsx.js';
import { useCountUp } from '../../lib/useCountUp.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './ProgressScreen.module.css';

const maxWeeklyActivity = Math.max(...weeklyActivity);

/**
 * Progress (Design Spec Section 9): accuracy, solved tasks, streak,
 * per-subject/topic mastery with weak topics flagged, and a lightweight
 * activity bar row — no new chart dependency, per instructions.
 */
export function ProgressScreen() {
  const accuracy = useCountUp(userStats.accuracy);

  return (
    <SlideUp className={styles.stack}>
      <h1 className="text-h1">Прогресс</h1>

      <Card elevated className={styles.statsRow}>
        <div className={styles.statCard}>
          <CircularProgress value={accuracy} label="Точность">
            <span className="text-h3">{Math.round(accuracy)}%</span>
          </CircularProgress>
          <span className="text-body-sm text-secondary">Точность</span>
        </div>
        <div className={styles.statCard}>
          <p className="text-stat">{userStats.solvedTotal}</p>
          <span className="text-body-sm text-secondary">Решено всего</span>
        </div>
        <div className={styles.statCard}>
          <p className="text-stat">{userStats.streakDays}</p>
          <span className="text-body-sm text-secondary">Дней подряд</span>
        </div>
      </Card>

      <div>
        <SectionHeader title="Активность за неделю" />
        <Card>
          <div className={styles.weekRow}>
            {weeklyActivity.map((count, i) => (
              <div key={weekdayLabels[i]} className={styles.weekBarColumn}>
                <div
                  className={styles.weekBar}
                  style={{ height: `${(count / maxWeeklyActivity) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="text-label">{weekdayLabels[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SectionHeader title="Прогресс по предметам" />
        <Card>
          {subjects.map((subject) => (
            <div key={subject.id} className={styles.subjectRow}>
              <span className={clsx('text-body-sm', styles.subjectName)}>{subject.shortName}</span>
              <ProgressBar
                value={subject.mastery}
                label={subject.shortName}
                className={styles.subjectBar}
              />
              <span className={clsx('text-body-sm', styles.subjectValue)}>{subject.mastery}%</span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionHeader title="Темы по математике" />
        <Card>
          {topicMastery.map((topic) => (
            <div key={topic.topic} className={styles.topicRow}>
              {topic.weak && <span className={styles.weakDot} aria-label="Слабая тема" />}
              <span className={clsx('text-body-sm', styles.topicName)}>{topic.topic}</span>
              <span className="text-body-sm text-secondary">{topic.mastery}%</span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionHeader title="Недавняя активность" />
        <Card>
          {recentActivity.map((entry) => (
            <div key={entry.id} className={styles.activityRow}>
              <Icon name={entry.correct ? 'success' : 'errorCircle'} size={18} />
              <span className={clsx('text-body-sm', styles.activityText)}>{entry.topic}</span>
              <span className="text-body-sm text-secondary">{entry.date}</span>
            </div>
          ))}
        </Card>
      </div>
    </SlideUp>
  );
}
