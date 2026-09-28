import { Icon } from '../Icon/Icon.js';
import { clsx } from '../../lib/clsx.js';
import styles from './StatusChips.module.css';

export interface StatusChipsProps {
  className?: string;
}

/**
 * The streak + level chips that sit in every persistent header across
 * the approved design (S1 Block 6) — mobile and desktop alike. Neither
 * a streak calculation nor a level/XP system exists in the backend
 * yet (see docs/PRODUCTION_DATA_MODEL.md before building either instead
 * of guessing), so both chips show a neutral "—" rather than a
 * fabricated number — never `StreakBadge`/`LevelBadge`, whose
 * illustration is itself picked by a day/level count that doesn't
 * exist here.
 */
export function StatusChips({ className }: StatusChipsProps) {
  return (
    <div className={clsx(styles.row, className)}>
      <div className={styles.chip}>
        <Icon name="flame" size={20} className={styles.flameIcon} />
        <span className={styles.chipText}>
          <span className={styles.chipLabel}>Серия</span>
          <span className={styles.chipValue}>—</span>
        </span>
      </div>
      <div className={clsx(styles.chip, styles.levelChip)}>
        <div className={styles.levelChipRow}>
          <Icon name="crown" size={20} className={styles.crownIcon} />
          <span className={styles.chipText}>
            <span className={styles.chipLabel}>Уровень</span>
            <span className={styles.chipValue}>—</span>
          </span>
        </div>
      </div>
    </div>
  );
}
