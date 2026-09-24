import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { recentActivity, achievementPreview, userStats } from '../../data/sampleProgress.js';
import { sampleTask } from '../../data/sampleTask.js';
import { Button } from '../../ui/Button/Button.js';
import { HeroBand } from '../../ui/HeroBand/HeroBand.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader.js';
import { StatRow } from '../../ui/StatRow/StatRow.js';
import { clsx } from '../../lib/clsx.js';
import { useCountUp } from '../../lib/useCountUp.js';
import { useToast } from '../../ui/Toast/ToastProvider.js';
import { FadeIn, SlideUp } from '../../ui/motion/motion.js';
import styles from './Home.module.css';

/**
 * Home (Design Spec redesign, S1 Block 5): the app's identity screen.
 * One dominant anchor — the greeting HeroBand, with the primary CTA
 * overlapping its lower edge — then a single inline progress+activity
 * group and a compact achievement strip. No card grid: this screen
 * should read as a composition, not a stack of equal-weight widgets.
 */
export function Home() {
  const { navigate } = useNavigation();
  const { show } = useToast();
  const xp = useCountUp(userStats.xp);

  function previewAchievement(label: string) {
    show({ variant: 'success', message: `Достижение получено: ${label}` });
  }

  return (
    <SlideUp className={styles.stack}>
      <HeroBand>
        <div className={styles.greeting}>
          <div className={styles.greetingText}>
            <p className="text-h2">Привет, {userStats.name}!</p>
            <p className="text-body-sm text-secondary">
              Сегодня ты ближе к своей цели, чем вчера. Продолжаем!
            </p>
          </div>
          <div className={styles.streakChip}>
            <Icon name="flame" size={18} />
            <span className="text-body-sm">{userStats.streakDays}</span>
          </div>
        </div>

        <div className={styles.subjectRow}>
          {subjects.map((subject) => (
            <span key={subject.id} className={styles.subjectItem}>
              <span
                className={styles.subjectDot}
                style={{ background: subject.color }}
                aria-hidden="true"
              />
              <span className="text-body-sm">{subject.shortName}</span>
              <span className="text-body-sm text-secondary">{subject.mastery}%</span>
            </span>
          ))}
        </div>
      </HeroBand>

      <Button
        variant="primary"
        fullWidth
        className={styles.cta}
        onClick={() => navigate({ screen: 'task', taskId: sampleTask.id })}
      >
        Продолжить тренировку
      </Button>

      <div className={styles.progressGroup}>
        <SectionHeader eyebrow="Сегодня" title="Твой прогресс" />
        <StatRow
          items={[
            { id: 'xp', value: <span className="text-stat">{Math.round(xp)}</span>, label: 'XP' },
            {
              id: 'streak',
              value: <span className="text-stat">{userStats.streakDays}</span>,
              label: 'Дней подряд',
            },
          ]}
        />
        <ProgressBar value={(xp / userStats.xpToNextLevel) * 100} label="Опыт" />

        <div className={styles.activityList}>
          {recentActivity.slice(0, 2).map((entry) => (
            <div key={entry.id} className={styles.activityRow}>
              <span
                className={clsx(
                  styles.activityIcon,
                  entry.correct ? styles.activityIconCorrect : styles.activityIconIncorrect,
                )}
              >
                <Icon name={entry.correct ? 'success' : 'errorCircle'} size={16} />
              </span>
              <p className={clsx('text-body-sm', styles.activityText)}>{entry.topic}</p>
              <span className="text-body-sm text-secondary">{entry.date}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.progressLink}
          onClick={() => navigate({ screen: 'progress' })}
        >
          Весь прогресс
          <Icon name="chevronRight" size={16} />
        </button>
      </div>

      <FadeIn>
        <SectionHeader
          title="Достижения"
          action={{ label: 'Все', onClick: () => navigate({ screen: 'profile' }) }}
        />
        <div className={styles.achievementRow}>
          {achievementPreview.map((achievement) =>
            achievement.unlocked ? (
              <button
                key={achievement.id}
                type="button"
                className={clsx(styles.achievementBadge, styles.achievementUnlocked)}
                onClick={() => previewAchievement(achievement.label)}
              >
                <span className={styles.achievementIcon}>
                  <Icon name="achievements" size={20} />
                </span>
                <span className={clsx('text-label', styles.achievementLabel)}>
                  {achievement.label}
                </span>
              </button>
            ) : (
              <div
                key={achievement.id}
                className={clsx(styles.achievementBadge, styles.achievementLocked)}
              >
                <span className={styles.achievementIcon}>
                  <Icon name="lock" size={20} />
                </span>
                <span className={clsx('text-label', styles.achievementLabel)}>
                  {achievement.label}
                </span>
              </div>
            ),
          )}
        </div>
      </FadeIn>
    </SlideUp>
  );
}
