import type { TaskPublic, TaskWithSolution } from '@zybrilka/shared';
import type { SampleTask } from '../data/sampleTask.js';
import { subjects } from '../data/subjects.js';

const DIFFICULTY_LABELS = ['Лёгкое', 'Среднее', 'Сложное'] as const;

function difficultyLabel(difficulty: number): SampleTask['difficultyLabel'] {
  return DIFFICULTY_LABELS[difficulty - 1] ?? 'Среднее';
}

function shortCode(id: string): string {
  return `#${id.slice(0, 8)}`;
}

/**
 * Maps a real API task (+ its siblings sharing the same task number, for
 * the "Другие задания" list and session strip) onto the `SampleTask`
 * shape the approved-design components already render. `steps`/`hint`
 * aren't modeled by the backend yet, so they get a single generic
 * explanation-based step rather than a fabricated multi-step solution.
 */
export function toSampleTask(
  task: TaskPublic | TaskWithSolution,
  siblings: readonly TaskPublic[],
): SampleTask {
  const subject = subjects.find((s) => s.id === task.subjectId);
  const hasSolution = 'correctAnswer' in task;
  const orderedSiblings = siblings.length > 0 ? siblings : [task];
  const indexInSession = Math.max(orderedSiblings.findIndex((t) => t.id === task.id) + 1, 1);
  const others = orderedSiblings.filter((t) => t.id !== task.id);

  return {
    id: task.id,
    subjectId: task.subjectId,
    subjectName: subject?.name ?? task.subjectId,
    topic: task.topicName ?? 'Общее',
    number: task.taskNumber,
    totalInSession: orderedSiblings.length,
    indexInSession,
    difficulty: task.difficulty as 1 | 2 | 3,
    difficultyLabel: difficultyLabel(task.difficulty),
    source: task.source,
    code: shortCode(task.id),
    condition: task.conditionMd,
    imageUrl: task.imageUrl,
    answerType: task.answerType,
    answerParts: task.answerParts,
    correctAnswer: hasSolution ? task.correctAnswer : '',
    explanation: hasSolution ? task.explanationMd : '',
    hint: 'Внимательно перечитай условие и вспомни формулы по теме задания.',
    steps: hasSolution ? [{ text: task.explanationMd }] : [],
    otherVariants: others.slice(0, 3).map((t) => ({
      id: t.id,
      code: shortCode(t.id),
      difficultyLabel: difficultyLabel(t.difficulty),
      preview: t.conditionMd.slice(0, 60),
    })),
    sessionTasks: orderedSiblings.map((t, i) => ({
      index: i + 1,
      status: t.id === task.id ? 'current' : 'pending',
    })),
  };
}

export interface ExplanationSection {
  heading: string;
  text: string;
}

/**
 * Splits a multi_part task's explanationMd into per-part sections at its
 * `### <heading>` markers (see importEge2026Variant1.ts's task 19 for the
 * convention). Falls back to one unheaded section when there are none, so
 * this is safe to call on any explanation, not just multi_part ones.
 */
export function splitMultiPartExplanation(explanationMd: string): readonly ExplanationSection[] {
  const chunks = explanationMd.split(/\n(?=###\s+)/);
  return chunks
    .map((chunk) => {
      // Greedy `.+` (not `.` spans newlines) consumes the whole heading
      // line up to but not past it — a lazy quantifier here would stop
      // after a single character whenever the trailing `\n?` is free to
      // match zero characters instead, truncating multi-word headings.
      const match = /^###\s+(.+)\n?/.exec(chunk);
      if (!match) return { heading: '', text: chunk.trim() };
      return { heading: match[1]!.trim(), text: chunk.slice(match[0].length).trim() };
    })
    .filter((section) => section.heading.length > 0 || section.text.length > 0);
}

/** Finds the explanation section for a given part label ("а", "б", ...) by
 * case-insensitive substring match against its heading (task 19's "Б и В"
 * heading covers both the б and в parts) — falls back to the whole
 * explanation when no section names this part specifically. */
export function explanationForPart(
  sections: readonly ExplanationSection[],
  partLabel: string,
): string {
  const match = sections.find((s) => s.heading.toLowerCase().includes(partLabel.toLowerCase()));
  return match ? match.text : sections.map((s) => s.text).join('\n\n');
}
