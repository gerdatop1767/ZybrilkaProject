import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

const variantIcon: Record<ToastVariant, IconName> = {
  success: 'success',
  error: 'errorCircle',
  warning: 'warning',
  info: 'info',
};

export interface ToastProps {
  toast: ToastData;
  entered: boolean;
  onDismiss: () => void;
}

/**
 * A single toast (Design Spec Section 12): "Правильно!", "Новая
 * серия!", "Достижение получено", etc. `role="status"` (not "alert")
 * so it announces without stealing focus or interrupting — it must
 * never feel like an error dialog, even for the `error` variant.
 */
export function Toast({ toast, entered, onDismiss }: ToastProps) {
  return (
    <div
      className={clsx(styles.toast, styles[toast.variant], entered && styles.toastOpen)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon}>
        <Icon name={variantIcon[toast.variant]} size={20} />
      </span>
      <p className={clsx('text-body-sm', styles.message)}>{toast.message}</p>
      {toast.actionLabel && toast.onAction && (
        <button type="button" className={styles.action} onClick={toast.onAction}>
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        className={styles.dismiss}
        onClick={onDismiss}
        aria-label="Скрыть уведомление"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
