/**
 * Canonical solution CONTENT for the one real EGE task №14 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 530-574 — pyramid SABCD, SA the height, ABCD a square, K the
 * midpoint of SB, line DK meeting plane SAC at N; а) prove a ratio on
 * diagonal AC, б) find the angle between lines DK and SC given
 * AB=2√3, SA=6). Authored content for ONE specific task instance —
 * the same per-task authoring `realTask13Variant1.ts` already
 * established — never a generic "math:14 algorithm".
 *
 * All coordinates/vectors/values below were independently re-derived
 * from the task's own condition (not copied from `explanationMd`,
 * which also has a garbled fragment in its part а) prose — "N=(a/3,
 * a/3, h/3·... )" — this content fixes that, not propagates it):
 *   A(0,0,0), B(a,0,0), C(a,a,0), D(0,a,0), S(0,0,h), a=AB, h=SA.
 *   Plane SAC is {x=y}. K=mid(S,B)=(a/2,0,h/2). Line DK parametrized
 *   D+t(K-D) meets {x=y} at t=2/3, so N=(a/3,a/3,h/3). The line
 *   through N parallel to SC=(a,a,-h) meets AC (points (v,v,0)) at
 *   u=1/3, i.e. (2a/3,2a/3,0), giving AP:PC=2:1 — the same division
 *   as "1:2" (just named from the other endpoint) — matching the
 *   task's own claim.
 *   For б): DK=(a/2,-a,h/2), SC=(a,a,-h); at a²=12,h=6:
 *   DK·SC=-24, |DK|=2√6, |SC|=2√15, cosφ=|DK·SC|/(|DK||SC|)=√10/5.
 * This matches `correctAnswer`/`correctAnswerDisplay` exactly.
 *
 * Part а) has NO checkable answer — it's a proof ("Докажите"), not a
 * computed value — `hasCheckableAnswer: false`, genuinely (not an
 * authoring gap like №13's part а) formula, which does exist but
 * isn't in any DB field). Part б)'s checkable answer comes from the
 * task's own `correctAnswer`/`correctAnswerDisplay` fields, same
 * pattern as №13's part б).
 *
 * FIPI sourcing for this task (see `stereometry.v1.ts`'s own doc
 * comment too): doc.fipi.ru was not reachable from this session (same
 * network restriction as №13). The scoring rubric used below (0-3
 * points, not №13's 0-2; the four-tier 3/2/1/0 criteria; that a
 * classical/projection/volume/coordinate method are all recognized
 * valid for №14) is sourced from a reputable secondary aggregator of
 * FIPI's published criteria (web search, this session) — tagged
 * `secondary_source_verified`, never `fipi_verified`, per the
 * project's explicit instruction to keep that distinction honest.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { mathTask14StereometryTemplate } from './stereometry.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask14Variant1Fields {
  readonly taskId: string;
  /** tasks.correct_answer — holds part б)'s angle only; part а) has no checkable answer (it's a proof). */
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask14Variant1(
  fields: RealTask14Variant1Fields,
): CanonicalSolution {
  return {
    taskId: fields.taskId,
    templateId: mathTask14StereometryTemplate.id,
    templateVersion: mathTask14StereometryTemplate.version,
    parts: [
      {
        id: 'a',
        label: 'а)',
        hasCheckableAnswer: false,
        steps: [
          {
            id: 'a1',
            title: 'Вводим координаты',
            explanation:
              'Пусть $A(0,0,0)$, $B(a,0,0)$, $C(a,a,0)$, $D(0,a,0)$, $S(0,0,h)$, где $a=AB$, $h=SA$. Плоскость $SAC$ задаётся уравнением $x=y$ — точки $A$ и $S$ имеют $x=y=0$, точка $C$ имеет $x=y=a$.',
          },
          {
            id: 'a2',
            title: 'Находим точку N — пересечение DK с плоскостью SAC',
            explanation:
              '$K$ — середина $SB$, $K=\\left(\\dfrac a2,0,\\dfrac h2\\right)$. Точки прямой $DK$: $\\left(\\dfrac{ta}2,\\ a-ta,\\ \\dfrac{th}2\\right)$. Условие $x=y$ даёт $t=\\dfrac23$, откуда $N=\\left(\\dfrac a3,\\dfrac a3,\\dfrac h3\\right)$.',
          },
          {
            id: 'a3',
            title: 'Строим прямую через N параллельно SC и находим отношение',
            explanation:
              'Прямая через $N$ параллельно $\\vec{SC}=(a,a,-h)$ пересекает диагональ $AC$ в точке $\\left(\\dfrac{2a}3,\\dfrac{2a}3,0\\right)$. Значит $AP=\\dfrac{2a}3$, $PC=\\dfrac a3$, то есть $AP:PC=2:1$ — та же точка делит $AC$ в отношении $1:2$, считая от $C$. Утверждение доказано.',
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
            title: 'Находим направляющие векторы',
            explanation:
              '$\\vec{DK}=K-D=\\left(\\dfrac a2,-a,\\dfrac h2\\right)$, $\\vec{SC}=C-S=(a,a,-h)$.',
          },
          {
            id: 'b2',
            title: 'Подставляем числовые значения',
            explanation:
              'При $a=AB=2\\sqrt3$ (значит $a^2=12$) и $h=SA=6$: $\\vec{DK}\\cdot\\vec{SC}=\\dfrac{a^2}2-a^2-\\dfrac{h^2}2=-24$.',
          },
          {
            id: 'b3',
            title: 'Находим длины векторов',
            explanation:
              '$|\\vec{DK}|^2=\\dfrac{a^2}4+a^2+\\dfrac{h^2}4=24\\Rightarrow|\\vec{DK}|=2\\sqrt6$. $|\\vec{SC}|^2=2a^2+h^2=60\\Rightarrow|\\vec{SC}|=2\\sqrt{15}$.',
          },
          {
            id: 'b4',
            title: 'Находим угол между прямыми',
            explanation:
              'Угол между прямыми (в отличие от угла между векторами) вычисляется через модуль: $\\cos\\varphi=\\dfrac{|\\vec{DK}\\cdot\\vec{SC}|}{|\\vec{DK}||\\vec{SC}|}=\\dfrac{24}{2\\sqrt6\\cdot2\\sqrt{15}}=\\dfrac{\\sqrt{10}}{5}$, откуда $\\varphi=\\arccos\\dfrac{\\sqrt{10}}{5}$.',
          },
        ],
      },
    ],
    // Compact, exam-ready write-up — every independent transition gets
    // its own line (no two facts glued into one $...$ span, no
    // mechanical ":" before a continuation — same lesson as №13's
    // audit fix). The ratio notation "2:1"/"1:2" itself is real math
    // notation, not a step separator, so it's left untouched.
    examWriteup: {
      content:
        'а) $A(0,0,0),\\ B(a,0,0),\\ C(a,a,0),\\ D(0,a,0),\\ S(0,0,h)$\n' +
        'Плоскость $SAC$ — это $x=y$\n' +
        '$K=\\left(\\dfrac a2,0,\\dfrac h2\\right)$ (середина $SB$)\n' +
        'Прямая $DK$: $\\left(\\dfrac{ta}2,\\ a-ta,\\ \\dfrac{th}2\\right)$\n' +
        '$x=y\\Rightarrow t=\\dfrac23\\Rightarrow N=\\left(\\dfrac a3,\\dfrac a3,\\dfrac h3\\right)$\n' +
        'Прямая через $N$ параллельно $SC$ пересекает $AC$ в $\\left(\\dfrac{2a}3,\\dfrac{2a}3,0\\right)$\n' +
        '$AP{:}PC=2{:}1$, то есть $AC$ делится в отношении $1{:}2$. Что и требовалось доказать.\n\n' +
        'б) $\\vec{DK}=\\left(\\dfrac a2,-a,\\dfrac h2\\right)$\n' +
        '$\\vec{SC}=(a,a,-h)$\n' +
        '$a=2\\sqrt3,\\ h=6$\n' +
        '$\\vec{DK}\\cdot\\vec{SC}=-24$\n' +
        '$|\\vec{DK}|=2\\sqrt6,\\ |\\vec{SC}|=2\\sqrt{15}$\n' +
        '$\\cos\\varphi=\\dfrac{|\\vec{DK}\\cdot\\vec{SC}|}{|\\vec{DK}||\\vec{SC}|}=\\dfrac{\\sqrt{10}}{5}$\n\n' +
        `Ответ: ${fields.correctAnswerDisplay ?? fields.correctAnswer}`,
    },
    methodTags: ['coordinate_method', 'vectors', 'plane_intersection'],
    criticalPoints: [
      {
        id: 'full-credit-requires-both-parts',
        text: 'Максимальные 3 балла ставятся только при верном доказательстве пункта а) и одновременно обоснованно верном ответе пункта б) — наличие только одного из них даёт меньше баллов.',
        category: 'exam_scoring',
        required: true,
        rationale:
          'Рубрика №14 (секундарный источник, 4ege.ru): 3 балла — "имеется верное доказательство утверждения пункта а) и обоснованно получен верный ответ в пункте б)"; 2 балла и 1 балл — за частичное выполнение. Отличается от №13 (0-2 балла) — у №14 шкала 0-3.',
        validationRuleId: 'has-both-parts',
        source: 'secondary_source_verified',
      },
      {
        id: 'proof-must-stand-on-its-own',
        text: 'Если ответ пункта б) опирается на утверждение пункта а), а само пункт а) не доказано — это оценивается только в 1 балл, а не в максимальные 3.',
        category: 'exam_scoring',
        required: true,
        partId: 'a',
        rationale:
          'Рубрика №14 (секундарный источник, 4ege.ru), критерий на 1 балл: "обоснованно получен верный ответ в пункте б) с использованием утверждения пункта а), при этом пункт а) не выполнен". Намеренно не привязан к validationRuleId — это логическая зависимость между пунктами, которую структурный валидатор (просто проверяющий непустоту шагов) не может обнаружить.',
        source: 'secondary_source_verified',
      },
      {
        id: 'part-b-needs-justification',
        text: 'Ответ пункта б) должен сопровождаться полным вычислением (векторы, скалярное произведение, длины), а не только итоговым числом.',
        category: 'exam_scoring',
        required: true,
        partId: 'b',
        rationale:
          'Рубрика №14 (секундарный источник, 4ege.ru) требует "обоснованно получен верный ответ" на всех уровнях выше 0 баллов — голый ответ без обоснования не засчитывается по максимальному критерию.',
        validationRuleId: 'has-content',
        source: 'secondary_source_verified',
      },
      {
        id: 'angle-between-lines-absolute-value',
        text: 'Угол между прямыми (в отличие от угла между направляющими векторами) всегда неотрицателен и не больше 90°, поэтому в формуле косинуса обязательно берётся модуль скалярного произведения.',
        category: 'correctness',
        required: true,
        partId: 'b',
        rationale:
          'Общий геометрический факт о том, как связан угол между прямыми с углом между их направляющими векторами (эти углы могут отличаться, если скалярное произведение отрицательно) — не специфичное для конкретной задачи требование ФИПИ, а математический факт, обязательный для корректности решения именно этим методом.',
        source: 'project_quality_rule',
      },
      {
        id: 'plane-SAC-equation-justification',
        text: 'Нужно обосновать, что плоскость SAC задаётся уравнением x=y в выбранной системе координат — без этого нахождение точки N не опирается ни на что.',
        category: 'correctness',
        required: true,
        partId: 'a',
        rationale:
          'Математический факт о структуре именно этой пирамиды (SA — высота, ABCD — квадрат) при выбранном расположении координат — часть корректного решения этой конкретной задачи, не общее требование ФИПИ к любому №14.',
        source: 'project_quality_rule',
      },
      {
        id: 'free-method-disclaimer',
        text: 'Метод решения и форма записи могут отличаться от этого эталонного решения — координатный метод здесь лишь один из распространённых корректных способов, наряду с классическим (синтетическим), методом проекций и методом объёмов.',
        category: 'presentation',
        required: false,
        rationale:
          'Секундарный источник (веб-поиск, эта сессия) подтверждает, что для №14 признаются разными методами: классический (на определениях и признаках), метод проекций, метод объёмов, координатно-векторный метод — эксперт обязан проверять совпадение ответа независимо от метода (в т.ч. эквивалентные формы записи вроде arcsin/arccos).',
        source: 'secondary_source_verified',
      },
    ],
  };
}
