import type { ReactNode } from 'react';
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
 */
export function MobileShell({ children, nav }: MobileShellProps) {
  return (
    <div className={styles.shell}>
      {nav && <div className={styles.nav}>{nav}</div>}
      <main className={styles.content}>{children}</main>
    </div>
  );
}
