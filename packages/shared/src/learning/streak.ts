import { z } from 'zod';

const MOSCOW_TIME_ZONE = 'Europe/Moscow';

const moscowDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: MOSCOW_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Resolves a real UTC instant (an attempt's `createdAt`, or "now") to
 * its Europe/Moscow calendar date as `YYYY-MM-DD` — the one and only
 * place this conversion happens. Never the browser's/server's local
 * timezone, never a client-supplied date: the streak's entire
 * timezone correctness rests on every caller going through this
 * function instead of rolling its own `toISOString().slice(0, 10)`
 * (which would silently use UTC, not Moscow, and misclassify any
 * attempt submitted between 00:00 and 02:59 Moscow time — or between
 * 21:00 and 23:59 UTC — as the wrong calendar day).
 */
export function toMoscowDateString(instant: Date): string {
  // en-CA formats as YYYY-MM-DD directly — no manual part-reassembly.
  return moscowDateFormatter.format(instant);
}

function previousDateString(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number) as [number, number, number];
  // Pure calendar-day arithmetic on already-resolved Y/M/D components
  // — using UTC internally here is just an implementation detail for
  // date math (never re-interpreted as a timezone), not a timezone
  // choice: subtracting one calendar day never depends on where the
  // user is.
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * The current streak: the number of consecutive Europe/Moscow calendar
 * days (walking backward) with at least one real activity row, ending
 * at `todayMoscow` if the user has already been active today, or at
 * yesterday otherwise (the streak the user still holds and can extend
 * today, not yet broken — see CLAUDE.md's "было 7; сегодня ещё не
 * решил → остаётся 7" example). A gap of two or more days (today
 * inactive AND yesterday inactive) returns 0 — a real, honest "no
 * current streak", never a frozen stale number.
 *
 * Pure and deterministic: no AI/ML, no randomness, no I/O — the same
 * `activityDates` and `todayMoscow` always produce the same answer,
 * so this is unit-testable without a database.
 */
export function computeCurrentStreak(
  activityDates: ReadonlySet<string> | readonly string[],
  todayMoscow: string,
): number {
  const dates = activityDates instanceof Set ? activityDates : new Set(activityDates);
  let cursor = todayMoscow;
  if (!dates.has(cursor)) {
    cursor = previousDateString(cursor);
    if (!dates.has(cursor)) return 0;
  }
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = previousDateString(cursor);
  }
  return streak;
}

export const streakResponseSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  lastActiveDate: z.string().nullable(),
  isActiveToday: z.boolean(),
});
export type StreakResponse = z.infer<typeof streakResponseSchema>;
