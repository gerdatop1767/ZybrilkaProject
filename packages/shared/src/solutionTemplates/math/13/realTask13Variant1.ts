/**
 * Canonical solution CONTENT for the one real EGE task №13 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 485-529 — "а) Решите уравнение √(2cos³x−sin²x−2cosx−sinx) =
 * √(cos(π/2+x)). б) Найдите все корни этого уравнения, принадлежащие
 * отрезку [−4π; −5π/2]."). This is authored content for ONE specific
 * task instance — the same kind of per-task authoring that file's own
 * `solutionSteps`/`explanationMd` already are — not a generic parser,
 * and it must never be read as "the math:13 algorithm".
 *
 * Why this can't be a generic adapter (architecture note, not a
 * shortcut): part а)'s answer is the general-solution formula
 * (x=πn, n∈ℤ; x=−2π/3+2πk, k∈ℤ) — this value exists ONLY as prose
 * inside the task's `explanationMd`/`hintMd` today; there is no
 * dedicated DB field holding it (only `correctAnswer`, which holds
 * part б)'s final numeric roots on the given interval). A real,
 * content-independent parser would have to extract a parametric
 * formula out of free-text Russian math prose — squarely AI/CAS
 * territory, explicitly out of scope for this stage. So this function
 * takes the task's real field VALUES as parameters (copied verbatim
 * from the import script, not invented) and returns the already-known
 * split into parts — explicit content authoring, not inference.
 *
 * The part split point: part а) is "решите уравнение" (find the
 * general solution) — that's `solutionSteps[0..3]` in the import
 * script (приводим к системе → упрощаем → кубическое уравнение →
 * проверяем sin x ⩽ 0, which is what actually produces the general
 * solution). Part б) is "найдите корни на отрезке" — the interval
 * selection alone, `solutionSteps[4]`.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { mathTask13EquationTemplate } from './equation.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask13Variant1Fields {
  readonly taskId: string;
  /** tasks.correct_answer — today holds only part б)'s numeric roots. */
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask13Variant1(
  fields: RealTask13Variant1Fields,
): CanonicalSolution {
  return {
    taskId: fields.taskId,
    templateId: mathTask13EquationTemplate.id,
    templateVersion: mathTask13EquationTemplate.version,
    parts: [
      {
        id: 'a',
        label: 'а)',
        hasCheckableAnswer: true,
        // Not present in any DB field today (see module doc) —
        // authored here from the task's real explanationMd/hintMd
        // wording, not invented.
        answer: 'x=πn, n∈ℤ; x=-2π/3+2πk, k∈ℤ',
        answerDisplay:
          '$x=\\pi n,\\ n\\in\\mathbb{Z};\\quad x=-\\dfrac{2\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$',
        steps: [
          {
            id: 'a1',
            title: 'Приводим к системе',
            explanation:
              'Так как $\\cos\\left(\\dfrac{\\pi}{2}+x\\right)=-\\sin x$, а уравнение вида $\\sqrt{A}=\\sqrt{B}$ равносильно системе $A=B$, $B\\geqslant 0$, получаем $2\\cos^3x-\\sin^2x-2\\cos x-\\sin x=-\\sin x$ при условии $\\sin x \\leqslant 0$.',
          },
          {
            id: 'a2',
            title: 'Упрощаем уравнение',
            explanation:
              '$2\\cos^3x-\\sin^2x-2\\cos x=0$. Заменяем $\\sin^2x=1-\\cos^2x$: $2\\cos^3x+\\cos^2x-2\\cos x-1=0$.',
          },
          {
            id: 'a3',
            title: 'Решаем кубическое уравнение относительно cos x',
            explanation:
              'Пусть $c=\\cos x$. Раскладываем на множители: $2c^3+c^2-2c-1=(c-1)(2c+1)(c+1)=0$, откуда $c=1$, $c=-\\dfrac12$, $c=-1$.',
          },
          {
            id: 'a4',
            title: 'Проверяем условие sin x ⩽ 0',
            explanation:
              '$c=1$ ($x=2\\pi n$) и $c=-1$ ($x=\\pi+2\\pi n$) дают $\\sin x=0$ — подходят всегда, вместе: $x=\\pi n$. Для $c=-\\dfrac12$ подходит только ветвь $x=-\\dfrac{2\\pi}{3}+2\\pi k$, где $\\sin x\\leqslant 0$.',
          },
        ],
      },
      {
        id: 'b',
        label: 'б)',
        hasCheckableAnswer: true,
        answer: fields.correctAnswer,
        answerDisplay: fields.correctAnswerDisplay ?? undefined,
        steps: [
          {
            id: 'b1',
            title: 'Отбираем корни на заданном отрезке',
            explanation:
              'Общее решение: $x=\\pi n$ или $x=-\\dfrac{2\\pi}{3}+2\\pi k$. На отрезке $\\left[-4\\pi;-\\dfrac{5\\pi}{2}\\right]$ подходят $x=-4\\pi$, $x=-3\\pi$ (из первой серии) и $x=-\\dfrac{8\\pi}{3}$ (из второй).',
          },
        ],
      },
    ],
    methodTags: ['substitution', 'factoring', 'quadratic_in_trig_function'],
  };
}
