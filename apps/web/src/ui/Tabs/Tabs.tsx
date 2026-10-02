import { useEffect, useRef, useState } from 'react';
import { clsx } from '../../lib/clsx.js';
import { useReducedMotion } from '../../lib/useReducedMotion.js';
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
  /** For a row with more tabs than fit the viewport (e.g. Statistics
   * mobile's 6 sub-tabs): tabs size to their own content and the strip
   * scrolls horizontally instead of forcing every tab to shrink to an
   * equal, cramped width — never a page-level overflow. Omitted (the
   * default) keeps every existing Tabs usage's current equal-width
   * segmented-control look exactly as it was. */
  scrollable?: boolean;
}

/**
 * Segmented tab control (Design Spec Section 6 / 13): tapping a tab
 * slides a single indicator to its position rather than crossfading
 * separate active/inactive backgrounds, matching the "active indicator
 * slides to the selected tab" motion rule.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  className,
  'aria-label': ariaLabel,
  scrollable = false,
}: TabsProps) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = tabRefs.current.get(activeId);
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    // Keep the active tab visible when the strip scrolls horizontally —
    // e.g. landing directly on a sub-tab that's currently scrolled out
    // of view. `nearest` never scrolls when it's already visible, so
    // this is a no-op for every non-scrollable Tabs usage too.
    if (scrollable && el) {
      el.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [activeId, items, scrollable, reducedMotion]);

  return (
    <div
      ref={listRef}
      className={clsx(styles.tabs, scrollable && styles.scrollable, className)}
      role="tablist"
      aria-label={ariaLabel}
    >
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
          className={clsx(styles.tab, scrollable && styles.tabScrollable)}
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
