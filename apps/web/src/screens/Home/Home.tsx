import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { recentActivity, achievementPreview, userStats } from '../../data/sampleProgress.js';
import { sampleTask } from '../../data/sampleTask.js';
import { Button } from '../../ui/Button/Button.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Mascot } from '../../ui/Mascot/Mascot.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { clsx } from '../../lib/clsx.js';
import { FadeIn, SlideUp } from '../../ui/motion/motion.js';
import styles from './Home.module.css';

/**
 * Home (Design Spec Section 7): the user's dashboard and the entry
 * point into the core loop — task → result → explanation → progress.
 */
export function Home() {
  const { navigate } = useNavigation();

  return (
    <SlideUp className={styles.stack}>
      <header className={styles.header}>
        <p className={clsx('text-h2', styles.wordmark)}>Zybrilka</p>
        <div className={styles.streakChip}>
          <Icon name="flame" size={18} />
          <span className="text-body-sm">{userStats.streakDays} дней подряд</span>
        </div>
      </header>

      <div className={styles.greeting}>
        <Mascot pose="greeting" size={64} />
        <div className={styles.greetingText}>
          <p className="text-h2">Привет, {userStats.name}!</p>
          <p className="text-body-sm text-secondary">
            Сегодня ты ближе к своей цели, чем вчера. Продолжаем!
          </p>
        </div>
      </div>

      <div className={styles.subjectRow}>
        {subjects.map((subject) => (
          <Chip key={subject.id} accentColor={subject.color}>
            {subject.shortName} {subject.mastery}%
          </Chip>
        ))}
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() => navigate({ screen: 'task', taskId: sampleTask.id })}
      >
        Продолжить тренировку
      </Button>

      <Card>
        <div className={styles.sectionHeader}>
          <p className="text-h3">Твой прогресс</p>
          <button
            type="button"
            className={styles.link}
            onClick={() => navigate({ screen: 'progress' })}
          >
            Подробнее →
          </button>
        </div>
        <p className="text-stat">
          {userStats.xp} / {userStats.xpToNextLevel} XP
        </p>
        <ProgressBar value={(userStats.xp / userStats.xpToNextLevel) * 100} label="Опыт" />
      </Card>

      <Card>
        <div className={styles.sectionHeader}>
          <p className="text-h3">Недавняя активность</p>
        </div>
        {recentActivity.slice(0, 3).map((entry) => (
          <div key={entry.id} className={styles.activityRow}>
            <span
              className={clsx(
                styles.activityIcon,
                entry.correct ? styles.activityIconCorrect : styles.activityIconIncorrect,
              )}
            >
              <Icon name={entry.correct ? 'success' : 'errorCircle'} size={18} />
            </span>
            <p className={clsx('text-body-sm', styles.activityText)}>{entry.topic}</p>
            <span className="text-body-sm text-secondary">{entry.date}</span>
          </div>
        ))}
      </Card>

      <FadeIn>
        <Card>
          <div className={styles.sectionHeader}>
            <p className="text-h3">Достижения</p>
            <button
              type="button"
              className={styles.link}
              onClick={() => navigate({ screen: 'profile' })}
            >
              Все →
            </button>
          </div>
          <div className={styles.achievementRow}>
            {achievementPreview.map((achievement) => (
              <div
                key={achievement.id}
                className={clsx(
                  styles.achievementBadge,
                  !achievement.unlocked && styles.achievementLocked,
                )}
              >
                <span className={styles.achievementIcon}>
                  <Icon name={achievement.unlocked ? 'achievements' : 'lock'} size={20} />
                </span>
                <span className={clsx('text-label', styles.achievementLabel)}>
                  {achievement.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>
    </SlideUp>
  );
}
