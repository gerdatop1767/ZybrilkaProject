/**
 * Seed subject list (S1 Block 6 — approved visual design). Fixed
 * per-subject hues and glyph tiles, matching the approved screenshots
 * exactly (Математика/Русский/Английский/Обществознание/Информатика/
 * Физика, each its own color + glyph). Demo content for the UI — not
 * the real catalog.
 */
export type SubjectGlyph = 'pi' | 'aa' | 'globe' | 'users' | 'code' | 'atom';

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  glyph: SubjectGlyph;
  mastery: number;
  taskCount: number;
}

export const subjects: readonly Subject[] = [
  {
    id: 'math',
    name: 'Математика (профильная)',
    shortName: 'Математика',
    color: 'var(--color-subject-math)',
    glyph: 'pi',
    mastery: 65,
    taskCount: 1240,
  },
  {
    id: 'russian',
    name: 'Русский язык',
    shortName: 'Русский язык',
    color: 'var(--color-subject-russian)',
    glyph: 'aa',
    mastery: 78,
    taskCount: 980,
  },
  {
    id: 'english',
    name: 'Английский язык',
    shortName: 'Английский язык',
    color: 'var(--color-subject-english)',
    glyph: 'globe',
    mastery: 58,
    taskCount: 760,
  },
  {
    id: 'social',
    name: 'Обществознание',
    shortName: 'Обществознание',
    color: 'var(--color-subject-social)',
    glyph: 'users',
    mastery: 49,
    taskCount: 1120,
  },
  {
    id: 'informatics',
    name: 'Информатика',
    shortName: 'Информатика',
    color: 'var(--color-subject-informatics)',
    glyph: 'code',
    mastery: 61,
    taskCount: 880,
  },
  {
    id: 'physics',
    name: 'Физика',
    shortName: 'Физика',
    color: 'var(--color-subject-physics)',
    glyph: 'atom',
    mastery: 46,
    taskCount: 1030,
  },
];
