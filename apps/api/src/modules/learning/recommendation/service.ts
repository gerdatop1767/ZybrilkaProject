import type { Database } from '@zybrilka/db';
import {
  calculateDifficultyFit,
  calculateErrorRelevance,
  calculateExamImportance,
  calculateRecency,
  calculateSimilarityBonus,
  calculateSkillNeed,
  calculateTargetGap,
  calculateTargetRelevance,
  calculateTaskSimilarity,
  combineRecommendationSignals,
  getComparableDifficulty,
  type NextTaskRecommendation,
  type RecommendationBreakdown,
  type RecommendationSignal,
  type RelevantErrorAnswerType,
  type TaskSimilarityInput,
} from '@zybrilka/shared';
import * as errorStatsRepo from '../errorSignatures/repo.js';
import * as learningProfileRepo from '../../learningProfile/repo.js';
import { getTaskMetadataForSimilarity } from '../taskSimilarity/repo.js';
import { toSimilarityInput } from '../taskSimilarity/service.js';
import * as repo from './repo.js';

export interface GetNextTaskRecommendationContext {
  readonly subjectId?: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Short, deterministic, template-generated explanation — built from
 * whichever signals actually drove the pick, never a canned string.
 * Picks the two highest-scoring AVAILABLE signals (tie-broken by
 * weight, then by signal name for full determinism) and names them. */
const SIGNAL_LABELS: Record<RecommendationSignal, string> = {
  skillNeed: 'слабый навык в этой задаче',
  errorRelevance: 'похожие на ваши частые ошибки',
  difficultyFit: 'сложность соответствует вашему уровню',
  targetRelevance: 'приближает к целевому баллу',
  recency: 'давно не практиковали эту тему',
  examImportance: 'часто встречается в реальном ЕГЭ',
  similarityBonus: 'похожа на задачу из ваших ошибок',
};

function buildReason(breakdown: RecommendationBreakdown, total: number): string {
  const included = (
    Object.entries(breakdown) as [
      RecommendationSignal,
      RecommendationBreakdown[RecommendationSignal],
    ][]
  )
    .filter(([, entry]) => entry.included && entry.score !== null)
    .sort((a, b) => {
      const scoreDiff = (b[1].score ?? 0) - (a[1].score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const weightDiff = b[1].weight - a[1].weight;
      if (weightDiff !== 0) return weightDiff;
      return a[0].localeCompare(b[0]);
    });

  if (included.length === 0) {
    return 'Недостаточно данных для персонализации — выбрана задача из общего каталога.';
  }

  const reasons = included.slice(0, 2).map(([key]) => SIGNAL_LABELS[key]);
  return `Рекомендовано (score ${total}): ${reasons.join(', ')}.`;
}

function toRelevantAnswerType(answerType: string): RelevantErrorAnswerType {
  return answerType as RelevantErrorAnswerType;
}

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 7 — `getNextTaskRecommendation`.
 * Fully deterministic: the same user state always produces the same
 * recommendation (score ties broken by taskNumber, then taskId). No
 * randomness anywhere.
 *
 * Steps (see `packages/shared/src/learning/recommendation.ts` for the
 * per-signal formulas):
 *   1. resolve the subject (explicit, or auto-pick the user's
 *      onboarded subject with the largest target/self-reported gap)
 *   2. load the candidate pool (published tasks in that subject)
 *   3. filter out tasks already answered correctly (falls back to the
 *      unfiltered pool if that would leave nothing to recommend)
 *   4. load weak-skill data (mastery + recency), error statistics,
 *      target gap, and open-mistake tasks for the similarity bonus
 *   5. score every remaining candidate
 *   6. pick the top-scoring one, deterministically tie-broken
 *   7. return it with its full breakdown and a generated explanation
 */
export async function getNextTaskRecommendation(
  db: Database,
  userId: string,
  context: GetNextTaskRecommendationContext,
): Promise<NextTaskRecommendation | null> {
  const subjectId = await resolveSubjectId(db, userId, context);
  if (!subjectId) return null;

  const allCandidates = await repo.getCandidateTasksForSubject(db, subjectId);
  if (allCandidates.length === 0) return null;

  const correctlyAttempted = new Set(
    await repo.getCorrectlyAttemptedTaskIds(db, userId, subjectId),
  );
  const unsolved = allCandidates.filter((c) => !correctlyAttempted.has(c.taskId));
  // Never leave the user with nothing to recommend just because every
  // task in the subject has already been solved once — fall back to
  // the full pool (review mode) rather than returning null.
  const candidates = unsolved.length > 0 ? unsolved : allCandidates;

  const [masteryRows, errorStats, subjectProfile, openMistakeTaskIds] = await Promise.all([
    repo.getUserSkillMasteryForSubject(db, userId, subjectId),
    errorStatsRepo.getUserErrorStatistics(db, userId),
    learningProfileRepo
      .getSubjectProfiles(db, userId)
      .then((profiles) => profiles.find((p) => p.subjectId === subjectId)),
    repo.getOpenMistakeTaskIdsForUserSubject(db, userId, subjectId),
  ]);

  const masteryBySkill = new Map(masteryRows.map((r) => [r.skillId, r] as const));
  const userSubjectAverageMastery =
    masteryRows.length > 0
      ? masteryRows.reduce((sum, r) => sum + r.mastery, 0) / masteryRows.length
      : null;

  const gap = subjectProfile
    ? calculateTargetGap(subjectProfile.selfReportedScore, subjectProfile.targetScore)
    : null;

  // Skill exam-frequency is a property of the WHOLE subject catalog
  // (how common is this skill across every published task), not of
  // the post-filter candidate set — computed once from `allCandidates`.
  const totalPublishedTasks = allCandidates.length;
  const taskCountBySkill = new Map<string, number>();
  for (const task of allCandidates) {
    for (const skillId of task.skillIds) {
      taskCountBySkill.set(skillId, (taskCountBySkill.get(skillId) ?? 0) + 1);
    }
  }

  const mistakeMetadata = (
    await Promise.all(openMistakeTaskIds.map((taskId) => getTaskMetadataForSimilarity(db, taskId)))
  ).filter((m): m is NonNullable<typeof m> => m !== undefined);
  const mistakeInputs: TaskSimilarityInput[] = mistakeMetadata.map(toSimilarityInput);

  const now = Date.now();

  const scored = candidates.map((candidate) => {
    const comparableDifficulty = getComparableDifficulty({
      authoredDifficulty: candidate.authoredDifficulty as 1 | 2 | 3,
      observedDifficulty: candidate.observedDifficulty,
    }).value;

    const skillMasteries = candidate.skillIds.map((id) => masteryBySkill.get(id)?.mastery ?? 0);
    const daysSinceEachSkillLastAttempted = candidate.skillIds
      .map((id) => masteryBySkill.get(id)?.lastAttemptAt ?? null)
      .filter((d): d is Date => d !== null)
      .map((d) => (now - d.getTime()) / MS_PER_DAY);
    const skillFrequencyRatios = candidate.skillIds.map(
      (id) => (taskCountBySkill.get(id) ?? 0) / totalPublishedTasks,
    );

    const candidateInput: TaskSimilarityInput = {
      taskId: candidate.taskId,
      subjectId,
      taskNumber: candidate.taskNumber,
      topicId: candidate.topicId,
      answerType: candidate.answerType,
      skillIds: candidate.skillIds,
      comparableDifficulty,
    };
    const similarityScores = mistakeInputs.map((m) => calculateTaskSimilarity(candidateInput, m));

    const { total, breakdown } = combineRecommendationSignals({
      skillNeed: calculateSkillNeed(skillMasteries),
      errorRelevance: calculateErrorRelevance(
        errorStats,
        toRelevantAnswerType(candidate.answerType),
      ),
      difficultyFit: calculateDifficultyFit(comparableDifficulty, userSubjectAverageMastery),
      targetRelevance: calculateTargetRelevance(gap, comparableDifficulty),
      recency: calculateRecency(daysSinceEachSkillLastAttempted),
      examImportance: calculateExamImportance(skillFrequencyRatios),
      similarityBonus: calculateSimilarityBonus(similarityScores),
    });

    return { candidate, total, breakdown };
  });

  scored.sort(
    (a, b) =>
      b.total - a.total ||
      a.candidate.taskNumber - b.candidate.taskNumber ||
      a.candidate.taskId.localeCompare(b.candidate.taskId),
  );

  const best = scored[0]!;

  return {
    taskId: best.candidate.taskId,
    taskNumber: best.candidate.taskNumber,
    subjectId,
    score: best.total,
    breakdown: best.breakdown,
    reason: buildReason(best.breakdown, best.total),
  };
}

/** Explicit `context.subjectId` wins. Otherwise, among the user's
 * onboarded subjects (that actually have published tasks), picks the
 * one with the largest target/self-reported gap — deliberately
 * deterministic: subjects with an unknown gap sort last, ties break
 * alphabetically by subjectId. `null` only when the user has no
 * onboarded subject with any published tasks at all. */
async function resolveSubjectId(
  db: Database,
  userId: string,
  context: GetNextTaskRecommendationContext,
): Promise<string | null> {
  if (context.subjectId) return context.subjectId;

  const profiles = await learningProfileRepo.getSubjectProfiles(db, userId);
  if (profiles.length === 0) return null;

  const withGap = profiles.map((p) => ({
    subjectId: p.subjectId,
    gap: calculateTargetGap(p.selfReportedScore, p.targetScore),
  }));

  withGap.sort((a, b) => {
    const gapDiff = (b.gap ?? -1) - (a.gap ?? -1);
    if (gapDiff !== 0) return gapDiff;
    return a.subjectId.localeCompare(b.subjectId);
  });

  for (const candidate of withGap) {
    if (await repo.subjectHasPublishedTasks(db, candidate.subjectId)) {
      return candidate.subjectId;
    }
  }
  return null;
}
