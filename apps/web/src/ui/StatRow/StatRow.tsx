import type { ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './StatRow.module.css';

export interface StatRowItem {
  id: string;
  value: ReactNode;
  label: string;
}

export interface StatRowProps {
  items: readonly StatRowItem[];
  className?: string;
}

/**
 * A row of 2-4 numbers sitting directly on the page/HeroBand
 * background, divided by hairlines instead of each getting its own
 * `Card` (Design Spec redesign, S1 Block 5) — replaces the "three
 * identical bordered stat boxes" pattern the earlier dashboard-style
 * screens used.
 */
export function StatRow({ items, className }: StatRowProps) {
  return (
    <div className={clsx(styles.row, className)}>
      {items.map((item) => (
        <div key={item.id} className={styles.item}>
          {item.value}
          <span className={clsx('text-body-sm text-secondary', styles.label)}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
