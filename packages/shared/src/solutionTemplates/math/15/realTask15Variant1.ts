/**
 * Canonical solution CONTENT for the one real EGE task №15 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 576-621 — "Решите неравенство (9^x − 3^(x+2) + 8) /
 * (log_(1/6)²(5^x−2) + log_(1/6)(5^x−2)² + 1) ≤ 0."). Authored content
 * for ONE specific task instance — the same per-task authoring
 * `realTask13Variant1.ts`/`realTask14Variant1.ts` already established.
 *
 * Single part ("main") — unlike №13/№14, this task's condition has no
 * а)/б) split at all, so `parts` is genuinely one entry, not an
 * authoring gap.
 *
 * Every transformation below was independently re-derived (not copied
 * from `explanationMd`, which is otherwise accurate here — no garbled
 * fragment like №14's, this is just a from-scratch check):
 *   Domain: the denominator contains log_{1/6}(5^x-2), so 5^x-2>0,
 *   i.e. x>log_5(2).
 *   Let t=log_{1/6}(5^x-2). Since 5^x-2>0 in the domain,
 *   log_{1/6}((5^x-2)^2) = 2·log_{1/6}(5^x-2) = 2t, so the denominator
 *   is t^2+2t+1=(t+1)^2 — always ≥0, equal to 0 only at t=-1, i.e.
 *   5^x-2=6, i.e. x=log_5(8) (the excluded point).
 *   For x≠log_5(8) in the domain, the denominator is strictly
 *   positive, so the fraction's sign equals the numerator's sign:
 *   9^x-3^(x+2)+8 ≤ 0. Let u=3^x>0: 9^x=u^2, 3^(x+2)=9u, giving
 *   u^2-9u+8≤0 ⟺ (u-1)(u-8)≤0 ⟺ 1≤u≤8 ⟺ 0≤x≤log_3(8).
 *   Intersecting [0,log_3(8)] with x>log_5(2) (log_5(2)≈0.431>0) gives
 *   (log_5(2),log_3(8)]; log_5(8)≈1.292 lies strictly inside that
 *   interval (log_5(2)<log_5(8)<log_3(8)≈1.893), so excluding it
 *   splits the interval into two:
 *   (log_5(2),log_5(8)) ∪ (log_5(8),log_3(8)].
 * This matches `correctAnswer`/`correctAnswerDisplay` exactly — also
 * independently confirmed via `intervalAnswer.ts`'s own `parseBound`
 * (numeric log evaluation), see `realTask15Variant1.test.ts`.
 *
 * FIPI sourcing (see `inequality.v1.ts`'s own doc comment too):
 * doc.fipi.ru and 4ege.ru were not reachable from this session (same
 * network restriction as №13/№14). The scoring rubric used below
 * (0-2 points; the two-tier 2/1/0 criteria; that including the
 * excluded point in the final answer specifically scores 0, not just
 * a minor deduction) is sourced from a reputable secondary aggregator
 * (web search, this session) — tagged `secondary_source_verified`,
 * never `fipi_verified`.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { mathTask15InequalityTemplate } from './inequality.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask15Variant1Fields {
  readonly taskId: string;
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask15Variant1(
  fields: RealTask15Variant1Fields,
): CanonicalSolution {
  return {
    taskId: fields.taskId,
    templateId: mathTask15InequalityTemplate.id,
    templateVersion: mathTask15InequalityTemplate.version,
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
            kind: 'domain_check',
            title: 'Находим ОДЗ',
            explanation:
              'Знаменатель содержит $\\log_{1/6}(5^x-2)$, значит необходимо $5^x-2>0$, то есть $x>\\log_5 2$.',
          },
          {
            id: 's2',
            title: 'Упрощаем знаменатель',
            explanation:
              'Пусть $t=\\log_{1/6}(5^x-2)$. Так как $5^x-2>0$ в ОДЗ, $\\log_{1/6}(5^x-2)^2=2\\log_{1/6}(5^x-2)=2t$. Значит знаменатель равен $t^2+2t+1=(t+1)^2$.',
          },
          {
            id: 's3',
            kind: 'excluded_point',
            title: 'Находим исключённую точку',
            explanation:
              '$(t+1)^2\\geqslant 0$ всегда и равен нулю только при $t=-1$, то есть при $5^x-2=6\\Leftrightarrow x=\\log_5 8$ — эту точку необходимо исключить, так как в ней дробь не определена.',
          },
          {
            id: 's4',
            title: 'Сводим неравенство к числителю',
            explanation:
              'При $x\\neq\\log_5 8$ знаменатель строго положителен, поэтому знак дроби совпадает со знаком числителя: исходное неравенство равносильно $9^x-3^{x+2}+8\\leqslant 0$ при условии $x>\\log_5 2$, $x\\neq\\log_5 8$.',
          },
          {
            id: 's5',
            title: 'Решаем неравенство для числителя',
            explanation:
              'Пусть $u=3^x>0$. Тогда $9^x=u^2$, $3^{x+2}=9u$, и неравенство принимает вид $u^2-9u+8\\leqslant 0\\Leftrightarrow (u-1)(u-8)\\leqslant 0\\Leftrightarrow 1\\leqslant u\\leqslant 8\\Leftrightarrow 0\\leqslant x\\leqslant\\log_3 8$.',
          },
          {
            id: 's6',
            title: 'Пересекаем с ОДЗ и исключаем точку',
            explanation:
              'Пересечение $[0;\\log_3 8]$ с $x>\\log_5 2$ даёт $(\\log_5 2;\\log_3 8]$. Точка $x=\\log_5 8$ лежит внутри этого промежутка (так как $\\log_5 2<\\log_5 8<\\log_3 8$), и её исключение разбивает промежуток на два: $(\\log_5 2;\\log_5 8)\\cup(\\log_5 8;\\log_3 8]$.',
          },
        ],
      },
    ],
    // Compact, exam-ready write-up — every independent transition gets
    // its own line (same lesson as №13/№14's audit fix: no glued
    // formulas, no mechanical ":" before a continuation). "ОДЗ:" and
    // "Ответ:" are the one legitimate exception — real exam-write-up
    // labels, not step separators (same convention kept for №13/№14).
    examWriteup: {
      content:
        'ОДЗ: $5^x-2>0\\Rightarrow x>\\log_5 2$\n' +
        'Пусть $t=\\log_{1/6}(5^x-2)$\n' +
        'Знаменатель $=t^2+2t+1=(t+1)^2\\geqslant 0$\n' +
        '$(t+1)^2=0\\Leftrightarrow x=\\log_5 8$ — исключаем эту точку\n' +
        'При $x\\neq\\log_5 8$ знак дроби определяется числителем\n' +
        'Пусть $u=3^x$\n' +
        '$u^2-9u+8\\leqslant 0\\Leftrightarrow (u-1)(u-8)\\leqslant 0\\Leftrightarrow 1\\leqslant u\\leqslant 8$\n' +
        '$\\Rightarrow 0\\leqslant x\\leqslant\\log_3 8$\n' +
        'Пересечение с ОДЗ и исключение точки $x=\\log_5 8$ даёт два промежутка\n' +
        `Ответ: ${fields.correctAnswerDisplay ?? fields.correctAnswer}`,
    },
    methodTags: ['substitution', 'domain_analysis', 'sign_analysis'],
    criticalPoints: [
      {
        id: 'excluded-point-must-not-be-in-answer',
        text: 'Если в ответ попадёт исключённая точка x=log₅8 (где знаменатель обращается в ноль), решение оценивается в 0 баллов — это не просто ошибка в строгости границы, а включение недопустимого значения.',
        category: 'exam_scoring',
        required: true,
        partId: 'main',
        rationale:
          'Рубрика №15 (секундарный источник, 4ege.ru): "Если в ответ включено значение переменной, при котором одна из частей неравенства не имеет смысла, то следует выставлять оценку 0 баллов" — отдельное, более строгое правило, чем обычная ошибка в границе.',
        validationRuleId: 'has-domain-step',
        source: 'secondary_source_verified',
      },
      {
        id: 'boundary-strictness-matters',
        text: 'Ошибка в строгости границы (< вместо ⩽ или наоборот) при верном методе снижает оценку до 1 балла вместо 2 — нужно точно определить, что x=log₃8 входит в ответ, а x=log₅2 и x=log₅8 — нет.',
        category: 'exam_scoring',
        required: true,
        partId: 'main',
        rationale:
          'Рубрика №15 (секундарный источник, 4ege.ru), критерий на 1 балл: "обоснованно получен ответ, отличающийся от верного исключением/включением граничных точек... допускаются только ошибки в строгости неравенства".',
        source: 'secondary_source_verified',
      },
      {
        id: 'full-justification-required',
        text: 'Для максимальных 2 баллов нужен полностью обоснованный ответ — вся последовательность шагов (ОДЗ, упрощение знаменателя, решение неравенства для числителя, пересечение), а не только итоговый результат.',
        category: 'exam_scoring',
        required: true,
        partId: 'main',
        rationale:
          'Рубрика №15 (секундарный источник, 4ege.ru): 2 балла — "обоснованно получен верный ответ"; 1 балл допускается только при "верной последовательности всех шагов решения" даже при вычислительной ошибке — голый ответ без обоснования не соответствует ни одному из этих уровней.',
        validationRuleId: 'has-content',
        source: 'secondary_source_verified',
      },
      {
        id: 'domain-must-be-stated',
        text: 'ОДЗ (x>log₅2) обязательно нужно явно выписать в начале решения — без неё нельзя корректно обосновать, почему итоговый промежуток начинается именно с log₅2, а не с 0.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этого неравенства (логарифм в знаменателе сужает область определения сильнее, чем решение числителя само по себе) — не общее требование ФИПИ к любому №15, а часть корректного решения этой конкретной задачи.',
        validationRuleId: 'has-domain-step',
        source: 'project_quality_rule',
      },
      {
        id: 'denominator-is-a-perfect-square',
        text: 'Нужно доказать, что знаменатель — полный квадрат (t+1)², а не просто предположить его знак: именно это обосновывает, что весь знак дроби определяется числителем, и даёт единственную исключённую точку, а не целый интервал запрета.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этого выражения (знаменатель раскладывается в полный квадрат через подстановку t=log_{1/6}(5^x-2)) — не общее требование ФИПИ к любому №15, а часть корректного решения этой конкретной задачи. No structural validator checks this (would need content-aware algebraic verification) — intentionally left unlinked, not automated this stage.',
        source: 'project_quality_rule',
      },
    ],
  };
}
