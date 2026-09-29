import { useState } from 'react';
import type { SampleTask } from '../../data/sampleTask.js';
import { getCanvasState, setCanvasState } from '../../lib/canvasSessionStore.js';
import { clearCanvas, type CanvasState } from '../../lib/canvasEngine.js';
import { Icon } from '../Icon/Icon.js';
import { Overlay, usePanelFocus } from '../Overlay/Overlay.js';
import { CanvasBoard } from './CanvasBoard.js';
import { clsx } from '../../lib/clsx.js';
import styles from './CanvasWorkspaceMobile.module.css';

export interface CanvasWorkspaceMobileProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  task: SampleTask;
}

/**
 * "Полотно" (CLAUDE.md Section 13 — "Расширить поле"): near-fullscreen
 * on mobile. `CanvasBoard` owns the entire body below the header — the
 * current task's condition/illustration and the white, zoomable/
 * pannable drawing surface are one unified canvas (canvas mobile fix
 * block: previously a separate fixed reference panel sat above a
 * small canvas, wasting most of the screen and preventing drawing
 * over the task itself). Drawing state is read/written through
 * canvasSessionStore, keyed by `taskId`: it survives this overlay
 * closing and reopening within the same task, and switching to a
 * different task and back, but is never shared between two different
 * tasks.
 */
export function CanvasWorkspaceMobile({ open, onClose, taskId, task }: CanvasWorkspaceMobileProps) {
  const panelRef = usePanelFocus(open);
  const [state, setState] = useState<CanvasState>(() => getCanvasState(taskId));
  // Re-reads from the session store whenever the overlay opens (or for a
  // different task) rather than in an effect — this is React's documented
  // "adjusting state when a prop changes" pattern, evaluated during render
  // rather than as a post-commit setState-in-effect cascade.
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open ? taskId : null;
  if (syncKey !== null && syncKey !== syncedFor) {
    setSyncedFor(syncKey);
    setState(getCanvasState(taskId));
  }

  function handleChangeState(next: CanvasState) {
    setState(next);
    setCanvasState(taskId, next);
  }

  return (
    <Overlay open={open} onClose={onClose}>
      {(entered) => (
        <div
          ref={panelRef}
          className={clsx(styles.panel, entered && styles.panelOpen)}
          role="dialog"
          aria-modal="true"
          aria-label="Полотно"
          tabIndex={-1}
        >
          <div className={styles.header}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Назад"
            >
              <Icon name="back" size={20} />
            </button>
            <span className="text-body" style={{ fontWeight: 700 }}>
              Полотно
            </span>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Очистить"
              disabled={state.strokes.length === 0}
              onClick={() => handleChangeState(clearCanvas())}
            >
              <Icon name="clear" size={18} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Закрыть"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className={styles.boardWrap}>
            <CanvasBoard state={state} onChangeState={handleChangeState} task={task} />
          </div>
        </div>
      )}
    </Overlay>
  );
}
