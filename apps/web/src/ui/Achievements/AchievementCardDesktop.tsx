import { Icon } from '../Icon/Icon.js';
import { ProgressBar } from '../Progress/ProgressBar.js';
import type { Achievement } from '../../data/sampleAchievements.js';
import { colorForAchievement } from './achievementColors.js';
import { formatDateShort } from '../../lib/formatDate.js';
import { clsx } from '../../lib/clsx.js';
import styles from './AchievementCardDesktop.module.css';

export function AchievementCardDesktop({ achievement }: { achievement: Achievement }) {
  const color = colorForAchievement(achievement);
  const percent = Math.round((achievement.progress / achievement.target) * 100);

  return (
    <div
      className={clsx(styles.card, achievement.unlocked && styles.cardUnlocked)}
      style={{ ['--accent' as string]: color }}
    >
      <span className={clsx(styles.iconTile, !achievement.unlocked && styles.iconTileLocked)}>
        <Icon name={achievement.unlocked ? achievement.icon : 'lock'} size={24} />
      </span>
      <div>
        <p className={clsx('text-h3', styles.title, achievement.unlocked && styles.titleUnlocked)}>
          {achievement.title}
        </p>
        <p className={clsx('text-body-sm', 'text-secondary', styles.description)}>
          {achievement.description}
        </p>
      </div>
      <div className={styles.meta}>
        {achievement.unlocked ? (
          <p className={clsx('text-body-sm', styles.unlockedDate)}>
            Получено {achievement.unlockedAt && formatDateShort(achievement.unlockedAt)}
          </p>
        ) : (
          <div className={styles.progressRow}>
            <ProgressBar value={percent} label={`${achievement.title}: прогресс`} />
            <span className={clsx('text-body-sm', 'text-secondary', styles.progressValue)}>
              {achievement.progress} / {achievement.target}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
