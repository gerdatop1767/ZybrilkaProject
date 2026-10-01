/**
 * Canonical solution CONTENT for the one real EGE task №17 currently
 * in the project (packages/db/src/importEge2026Variant1.ts, ~lines
 * 662-706 — right trapezoid ABCD, larger base CD, right angles at A
 * and D, incircle center O radius R, G the tangency point on AB, the
 * bisector of angle ADC perpendicular to BC meeting it at N; а) prove
 * BN=(√2−1)R, б) find the radius of the circle inscribed in
 * quadrilateral BNOG given R=6). Authored content for ONE specific
 * task instance — the same per-task authoring `realTask13Variant1.ts`/
 * `...14.../...15.../...16...` already established.
 *
 * Every coordinate/length/area below was independently re-derived
 * from the task's own condition (not copied from `explanationMd`,
 * just re-verified from scratch, including a convexity/simplicity
 * check on quadrilateral BNOG that `explanationMd` doesn't show):
 *   Right angles at A and D mean AD ⊥ AB and AD ⊥ DC, so AB ∥ DC —
 *   AD is the trapezoid's height. Since the incircle is tangent to
 *   both parallel sides AB and DC, the distance between them (= AD)
 *   equals the diameter 2R. Place D=(0,0), A=(0,2R), C=(c,0),
 *   B=(b,2R); tangency to DA (x=0) and DC (y=0) forces O=(R,R).
 *   Angle ADC is the right angle between ray DA (direction (0,1)) and
 *   ray DC (direction (1,0)); its bisector is the line y=x.
 *   BC passes through C=(c,0) and B=(b,2R), slope -2R/(c-b). The
 *   bisector y=x has slope 1, so BC ⊥ bisector ⇒ slope(BC)=-1 ⇒
 *   c-b=2R ⇒ b=c-2R. Line BC: x+y=c.
 *   Tangency of BC to the incircle: distance from O=(R,R) to
 *   x+y-c=0 equals R ⇒ |2R-c|/√2=R ⇒ c=2R±R√2. For B to lie to the
 *   right of A (b=c-2R>0, a convex trapezoid with CD the larger
 *   base), c=2R+R√2=R(2+√2) is the only valid root, giving
 *   b=R√2.
 *   N = (y=x) ∩ (x+y=c) = (c/2,c/2). BN vector =
 *   (c/2-b, c/2-2R) = (R(2-√2)/2, -R(2-√2)/2) (both components equal
 *   in magnitude since N lies on y=x) ⇒ |BN| = R(2-√2)/2·√2 =
 *   R(√2-1). This matches the task's claim in а) exactly.
 *   G, the tangency point on AB (the line y=2R), is the foot of the
 *   perpendicular from O to that line: G=(R,2R).
 *   Side lengths of BNOG: BN=R(√2-1) (above), NO=|N-O|=R (both
 *   components of N-O equal R√2/2, so the length is R√2/2·√2=R),
 *   OG=|G-O|=R (vertical distance), GB=|B-G|=R(√2-1) (horizontal
 *   distance, since b=R√2>R). So BN=GB and NO=OG — BNOG is a kite,
 *   and (independently checked via Pitot's theorem: BN+OG =
 *   R(√2-1)+R = R√2 = R+R(√2-1) = NO+GB) every kite is tangential —
 *   has an incircle, confirming the task's premise that one exists.
 *   Area of BNOG via the shoelace formula on B,N,O,G in order comes
 *   out to R²(√2-1) (independently verified numerically at R=1 and
 *   confirmed the vertex order traces a simple, non-self-intersecting
 *   quadrilateral by checking the angular order of all four points
 *   around their centroid). Semiperimeter s=(BN+NO+OG+GB)/2=R√2.
 *   r = Area/s = R²(√2-1)/(R√2) = R(√2-1)/√2 = R(2-√2)/2. At R=6:
 *   r=3(2-√2)=6-3√2≈1.757.
 * This matches `correctAnswer`/`correctAnswerDisplay` ('6-3√2' /
 * '$6-3\sqrt2$') exactly.
 *
 * Part а) has NO checkable answer — it's a proof ("Докажите"), not a
 * computed value — `hasCheckableAnswer: false`, same pattern as №14's
 * part а). Part б)'s checkable answer comes from the task's own
 * `correctAnswer`/`correctAnswerDisplay` fields.
 *
 * FIPI sourcing (see `planimetry.v1.ts`'s own doc comment too):
 * doc.fipi.ru was not reachable from this session (same network
 * restriction as every earlier task). The scoring rubric used below
 * (0-3 points; the four-tier 3/2/1/0 criteria, including the specific
 * rule that a correct б) built on an unproven а) caps at 1 point) is
 * sourced from a reputable secondary aggregator of FIPI's published
 * criteria (web search, this session, 4ege.ru) — tagged
 * `secondary_source_verified`, never `fipi_verified`.
 */
