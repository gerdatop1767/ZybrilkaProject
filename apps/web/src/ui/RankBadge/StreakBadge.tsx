import { getStreakAsset } from '../../lib/rank.js';
import { clsx } from '../../lib/clsx.js';
import styles from './RankBadge.module.css';

export interface StreakBadgeProps {
  days: number;
  size?: number;
  className?: string;
  /** Lazy-load when the badge is below the fold (a rating row far down
   * a long table) — never on header/summary badges, which must render
   * immediately with no layout jump. */
  lazy?: boolean;
}

/** The streak-days flame illustration — never emoji, never a plain
 * lucide icon (see lib/rank.ts for the day-count → asset rule). */
export function StreakBadge({ days, size = 20, className, lazy = false }: StreakBadgeProps) {
  return (
    <img
      src={getStreakAsset(days)}
      alt="Серия"
      width={size}
      height={size}
      loading={lazy ? 'lazy' : 'eager'}
      className={clsx(styles.badge, className)}
      style={{ width: size, height: size }}
    />
  );
}
