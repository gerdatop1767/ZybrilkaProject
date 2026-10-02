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
