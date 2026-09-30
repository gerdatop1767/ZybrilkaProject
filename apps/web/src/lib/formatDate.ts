const shortMonths = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

const genitiveMonths = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * Accepts either a bare date ("2026-09-25") or a full ISO datetime
 * ("2026-09-25T14:30:00.000Z", what the real `/api/v1/mistakes`
 * `createdAt` field actually sends) — appending "T00:00:00Z" to an
 * already-full datetime produced an invalid Date (and so a rendered
 * "NaN undefined") once real API data replaced the bare-date mock
 * data this was originally written against.
 */
function parseDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : `${iso}T00:00:00Z`);
}

/** "25 сен 2026" — the desktop Mistakes list's date format. */
export function formatDateShort(iso: string): string {
  const d = parseDate(iso);
  return `${d.getUTCDate()} ${shortMonths[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "24 сентября" — the mobile Mistakes list's date format (no year). */
export function formatDateLong(iso: string): string {
  const d = parseDate(iso);
  return `${d.getUTCDate()} ${genitiveMonths[d.getUTCMonth()]}`;
}
