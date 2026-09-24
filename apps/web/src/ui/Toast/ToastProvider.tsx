import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastData, type ToastVariant } from './Toast.js';
import styles from './Toast.module.css';

// Matches --duration-base in tokens.css: how long the exit transition
// takes before the toast is actually removed from the queue.
const EXIT_DELAY_MS = 200;
const DEFAULT_DURATION_MS = 3000;

export interface ShowToastInput {
  variant: ToastVariant;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  show: (input: ShowToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast system (Design Spec Section 12): "Правильно!", "Новая серия!",
 * "Достижение получено", etc. Only one toast is ever visible at a time
 * — later ones queue rather than stacking, so a toast never blocks
 * important content or buries an earlier message.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastData[]>([]);
  const current = queue[0];

  const show = useCallback((input: ShowToastInput) => {
    const id = crypto.randomUUID();
    setQueue((prev) => [...prev, { ...input, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setQueue((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {current &&
        createPortal(
          <div className={styles.container}>
            <ActiveToast
              key={current.id}
              toast={current}
              onDone={() => setQueue((prev) => prev.slice(1))}
            />
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/**
 * Mounted fresh per toast (`key={toast.id}` on the parent), so `entered`
 * naturally starts false for each one — no effect needs to reset it.
 */
function ActiveToast({ toast, onDone }: { toast: ToastData; onDone: () => void }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const dismiss = useCallback(() => {
    setEntered(false);
    setTimeout(onDone, EXIT_DELAY_MS);
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(dismiss, toast.durationMs ?? DEFAULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return <Toast toast={toast} entered={entered} onDismiss={dismiss} />;
}

/** Access the toast queue from anywhere inside a ToastProvider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
