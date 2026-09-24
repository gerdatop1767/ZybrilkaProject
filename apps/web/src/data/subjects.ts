/**
 * Seed subject list (Design Spec Section 2: fixed per-subject hues,
 * chips/tags only). Demo content for the UI — not the real catalog.
 */
export interface Subject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  mastery: number;
}

export const subjects: readonly Subject[] = [
  {
    id: 'math',
    name: 'Математика (профиль)',
    shortName: 'Математика',
    color: 'var(--color-subject-math)',
    mastery: 62,
  },
  {
    id: 'russian',
    name: 'Русский язык',
    shortName: 'Русский',
    color: 'var(--color-subject-russian)',
    mastery: 78,
  },
  {
    id: 'physics',
    name: 'Физика',
    shortName: 'Физика',
    color: 'var(--color-subject-physics)',
    mastery: 48,
  },
  {
    id: 'chemistry',
    name: 'Химия',
    shortName: 'Химия',
    color: 'var(--color-subject-chemistry)',
    mastery: 31,
  },
  {
    id: 'history',
    name: 'История',
    shortName: 'История',
    color: 'var(--color-subject-history)',
    mastery: 56,
  },
];
