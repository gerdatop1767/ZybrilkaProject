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

/** "25 сен 2026" — the desktop Mistakes list's date format. */
export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${shortMonths[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "24 сентября" — the mobile Mistakes list's date format (no year). */
export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${genitiveMonths[d.getUTCMonth()]}`;
}
