/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 2 — TASK ↔ SKILL foundation.
 * No ML/AI: a skill is a fixed row seeded deterministically from a
 * task's own authored `methodTags` (see
 * `apps/api/src/modules/skills/sync.ts`). Plain types only — no zod
 * schema yet, since nothing here crosses an HTTP boundary (no public
 * endpoint in this phase).
 */
export interface Skill {
  readonly id: string;
  readonly subjectId: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
}

/** Matches `packages/db/src/schema.ts`'s `taskSkillSources` enum — the DB
 * schema is the single source of truth for the allowed values, not
 * duplicated here as a runtime array. */
export interface TaskSkill {
  readonly taskId: string;
  readonly skillId: string;
  readonly source: 'canonical' | 'admin' | 'import';
}

/** `GET /me/learning/mastery` row — one per skill the user has ever
 * attempted. mastery/confidence are 0..100 (see `calculateSkillMastery`). */
export interface SkillMasteryEntry {
  readonly subjectId: string;
  readonly skillId: string;
  readonly skillSlug: string;
  readonly skillName: string;
  readonly mastery: number;
  readonly confidence: number;
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly incorrectAttempts: number;
  readonly lastAttemptAt: string | null;
}
