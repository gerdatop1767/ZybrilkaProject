import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from '../../lib/clsx.js';
import styles from './Overlay.module.css';

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  /**
   * The dialog/sheet panel, rendered as a sibling of the backdrop.
   * Receives `entered` so the panel can drive its own enter transition
   * (slide up / scale in) in step with the backdrop fade.
   */
  children: (entered: boolean) => ReactNode;
}

/**
 * Shared backdrop + portal + dismiss behavior for Modal and BottomSheet
 * (Design Spec Section 3 / 12): renders above the app in a portal,
 * closes on Escape or a backdrop tap, and locks body scroll while open.
 * Each caller supplies its own panel markup/animation (center modal vs.
 * bottom sheet), so this only owns what's common to both.
 */
export function Overlay({ open, onClose, children }: OverlayProps) {
  if (!open) return null;
  return createPortal(<OverlayContent onClose={onClose}>{children}</OverlayContent>, document.body);
}

/**
 * Mounted only while `open` is true, so `entered` naturally starts
 * false on every open — no effect ever needs to reset it back to
 * false itself, which keeps state updates inside effects async
 * (rAF/timeout callbacks) instead of synchronous.
 */
function OverlayContent({ onClose, children }: Omit<OverlayProps, 'open'>) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div
        className={clsx(styles.backdrop, entered && styles.backdropOpen)}
        onClick={onClose}
        aria-hidden="true"
      />
      {children(entered)}
    </>
  );
}

/** Autofocuses the panel on open so focus moves into the dialog/sheet. */
export function usePanelFocus(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  return ref;
}
