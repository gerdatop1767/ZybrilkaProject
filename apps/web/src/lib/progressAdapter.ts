import type { ProgressByTaskNumberResponse, ProgressDailyResponse } from '@zybrilka/shared';
import type { DailyPoint, TaskNumberProgress } from '../data/sampleStatistics.js';

/**
 * Maps real per-task-number X/Y (Block A's total/completed — same
 * source of truth as Subject's "По номерам") onto the "Прогресс по
 * заданиям" strip/grid. The number list itself is derived from the
 * real response (every number that actually has published tasks,
 * `total > 0`) rather than a fixed range — subjects don't all have the
 * same count of task numbers, so a hardcoded range would either cut
 * off real numbers or show numbers that don't exist for this subject.
 * Numbers with no attempt at all render as "не решалось" rather than a
 * fabricated percent. `percent` here is *completion* (completed/total),
 * not accuracy: Statistics and Subject now show the same real metric
 * for a task number instead of two different ones.
 */
export function toTaskNumberProgress(
  items: ProgressByTaskNumberResponse['items'],
): readonly TaskNumberProgress[] {
  return items
    .filter((row) => row.total > 0)
    .slice()
    .sort((a, b) => a.taskNumber - b.taskNumber)
    .map((row) => {
      const { taskNumber: number, completed, total } = row;
      if (completed === 0) {
        return { number, percent: null, status: 'untried' as const, completed, total };
      }
      const percent = Math.round((completed / total) * 100);
      const status: TaskNumberProgress['status'] =
        percent >= 70 ? 'strong' : percent >= 40 ? 'medium' : 'weak';
      return { number, percent, status, completed, total };
    });
}

/**
 * Zero-fills the requested day range (UTC calendar days, oldest first)
 * around the sparse real `/progress/daily` response: a day with no
 * activity is a real zero, not a missing chart point.
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
