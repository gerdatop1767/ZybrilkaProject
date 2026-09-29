import { useState } from 'react';
import { reportTask } from '../../lib/reportTask.js';
import { Icon } from '../Icon/Icon.js';
import styles from './ReportTaskContent.module.css';

export interface ReportTaskContentProps {
  taskId: string;
}

/**
 * The small "Пожаловаться на задание" menu/popup (canvas mobile fix
 * block, sections 5–6): a single action, embedded in whichever
 * container the caller already uses (Modal on desktop, BottomSheet on
 * mobile — same pattern as Calculator). A full complaint system
 * (reasons, backend, admin review) is explicitly out of scope here —
 * see `reportTask()` for the one placeholder seam a real
 * implementation will replace.
 */
export function ReportTaskContent({ taskId }: ReportTaskContentProps) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="text-body-sm text-secondary" role="status">
        Спасибо! Жалоба отправлена.
      </p>
    );
  }

  return (
    <button
      type="button"
      className={styles.action}
      onClick={() => {
        reportTask(taskId);
        setSent(true);
      }}
    >
      <Icon name="warning" size={18} />
      Пожаловаться на задание
    </button>
  );
}
