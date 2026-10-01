/**
 * Canonical solution CONTENT for the one real EGE task №19 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 757-804 — Иван Ильич's coin collection: large binders need $k$ of
 * them with 5 empty cells in the last one, small binders need $k+2$
 * with 5 empty cells too; large binders have 151-159 cells, small
 * ones 101-119 cells; а) can $k=3$? б) smallest possible collection?
 * в) largest possible collection?). Authored content for ONE specific
 * task instance — the same per-task authoring `realTask13Variant1.ts`/
 * `...14.../...15.../...16.../...17.../...18...` already established.
 *
 * `answerType: 'multi_part'` — `fields.correctAnswer` holds the
 * serialized `MultiPartSpec` JSON (three sub-answers: а='нет',
 * б='607', в='1066'), parsed here via `parseMultiPartSpec` (not
 * re-typed by hand) to populate each CanonicalSolution part's own
 * `answer` field — never duplicating the per-part correct values as a
 * second source of truth.
 *
 * Every step below was independently re-derived from scratch (NOT
 * copied from `explanationMd`, whose brute-force-style enumeration is
 * correct but less rigorous than the argument used here — this
 * content deliberately uses a cleaner, fully exam-reproducible bound
 * instead of an implicit "search every (Б,М) pair"):
 *   Let $N$ = coin count, $Б$ = cells per large binder
 *   ($151\leqslant Б\leqslant159$), $М$ = cells per small binder
 *   ($101\leqslant М\leqslant119$), $k$ = number of large binders.
 *   $N=kБ-5=(k+2)М-5 \Rightarrow kБ=(k+2)М \Rightarrow k(Б-М)=2М$.
 *   For ANY valid pair: $Б-М\geqslant151-119=32$ (universal, since
 *   $Б\geqslant151$, $М\leqslant119$) and $Б-М\leqslant159-101=58$
 *   (universal, since $Б\leqslant159$, $М\geqslant101$); also
 *   $2М\in[202,238]$. So $k=\frac{2М}{Б-М}\in[\frac{202}{58},
 *   \frac{238}{32}]\approx[3.48,7.44]$ for EVERY valid pair, and since
 *   $k$ is a positive integer, $k\in\{4,5,6,7\}$ — this alone proves
 *   $k=3$ is impossible (independently re-verified: this is strictly
 *   stronger than `explanationMd`'s ad-hoc check of multiples of 3,
 *   and gives the same "нет" conclusion by a fully general argument).
 *   For each $k$, $Б=\frac{(k+2)М}{k}$ is an integer $\Leftrightarrow$
 *   $k\mid2М$ (since $(k+2)М=kМ+2М$ and $kМ$ is always divisible by
 *   $k$). Independently solved for the two extremal $k$ values only
 *   (justified below, not an oversight):
 *     $k=4$: $4\mid2М\Leftrightarrow2\mid М$ (even). Even
 *     $М\in[101,119]$ with $Б=\frac{3М}{2}\leqslant159$ gives
 *     $М\in\{102,104,106\}$ ⟶ $(Б,М)=(153,102),(156,104),(159,106)$
 *     ⟶ $N=607,619,631$.
 *     $k=7$: $7\mid2М\Leftrightarrow7\mid М$ (since $\gcd(2,7)=1$).
 *     Multiples of 7 in $[101,119]$ are $105,112,119$; only $М=119$
 *     gives $Б=\frac{9\cdot119}{7}=153\in[151,159]$ ⟶ $N=1066$.
 *   Key independent insight (not in `explanationMd`): since
 *   $Б\in[151,159]$ for every $k$, $N=kБ-5$ ranges over
 *   $[151k-5,159k-5]$ for that $k$ — and these four ranges
 *   ($k=4$: $[599,631]$; $k=5$: $[750,790]$; $k=6$: $[901,949]$;
 *   $k=7$: $[1052,1108]$) are pairwise disjoint and strictly
 *   increasing with $k$ (independently confirmed numerically: every
 *   value in the $k$ range is less than every value in the $(k+1)$
 *   range). So the global minimum MUST come from $k=4$ (the smallest
 *   possible $k$) and the global maximum MUST come from $k=7$ (the
 *   largest possible $k$) — $k=5,6$ never need to be checked at all
 *   to answer б)/в), since nothing in their ranges could beat $k=4$'s
 *   minimum or $k=7$'s maximum regardless of what those ranges
 *   contain. Within $k=4$'s three solutions, the smallest $Б=153$
 *   gives the smallest $N=607$; $k=7$ has only one solution, $N=1066$.
 *   (Independently cross-checked against a full brute-force search
 *   over every integer $(Б,М)$ pair in range — see
 *   `realTask19Variant1.test.ts` — which finds exactly the same 7
 *   triples `explanationMd` lists, confirming both methods agree.)
 * This matches the parsed `correctAnswer` spec
 * (а='нет', б='607', в='1066') exactly.
 *
 * FIPI sourcing (see `numberTheory.v1.ts`'s own doc comment too):
 * doc.fipi.ru was not reachable from this session (same network
 * restriction as every earlier task). The scoring rubric used below
 * (0-4 points; 1 point each for а, б, в's "оценка" (bound/estimate),
 * в's "пример" (an achieving example) — i.e. б/в each need BOTH a
 * bound and an example to earn full credit; "решение может быть
 * произвольным" — any mathematically sound method is accepted) is
 * sourced from a reputable secondary aggregator of FIPI's published
 * criteria (web search, this session, 4ege.ru) — tagged
 * `secondary_source_verified`, never `fipi_verified`.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { parseMultiPartSpec } from '../../../multiPartAnswer.js';
import { mathTask19NumberTheoryTemplate } from './numberTheory.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask19Variant1Fields {
  readonly taskId: string;
  /** tasks.correct_answer for a multi_part task — the serialized MultiPartSpec JSON, never a plain string here. */
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask19Variant1(
  fields: RealTask19Variant1Fields,
): CanonicalSolution {
  const spec = parseMultiPartSpec(fields.correctAnswer);
  if (!spec) {
    throw new Error(
      'buildCanonicalSolutionForTask19Variant1: fields.correctAnswer is not a valid MultiPartSpec JSON',
    );
  }
  const answerFor = (partId: string): string => {
    const part = spec.parts.find((p) => p.id === partId);
    if (!part) {
      throw new Error(`buildCanonicalSolutionForTask19Variant1: no spec part with id "${partId}"`);
    }
    return part.correctAnswer;
  };

  return {
    taskId: fields.taskId,
    templateId: mathTask19NumberTheoryTemplate.id,
    templateVersion: mathTask19NumberTheoryTemplate.version,
    parts: [
      {
        id: 'a',
        label: 'а)',
        hasCheckableAnswer: true,
        answer: answerFor('a'),
        steps: [
          {
            id: 'a1',
            title: 'Составляем уравнение',
            explanation:
              'Пусть $N$ — число монет, $Б$ — ячеек в большом кляссере ($151\\leqslant Б\\leqslant159$), $М$ — ячеек в маленьком ($101\\leqslant М\\leqslant119$), $k$ — число больших кляссеров. Тогда $N=kБ-5=(k+2)М-5$, откуда $kБ=(k+2)М$, то есть $k(Б-М)=2М$.',
          },
          {
            id: 'a2',
            kind: 'bound_derivation',
            title: 'Находим границы для k и отвечаем на пункт а',
            explanation:
              'Для любой допустимой пары: $Б-М\\geqslant151-119=32$ и $Б-М\\leqslant159-101=58$ (это верно для ЛЮБЫХ $Б\\in[151,159]$, $М\\in[101,119]$, а не только для конкретной пары). Также $2М\\in[202,238]$. Значит $k=\\dfrac{2М}{Б-М}\\in\\left[\\dfrac{202}{58};\\dfrac{238}{32}\\right]\\approx[3.48;7.44]$ для любой допустимой пары. Так как $k$ — целое положительное число, $k\\in\\{4,5,6,7\\}$ — в частности, $k=3$ невозможно.',
          },
        ],
      },
      {
        id: 'b',
        label: 'б)',
        hasCheckableAnswer: true,
        answer: answerFor('b'),
        steps: [
          {
            id: 'b1',
            title: 'Оцениваем диапазон N для каждого k',
            explanation:
              'Так как $Б\\in[151,159]$ при любом $k$, то $N=kБ-5$ лежит в диапазоне $[151k-5,\\ 159k-5]$ для этого $k$. Вычисляя эти диапазоны для $k=4,5,6,7$: $[599,631]$, $[750,790]$, $[901,949]$, $[1052,1108]$ — они не пересекаются и строго возрастают с ростом $k$. Значит наименьшее $N$ может быть только при $k=4$, а наибольшее — только при $k=7$; случаи $k=5,6$ не могут дать ни наименьшее, ни наибольшее значение и не нужны для пунктов б) и в).',
          },
          {
            id: 'b2',
            kind: 'exhaustive_case_check',
            title: 'Разбираем k = 4 и находим наименьшее N',
            explanation:
              'При $k=4$: $Б=\\dfrac{6М}{4}=\\dfrac{3М}{2}$ — целое $\\Leftrightarrow$ $М$ чётное. Перебирая чётные $М\\in[101,119]$ с условием $Б\\leqslant159$: подходят $М=102,104,106$, что даёт $Б=153,156,159$ и $N=607,619,631$. Наименьшее среди них — $N=607$ (при $Б=153,М=102$).',
          },
        ],
      },
      {
        id: 'c',
        label: 'в)',
        hasCheckableAnswer: true,
        answer: answerFor('c'),
        steps: [
          {
            id: 'c1',
            kind: 'exhaustive_case_check',
            title: 'Разбираем k = 7 и находим наибольшее N',
            explanation:
              'При $k=7$: $Б=\\dfrac{9М}{7}$ — целое $\\Leftrightarrow$ $7\\mid М$ (так как $\\gcd(2,7)=1$). Кратные $7$ в $[101,119]$: $105,112,119$. Только $М=119$ даёт $Б=153\\in[151,159]$, остальные дают $Б$ вне диапазона. Получаем единственное решение: $N=7\\cdot153-5=1066$.',
          },
          {
            id: 'c2',
            title: 'Обосновываем, что это наибольшее возможное N',
            explanation:
              'По пункту б), диапазоны $N$ для $k=4,5,6,7$ не пересекаются и возрастают, поэтому наибольшее $N$ может быть только при $k=7$ — а при $k=7$ единственное решение даёт $N=1066$. Значит наибольшее количество монет — $1066$.',
          },
        ],
      },
    ],
    // Compact BUT genuinely complete exam-ready write-up — the
    // strictest bar yet (final task of this stage): if a student
    // copied only this block onto their exam sheet, an expert should
    // see the full justified chain for all three parts — the shared
    // model, the universal k-bound (with its own inequality
    // justification, not asserted), the divisibility-based case
    // analysis for both extremal k values (showing it's necessary AND
    // sufficient, not just "an example that works"), and the band
    // argument that justifies skipping k=5,6 instead of silently
    // omitting them. Each independent fact is on its own line (no
    // mechanical ":"/";" gluing); ⇔ is used only where the
    // if-and-only-if is actually shown (the divisibility conditions),
    // ⇒ elsewhere for one-directional derivations.
    examWriteup: {
      content:
        'Пусть $N$ — число монет, $Б\\in[151,159]$ — ячеек в большом кляссере, $М\\in[101,119]$ — в маленьком, $k$ — число больших кляссеров\n' +
        '$N=kБ-5=(k+2)М-5 \\Rightarrow kБ=(k+2)М \\Rightarrow k(Б-М)=2М$\n' +
        'Для любой допустимой пары: $Б-М\\geqslant32$, $Б-М\\leqslant58$, $2М\\in[202,238]$\n' +
        '$k=\\dfrac{2М}{Б-М}\\in\\left[\\dfrac{202}{58};\\dfrac{238}{32}\\right]\\approx[3.48;7.44]$\n' +
        '$k$ целое $\\Rightarrow k\\in\\{4,5,6,7\\}$\n' +
        'а) $k=3\\notin\\{4,5,6,7\\}$ — невозможно. Ответ: нет\n' +
        '$Б=\\dfrac{(k+2)М}{k}\\in\\mathbb Z \\Leftrightarrow k\\mid2М$ (так как $(k+2)М=kМ+2М$)\n' +
        '$N=kБ-5\\in[151k-5;159k-5]$ для каждого $k$\n' +
        'Эти диапазоны при $k=4,5,6,7$: $[599;631],[750;790],[901;949],[1052;1108]$ — не пересекаются, возрастают\n' +
        'Значит наименьшее $N$ — только при $k=4$, наибольшее — только при $k=7$\n' +
        'б) $k=4$: $4\\mid2М\\Leftrightarrow2\\mid М$. Чётные $М\\in[101,119]$ с $Б=\\dfrac{3М}2\\leqslant159$: $М=102,104,106$\n' +
        '$(Б,М)=(153,102),(156,104),(159,106) \\Rightarrow N=607,619,631$\n' +
        'Наименьшее: $N=607$. Ответ: 607\n' +
        'в) $k=7$: $7\\mid2М\\Leftrightarrow7\\mid М$. Кратные $7$ в $[101,119]$: $105,112,119$\n' +
        'Только $М=119$ даёт $Б=\\dfrac{9\\cdot119}7=153\\in[151,159] \\Rightarrow N=7\\cdot153-5=1066$\n' +
        'По диапазонам выше это единственное и наибольшее $N$ при $k=7$. Ответ: 1066',
    },
    methodTags: ['divisibility', 'bounding_argument', 'case_analysis'],
    criticalPoints: [
      {
        id: 'full-justification-required-per-component',
        text: 'Каждый из четырёх оцениваемых компонентов (пункт а, пункт б, оценка в пункте в, пример в пункте в) засчитывается только при полном обосновании — простой перебор без объяснения, почему он исчерпывающий, не даёт максимальный балл.',
        category: 'exam_scoring',
        required: true,
        rationale:
          'Рубрика №19 (секундарный источник, 4ege.ru): "за 1 балл присуждается верное получение одного из следующих результатов: обоснованное решение пункта а, обоснованное решение пункта б, искомая оценка в пункте в, или пример в пункте в, обеспечивающий точность предыдущей оценки" — максимум 4 балла, по одному баллу за каждый обоснованный компонент.',
        validationRuleId: 'has-content',
        source: 'secondary_source_verified',
      },
      {
        id: 'bound-and-example-both-required-for-b-and-c',
        text: 'Для пунктов б) и в) недостаточно просто назвать число — нужно и доказать, что меньшее (для б) или большее (для в) значение невозможно (оценка), и привести конкретный пример, который это значение достигает (пример).',
        category: 'exam_scoring',
        required: true,
        partId: 'b',
        rationale:
          'Рубрика №19 (секундарный источник, 4ege.ru) явно разделяет «оценку» и «пример» как отдельные засчитываемые компоненты для пункта в (и по аналогии для пункта б) — оба обязательны для полного балла.',
        source: 'secondary_source_verified',
      },
      {
        id: 'k-bound-must-be-derived-not-assumed',
        text: 'Диапазон k∈{4,5,6,7} — это ключевой результат всего решения, и он должен быть явно выведен из неравенств на Б−М и 2М, а не просто предъявлен как готовый факт.',
        category: 'correctness',
        required: true,
        partId: 'a',
        rationale:
          'Математический факт о структуре именно этой задачи (диапазоны Б и М дают именно такие границы для k) — не общее требование ФИПИ к любому №19, а часть корректного решения этой конкретной задачи.',
        validationRuleId: 'has-bound-derivation-step',
        source: 'project_quality_rule',
      },
      {
        id: 'part-a-follows-directly-from-k-bound',
        text: 'Ответ на пункт а) (невозможность k=3) должен явно опираться на доказанный диапазон k∈{4,5,6,7}, а не на отдельную, не связанную с общим решением проверку кратности 3.',
        category: 'correctness',
        required: true,
        partId: 'a',
        rationale:
          'Логическая связь между общим результатом (диапазон k) и конкретным выводом пункта а) — структурный валидатор (проверяющий лишь наличие шага) не может проверить, что вывод действительно ссылается на диапазон, а не является отдельным независимым рассуждением.',
        source: 'project_quality_rule',
      },
      {
        id: 'divisibility-condition-must-be-necessary-and-sufficient',
        text: 'Условие делимости (например, k∣2М для целого Б) должно быть показано как равносильное (⇔) существованию целого Б, а не просто как достаточное условие — иначе могли бы быть пропущены решения.',
        category: 'correctness',
        required: true,
        partId: 'b',
        rationale:
          'Общий математический факт о том, когда дробь (k+2)М/k является целым числом (эквивалентно k∣2М, так как kМ всегда делится на k) — обязательное условие корректности именно этого метода решения.',
        source: 'project_quality_rule',
      },
      {
        id: 'skipping-k-5-6-must-be-explicitly-justified',
        text: 'Пропуск случаев k=5 и k=6 при поиске минимума и максимума допустим только при явном доказательстве, что диапазоны N для разных k не пересекаются и возрастают — без этого обоснования пропуск этих случаев является дырой в решении, а не законным сокращением.',
        category: 'correctness',
        required: true,
        partId: 'b',
        rationale:
          'Математический факт о структуре именно этой задачи (диапазоны N для k=4,5,6,7 оказываются непересекающимися) — часть корректного решения, предотвращающая скрытую потерю случаев при неполном переборе.',
        source: 'project_quality_rule',
      },
      {
        id: 'free-method-disclaimer',
        text: 'Метод решения может отличаться от этого эталонного — используемый здесь аргумент с диапазонами k и N является лишь одним из способов; прямой перебор всех пар (Б,М) с явным обоснованием полноты перебора тоже допустим.',
        category: 'presentation',
        required: false,
        rationale:
          'Секундарный источник (веб-поиск, эта сессия, 4ege.ru): "решение может быть произвольным, и полнота и обоснованность рассуждений оцениваются независимо от выбранного метода решения".',
        source: 'secondary_source_verified',
      },
    ],
  };
}
