import type { ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './MobileShell.module.css';

export interface MobileShellProps {
  children: ReactNode;
  /** Omit on task/battle screens, which hide navigation entirely. */
  nav?: ReactNode;
}

/**
 * Mobile layout foundation (Design Spec Section 3 / 9): a
 * phone-proportioned column (max ~480px) that centers on wider
 * viewports instead of stretching into a desktop dashboard, with the
 * primary nav docked to the bottom on mobile and collapsing into a
 * left rail at >=768px.
 *
 * The scrollable content always reserves enough bottom padding to
 * clear both the fixed BottomNav (when present) and the iOS
 * safe-area-inset-bottom, so the last card/button on any screen is
 * never covered by the nav — see MobileShell.module.css.
 */
export function MobileShell({ children, nav }: MobileShellProps) {
  return (
    <div className={styles.shell}>
      {nav && <div className={styles.nav}>{nav}</div>}
      <main className={clsx(styles.content, Boolean(nav) && styles.contentWithNav)}>
        {children}
      </main>
    </div>
  );
}
