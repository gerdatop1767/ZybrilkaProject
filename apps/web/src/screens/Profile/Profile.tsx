import { useNavigation } from '../../lib/navigation.js';
import { achievementPreview, userStats } from '../../data/sampleProgress.js';
import { Card } from '../../ui/Card/Card.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Mascot } from '../../ui/Mascot/Mascot.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader.js';
import { clsx } from '../../lib/clsx.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './Profile.module.css';

/**
 * Profile (Design Spec Section 7): identity, level/XP, streak,
 * achievements preview and settings entry points.
 */
export function Profile() {
  const { navigate } = useNavigation();

  return (
    <SlideUp className={styles.stack}>
      <h1 className="text-h1">Профиль</h1>

      <Card elevated className={styles.identity}>
        <CircularProgress value={(userStats.xp / userStats.xpToNextLevel) * 100} label="Уровень">
          <Mascot pose="idle" size={40} />
        </CircularProgress>
        <div className={styles.identityText}>
          <p className="text-h3">{userStats.name}</p>
          <p className="text-body-sm text-secondary">Уровень {userStats.level}</p>
        </div>
      </Card>

      <Card>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className="text-stat">{userStats.xp}</span>
            <span className="text-body-sm text-secondary">XP</span>
          </div>
          <div className={styles.stat}>
            <span className="text-stat">{userStats.streakDays}</span>
            <span className="text-body-sm text-secondary">Дней подряд</span>
          </div>
        </div>
        <ProgressBar
          value={(userStats.xp / userStats.xpToNextLevel) * 100}
          label="Опыт до следующего уровня"
        />
      </Card>

      <div>
        <SectionHeader title="Достижения" />
        <Card>
          <div className={styles.achievementRow}>
            {achievementPreview.map((achievement) => (
              <div
                key={achievement.id}
                className={clsx(
                  styles.achievementBadge,
                  achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked,
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
      </div>

      <div>
        <SectionHeader title="Настройки" />
        <Card>
          <button
            type="button"
            className={styles.settingsRow}
            onClick={() => navigate({ screen: 'onboarding' })}
          >
            <span className={styles.settingsIcon}>
              <Icon name="smart" size={18} />
            </span>
            <span className={styles.settingsLabel}>Пройти диагностику заново</span>
          </button>
          <div className={styles.settingsInfo}>
            <Icon name="info" size={18} />
            <span className="text-body-sm">
              Анимации следуют системной настройке «Уменьшить движение»
            </span>
          </div>
        </Card>
      </div>
    </SlideUp>
  );
}
