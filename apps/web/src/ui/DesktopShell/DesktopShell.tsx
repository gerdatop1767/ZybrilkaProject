import type { ReactNode } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { Logo } from '../Logo/Logo.js';
import { StatusChips } from '../StatusChips/StatusChips.js';
import { Button } from '../Button/Button.js';
import { Icon } from '../Icon/Icon.js';
import { DesktopSidebar } from './DesktopSidebar.js';
import { clsx } from '../../lib/clsx.js';
import styles from './DesktopShell.module.css';

export type DesktopShellVariant = 'marketing' | 'app';

export interface DesktopShellProps {
  /** 'marketing' = Home/Subject-catalog's top-bar-only hero layout;
   * 'app' = every other screen's persistent left sidebar. Separate
   * approved compositions (S1 Block 6), not one responsive layout. */
  variant: DesktopShellVariant;
  children: ReactNode;
}

/**
 * Desktop app shell (S1 Block 6 — approved design). Unlike mobile,
 * desktop Home is a logged-out-style marketing page (hero + "Начать
 * бесплатно"), while every other desktop screen is a logged-in
 * dashboard with a persistent left sidebar — that split is
 * intentional and comes straight from the approved screenshots, not
 * an invented distinction.
 */
export function DesktopShell({ variant, children }: DesktopShellProps) {
  const { navigate } = useNavigation();

  return (
    <div className={styles.shell}>
      <header className={clsx(styles.topHeader, variant === 'app' && styles.topHeaderApp)}>
        <div className={styles.topHeaderInner}>
          <Logo icon="desktop" size={40} />
          <div className={styles.topHeaderActions}>
            {variant === 'marketing' ? (
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
      <div className={clsx(styles.body, variant === 'app' && styles.bodyApp)}>
        {variant === 'app' && <DesktopSidebar />}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
