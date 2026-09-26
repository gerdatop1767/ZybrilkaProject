import { getLevelAsset } from '../../lib/rank.js';
import { clsx } from '../../lib/clsx.js';
import styles from './RankBadge.module.css';

export interface LevelBadgeProps {
  level: number;
  size?: number;
  className?: string;
  lazy?: boolean;
}

/** The level-crown illustration — never emoji, never a plain lucide
 * icon (see lib/rank.ts for the level → asset rule). */
export function LevelBadge({ level, size = 20, className, lazy = false }: LevelBadgeProps) {
  return (
    <img
      src={getLevelAsset(level)}
      alt="Уровень"
      width={size}
      height={size}
      loading={lazy ? 'lazy' : 'eager'}
      className={clsx(styles.badge, className)}
      style={{ width: size, height: size }}
    />
  );
}
