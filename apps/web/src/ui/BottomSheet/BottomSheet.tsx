import { useId, type ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import { Overlay, usePanelFocus } from '../Overlay/Overlay.js';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom sheet (Design Spec Section 12): the preferred mobile pattern
 * for anything that wants full-width real estate or a scrollable list —
 * the scratchboard, filters, Select's option list, achievement detail.
 * Slides up from the bottom, safe-area aware, swipe-to-dismiss is left
 * to a later block (Escape/backdrop/close-button dismissal covers this
 * one).
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const titleId = useId();
  const panelRef = usePanelFocus(open);

  return (
    <Overlay open={open} onClose={onClose}>
      {(entered) => (
        <div
          ref={panelRef}
          className={clsx(styles.panel, entered && styles.panelOpen)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
        >
          <div className={styles.handle} aria-hidden="true" />
          {title && (
            <div className={styles.header}>
              <h2 id={titleId} className="text-h3">
                {title}
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Закрыть"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </Overlay>
  );
}
