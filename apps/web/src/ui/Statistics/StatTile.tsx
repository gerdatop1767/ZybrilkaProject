import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import { useCountUp } from '../../lib/useCountUp.js';
import styles from './StatTile.module.css';

export interface StatTileProps {
  icon: IconName;
  iconColor: string;
  label: string;
  /** Animated with useCountUp when numeric; rendered as-is otherwise (e.g. "2 мин 14 сек"). */
  value: number | string;
  suffix?: string;
  deltaLabel?: ReactNode;
  deltaDirection?: 'up' | 'down';
  className?: string;
}

/**
 * Headline stat card (Statistics — the four top tiles on both
 * platforms: "Решено заданий" / "Правильных ответов" / "Среднее
 * время" / "Текущий уровень"). Numeric values count up on mount via
 * the same `useCountUp` hook Result/Home already use.
 */
export function StatTile({
  icon,
  iconColor,
  label,
  value,
  suffix,
  deltaLabel,
  deltaDirection,
  className,
}: StatTileProps) {
  const numeric = typeof value === 'number' ? value : null;
  const animated = useCountUp(numeric ?? 0, 700);

  return (
    <div className={`${styles.tile} ${className ?? ''}`}>
      <span className={styles.iconBadge} style={{ background: `${iconColor}26`, color: iconColor }}>
        <Icon name={icon} size={20} />
      </span>
      <p className="text-body-sm text-secondary">{label}</p>
      <p className={styles.value}>
        {numeric === null ? value : Math.round(animated)}
        {suffix}
      </p>
      {deltaLabel && (
        <span
          className={`${styles.delta} ${deltaDirection === 'down' ? styles.deltaDown : styles.deltaUp}`}
        >
          <Icon name={deltaDirection === 'down' ? 'trendDown' : 'trend'} size={14} />
          {deltaLabel}
        </span>
      )}
    </div>
  );
}
