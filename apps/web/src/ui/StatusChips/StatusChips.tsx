import { userStats } from '../../data/sampleProgress.js';
import { StreakBadge } from '../RankBadge/StreakBadge.js';
import { LevelBadge } from '../RankBadge/LevelBadge.js';
import { clsx } from '../../lib/clsx.js';
import styles from './StatusChips.module.css';

export interface StatusChipsProps {
  className?: string;
}

/**
 * The streak + level chips that sit in every persistent header across
 * the approved design (S1 Block 6) — mobile and desktop alike. One
 * shared component so the two chips stay visually identical wherever
 * they appear, reading real values from the shared progress data.
 * The streak flame / level crown come from `StreakBadge`/`LevelBadge`
 * (lib/rank.ts) — the same components /rating and /friends use, so a
 * given streak/level always shows the same illustration everywhere.
 */
export function StatusChips({ className }: StatusChipsProps) {
  const levelPercent = Math.round((userStats.xp / userStats.xpToNextLevel) * 100);

  return (
    <div className={clsx(styles.row, className)}>
      <div className={styles.chip}>
        <StreakBadge days={userStats.streakDays} size={20} className={styles.flameIcon} />
        <span className={styles.chipText}>
          <span className={styles.chipLabel}>Серия</span>
          <span className={styles.chipValue}>{userStats.streakDays} дней</span>
        </span>
      </div>
      <div className={clsx(styles.chip, styles.levelChip)}>
        <div className={styles.levelChipRow}>
          <LevelBadge level={userStats.level} size={20} className={styles.crownIcon} />
          <span className={styles.chipText}>
            <span className={styles.chipLabel}>Уровень</span>
            <span className={styles.chipValue}>{userStats.level}</span>
          </span>
        </div>
        <span className={styles.levelBar} aria-hidden="true">
          <span className={styles.levelBarFill} style={{ width: `${levelPercent}%` }} />
        </span>
      </div>
    </div>
  );
}