import type { CanonicalSolution } from '../../../solutionEngine/index.js';
import { mathTask17PlanimetryTemplate } from './planimetry.v1.js';

/** The task's own real fields this builder needs — copied verbatim by the caller from its actual DB/import row, never re-typed by hand elsewhere. */
export interface RealTask17Variant1Fields {
  readonly taskId: string;
  /** tasks.correct_answer — holds part б)'s radius only; part а) has no checkable answer (it's a proof). */
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

export function buildCanonicalSolutionForTask17Variant1(
  fields: RealTask17Variant1Fields,
): CanonicalSolution {
  return {
    taskId: fields.taskId,
    templateId: mathTask17PlanimetryTemplate.id,
    templateVersion: mathTask17PlanimetryTemplate.version,
    parts: [
      {
        id: 'a',
        label: 'а)',
        hasCheckableAnswer: false,
        steps: [
          {
            id: 'a1',
            title: 'Вводим координаты и находим центр O',
            explanation:
              'Так как углы $A$ и $D$ прямые, $AD\\perp AB$ и $AD\\perp DC$, значит $AB\\parallel DC$ и $AD$ — высота трапеции. Вписанная окружность касается обеих параллельных сторон $AB$ и $DC$, поэтому расстояние между ними равно диаметру: $AD=2R$. Пусть $D=(0,0)$, $A=(0,2R)$, $C=(c,0)$, $B=(b,2R)$. Из касания окружности сторон $DA$ ($x=0$) и $DC$ ($y=0$) получаем $O=(R,R)$.',
          },
          {
            id: 'a2',
            title: 'Находим уравнение биссектрисы угла ADC',
            explanation:
              'Угол $ADC$ — это прямой угол между лучом $DA$ (направление $(0,1)$) и лучом $DC$ (направление $(1,0)$). Его биссектриса делит угол пополам и задаётся прямой $y=x$.',
          },
          {
            id: 'a3',
            title: 'Используем перпендикулярность биссектрисы и BC',
            explanation:
              'Прямая $BC$ проходит через $B=(b,2R)$ и $C=(c,0)$, её угловой коэффициент $k=\\dfrac{0-2R}{c-b}$. Биссектриса $y=x$ имеет угловой коэффициент $1$. Условие перпендикулярности $k\\cdot1=-1$ даёт $\\dfrac{-2R}{c-b}=-1\\Rightarrow c-b=2R$, то есть $b=c-2R$. Прямая $BC$: $x+y=c$.',
          },
          {
            id: 'a4',
            title: 'Используем касание BC и окружности',
            explanation:
              'Расстояние от $O=(R,R)$ до прямой $x+y-c=0$ равно $R$: $\\dfrac{|2R-c|}{\\sqrt2}=R\\Rightarrow c=2R\\pm R\\sqrt2$. Так как $B$ должна лежать правее $A$ ($b=c-2R>0$), подходит только $c=2R+R\\sqrt2=R(2+\\sqrt2)$, откуда $b=R\\sqrt2$.',
          },
          {
            id: 'a5',
            title: 'Находим точку N и вычисляем BN',
            explanation:
              'Точка $N$ — пересечение $y=x$ и $x+y=c$: $N=\\left(\\dfrac c2,\\dfrac c2\\right)$. Вектор $\\vec{BN}=\\left(\\dfrac c2-b,\\ \\dfrac c2-2R\\right)=\\left(\\dfrac{R(2-\\sqrt2)}2,\\ -\\dfrac{R(2-\\sqrt2)}2\\right)$, откуда $|BN|=\\dfrac{R(2-\\sqrt2)}2\\cdot\\sqrt2=R(\\sqrt2-1)$. Утверждение доказано.',
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
            title: 'Находим точку касания G',
            explanation:
              'Точка $G$ — касание окружности со стороной $AB$ (прямая $y=2R$) — это основание перпендикуляра из $O=(R,R)$ на эту прямую: $G=(R,2R)$.',
          },
          {
            id: 'b2',
            title: 'Находим стороны четырёхугольника BNOG',
            explanation:
              'По координатам: $BN=R(\\sqrt2-1)$ (из пункта а), $NO=R$, $OG=R$, $GB=R(\\sqrt2-1)$. Так как $BN=GB$ и $NO=OG$, четырёхугольник $BNOG$ — дельтоид (кайт). У любого кайта есть вписанная окружность (это можно проверить и по теореме Пито: $BN+OG=NO+GB=R\\sqrt2$).',
          },
          {
            id: 'b3',
            title: 'Находим площадь и полупериметр BNOG',
            explanation:
              'По координатам вершин (формула площади многоугольника): площадь $BNOG=R^2(\\sqrt2-1)$. Полупериметр $s=\\dfrac{BN+NO+OG+GB}2=R\\sqrt2$.',
          },
          {
            id: 'b4',
            title: 'Находим радиус вписанной окружности',
            explanation:
              'Для любого описанного многоугольника площадь $S=r\\cdot s$, откуда $r=\\dfrac{S}{s}=\\dfrac{R^2(\\sqrt2-1)}{R\\sqrt2}=\\dfrac{R(2-\\sqrt2)}2$. При $R=6$: $r=3(2-\\sqrt2)=6-3\\sqrt2$.',
          },
        ],
      },
    ],
    // Compact BUT genuinely complete exam-ready write-up — the
    // elevated bar for №16-19 (audit note): if a student copied only
    // this block onto their exam sheet, an expert should be able to
    // see the full justified line of reasoning for both а) and б) —
    // the coordinate setup with its justification, every intermediate
    // equation, the perpendicularity and tangency conditions actually
    // used (not asserted), the kite/Pitot justification for б), and
    // the final numeric answer. Each independent fact is on its own
    // line (no mechanical ":"/";" gluing, same lesson as №13-16's
    // audit fixes); ⇒ is used only for genuine one-directional
    // derivations, never as a decorative substitute for "=".
    examWriteup: {
      content:
        'а) $AD\\perp AB$, $AD\\perp DC\\Rightarrow AB\\parallel DC$, $AD$ — высота трапеции\n' +
        'Окружность касается $AB$ и $DC\\Rightarrow AD=2R$\n' +
        '$D=(0,0),\\ A=(0,2R),\\ C=(c,0),\\ B=(b,2R),\\ O=(R,R)$\n' +
        'Биссектриса угла $ADC$ (прямого, между $DA$ и $DC$) — прямая $y=x$\n' +
        '$BC\\perp(y=x)\\Rightarrow$ угловой коэффициент $BC$ равен $-1\\Rightarrow c-b=2R$\n' +
        'Касание $BC$ и окружности: $\\dfrac{|2R-c|}{\\sqrt2}=R$\n' +
        '$B$ правее $A\\Rightarrow c=R(2+\\sqrt2),\\ b=R\\sqrt2$\n' +
        '$N=(y=x)\\cap BC=\\left(\\dfrac c2,\\dfrac c2\\right)$\n' +
        '$BN=\\left|\\left(\\dfrac c2-b,\\dfrac c2-2R\\right)\\right|=R(\\sqrt2-1)$. Что и требовалось доказать.\n\n' +
        'б) $G$ — касание окружности с $AB\\Rightarrow G=(R,2R)$\n' +
        '$BN=R(\\sqrt2-1),\\ NO=R,\\ OG=R,\\ GB=R(\\sqrt2-1)$\n' +
        '$BN=GB,\\ NO=OG\\Rightarrow BNOG$ — кайт, у кайта есть вписанная окружность\n' +
        'Площадь $BNOG=R^2(\\sqrt2-1)$, полупериметр $s=R\\sqrt2$\n' +
        '$S=r\\cdot s\\Rightarrow r=\\dfrac{R^2(\\sqrt2-1)}{R\\sqrt2}=\\dfrac{R(2-\\sqrt2)}2$\n' +
        '$R=6\\Rightarrow r=3(2-\\sqrt2)=6-3\\sqrt2$\n\n' +
        `Ответ: ${fields.correctAnswerDisplay ?? fields.correctAnswer}`,
    },
    methodTags: ['coordinate_method', 'incircle_tangency', 'kite_properties'],
    criticalPoints: [
      {
        id: 'full-credit-requires-both-parts',
        text: 'Максимальные 3 балла ставятся только при верном доказательстве пункта а) и одновременно обоснованно верном ответе пункта б) — наличие только одного из них даёт меньше баллов.',
        category: 'exam_scoring',
        required: true,
        rationale:
          'Рубрика №17 (секундарный источник, 4ege.ru): 3 балла — "имеется верное доказательство утверждения пункта а и обоснованно получен верный ответ в пункте б". Та же шкала 0-3, что и у №14, но собственная, независимо найденная формулировка критериев.',
        validationRuleId: 'has-both-parts',
        source: 'secondary_source_verified',
      },
      {
        id: 'part-b-using-unproven-a-caps-at-one-point',
        text: 'Если ответ пункта б) опирается на утверждение пункта а) (длину BN), а само пункт а) не доказано — это оценивается только в 1 балл, а не в максимальные 3.',
        category: 'exam_scoring',
        required: true,
        partId: 'a',
        rationale:
          'Рубрика №17 (секундарный источник, 4ege.ru), критерий на 1 балл: "обоснованно получен верный ответ в пункте б с использованием утверждения пункта а, при этом пункт а не выполнен". Намеренно не привязан к validationRuleId — это логическая зависимость между пунктами, которую структурный валидатор (проверяющий лишь непустоту шагов) не может обнаружить.',
        source: 'secondary_source_verified',
      },
      {
        id: 'arithmetic-error-caps-at-two-points',
        text: 'Если решение пункта б) полностью обосновано, но итоговое число неверно из-за арифметической ошибки, это даёт 2 балла, а не 3 — верный метод сам по себе не гарантирует максимальный балл.',
        category: 'exam_scoring',
        required: false,
        partId: 'b',
        rationale:
          'Рубрика №17 (секундарный источник, 4ege.ru), критерий на 2 балла: "...при обоснованном решении пункта б получен неверный ответ из-за арифметической ошибки". Не привязан к структурному валидатору — отсутствие арифметической ошибки не проверяется автоматически.',
        source: 'secondary_source_verified',
      },
      {
        id: 'part-b-needs-justification',
        text: 'Ответ пункта б) должен сопровождаться полным вычислением (стороны четырёхугольника, площадь, полупериметр, формула S=r·s), а не только итоговым числом.',
        category: 'exam_scoring',
        required: true,
        partId: 'b',
        rationale:
          'Рубрика №17 (секундарный источник, 4ege.ru) требует "обоснованно получен верный ответ" на всех уровнях выше 0 баллов — голый ответ без обоснования не засчитывается по максимальному критерию.',
        validationRuleId: 'has-content',
        source: 'secondary_source_verified',
      },
      {
        id: 'ad-equals-diameter-must-be-justified',
        text: 'Равенство AD=2R нельзя просто постулировать — нужно явно объяснить, что оно следует из касания вписанной окружности обеих параллельных сторон AB и DC.',
        category: 'correctness',
        required: true,
        partId: 'a',
        rationale:
          'Математический факт о структуре именно этой трапеции (AB∥DC, обе стороны касаются вписанной окружности) — часть корректного решения этой конкретной задачи, не общее требование ФИПИ к любому №17.',
        source: 'project_quality_rule',
      },
      {
        id: 'tangency-root-selection-must-be-justified',
        text: 'Уравнение касания |2R−c|/√2=R даёт два корня для c — нужно явно обосновать выбор правильного корня (через то, что B должна лежать правее A, то есть b=c−2R>0), а не просто взять «подходящий» ответ без объяснения.',
        category: 'correctness',
        required: true,
        partId: 'a',
        rationale:
          'Математический факт о структуре именно этой задачи (уравнение касания даёт два формальных решения, только одно из которых соответствует реальной конфигурации трапеции) — не общее требование ФИПИ, а часть корректного решения, предотвращающая случайное совпадение с ответом без геометрического обоснования.',
        source: 'project_quality_rule',
      },
      {
        id: 'kite-has-incircle-must-be-justified',
        text: 'Утверждение «у четырёхугольника BNOG есть вписанная окружность» нужно обосновать (через свойство кайта или теорему Пито: BN+OG=NO+GB), а не принимать на веру из условия задачи.',
        category: 'correctness',
        required: true,
        partId: 'b',
        rationale:
          'Математический факт о структуре именно этого четырёхугольника (BN=GB и NO=OG по вычисленным координатам) — часть корректного решения этой конкретной задачи, не общее требование ФИПИ к любому №17.',
        source: 'project_quality_rule',
      },
      {
        id: 'free-method-disclaimer',
        text: 'Метод решения и форма записи могут отличаться от этого эталонного решения — координатный метод здесь лишь один из распространённых корректных способов, наряду с классическим (синтетическим) методом на признаках и свойствах касательных, биссектрис и вписанных окружностей.',
        category: 'presentation',
        required: false,
        rationale:
          'Секундарный источник (веб-поиск, эта сессия) подтверждает, что для №17 засчитывается любой математически корректный метод — эксперт обязан проверять совпадение результата и полноту обоснования независимо от выбранного метода.',
        source: 'secondary_source_verified',
      },
    ],
  };
}
