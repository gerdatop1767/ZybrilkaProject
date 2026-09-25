import type { ReactNode } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { Logo } from '../Logo/Logo.js';
import { StatusChips } from '../StatusChips/StatusChips.js';
import { Button } from '../Button/Button.js';
import { Icon } from '../Icon/Icon.js';
import { DesktopSidebar } from './DesktopSidebar.js';
import { clsx } from '../../lib/clsx.js';
import styles from './DesktopShell.module.css';

export interface DesktopShellProps {
  /** 'cta' = Home's logged-out-style "Начать заниматься" header (the
   * only screen that shows it); 'status' = every other screen's
   * streak/level chips. */
  header?: 'cta' | 'status';
  /** Whether the persistent left sidebar renders — independent of the
   * header, since Task/Result use the status header WITHOUT a sidebar
   * (no approved desktop screenshot shows one there). */
  sidebar?: boolean;
  children: ReactNode;
}

/**
 * Desktop app shell (S1 Block 6 — approved design). Unlike mobile,
 * desktop Home is a logged-out-style marketing page (hero + "Начать
 * бесплатно"), while most other desktop screens are a logged-in
 * dashboard with a persistent left sidebar — except Training/Result,
 * which show the status header but no sidebar. All three
 * combinations come straight from the approved screenshots, not an
 * invented distinction.
 */
export function DesktopShell({ header = 'status', sidebar = true, children }: DesktopShellProps) {
  const { navigate } = useNavigation();

  return (
    <div className={styles.shell}>
      <header className={clsx(styles.topHeader, sidebar && styles.topHeaderApp)}>
        <div className={styles.topHeaderInner}>
          <Logo icon="desktop" size={40} />
          <div className={styles.topHeaderActions}>
            {header === 'cta' ? (
              <Button variant="primary" onClick={() => navigate({ screen: 'training' })}>
                Начать заниматься <Icon name="arrowRight" size={16} />
              </Button>
            ) : (
              <StatusChips />
            )}
            <button
              type="button"
              className={styles.menuButton}
              aria-label="Меню"
              onClick={() => navigate({ screen: 'menu' })}
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>
      <div className={clsx(styles.body, sidebar && styles.bodyApp)}>
        {sidebar && <DesktopSidebar />}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
