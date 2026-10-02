/**
 * The canonical `subjects` rows every deploy's database must have.
 *
 * Single source of truth for subject **ids** — must match
 * `apps/web/src/data/subjects.ts`'s `id`s exactly: that's the list
 * Onboarding's "какие предметы сдаёшь?" step lets a user pick from
 * (`packages/shared/src/learningProfile.ts`'s `subjectId` has no enum
 * of its own, so the API's own source of truth for "is this a real
 * subject" is this `subjects` table). Web keeps its own file for the
 * UI-only fields (color/glyph/mastery/taskCount) this module has no
 * business knowing about — only `id`/`name` live here.
 */
export const canonicalSubjects: readonly { id: string; name: string }[] = [
  { id: 'math', name: 'Математика' },
  { id: 'russian', name: 'Русский язык' },
  { id: 'english', name: 'Английский язык' },
  { id: 'social', name: 'Обществознание' },
  { id: 'informatics', name: 'Информатика' },
  { id: 'physics', name: 'Физика' },
  { id: 'chemistry', name: 'Химия' },
  { id: 'biology', name: 'Биология' },
  { id: 'history', name: 'История' },
];
