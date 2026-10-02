/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 6 — deterministic task
 * similarity. No AI/ML: a pure, documented, weighted-signal formula
 * over real task metadata — `task_skills`/`skills` (the dominant
 * signal), `topicId`, `taskNumber`, `answerType`, and a difficulty
 * value resolved by `getComparableDifficulty`. No embeddings, no
 * vector search, no learned weights.
 *
 * Audited against the real imported tasks (13-19) before picking
 * weights: every one of them has a real, distinct `topicId` (the demo
 * seed tasks 1-5 instead *share* a topic two-at-a-time — e.g. two
 * "practical-arithmetic" tasks) and non-empty `task_skills` — so both
 * signals carry real information today, not hypothetical future data.
 *
 * Weights (sum to 100), skills dominant per the project's instruction
 * that similarity "must account for SKILLS above all":
 *   skills:      50  (Jaccard over skillIds — the real taxonomy link)
 *   topic:       20  (exact topicId match — a real, often-unique signal today)
 *   taskNumber:  10  (weak signal only — two different real tasks can
 *                     share a taskNumber without being alike at all,
 *                     so this is deliberately minor, never the whole score)
 *   answerType:  10  (weak signal — same answer shape, nothing more)
 *   difficulty:  10  (proximity on a 0..100 scale, see getComparableDifficulty)
 *
 * A signal is only included when BOTH tasks actually have real data
 * for it — never faked with a 0 or a guess. `topicId` can be null, so
 * it's skipped for that pair. `skillIds` can be empty for a task with
 * no authored canonical-solution methodTags yet (anything other than
 * 13-19 today); when EITHER task has zero skills, the skill signal is
 * skipped entirely, per the instruction "a task with no skills must
 * not read as completely dissimilar" — skipping avoids silently
 * collapsing its score, unlike scoring a Jaccard against an empty set
 * (which is always 0 and would otherwise drag the score down for a
 * reason that has nothing to do with how alike the tasks really are).
 * `taskNumber`, `answerType`, and the resolved difficulty are always
 * present (every task has a taskNumber, an answerType, and at least an
 * authored difficulty), so those three signals are always included.
 * The weights of whatever signals ARE present are renormalized to sum
 * to 100 — not diluted by a missing signal's weight going to waste.
 */

export interface TaskSimilarityInput {
  readonly taskId: string;
  readonly subjectId: string;
  readonly taskNumber: number;
  readonly topicId: string | null;
  readonly answerType: string;
  readonly skillIds: readonly string[];
  /** Already resolved via `getComparableDifficulty` — 0..100. */
  readonly comparableDifficulty: number;
}

const SIMILARITY_WEIGHTS = {
  skills: 50,
  topic: 20,
  taskNumber: 10,
  answerType: 10,
  difficulty: 10,
} as const;

/**
 * 0..100. Cross-subject pairs and a task compared to itself both score
 * 0 — callers should filter these out of candidate pools themselves
 * (this is a defensive floor, not the primary filtering mechanism).
 */
export function calculateTaskSimilarity(a: TaskSimilarityInput, b: TaskSimilarityInput): number {
  if (a.subjectId !== b.subjectId) return 0;
  if (a.taskId === b.taskId) return 0;

  const signals: { weight: number; score: number }[] = [];

  if (a.skillIds.length > 0 && b.skillIds.length > 0) {
    const setA = new Set(a.skillIds);
    const setB = new Set(b.skillIds);
    const intersectionSize = [...setA].filter((id) => setB.has(id)).length;
    const unionSize = new Set([...setA, ...setB]).size;
    signals.push({
      weight: SIMILARITY_WEIGHTS.skills,
      score: unionSize === 0 ? 0 : intersectionSize / unionSize,
    });
  }

  if (a.topicId !== null && b.topicId !== null) {
    signals.push({ weight: SIMILARITY_WEIGHTS.topic, score: a.topicId === b.topicId ? 1 : 0 });
  }

  signals.push({
    weight: SIMILARITY_WEIGHTS.taskNumber,
    score: a.taskNumber === b.taskNumber ? 1 : 0,
  });
  signals.push({
    weight: SIMILARITY_WEIGHTS.answerType,
    score: a.answerType === b.answerType ? 1 : 0,
  });

  const difficultyDistance = Math.abs(a.comparableDifficulty - b.comparableDifficulty) / 100;
  signals.push({ weight: SIMILARITY_WEIGHTS.difficulty, score: 1 - difficultyDistance });

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = signals.reduce((sum, s) => sum + s.weight * s.score, 0);
  return Math.round((weightedSum / totalWeight) * 100);
}

export type DifficultySource = 'observed' | 'authored';

export interface ComparableDifficulty {
  readonly value: number;
  readonly source: DifficultySource;
}

/** Authored 1..3 spread evenly onto the same 0..100 scale observed difficulty uses. */
const AUTHORED_DIFFICULTY_SCALE: Readonly<Record<1 | 2 | 3, number>> = { 1: 25, 2: 50, 3: 75 };

/**
 * Observed (statistical, from real attempts — Phase 4's `task_statistics.difficulty`)
 * takes priority when it exists; authored (the editorial 1..3 rating)
 * is the fallback for a task with no/too little attempt history yet.
 * The two are never averaged or otherwise blended — exactly one is
 * used, and `source` says which, so a caller can always tell.
 */
export function getComparableDifficulty(input: {
  readonly authoredDifficulty: 1 | 2 | 3;
  readonly observedDifficulty: number | null;
}): ComparableDifficulty {
  if (input.observedDifficulty !== null) {
    return { value: input.observedDifficulty, source: 'observed' };
  }
  return { value: AUTHORED_DIFFICULTY_SCALE[input.authoredDifficulty], source: 'authored' };
}
