import { useState } from 'react';
import type { SampleTask } from '../../data/sampleTask.js';
import { getCanvasState, setCanvasState } from '../../lib/canvasSessionStore.js';
import { clearCanvas, type CanvasState } from '../../lib/canvasEngine.js';
import { Icon } from '../Icon/Icon.js';
import { MathText } from '../MathText/MathText.js';
import {
  TaskExamIllustration,
  TaskSolutionIllustration,
} from '../TaskIllustration/TaskIllustration.js';
import { Overlay, usePanelFocus } from '../Overlay/Overlay.js';
import { CanvasBoard } from './CanvasBoard.js';
import { clsx } from '../../lib/clsx.js';
import styles from './CanvasWorkspaceDesktop.module.css';

export interface CanvasWorkspaceDesktopProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  task: SampleTask;
}

/**
 * "Полотно" desktop/iPad presentation (Task Workspace block 4): a large
 * modal, not a small dialog — left column is the current task's
 * condition/illustration (same renderers Task screen itself uses),
 * right column is the shared CanvasBoard. Same session-scoped
 * persistence as CanvasWorkspaceMobile via canvasSessionStore, keyed
 * by taskId.
 */
export function CanvasWorkspaceDesktop({
  open,
  onClose,
  taskId,
  task,
}: CanvasWorkspaceDesktopProps) {
  const panelRef = usePanelFocus(open);
  const [state, setState] = useState<CanvasState>(() => getCanvasState(taskId));
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
            <span className="text-h3">Полотно</span>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.textButton}
                disabled={state.strokes.length === 0}
                onClick={() => handleChangeState(clearCanvas())}
              >
                Очистить
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
          </div>

          <div className={styles.body}>
            <div className={styles.reference}>
              <p className={styles.referenceLabel}>Задание №{task.number}</p>
              <div className={clsx('text-body', styles.condition)}>
                <MathText text={task.condition} />
              </div>
              <TaskExamIllustration
                subjectId={task.subjectId}
                taskNumber={task.number}
                className={styles.referenceImage}
              />
              <TaskSolutionIllustration
                subjectId={task.subjectId}
                taskNumber={task.number}
                className={styles.referenceImage}
              />
            </div>

            <div className={styles.boardWrap}>
              <CanvasBoard state={state} onChangeState={handleChangeState} />
            </div>
          </div>
        </div>
      )}
    </Overlay>
  );
}
