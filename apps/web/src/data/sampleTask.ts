/**
 * Sample EGE task content (Design Spec Section 15: subject-agnostic
 * shape, currently seeded with one profile-math Part 1 item). Demo/seed
 * content for the UI only — not the real task database or import
 * pipeline.
 */
export interface SampleTask {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  number: number;
  totalInSession: number;
  difficulty: 1 | 2 | 3;
  condition: string;
  /** Numeric/short-text answer tasks (most of EGE profile-math Part 1). */
  correctAnswer: string;
  explanation: string;
}

/**
 * Placeholder lookup. Subject/task-agnostic on purpose: every screen
 * asks for a task by id rather than importing `sampleTask` directly,
 * so swapping this for a real API call later touches only this file.
 */
export function getTaskById(_id: string): SampleTask {
  return sampleTask;
}

export const sampleTask: SampleTask = {
  id: 'demo-1',
  subjectId: 'math',
  subjectName: 'Математика (профиль)',
  topic: 'Квадрат суммы и разности. Степени',
  number: 1,
  totalInSession: 10,
  difficulty: 2,
  condition: 'Найдите значение выражения (3x − 2)², если x = 4.',
  correctAnswer: '100',
  explanation: 'Подставим x = 4 в выражение: (3 · 4 − 2)² = (12 − 2)² = 10² = 100.',
};
