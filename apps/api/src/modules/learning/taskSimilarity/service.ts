import type { Database } from '@zybrilka/db';
import {
  calculateTaskSimilarity,
  getComparableDifficulty,
  type SimilarTaskEntry,
  type TaskSimilarityInput,
} from '@zybrilka/shared';
import * as repo from './repo.js';

function toSimilarityInput(meta: repo.TaskSimilarityMetadata): TaskSimilarityInput {
  const { value } = getComparableDifficulty({
    authoredDifficulty: meta.authoredDifficulty,
    observedDifficulty: meta.observedDifficulty,
  });
  return {
    taskId: meta.taskId,
    subjectId: meta.subjectId,
    taskNumber: meta.taskNumber,
    topicId: meta.topicId,
    answerType: meta.answerType,
    skillIds: meta.skillIds,
    comparableDifficulty: value,
  };
}

/**
 * Deterministic, on-demand (never precomputed/stored — see Phase 6's
 * instructions: the task catalog is small enough that a stored
 * `similar_task_relations` table would just be a second place for the
 * same calculation to drift out of sync). Candidates are resolved
 * purely by `taskId` → `subjectId` → every other published task in
 * that subject — zero `taskNumber` branching. Returns `[]` for an
 * unknown `taskId`, never throws.
 */
export async function getSimilarTasks(
  db: Database,
  taskId: string,
  limit: number,
): Promise<SimilarTaskEntry[]> {
  const target = await repo.getTaskMetadataForSimilarity(db, taskId);
  if (!target) return [];

  const candidates = await repo.getCandidateTasksForSimilarity(db, target.subjectId, taskId);
  const targetInput = toSimilarityInput(target);

  const scored = candidates.map((candidate) => {
    const candidateInput = toSimilarityInput(candidate);
    return {
      taskId: candidate.taskId,
      taskNumber: candidate.taskNumber,
      score: calculateTaskSimilarity(targetInput, candidateInput),
    };
  });

  // Deterministic order: score desc, then taskId asc as a stable
  // tie-break — never an arbitrary DB row order.
  scored.sort((a, b) => b.score - a.score || a.taskId.localeCompare(b.taskId));

  return scored.slice(0, limit);
}
