import { Icon } from '../Icon/Icon.js';
import type { Achievement } from '../../data/sampleAchievements.js';
import { colorForAchievement } from './achievementColors.js';
import { clsx } from '../../lib/clsx.js';
import styles from './AchievementCardMobile.module.css';

/**
 * Mobile achievement card (S1 Block 6, approved design —
 * mobile/09_achievements.png): a hexagon badge (locked = grey + lock
 * icon, unlocked = the achievement's color + glow) with a thin
 * progress bar and a green checkmark once complete.
 */
export function AchievementCardMobile({ achievement }: { achievement: Achievement }) {
  const color = colorForAchievement(achievement);
  const percent = Math.round((achievement.progress / achievement.target) * 100);

  return (
    <div
      className={clsx(styles.card, achievement.unlocked && styles.cardUnlocked)}
      style={{ ['--accent' as string]: color }}
    >
      <div className={styles.hexWrap}>
        <div
          className={clsx(styles.hex, achievement.unlocked ? styles.hexUnlocked : styles.hexLocked)}
        >
          <Icon name={achievement.unlocked ? achievement.icon : 'lock'} size={26} />
        </div>
      </div>
      <p className={clsx('text-body', styles.title)} style={{ fontWeight: 700 }}>
        {achievement.title}
      </p>
      <p className={clsx('text-body-sm', 'text-secondary', styles.description)}>
        {achievement.description}
      </p>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={achievement.title}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: 'var(--color-bg-elevated)',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${percent}%`,
              borderRadius: 3,
              background: color,
            }}
          />
        </span>
        <span className={styles.progressValue}>
          {achievement.progress} / {achievement.target}
        </span>
        {achievement.unlocked && (
          <span className={styles.checkBadge} aria-hidden="true">
            <Icon name="check" size={12} />
          </span>
        )}
      </div>
    </div>
  );
}
