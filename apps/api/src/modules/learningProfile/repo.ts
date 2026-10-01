import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import type { SaveLearningProfileRequest, SubjectProfile } from '@zybrilka/shared';
import { and, eq, notInArray, sql } from 'drizzle-orm';

export async function getSubjectProfiles(db: Database, userId: string): Promise<SubjectProfile[]> {
  const rows = await db
    .select({
      subjectId: schema.userSubjectProfiles.subjectId,
      selfReportedScore: schema.userSubjectProfiles.selfReportedScore,
      targetScore: schema.userSubjectProfiles.targetScore,
      onboardingCompletedAt: schema.userSubjectProfiles.onboardingCompletedAt,
    })
    .from(schema.userSubjectProfiles)
    .where(eq(schema.userSubjectProfiles.userId, userId));

  return rows.map((row) => ({
    subjectId: row.subjectId,
    selfReportedScore: row.selfReportedScore,
    targetScore: row.targetScore,
  }));
}

/** True only once every one of the user's current subject rows has been
 * marked complete — a profile with zero subjects is never "completed". */
export async function isOnboardingCompleted(db: Database, userId: string): Promise<boolean> {
  const rows = await db
    .select({ onboardingCompletedAt: schema.userSubjectProfiles.onboardingCompletedAt })
    .from(schema.userSubjectProfiles)
    .where(eq(schema.userSubjectProfiles.userId, userId));

  return rows.length > 0 && rows.every((row) => row.onboardingCompletedAt !== null);
}

/**
 * Atomically replaces the user's whole subject set: rows for subjects no
 * longer selected are deleted, rows for selected subjects are
 * upserted (never duplicated, matching `user_subject_profiles_user_subject_idx`).
 * `onboardingCompletedAt` is preserved if already set (first-completion
 * date), otherwise set to now — so editing an already-completed profile
 * never un-completes it, but a brand-new save marks it done only once
 * every selected subject's row is written in this same transaction.
 */
export async function replaceSubjectProfiles(
  db: Database,
  userId: string,
  request: SaveLearningProfileRequest,
): Promise<void> {
  const subjectIds = request.subjects.map((s) => s.subjectId);

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.userSubjectProfiles)
      .where(
        and(
          eq(schema.userSubjectProfiles.userId, userId),
          notInArray(schema.userSubjectProfiles.subjectId, subjectIds),
        ),
      );

    for (const subject of request.subjects) {
      await tx
        .insert(schema.userSubjectProfiles)
        .values({
          userId,
          subjectId: subject.subjectId,
          selfReportedScore: subject.selfReportedScore,
          targetScore: subject.targetScore,
          onboardingCompletedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.userSubjectProfiles.userId, schema.userSubjectProfiles.subjectId],
          set: {
            selfReportedScore: subject.selfReportedScore,
            targetScore: subject.targetScore,
            onboardingCompletedAt: sql`coalesce(${schema.userSubjectProfiles.onboardingCompletedAt}, now())`,
            updatedAt: new Date(),
          },
        });
    }
  });
}
