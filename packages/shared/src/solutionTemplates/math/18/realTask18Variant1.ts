/**
 * Canonical solution CONTENT for the one real EGE task №18 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 707-756 — a system with parameter $a$:
 * $(|x|-a^2)^2+(y-4a)(y+4a)=9a^2-2y-1$, $y+1=6\sqrt a$; find every $a$
 * for which the system has exactly two distinct solutions). Authored
 * content for ONE specific task instance — the same per-task
 * authoring `realTask13Variant1.ts`/`...14.../...15.../...16.../
 * ...17...` already established.
 *
 * Single part ("main") — like №15/№16, this task's condition has no
 * а)/б) split, just one "find all values of a" question.
 *
 * Every transformation below was independently re-derived (not copied
 * from `explanationMd`, which is accurate here, just re-verified from
 * scratch, including an extra boundary check `explanationMd` doesn't
 * show — confirming a=4 and a=√13-2 both make a²-√K=0 exactly, i.e.
 * the excluded endpoints genuinely add a third solution rather than
 * being an arbitrary open-interval convention):
 *   $a$ is the parameter, $(x,y)$ the variables. From $y+1=6\sqrt a$,
 *   $y=6\sqrt a-1$, requiring $a\geqslant0$ (domain of $\sqrt a$).
 *   $(y-4a)(y+4a)=y^2-16a^2$, so the first equation becomes
 *   $(|x|-a^2)^2=9a^2-2y-1-y^2+16a^2=25a^2-(y+1)^2$. Since
 *   $(y+1)^2=(6\sqrt a)^2=36a$ (valid for any $a\geqslant0$), this is
 *   $(|x|-a^2)^2=25a^2-36a=a(25a-36)=K(a)$.
 *   $K(a)\geqslant0$ and $a\geqslant0$ together give $a=0$ or
 *   $a\geqslant\frac{36}{25}$. At $a=0$: $K=0$, $|x|=0$, a single
 *   solution $(0,-1)$ — rejected (need exactly two).
 *   At $a=\frac{36}{25}$ ($K=0$): $|x|=a^2>0$, so $x=\pm a^2$ — two
 *   distinct $x$, same $y$ — exactly 2 solutions. Included (a single
 *   point, not yet part of any interval).
 *   At $a>\frac{36}{25}$ ($K>0$): $|x|=a^2+\sqrt K$ always gives 2
 *   solutions (positive); $|x|=a^2-\sqrt K$ gives 0, 1, or 2 more
 *   depending on its sign. For exactly 2 total, need
 *   $a^2-\sqrt K<0$ strictly. Both $a^2\geqslant0$ and
 *   $\sqrt K\geqslant0$, so this is equivalent (⇔, not just ⇒) to
 *   $a^4<K=25a^2-36a$, i.e. $a^4-25a^2+36a<0$. Dividing by $a>0$
 *   (valid, preserves the inequality direction):
 *   $a^3-25a+36<0$. Testing $a=4$: $64-100+36=0$, so $(a-4)$ divides
 *   it; synthetic division gives $a^3-25a+36=(a-4)(a^2+4a-9)$, and
 *   $a^2+4a-9=0$ at $a=-2\pm\sqrt{13}$. For the monic cubic with roots
 *   $-2-\sqrt{13}<\sqrt{13}-2<4$ (in increasing order), the sign
 *   pattern is negative/positive/negative/positive across the four
 *   intervals they create, so the cubic is negative exactly on
 *   $(-\infty,-2-\sqrt{13})\cup(\sqrt{13}-2,4)$. Intersecting with
 *   $a>\frac{36}{25}$: the first piece is entirely negative values,
 *   excluded; the second piece survives whole since
 *   $\sqrt{13}-2\approx1.606>\frac{36}{25}=1.44$.
 *   Boundary check (independently confirmed, not in `explanationMd`):
 *   at $a=\sqrt{13}-2$ and at $a=4$, $a^2-\sqrt K=0$ exactly (both are
 *   roots of $a^4=K$), giving a third solution — correctly excluded
 *   by the strict inequality (open interval).
 *   Final answer: $a=\frac{36}{25}$ or $a\in(\sqrt{13}-2;\,4)$ — kept
 *   as a separate point plus an interval, never merged, because
 *   $\frac{36}{25}<\sqrt{13}-2$ leaves a genuine gap between them
 *   where the system does NOT have exactly two solutions (it has
 *   none, for $\frac{36}{25}<a<\sqrt{13}-2$... actually K>0 there and
 *   $a^2-\sqrt K\geqslant0$ giving 3 solutions — re-confirmed: for
 *   $a\in(\frac{36}{25},\sqrt{13}-2)$ the cubic is positive, i.e.
 *   $a^2\geqslant\sqrt K$, so that range gives 3 solutions, not 2 and
 *   not 0 — the point is simply that it's excluded from the "exactly
 *   2" answer set, not that the system has no real solutions there).
 * This matches `correctAnswer`/`correctAnswerDisplay`
 * ('36/25; (√13-2;4)' / '$\dfrac{36}{25};\ (\sqrt{13}-2;\ 4)$')
 * exactly.
 *
 * FIPI sourcing (see `parameters.v1.ts`'s own doc comment too):
 * doc.fipi.ru was not reachable from this session (same network
 * restriction as every earlier task). The scoring rubric used below
 * (0-4 points, distinct from every other task's scale so far; the
 * top-tier phrase "обоснованно получен верный ответ"; partial credit
 * for a correctly-built model/reasoning that's incomplete, has a
 * computational slip, or is missing/adds boundary values) is sourced
 * from a reputable secondary aggregator of FIPI's published criteria
 * (web search, this session) — tagged `secondary_source_verified`,
 * never `fipi_verified`.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { mathTask18ParametersTemplate } from './parameters.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask18Variant1Fields {
  readonly taskId: string;
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask18Variant1(
  fields: RealTask18Variant1Fields,
): CanonicalSolution {
  return {
    taskId: fields.taskId,
    templateId: mathTask18ParametersTemplate.id,
    templateVersion: mathTask18ParametersTemplate.version,
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
            title: 'Находим область значений параметра и выражаем y',
            explanation:
              'Из второго уравнения $y=6\\sqrt a-1$ — это возможно только при $a\\geqslant0$ (область определения $\\sqrt a$). Переменная — пара $(x,y)$, параметр — $a$.',
          },
          {
            id: 's2',
            title: 'Подставляем y в первое уравнение',
            explanation:
              'Раскрываем $(y-4a)(y+4a)=y^2-16a^2$. Первое уравнение принимает вид $(|x|-a^2)^2=9a^2-2y-1-y^2+16a^2=25a^2-(y+1)^2$.',
          },
          {
            id: 's3',
            title: 'Упрощаем правую часть через a',
            explanation:
              'Так как $(y+1)^2=(6\\sqrt a)^2=36a$ (верно для любого $a\\geqslant0$), получаем $(|x|-a^2)^2=25a^2-36a=a(25a-36)=K(a)$ — уравнение относительно $x$ с правой частью, зависящей только от $a$.',
          },
          {
            id: 's4',
            kind: 'critical_value_derivation',
            title: 'Находим, при каких a уравнение относительно x вообще имеет решения',
            explanation:
              'Левая часть $(|x|-a^2)^2\\geqslant0$, значит нужно $K(a)\\geqslant0$. Вместе с $a\\geqslant0$ это даёт $a=0$ или $a\\geqslant\\dfrac{36}{25}$. При $a=0$: $K=0$, $|x|=0$, единственное решение $(0,-1)$ — не подходит (нужно ровно два).',
          },
          {
            id: 's5',
            title: 'Разбираем случай K = 0',
            explanation:
              'При $a=\\dfrac{36}{25}$: $|x|=a^2>0$, значит $x=\\pm a^2$ — ровно два различных $x$ (одно и то же $y$) — ровно 2 решения. Значение подходит.',
          },
          {
            id: 's6',
            title: 'Разбираем случай K > 0 и ставим условие на количество решений',
            explanation:
              'При $a>\\dfrac{36}{25}$: $|x|=a^2+\\sqrt K$ всегда положительно и даёт 2 решения. $|x|=a^2-\\sqrt K$ даёт ещё 2 решения, если это выражение $>0$, 1 решение при $=0$, 0 решений при $<0$. Чтобы всего было ровно 2 решения, нужно $a^2-\\sqrt K<0$ строго.',
          },
          {
            id: 's7',
            kind: 'critical_value_derivation',
            title: 'Решаем неравенство на a и находим итоговый ответ',
            explanation:
              'Оба выражения $a^2$ и $\\sqrt K$ неотрицательны, поэтому $a^2<\\sqrt K \\Leftrightarrow a^4<K=25a^2-36a$, то есть $a^4-25a^2+36a<0$. Делим на $a>0$: $a^3-25a+36<0$. Проверка $a=4$ даёт $0$, значит $a^3-25a+36=(a-4)(a^2+4a-9)$, а корни $a^2+4a-9=0$ — это $a=-2\\pm\\sqrt{13}$. Многочлен отрицателен на $(-\\infty;-2-\\sqrt{13})\\cup(\\sqrt{13}-2;4)$; пересекая с $a>\\dfrac{36}{25}$, остаётся только $(\\sqrt{13}-2;4)$ целиком (так как $\\sqrt{13}-2\\approx1.606>\\dfrac{36}{25}=1.44$). На концах $a=\\sqrt{13}-2$ и $a=4$ выполняется $a^2-\\sqrt K=0$ — там получается 3 решения, поэтому границы исключены.',
          },
        ],
      },
    ],
    // Compact BUT genuinely complete exam-ready write-up — the
    // elevated bar for №16-19, even stricter for №18 (parameter
    // investigation): if a student copied only this block onto their
    // exam sheet, an expert should be able to see WHY the domain is
    // a⩾0, WHERE the critical values 36/25, √13-2, 4 come from, WHY
    // each case gives the number of solutions it does, and WHY the
    // isolated point and the interval are never merged into one
    // range. Each independent fact/transition is on its own line (no
    // mechanical ":"/";" gluing); ⇔ is used only where both sides are
    // genuinely nonnegative (justifying the squaring step), ⇒
    // elsewhere for one-directional derivations.
    examWriteup: {
      content:
        '$y=6\\sqrt a-1$ из второго уравнения, область: $a\\geqslant0$\n' +
        '$(y-4a)(y+4a)=y^2-16a^2 \\Rightarrow (|x|-a^2)^2=25a^2-(y+1)^2$\n' +
        '$(y+1)^2=36a \\Rightarrow (|x|-a^2)^2=25a^2-36a=a(25a-36)=K(a)$\n' +
        'Нужно $K(a)\\geqslant0$ и $a\\geqslant0 \\Rightarrow a=0$ или $a\\geqslant\\dfrac{36}{25}$\n' +
        'При $a=0$: $|x|=0$, одно решение $(0,-1)$ — не подходит\n' +
        'При $a=\\dfrac{36}{25}$ ($K=0$): $|x|=a^2>0 \\Rightarrow x=\\pm a^2$ — ровно 2 решения\n' +
        'При $a>\\dfrac{36}{25}$ ($K>0$): $|x|=a^2+\\sqrt K$ — всегда 2 решения\n' +
        '$|x|=a^2-\\sqrt K$ добавляет решения, только если это выражение $\\geqslant0$\n' +
        'Для ровно 2 решений нужно $a^2-\\sqrt K<0$\n' +
        '$a^2,\\sqrt K\\geqslant0 \\Rightarrow a^2<\\sqrt K \\Leftrightarrow a^4<25a^2-36a$\n' +
        '$a^3-25a+36<0$ (поделили на $a>0$)\n' +
        '$a^3-25a+36=(a-4)(a^2+4a-9)$, корни: $a=4,\\ a=-2\\pm\\sqrt{13}$\n' +
        'Многочлен $<0$ на $(-\\infty;-2-\\sqrt{13})\\cup(\\sqrt{13}-2;4)$\n' +
        'Пересечение с $a>\\dfrac{36}{25}$ даёт $(\\sqrt{13}-2;4)$ целиком\n' +
        'На концах $a=\\sqrt{13}-2$ и $a=4$: $a^2-\\sqrt K=0$, то есть 3 решения — границы исключены\n' +
        '$\\dfrac{36}{25}<\\sqrt{13}-2$, поэтому точка и интервал не объединяются\n\n' +
        `Ответ: ${fields.correctAnswerDisplay ?? fields.correctAnswer}`,
    },
    methodTags: ['parameter_investigation', 'case_analysis', 'cubic_factoring'],
    criticalPoints: [
      {
        id: 'full-justification-required-for-max-score',
        text: 'Для максимальных 4 баллов нужно не только верно найти ответ, но и полностью обосновать каждый случай — голый перечень значений параметра без вывода не засчитывается по максимальному критерию.',
        category: 'exam_scoring',
        required: true,
        rationale:
          'Рубрика №18 (секундарный источник, 4ege.ru): высший критерий — "обоснованно получен верный ответ". Шкала 0-4 балла — отдельная от №13/№16 (0-2) и №14/№17 (0-3).',
        validationRuleId: 'has-content',
        source: 'secondary_source_verified',
      },
      {
        id: 'missing-boundary-values-reduces-score',
        text: 'Если рассуждение верное, но итоговый набор значений параметра отличается от правильного (пропущена изолированная точка a=36/25 или неверно включена/исключена граница интервала), это снижает оценку — верный метод сам по себе не гарантирует максимальный балл.',
        category: 'exam_scoring',
        required: false,
        rationale:
          'Секундарный источник (веб-поиск, эта сессия, 4ege.ru) подтверждает, что для №18 корректно построенное рассуждение с ошибкой в итоговом множестве значений параметра (в том числе пропущенные или лишние граничные значения) оценивается ниже максимального балла.',
        source: 'secondary_source_verified',
      },
      {
        id: 'domain-a-nonnegative-must-be-stated',
        text: 'Нужно явно указать и обосновать a⩾0 — это следует из $\\sqrt a$ во втором уравнении, а не постулируется без объяснения.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этого уравнения ($y+1=6\\sqrt a$ определено только при $a\\geqslant0$) — не общее требование ФИПИ к любому №18, а часть корректного решения этой конкретной задачи.',
        validationRuleId: 'has-domain-step',
        source: 'project_quality_rule',
      },
      {
        id: 'case-a-equals-zero-must-be-checked-and-rejected',
        text: 'Нельзя пропустить проверку a=0 отдельно — это допустимое по ОДЗ значение, но даёт только одно решение, а не два, поэтому должно быть явно отклонено, а не просто забыто.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этой задачи — a=0 удовлетворяет условию K(a)⩾0, но число решений при этом равно 1 — частая ошибка пропустить эту проверку и сразу перейти к случаю a⩾36/25.',
        source: 'project_quality_rule',
      },
      {
        id: 'squaring-step-must-be-justified-as-equivalence',
        text: 'Переход от a²<√K к a⁴<K — это равносильность (⇔), а не просто следствие (⇒), и это нужно явно обосновать тем, что обе части (a² и √K) неотрицательны — иначе возведение в квадрат могло бы потерять или добавить решения.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Общий математический факт о том, когда возведение в квадрат неравенства сохраняет равносильность (только когда обе части неотрицательны) — обязательное условие корректности именно этого преобразования в решении, одно из явных требований задания (раздел 8 задания на честное использование =/⇔/⇒).',
        source: 'project_quality_rule',
      },
      {
        id: 'isolated-point-and-interval-must-not-be-merged',
        text: 'Значение a=36/25 и интервал (√13−2;4) нельзя объединять в один интервал или записывать как a⩾36/25 — между ними есть промежуток, где решений не ровно два (получается три решения), поэтому ответ обязательно состоит из отдельной точки и отдельного интервала.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этой задачи (36/25<√13−2, и на (36/25;√13−2) кубический многочлен положителен, то есть там получается 3 решения, не 2) — часть корректного решения, предотвращающая типичную ошибку "слияния" точки и интервала в формулировке ответа.',
        source: 'project_quality_rule',
      },
      {
        id: 'boundary-points-must-be-excluded-with-justification',
        text: 'Точки a=√13−2 и a=4 должны быть явно исключены из интервала (строгое неравенство), с обоснованием, что именно в них a²−√K=0 и появляется третье решение — а не просто взяты как "обычная" открытая граница по умолчанию.',
        category: 'correctness',
        required: true,
        partId: 'main',
        rationale:
          'Математический факт о структуре именно этой задачи — границы интервала являются корнями уравнения a⁴=K, где знак меняется и количество решений становится равным 3, а не остаётся равным 2.',
        source: 'project_quality_rule',
      },
      {
        id: 'free-method-disclaimer',
        text: 'Метод решения может отличаться от этого эталонного — алгебраический разбор случаев здесь лишь один из распространённых корректных способов, наряду с графическим исследованием зависимости количества решений от параметра.',
        category: 'presentation',
        required: false,
        rationale:
          'Секундарный источник (веб-поиск, эта сессия) подтверждает, что для №18 требуемые навыки включают как алгебраические преобразования, так и использование свойств и графиков функций — эксперт обязан проверять совпадение итогового множества значений параметра независимо от выбранного метода.',
        source: 'secondary_source_verified',
      },
    ],
  };
}
