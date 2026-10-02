import { z } from 'zod';

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 1 vertical slice: real onboarding
 * persistence only (user + chosen subjects + self-reported level + target
 * score). No diagnostic, mastery, task taxonomy, events, or recommendations
 * yet — see the Learning Intelligence audit report for what's deliberately
 * out of scope for this phase.
 */

/** Self-reported, NOT a measured result — distinct from any future
 * estimated/observed score. 'unknown' is a valid answer, not an error. */
export const selfReportedScoreLevels = [
  'unknown',
  'under_40',
  '40_plus',
  '50_plus',
  '60_plus',
  '70_plus',
  '80_plus',
  '90_plus',
] as const;
export const selfReportedScoreSchema = z.enum(selfReportedScoreLevels);
export type SelfReportedScore = z.infer<typeof selfReportedScoreSchema>;

/** What the user wants to reach — kept separate from `selfReportedScore`. */
export const targetScoreLevels = [
  'unknown',
  '60_plus',
  '70_plus',
  '80_plus',
  '90_plus',
  '95_plus',
  '100',
] as const;
export const targetScoreSchema = z.enum(targetScoreLevels);
export type TargetScore = z.infer<typeof targetScoreSchema>;

export const subjectProfileSchema = z.object({
  subjectId: z.string().min(1),
  selfReportedScore: selfReportedScoreSchema,
  targetScore: targetScoreSchema,
});
export type SubjectProfile = z.infer<typeof subjectProfileSchema>;

/** `GET /me/learning-profile` response. `onboardingCompleted` is the
 * frontend's single source of truth for whether to show onboarding —
 * never derived from localStorage (see apps/web's Onboarding screen). */
export const learningProfileResponseSchema = z.object({
  onboardingCompleted: z.boolean(),
  subjects: z.array(subjectProfileSchema),
});
export type LearningProfileResponse = z.infer<typeof learningProfileResponseSchema>;

/**
 * `PUT /me/learning-profile` request body — a full replace of the user's
 * subject set in one call (not a per-field patch), so "remove a subject"
 * is just "send a set that no longer includes it". At least one subject
 * is required: an empty onboarding can't be marked complete.
 */
export const saveLearningProfileRequestSchema = z.object({
  subjects: z.array(subjectProfileSchema).min(1),
});
export type SaveLearningProfileRequest = z.infer<typeof saveLearningProfileRequestSchema>;
