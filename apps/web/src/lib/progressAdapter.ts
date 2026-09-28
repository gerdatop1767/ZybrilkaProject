import type { ProgressByTaskNumberResponse, ProgressDailyResponse } from '@zybrilka/shared';
import type { DailyPoint, TaskNumberProgress } from '../data/sampleStatistics.js';

const MAX_TASK_NUMBER = 19;

/**
 * Maps real per-task-number X/Y (Block A's total/completed — same
 * source of truth as Subject's "По номерам") onto the fixed 1–19
 * "Прогресс по заданиям" strip/grid — numbers with no attempt at all
 * render as "не решалось" rather than a fabricated percent. `percent`
 * here is *completion* (completed/total), not accuracy: Statistics and
 * Subject now show the same real metric for a task number instead of
 * two different ones.
 */
export function toTaskNumberProgress(
  items: ProgressByTaskNumberResponse['items'],
): readonly TaskNumberProgress[] {
  const byNumber = new Map(items.map((row) => [row.taskNumber, row]));

  return Array.from({ length: MAX_TASK_NUMBER }, (_, i) => {
    const number = i + 1;
    const row = byNumber.get(number);
    if (!row || row.completed === 0) {
      return { number, percent: null, status: 'untried' as const };
    }
    const percent = Math.round((row.completed / row.total) * 100);
    const status: TaskNumberProgress['status'] =
      percent >= 70 ? 'strong' : percent >= 40 ? 'medium' : 'weak';
    return { number, percent, status };
  });
}

/**
 * Zero-fills the requested day range (UTC calendar days, oldest first)
 * around the sparse real `/progress/daily` response — same precedent
 * as `toTaskNumberProgress`'s fixed 1–19 range: a day with no activity
 * is a real zero, not a missing chart point.
 */
export function toDailyPoints(
  items: ProgressDailyResponse['items'],
  days: number,
): readonly DailyPoint[] {
  const byDate = new Map(items.map((row) => [row.date, row]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const date = d.toISOString().slice(0, 10);
    const row = byDate.get(date);
    return {
      date,
      label: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      solved: row?.solved ?? 0,
      accuracyPercent: row?.accuracyPercent ?? 0,
    };
  });
}
