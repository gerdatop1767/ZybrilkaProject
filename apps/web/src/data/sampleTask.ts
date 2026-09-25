/**
 * Sample EGE task content (S1 Block 6 — approved design, Training/
 * Result screenshots). Subject-agnostic shape, seeded with one
 * profile-math logarithm item matching the approved reference
 * (условие, ответ, шаги решения, вариант задания №15, code #3214).
 * Demo/seed content for the UI only — not the real task database.
 */
export interface SolutionStep {
  text: string;
}

export interface TaskVariant {
  id: string;
  code: string;
  difficultyLabel: 'Лёгкое' | 'Среднее' | 'Сложное';
  preview: string;
}

export type SessionTaskStatus = 'correct' | 'incorrect' | 'current' | 'pending';

export interface SessionTask {
  index: number;
  status: SessionTaskStatus;
}

export interface SampleTask {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  /** The official EGE question number (mobile's 11-19 number strip). */
  number: number;
  totalInSession: number;
  /** Position of this task within the current training session (desktop sidebar / "Задание N из M"). */
  indexInSession: number;
  difficulty: 1 | 2 | 3;
  difficultyLabel: 'Лёгкое' | 'Среднее' | 'Сложное';
  source: string;
  code: string;
  condition: string;
  /** Numeric/short-text answer tasks (most of EGE profile-math Part 1). */
  correctAnswer: string;
  explanation: string;
  hint: string;
  steps: readonly SolutionStep[];
  otherVariants: readonly TaskVariant[];
  sessionTasks: readonly SessionTask[];
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
  id: 'demo-3214',
  subjectId: 'math',
  subjectName: 'Математика',
  topic: 'Логарифмы',
  number: 15,
  totalInSession: 12,
  indexInSession: 3,
  difficulty: 3,
  difficultyLabel: 'Сложное',
  source: 'ФИПИ',
  code: '#3214',
  condition: 'Решите неравенство: log₂(x² − 3x − 4) ≥ 1',
  correctAnswer: '(−∞; −1] ∪ [2; +∞)',
  explanation:
    'log₂(x² − 3x − 4) ≥ 1 равносильно системе: x² − 3x − 4 ≥ 2 и x² − 3x − 4 > 0. Решая первое неравенство, получаем x² − 3x − 6 ≥ 0, откуда x ∈ (−∞; −1] ∪ [2; +∞) — это же множество удовлетворяет и области определения логарифма.',
  hint: 'Подставляй значение переменной по шагам, не сокращая вычисление сразу. Не забудь про область определения логарифма.',
  steps: [
    { text: 'Область определения: x² − 3x − 4 > 0, откуда x ∈ (−∞; −1) ∪ (4; +∞).' },
    { text: 'Так как основание 2 > 1, неравенство равносильно x² − 3x − 4 ≥ 2¹ = 2.' },
    { text: 'Решаем x² − 3x − 6 ≥ 0 — получаем x ∈ (−∞; −1] ∪ [2; +∞).' },
    { text: 'Пересекаем с областью определения: ответ (−∞; −1] ∪ [2; +∞).' },
  ],
  otherVariants: [
    { id: 'demo-3215', code: '#3215', difficultyLabel: 'Среднее', preview: 'log₅(x − 1) ≤ 2' },
    {
      id: 'demo-3216',
      code: '#3216',
      difficultyLabel: 'Сложное',
      preview: 'log₃(x + 2) + log₃x ≥ 1',
    },
    { id: 'demo-3217', code: '#3217', difficultyLabel: 'Лёгкое', preview: 'log₂(x − 4) ≥ 0' },
  ],
  sessionTasks: [
    { index: 1, status: 'correct' },
    { index: 2, status: 'correct' },
    { index: 3, status: 'correct' },
    { index: 4, status: 'correct' },
    { index: 5, status: 'correct' },
    { index: 6, status: 'current' },
    { index: 7, status: 'pending' },
    { index: 8, status: 'pending' },
    { index: 9, status: 'pending' },
    { index: 10, status: 'pending' },
  ],
};
