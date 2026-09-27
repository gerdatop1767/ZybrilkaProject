import type { Mistake as ApiMistake } from '@zybrilka/shared';
import type { Mistake as SampleMistake } from '../data/sampleMistakes.js';

/**
 * Maps a real /api/v1/mistakes row onto the `Mistake` shape the
 * approved-design Mistakes screens already render. Difficulty isn't
 * tracked per-mistake by the backend yet, so it gets a neutral default
 * rather than a fabricated value.
 */
export function toSampleMistake(mistake: ApiMistake): SampleMistake {
  return {
    id: mistake.id,
    taskId: mistake.taskId,
    taskNumber: mistake.taskNumber,
    subjectId: mistake.subjectId,
    topic: mistake.topicName ?? 'Общее',
    difficultyLabel: 'Среднее',
    condition: mistake.conditionMd,
    date: mistake.createdAt,
    userAnswer: mistake.userAnswer,
    correctAnswer: mistake.correctAnswer,
    status: mistake.status === 'resolved' ? 'reviewed' : 'unsolved',
    repeated: mistake.timesWrong > 1,
  };
}
