/**
 * Canonical solution CONTENT for the one real EGE task №16 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 622-650 — a credit problem: loan A (whole number of million rubles)
 * taken June 2028; 2029-2031 pay interest only each year; 2032-2033
 * two equal payments, the second fully paying off the debt; find the
 * largest A such that total payments ≤10 million rubles). Authored
 * content for ONE specific task instance — the same per-task
 * authoring `realTask13Variant1.ts`/`...14.../...15...` already
 * established.
 *
 * Single part ("main") — like №15, this task's condition has no
 * а)/б) split.
 *
 * Every transformation below was independently re-derived (not copied
 * from `explanationMd`, which is accurate here, just re-verified from
 * scratch):
 *   Let A = loan size (whole number of million rubles).
 *   2029, 2030, 2031: each January the debt becomes 1.2×(debt at the
 *   end of the previous year). Since only interest is paid each year,
 *   the debt returns to A after each payment — so the January debt is
 *   1.2A every single year (not a growing 1.2^n·A), and each year's
 *   interest-only payment is 0.2A. Three years: 3×0.2A=0.6A paid,
 *   debt entering 2032 is still A.
 *   January 2032: debt becomes 1.2A. Payment P leaves 1.2A-P.
 *   January 2033: that grows by 20% to (1.2A-P)×1.2=1.44A-1.2P.
 *   The second payment P fully pays it off: 1.44A-1.2P-P=0, so
 *   1.44A=2.2P, so P=1.44A/2.2=36A/55.
 *   Total payments: 0.6A+2P = 0.6A+72A/55 = 33A/55+72A/55 = 105A/55
 *   = 21A/11.
 *   Condition: 21A/11≤10, so A≤110/21≈5.238..., and since A is a
 *   whole number, the largest possible A is 5.
 * This matches `correctAnswer` ('5') exactly — independently confirmed
 * (21×5/11 = 105/11 ≈ 9.545 ≤ 10, while 21×6/11 = 126/11 ≈ 11.45 > 10).
 *
 * FIPI sourcing (see `economics.v1.ts`'s own doc comment too):
 * doc.fipi.ru/4ege.ru were not reachable from this session (same
 * network restriction as №13-15). The scoring rubric used below
 * (0-2 points; the two-tier 2/1/0 criteria; the explicit requirement
 * to define variables and justify the model's construction, not just
 * state the resulting equation) is sourced from a reputable secondary
 * aggregator (web search, this session) — tagged
 * `secondary_source_verified`, never `fipi_verified`.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { mathTask16EconomicsTemplate } from './economics.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask16Variant1Fields {
  readonly taskId: string;
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask16Variant1(
  fields: RealTask16Variant1Fields,
): CanonicalSolution {
  return {
    taskId: fields.taskId,
    templateId: mathTask16EconomicsTemplate.id,
    templateVersion: mathTask16EconomicsTemplate.version,
    parts: [
      {
        id: 'main',
        label: 'Решение',
        hasCheckableAnswer: true,
        answer: fields.correctAnswer,
        answerDisplay: fields.correctAnswerDisplay ?? undefined,
        steps: [
          {
            id: 's1',
            kind: 'model_setup',
            title: 'Вводим обозначение',
            explanation:
              'Пусть $A$ — размер кредита в млн руб ($A$ — целое число по условию). Долг в июне 2028 года равен $A$.',
          },
          {
            id: 's2',
            title: 'Считаем выплаты за 2029–2031 годы',
            explanation:
              'Каждый январь долг увеличивается на 20%, то есть становится $1.2A$. В феврале–июне выплачиваются только проценты $0.2A$, после чего долг снова равен $A$ — значит и в следующем январе долг снова станет ровно $1.2A$, а не больше. За три года ($2029$, $2030$, $2031$) выплачено $3\\cdot 0.2A = 0.6A$, и долг на начало 2032 года по-прежнему равен $A$.',
          },
          {
            id: 's3',
            title: 'Составляем уравнение для равного платежа P',
            explanation:
              'Январь 2032: долг становится $1.2A$. После платежа $P$ остаётся $1.2A-P$. Январь 2033: этот остаток увеличивается на 20%, то есть становится $(1.2A-P)\\cdot 1.2 = 1.44A-1.2P$. Второй платёж $P$ полностью гасит долг, значит $1.44A-1.2P-P=0$, откуда $P=\\dfrac{1.44A}{2.2}=\\dfrac{36A}{55}$.',
          },
          {
            id: 's4',
            title: 'Находим общую сумму выплат',
            explanation:
              'Сумма всех выплат: $0.6A + 2P = 0.6A + \\dfrac{72A}{55} = \\dfrac{33A+72A}{55} = \\dfrac{105A}{55} = \\dfrac{21A}{11}$.',
          },
          {
            id: 's5',
            title: 'Решаем неравенство и находим наибольшее целое A',
            explanation:
              'По условию $\\dfrac{21A}{11}\\leqslant 10$, откуда $A\\leqslant \\dfrac{110}{21}\\approx 5.238$. Так как $A$ — целое число, наибольшее подходящее значение $A=5$.',
          },
        ],
      },
    ],
    // Compact BUT genuinely complete exam-ready write-up — the new,
    // higher bar for №16-19 (audit note): if a student copied only
    // this block onto their exam sheet, an expert should be able to
    // see the full justified line of reasoning — variable definition,
    // every model-building step with its justification, every
    // intermediate result the next line depends on, the final
    // inequality, the integer constraint, and the answer. This is
    // deliberately NOT just the first/last lines of the detailed
    // steps above — each line keeps exactly the content needed to
    // not lose the thread, while dropping only the explanatory prose
    // around them (same lesson as №13-15's audit fix: no glued
    // independent steps, no mechanical ":" before a continuation).
    examWriteup: {
      content:
        'Пусть $A$ — размер кредита в млн руб, $A\\in\\mathbb{N}$\n' +
        'В 2029, 2030, 2031 годах каждый январь долг становится $1.2A$\n' +
        'Выплачиваются только проценты $0.2A$, и долг снова равен $A$\n' +
        'За три года выплачено $3\\cdot 0.2A=0.6A$, долг на начало 2032 года равен $A$\n' +
        'Январь 2032: долг $1.2A$, после платежа $P$ остаётся $1.2A-P$\n' +
        'Январь 2033: долг становится $(1.2A-P)\\cdot 1.2=1.44A-1.2P$\n' +
        'Второй платёж полностью гасит долг: $1.44A-1.2P-P=0$\n' +
        '$\\Rightarrow P=\\dfrac{1.44A}{2.2}=\\dfrac{36A}{55}$\n' +
        'Общая сумма выплат: $0.6A+2P=0.6A+\\dfrac{72A}{55}=\\dfrac{105A}{55}=\\dfrac{21A}{11}$\n' +
        'По условию $\\dfrac{21A}{11}\\leqslant 10$\n' +
        '$\\Rightarrow A\\leqslant \\dfrac{110}{21}\\approx 5.238$\n' +
        '$A$ — целое число, наибольшее подходящее значение $A=5$\n\n' +
        `Ответ: ${fields.correctAnswerDisplay ?? fields.correctAnswer}`,
    },
    methodTags: ['variable_introduction', 'percentage_growth', 'equal_payment_equation'],
    criticalPoints: [
      {
        id: 'variables-must-be-defined-and-justified',
        text: 'Для полного балла нужно явно ввести обозначение (например, A — размер кредита) и объяснить, откуда берётся каждое уравнение — простое предъявление готовой формулы без обоснования не засчитывается по максимальному критерию.',
        category: 'exam_scoring',
        required: true,
        partId: 'main',
        rationale:
          'Рубрика №16 (секундарный источник, 4ege.ru): "для получения полного балла необходимо приводить полное обоснование всех шагов решения, описывать введённые в задачу переменные, а также пояснять, аргументировать составление математической модели задачи".',
        validationRuleId: 'has-model-setup-step',
        source: 'secondary_source_verified',
      },
      {
        id: 'model-must-be-fully-solved-and-justified',
        text: 'Модель нужно не только построить, но и полностью довести до обоснованно верного ответа — верная модель с результатом, который недостаточно обоснован, или с вычислительной ошибкой, даёт только 1 балл вместо 2.',
        category: 'exam_scoring',
        required: true,
        partId: 'main',
        rationale:
          'Рубрика №16 (секундарный источник, 4ege.ru): 2 балла — "обоснованно получен верный ответ"; 1 балл — "верно построена математическая модель, решение сведено к исследованию этой модели и получен результат (неверный ответ из-за вычислительной ошибки или верный ответ, но решение недостаточно обосновано)".',
        validationRuleId: 'has-content',
        source: 'secondary_source_verified',
      },
      {
        id: 'integer-constraint-must-be-applied',
        text: 'Кредит — целое число миллионов рублей по условию задачи. Нельзя оставить ответ в виде дроби 110/21≈5.238 — обязательно нужно явно перейти к наибольшему целому числу, удовлетворяющему неравенству.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этой задачи (условие явно требует целого числа миллионов рублей) — не общее требование ФИПИ к любому №16, а часть корректного решения этой конкретной задачи. Пропуск этого шага — частая ошибка, ведущая к неверному ответу (например, округление 5.238 до 5.24 или до 6).',
        source: 'project_quality_rule',
      },
      {
        id: 'debt-returns-to-principal-each-interest-only-year',
        text: 'Нужно явно показать, что в 2029–2031 годах долг каждый раз возвращается к A после уплаты процентов — именно поэтому проценты во всех трёх годах считаются от одной и той же суммы A (0.6A суммарно), а не от накапливающегося долга.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этого кредитного условия (платятся только проценты, тело долга не уменьшается и не растёт за эти три года) — не общее требование ФИПИ к любому №16, а часть корректного решения этой конкретной задачи. No structural validator checks this (would need content-aware verification of the recurrence) — intentionally left unlinked, not automated this stage.',
        source: 'project_quality_rule',
      },
    ],
  };
}
