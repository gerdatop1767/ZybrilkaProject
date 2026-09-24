import { useEffect, useRef, useState } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: readonly TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  'aria-label': string;
}

/**
 * Segmented tab control (Design Spec Section 6 / 13): tapping a tab
 * slides a single indicator to its position rather than crossfading
 * separate active/inactive backgrounds, matching the "active indicator
 * slides to the selected tab" motion rule.
 */
export function Tabs({ items, activeId, onChange, className, 'aria-label': ariaLabel }: TabsProps) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current.get(activeId);
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeId, items]);

  return (
    <div className={clsx(styles.tabs, className)} role="tablist" aria-label={ariaLabel}>
      <span
        className={styles.indicator}
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
        }}
        aria-hidden="true"
      />
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => {
            if (el) tabRefs.current.set(item.id, el);
            else tabRefs.current.delete(item.id);
          }}
          type="button"
          role="tab"
          className={styles.tab}
          aria-selected={item.id === activeId}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
