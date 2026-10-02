/**
 * Statistics 2.0 — shared formatting for the "По номерам → №N" detail
 * view (Desktop panel + Mobile full screen use the exact same labels
 * so the numbers mean the same thing on both platforms).
 */

/** `12345` -> "12.3 c" — never rounds to a fake "0 c" for sub-second times. */
export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)} с`;
  return `${Math.round(seconds)} с`;
}

/**
 * `6120000` -> "1 ч 42 мин" — Statistics' variant history cards show a
 * real total solving time in hours/minutes, never the sub-10s-aware
 * `formatDuration` above (built for one attempt's time, not a whole
 * variant's). Minutes-only once under an hour, seconds-only once
 * under a minute — never a fabricated "0 мин" for a fast variant.
 */
export function formatDurationLong(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} ч ${minutes} мин`;
  if (minutes > 0) return `${minutes} мин`;
  return `${seconds} с`;
}

/**
 * Human labels for the fixed error-signature set (packages/shared's
 * `errorSignatureTypes`) — never invents a new error type, just
 * translates the existing deterministic codes, including the
 * multi_part per-part codes (`part_incorrect:<partId>`,
 * `blank_answer:<partId>`).
 */
export function errorSignatureLabel(code: string): string {
  const [type, partId] = code.split(':');
  const base: Record<string, string> = {
    incorrect_answer: 'Неверный ответ',
    blank_answer: 'Пустой ответ',
    format_error: 'Ошибка формата ответа',
    partially_correct: 'Частично верно',
    part_incorrect: 'Неверная часть ответа',
  };
  const label = base[type!] ?? type!;
  return partId ? `${label} (пункт «${partId}»)` : label;
}
