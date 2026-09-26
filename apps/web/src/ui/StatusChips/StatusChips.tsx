import { userStats } from '../../data/sampleProgress.js';
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
 */
export function StatusChips({ className }: StatusChipsProps) {
  const levelPercent = Math.round((userStats.xp / userStats.xpToNextLevel) * 100);

  return (
    <div className={clsx(styles.row, className)}>
      <div className={styles.chip}>
        <img
          src="/branding/v2/badges/flame.png"
          alt=""
          aria-hidden="true"
          className={styles.flameIcon}
        />
        <span className={styles.chipText}>
          <span className={styles.chipLabel}>Серия</span>
          <span className={styles.chipValue}>{userStats.streakDays} дней</span>
        </span>
      </div>
      <div className={clsx(styles.chip, styles.levelChip)}>
        <div className={styles.levelChipRow}>
          <img
            src="/branding/v2/badges/crown.png"
            alt=""
            aria-hidden="true"
            className={styles.crownIcon}
          />
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
