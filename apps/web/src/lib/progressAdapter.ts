import type { ProgressSummary } from '@zybrilka/shared';
import type { TaskNumberProgress } from '../data/sampleStatistics.js';

const MAX_TASK_NUMBER = 19;

/**
 * Maps real per-task-number attempt counts onto the fixed 1–19
 * "Прогресс по заданиям" strip/grid — numbers with no recorded attempt
 * render as "не решалось" rather than a fabricated percent.
 */
export function toTaskNumberProgress(
  byTaskNumber: ProgressSummary['byTaskNumber'],
): readonly TaskNumberProgress[] {
  const byNumber = new Map(byTaskNumber.map((row) => [row.taskNumber, row]));

  return Array.from({ length: MAX_TASK_NUMBER }, (_, i) => {
    const number = i + 1;
    const row = byNumber.get(number);
    if (!row || row.solved === 0) {
      return { number, percent: null, status: 'untried' as const };
    }
    const percent = row.accuracyPercent;
    const status: TaskNumberProgress['status'] =
      percent >= 70 ? 'strong' : percent >= 40 ? 'medium' : 'weak';
    return { number, percent, status };
  });
}
