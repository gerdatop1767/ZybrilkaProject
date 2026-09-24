import type { ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import { Logo } from '../Logo/Logo.js';
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
 * Renders the Zybrilka logo as a persistent, non-scrolling header
 * whenever `nav` is present (i.e. on the 5 tab screens) — Task/Result/
 * Onboarding omit it entirely to keep their screen space for the task
 * at hand. The header is a normal flex item, not fixed/sticky, so it
 * can never overlap content by construction.
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
      <div className={styles.main}>
        {nav && (
          <header className={styles.header}>
            <Logo size={28} />
          </header>
        )}
        <main
          className={clsx(
            styles.content,
            !nav && styles.contentNoHeader,
            Boolean(nav) && styles.contentWithNav,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
