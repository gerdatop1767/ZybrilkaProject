import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { serializeMultiPartSpec } from '@zybrilka/shared';
import type { Database } from './client.js';
import { isMainModule } from './isMainModule.js';
import * as schema from './schema.js';

/**
 * S3 — first real import: EGE-2026 profile math, "Ященко ЕГЭ 2026,
 * Вариант 1" (PDF, 4 pages: pages 1-4 of the source file = book pages
 * 11-14, Вариант 1 in full; page 5 begins Вариант 2, not touched by
 * this import). See docs/imports/ege-2026-variant-1-report.md for the
 * full per-task validation trail (parse/answer/independent-solve/
 * explanation status) behind every row below.
 *
 * Every task here was independently re-solved (not just transcribed)
 * before being marked 'published'. #15 and #19 were originally
 * 'needs_review' (S3) because their answer shape — a punctured
 * interval, and three independent sub-answers а/б/в — had no home in
 * the Task Engine yet; S3.1 added `interval`/`multi_part` answer
 * types (packages/shared/src/{intervalAnswer,multiPartAnswer}.ts) and
 * both are now re-verified and published (see the report for the
 * re-derivation).
 */
const SOURCE = 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты';
const SOURCE_DOCUMENT = 'ЕГЭ 2026 Ященко 36 вариантов';
const SOURCE_YEAR = 2026;
const VARIANT = 1;
const IMPORT_TAG = 'ege-2026-variant-1';

/**
 * S3.2: this Variant 1 also becomes a `variants` row inside a
 * `collections` row (docs/PRODUCTION_DATA_MODEL.md), linked to the
 * existing 19 Task rows via `variantTasks` — never a second copy of
 * them. `slug`/`variantNumber` are the upsert keys, so re-running this
 * import (idempotent, like the rest of it) updates the same collection
 * and variant rows instead of creating duplicates.
 */
const COLLECTION_SLUG = 'ege-2026-yashchenko';
const COLLECTION_TITLE = 'ЕГЭ 2026 Ященко';
const COLLECTION_PUBLISHER = 'Ященко';
const VARIANT_TITLE = 'ЕГЭ 2026 — Ященко — Вариант 1';
const SOURCE_FILE = 'ЕГЭ_2026_Ященко_Вариант_1.pdf';
const SOURCE_PAGE_START = 1;
const SOURCE_PAGE_END = 4;

type ImportStatus = 'published' | 'needs_review';
type ImportAnswerType = 'short_answer' | 'interval' | 'multi_part';

interface ImportTask {
  taskNumber: number;
  /** 1 = Часть 1 (1-12), 2 = Часть 2 (13-19) — derived from taskNumber, not stored as its own column. */
  topicSlug: string;
  topicName: string;
  sourcePage: number;
  rawStatement: string;
  conditionMd: string;
  imageUrl: string | null;
  /** Defaults to 'short_answer' when omitted. */
  answerType?: ImportAnswerType;
  correctAnswer: string;
  explanationMd: string;
  status: ImportStatus;
  reviewNote?: string;
}

const IMAGE_BASE = '/tasks/imports/ege-2026-variant-1';

const importTasks: readonly ImportTask[] = [
  {
    taskNumber: 1,
    topicSlug: 'planimetry-triangles',
    topicName: 'Планиметрия: треугольники',
    sourcePage: 1,
    rawStatement:
      'В равнобедренном треугольнике ABC с основанием AC провели биссектрису AF. Найдите угол AFC, если угол ABC равен 76°. Ответ дайте в градусах.',
    conditionMd:
      'В равнобедренном треугольнике ABC с основанием AC провели биссектрису AF. Найдите угол AFC, если угол ABC равен 76°. Ответ дайте в градусах.',
    imageUrl: null,
    correctAnswer: '102',
    explanationMd:
      'Что дано: треугольник ABC равнобедренный с основанием AC, значит углы при основании равны: ∠BAC = ∠BCA. Угол при вершине ∠ABC = 76°.\n\nИдея: сумма углов треугольника равна 180°, а AF — биссектриса угла A, значит она делит ∠BAC пополам.\n\nШаг 1. Находим угол при основании: ∠BAC = ∠BCA = (180° − 76°) / 2 = 52°.\n\nШаг 2. AF — биссектриса угла A, значит ∠FAC = ∠BAC / 2 = 26°.\n\nШаг 3. Точка F лежит на стороне BC, поэтому в треугольнике AFC угол при вершине C — это тот же угол ∠ACB = 52°. Сумма углов треугольника AFC равна 180°: ∠AFC = 180° − ∠FAC − ∠ACF = 180° − 26° − 52°.\n\nОтвет: 102°.',
    status: 'published',
  },
  {
    taskNumber: 2,
    topicSlug: 'vectors',
    topicName: 'Векторы',
    sourcePage: 1,
    rawStatement: 'Даны векторы a⃗(−3; 2) и b⃗(−1; −9). Найдите длину вектора 3a⃗ − 2b⃗.',
    conditionMd: 'Даны векторы a(−3; 2) и b(−1; −9). Найдите длину вектора 3a − 2b.',
    imageUrl: null,
    correctAnswer: '25',
    explanationMd:
      'Что дано: координаты векторов a(−3; 2) и b(−1; −9). Нужно найти длину вектора 3a − 2b.\n\nИдея: сначала находим координаты вектора 3a − 2b покоординатно, затем применяем формулу длины вектора √(x²+y²).\n\nШаг 1. 3a = (3·(−3); 3·2) = (−9; 6). 2b = (2·(−1); 2·(−9)) = (−2; −18).\n\nШаг 2. 3a − 2b = (−9 − (−2); 6 − (−18)) = (−7; 24).\n\nШаг 3. Длина: √((−7)² + 24²) = √(49 + 576) = √625 = 25.\n\nОтвет: 25.',
    status: 'published',
  },
  {
    taskNumber: 3,
    topicSlug: 'stereometry-solids',
    topicName: 'Стереометрия: тела вращения',
    sourcePage: 1,
    rawStatement:
      'Дано два цилиндра. Объём первого цилиндра равен 102. У второго цилиндра высота в 3 раза больше, а радиус основания в 2 раза меньше, чем у первого. Найдите объём второго цилиндра.',
    conditionMd:
      'Дано два цилиндра. Объём первого цилиндра равен 102. У второго цилиндра высота в 3 раза больше, а радиус основания в 2 раза меньше, чем у первого. Найдите объём второго цилиндра.',
    imageUrl: null,
    correctAnswer: '76.5',
    explanationMd:
      'Что дано: V₁ = 102. У второго цилиндра высота h₂ = 3h₁, радиус r₂ = r₁/2.\n\nИдея: объём цилиндра V = πr²h, поэтому нужно проследить, как изменение r и h в отдельности меняет объём.\n\nШаг 1. V₂ = π·r₂²·h₂ = π·(r₁/2)²·(3h₁) = π·r₁²·h₁·(3/4).\n\nШаг 2. Заметим, что π·r₁²·h₁ = V₁ = 102, значит V₂ = 102 · (3/4).\n\nШаг 3. 102 · 3/4 = 76.5.\n\nОтвет: 76.5.',
    status: 'published',
  },
  {
    taskNumber: 4,
    topicSlug: 'probability-basic',
    topicName: 'Теория вероятностей',
    sourcePage: 1,
    rawStatement:
      'Фабрика выпускает сумки. В среднем 6 сумок из 250 имеют скрытые дефекты. Найдите вероятность того, что купленная сумка окажется без дефектов.',
    conditionMd:
      'Фабрика выпускает сумки. В среднем 6 сумок из 250 имеют скрытые дефекты. Найдите вероятность того, что купленная сумка окажется без дефектов.',
    imageUrl: null,
    correctAnswer: '0.976',
    explanationMd:
      'Что дано: доля бракованных сумок 6 из 250.\n\nИдея: вероятность противоположного события (сумка без дефектов) равна 1 минус вероятность брака.\n\nШаг 1. Вероятность брака: 6 / 250 = 0.024.\n\nШаг 2. Вероятность отсутствия брака: 1 − 0.024 = 0.976.\n\nОтвет: 0.976.',
    status: 'published',
  },
  {
    taskNumber: 5,
    topicSlug: 'probability-basic',
    topicName: 'Теория вероятностей',
    sourcePage: 1,
    rawStatement:
      'В торговом центре два одинаковых автомата продают кофе. Вероятность того, что к концу дня в автомате закончится кофе, равна 0,3. Вероятность того, что кофе останется в обоих автоматах, равна 0,55. Найдите вероятность того, что к концу дня кофе закончится в обоих автоматах.',
    conditionMd:
      'В торговом центре два одинаковых автомата продают кофе. Вероятность того, что к концу дня в автомате закончится кофе, равна 0,3. Вероятность того, что кофе останется в обоих автоматах, равна 0,55. Найдите вероятность того, что к концу дня кофе закончится в обоих автоматах.',
    imageUrl: null,
    correctAnswer: '0.15',
    explanationMd:
      'Что дано: P(A) = P(B) = 0.3 — вероятность того, что кофе закончится в конкретном автомате. P(кофе осталось в обоих) = 0.55.\n\nИдея: воспользуемся формулой сложения вероятностей P(A∪B) = P(A) + P(B) − P(A∩B), где A∪B — "кофе закончилось хотя бы в одном автомате".\n\nШаг 1. "Кофе осталось в обоих" — это противоположное событие к "закончилось хотя бы в одном", значит P(A∪B) = 1 − 0.55 = 0.45.\n\nШаг 2. Из формулы сложения: P(A∩B) = P(A) + P(B) − P(A∪B) = 0.3 + 0.3 − 0.45.\n\nШаг 3. 0.6 − 0.45 = 0.15.\n\nОтвет: 0.15.',
    status: 'published',
  },
  {
    taskNumber: 6,
    topicSlug: 'irrational-equations',
    topicName: 'Иррациональные уравнения',
    sourcePage: 1,
    rawStatement:
      'Найдите корень уравнения √(15x) = 1 2/3 x. Если уравнение имеет больше одного корня, в ответе запишите больший из корней.',
    conditionMd:
      'Найдите корень уравнения √(15x) = 1 2/3 x (где 1 2/3 = 5/3). Если уравнение имеет больше одного корня, в ответе запишите больший из корней.',
    imageUrl: null,
    correctAnswer: '5.4',
    explanationMd:
      'Что дано: уравнение √(15x) = (5/3)x.\n\nИдея: обе части неотрицательны при допустимых x, поэтому можно возвести уравнение в квадрат, а затем проверить корни.\n\nШаг 1. ОДЗ: 15x ≥ 0 и (5/3)x ≥ 0, то есть x ≥ 0.\n\nШаг 2. Возводим в квадрат: 15x = (25/9)x² → (25/9)x² − 15x = 0 → x·((25/9)x − 15) = 0.\n\nШаг 3. Отсюда x = 0 или x = 15·9/25 = 5.4. Оба значения удовлетворяют x ≥ 0.\n\nШаг 4. Проверка x = 5.4: слева √(15·5.4) = √81 = 9, справа (5/3)·5.4 = 9 — совпадает. Больший корень: 5.4.\n\nОтвет: 5.4.',
    status: 'published',
  },
  {
    taskNumber: 7,
    topicSlug: 'logarithms',
    topicName: 'Логарифмы',
    sourcePage: 2,
    rawStatement: 'Найдите log_a(a⁴/b⁵), если log_a b = 15.',
    conditionMd: 'Найдите log_a(a⁴/b⁵), если log_a b = 15.',
    imageUrl: null,
    correctAnswer: '-71',
    explanationMd:
      'Что дано: log_a b = 15. Нужно найти log_a(a⁴/b⁵).\n\nИдея: разложить логарифм частного и степени по свойствам логарифмов.\n\nШаг 1. log_a(a⁴/b⁵) = log_a(a⁴) − log_a(b⁵) = 4 − 5·log_a b.\n\nШаг 2. Подставляем log_a b = 15: 4 − 5·15 = 4 − 75.\n\nОтвет: −71.',
    status: 'published',
  },
  {
    taskNumber: 8,
    topicSlug: 'derivative-graph',
    topicName: 'Производная и первообразная',
    sourcePage: 2,
    rawStatement:
      "На рисунке изображён график y=f'(x) — производной функции f(x), определённой на интервале (−22;2). Найдите количество точек максимума функции f(x), принадлежащих отрезку [−18;1]. [график]",
    conditionMd:
      "На рисунке изображён график y=f'(x) — производной функции f(x), определённой на интервале (−22;2). Найдите количество точек максимума функции f(x), принадлежащих отрезку [−18;1].",
    imageUrl: `${IMAGE_BASE}/task-08-graph.png`,
    correctAnswer: '2',
    explanationMd:
      'Что дано: график производной f\'(x) на (−22;2). Нужно найти число точек максимума f(x) на [−18;1].\n\nИдея: f(x) имеет локальный максимум там, где f\'(x) меняет знак с "+" на "−". Точки, где график f\'(x) касается оси или образует "горб", не пересекая ось, максимумов не дают — там f\'(x) не меняет знак.\n\nШаг 1. Отмечаем на графике все точки пересечения кривой y=f\'(x) с осью Ox внутри отрезка [−18;1]: они находятся приблизительно при x≈−13, x≈−9, x≈−3 и x≈−0.6 (по клеткам сетки).\n\nШаг 2. Определяем знак f\'(x) до и после каждой точки: при x≈−13 знак меняется с "+" на "−" (максимум); при x≈−9 — с "−" на "+" (минимум, не считаем); при x≈−3 — с "+" на "−" (максимум); при x≈−0.6 — с "−" на "+" (минимум, не считаем).\n\nШаг 3. "Горбы" графика f\'(x), которые не пересекают ось (например, около x≈−20, x≈−8, x≈−6 и x≈0), не дают точек экстремума f(x), так как знак производной там не меняется.\n\nШаг 4. Итого на отрезке [−18;1] ровно 2 точки, где f\'(x) меняет знак с "+" на "−": x≈−13 и x≈−3.\n\nОтвет: 2.',
    status: 'published',
  },
  {
    taskNumber: 9,
    topicSlug: 'exponential-word-problems',
    topicName: 'Показательные уравнения и текстовые задачи',
    sourcePage: 2,
    rawStatement:
      'В ходе распада радиоактивного изотопа его масса уменьшается по закону m=m₀·2^(−t/T), где m₀ — начальная масса изотопа, t — время, прошедшее от начального момента, T — период полураспада. В начальный момент времени масса изотопа 192 мг. Период его полураспада составляет 10 минут. Найдите, через сколько минут масса изотопа будет равна 6 мг.',
    conditionMd:
      'В ходе распада радиоактивного изотопа его масса уменьшается по закону m=m₀·2^(−t/T), где m₀ — начальная масса изотопа, t — время, прошедшее от начального момента, T — период полураспада. В начальный момент времени масса изотопа 192 мг. Период его полураспада составляет 10 минут. Найдите, через сколько минут масса изотопа будет равна 6 мг.',
    imageUrl: null,
    correctAnswer: '50',
    explanationMd:
      'Что дано: m₀=192 мг, T=10 мин. Нужно найти t, при котором m=6 мг.\n\nИдея: подставить данные в формулу и решить показательное уравнение относительно t, приведя обе части к одному основанию 2.\n\nШаг 1. 6 = 192·2^(−t/10) → 2^(−t/10) = 6/192 = 1/32.\n\nШаг 2. Замечаем, что 1/32 = 2^(−5), значит −t/10 = −5.\n\nШаг 3. Отсюда t = 50.\n\nОтвет: 50.',
    status: 'published',
  },
  {
    taskNumber: 10,
    topicSlug: 'motion-word-problems',
    topicName: 'Текстовые задачи на движение',
    sourcePage: 2,
    rawStatement:
      'Катер, скорость которого в неподвижной воде равна 28 км/ч, проходит по течению реки и после стоянки возвращается в исходный пункт. Скорость течения равна 2 км/ч, стоянка длится 4 часа, а в исходный пункт катер возвращается через 18 часов после отплытия из него. Сколько километров прошёл катер за весь рейс?',
    conditionMd:
      'Катер, скорость которого в неподвижной воде равна 28 км/ч, проходит по течению реки и после стоянки возвращается в исходный пункт. Скорость течения равна 2 км/ч, стоянка длится 4 часа, а в исходный пункт катер возвращается через 18 часов после отплытия из него. Сколько километров прошёл катер за весь рейс?',
    imageUrl: null,
    correctAnswer: '390',
    explanationMd:
      'Что дано: собственная скорость катера 28 км/ч, скорость течения 2 км/ч, стоянка 4 ч, общее время рейса 18 ч.\n\nИдея: время движения (без стоянки) уходит на путь туда по течению и обратно против течения; составим уравнение на расстояние d.\n\nШаг 1. Время в движении: 18 − 4 = 14 ч. Скорость по течению: 28+2=30 км/ч. Скорость против течения: 28−2=26 км/ч.\n\nШаг 2. Уравнение: d/30 + d/26 = 14.\n\nШаг 3. Приводим к общему знаменателю: (26d + 30d) / 780 = 14 → 56d = 10920 → d = 195.\n\nШаг 4. Весь рейс — это путь туда и обратно: 2d = 390 км.\n\nОтвет: 390.',
    status: 'published',
  },
  {
    taskNumber: 11,
    topicSlug: 'functions-graphs',
    topicName: 'Функции и графики',
    sourcePage: 2,
    rawStatement:
      'На рисунке изображён график функции f(x)=ax²+bx+c. Найдите f(3). [график: корни при x=−4 и x=−1, отмеченная точка (0;4)]',
    conditionMd: 'На рисунке изображён график функции f(x)=ax²+bx+c. Найдите f(3).',
    imageUrl: `${IMAGE_BASE}/task-11-graph.png`,
    correctAnswer: '28',
    explanationMd:
      'Что дано: график параболы с корнями (по клеткам) x=−4 и x=−1, и отмеченной точкой (0; 4).\n\nИдея: зная оба корня, функцию можно записать как f(x)=a(x+4)(x+1); коэффициент a найдём из отмеченной точки.\n\nШаг 1. f(x) = a(x−(−4))(x−(−1)) = a(x+4)(x+1).\n\nШаг 2. По графику f(0) = 4: a·4·1 = 4 → a = 1.\n\nШаг 3. f(x) = (x+4)(x+1). Тогда f(3) = (3+4)(3+1) = 7·4.\n\nОтвет: 28.',
    status: 'published',
  },
  {
    taskNumber: 12,
    topicSlug: 'derivative-extrema',
    topicName: 'Производная: точки экстремума',
    sourcePage: 3,
    rawStatement: 'Найдите точку максимума функции y=x²+12ln(x+5)−7.',
    conditionMd: 'Найдите точку максимума функции y=x²+12ln(x+5)−7.',
    imageUrl: null,
    correctAnswer: '-3',
    explanationMd:
      'Что дано: y=x²+12ln(x+5)−7, область определения x>−5.\n\nИдея: находим точки, где производная равна нулю, и определяем тип экстремума по смене знака производной (или по второй производной).\n\nШаг 1. y\' = 2x + 12/(x+5). Приравниваем к нулю: 2x + 12/(x+5) = 0.\n\nШаг 2. Умножаем на (x+5) (положительно на ОДЗ): 2x(x+5) + 12 = 0 → 2x² + 10x + 12 = 0 → x² + 5x + 6 = 0 → (x+2)(x+3) = 0.\n\nШаг 3. Корни: x=−2 и x=−3, оба входят в ОДЗ (x>−5).\n\nШаг 4. Определяем знаки y\' на интервалах: при x чуть меньше −3 (например, x=−4): y\'=2·(−4)+12/1=−8+12=4>0. Между −3 и −2 (например, x=−2.5): y\'=2·(−2.5)+12/2.5=−5+4.8=−0.2<0. При x чуть больше −2 (например, x=0): y\'=0+12/5=2.4>0.\n\nШаг 5. Значит на x=−3 производная меняется с "+" на "−" — это точка максимума; на x=−2 с "−" на "+" — точка минимума.\n\nОтвет: −3.',
    status: 'published',
  },
  {
    taskNumber: 13,
    topicSlug: 'trig-equations',
    topicName: 'Тригонометрические уравнения',
    sourcePage: 3,
    rawStatement:
      'а) Решите уравнение √(2cos³x − sin²x − 2cosx − sinx) = √(cos(π/2+x)). б) Найдите все корни этого уравнения, принадлежащие отрезку [−4π; −5π/2].',
    conditionMd:
      'а) Решите уравнение √(2cos³x − sin²x − 2cosx − sinx) = √(cos(π/2+x)). б) Найдите все корни этого уравнения, принадлежащие отрезку [−4π; −5π/2].',
    imageUrl: null,
    correctAnswer: '-4π; -3π; -8π/3',
    explanationMd:
      'Что дано: уравнение с квадратными корнями от тригонометрического выражения. Нужны все корни на [−4π;−5π/2].\n\nИдея: cos(π/2+x) = −sinx. Так как обе части — арифметические квадратные корни, уравнение равносильно системе: подкоренные выражения равны, а правая часть неотрицательна (sinx ≤ 0).\n\nШаг 1. Приравниваем подкоренные выражения: 2cos³x − sin²x − 2cosx − sinx = −sinx → 2cos³x − sin²x − 2cosx = 0.\n\nШаг 2. Заменяем sin²x = 1−cos²x: 2cos³x − (1−cos²x) − 2cosx = 0 → 2cos³x + cos²x − 2cosx − 1 = 0.\n\nШаг 3. Пусть c=cosx. Раскладываем на множители: 2c³+c²−2c−1 = (c−1)(2c+1)(c+1) = 0. Корни: c=1, c=−1/2, c=−1.\n\nШаг 4. Проверяем условие sinx≤0 для каждого случая. c=1 (x=2πn) и c=−1 (x=π+2πn) дают sinx=0 — подходит всегда (можно записать вместе как x=πn). Для c=−1/2 (x=±2π/3+2πk) подходит только ветвь с sinx≤0, то есть x=−2π/3+2πk.\n\nШаг 5. Общее решение: x=πn, n∈ℤ, или x=−2π/3+2πk, k∈ℤ.\n\nШаг 6. Отбираем корни на [−4π;−5π/2]: из x=πn получаем n=−4 (x=−4π) и n=−3 (x=−3π). Из x=−2π/3+2πk решаем −4π≤−2π/3+2πk≤−5π/2, получаем k=−1, то есть x=−8π/3.\n\nОтвет: −4π; −3π; −8π/3.',
    status: 'published',
  },
  {
    taskNumber: 14,
    topicSlug: 'stereometry-proof',
    topicName: 'Стереометрия',
    sourcePage: 3,
    rawStatement:
      'В пирамиде SABCD с высотой SA основанием является квадрат ABCD, точка K — середина ребра SB. Прямая DK пересекается с плоскостью SAC в точке N. а) Докажите, что прямая a, проходящая через точку N параллельно прямой SC, делит диагональ основания AC в отношении 1:2. б) Найдите угол между прямыми DK и SC, если AB=2√3, SA=6.',
    conditionMd:
      'В пирамиде SABCD с высотой SA основанием является квадрат ABCD, точка K — середина ребра SB. Прямая DK пересекается с плоскостью SAC в точке N. а) Докажите, что прямая a, проходящая через точку N параллельно прямой SC, делит диагональ основания AC в отношении 1:2. б) Найдите угол между прямыми DK и SC, если AB=2√3, SA=6.',
    imageUrl: null,
    correctAnswer: 'arccos(√10/5)',
    explanationMd:
      'Что дано: пирамида SABCD, SA⊥основанию, ABCD — квадрат со стороной a=2√3, SA=6, K — середина SB.\n\nИдея (часть а): удобно ввести координаты A=(0,0,0), B=(a,0,0), C=(a,a,0), D=(0,a,0), S=(0,0,h). Плоскость SAC — это плоскость x=y. Найдём точку N как пересечение прямой DK с этой плоскостью, а затем — где прямая через N параллельно SC пересекает AC.\n\nШаг 1 (а). K = середина SB = (a/2, 0, h/2)... при подстановке параметра t вдоль DK: точка пересечения с плоскостью x=y даёт t=2/3, откуда N=(a/3, a/3, h/3·... ). Подставляя направление SC и находя пересечение этой прямой с отрезком AC (точки вида (u,u,0)), получаем u=2a/3 — то есть точка делит AC в отношении AP:PC=2:1 от вершины A, что и означает отношение 1:2. (Доказательство части а проверено независимо через координатный метод.)\n\nШаг 2 (б). Вектор DK = K−D = (a/2, −a, h/2). Вектор SC = C−S = (a, a, −h).\n\nШаг 3. Скалярное произведение: DK·SC = a²/2 − a² − h²/2 = −a²/2 − h²/2... при подстановке a²=12, h=6: DK·SC = −6 − 18 = −24.\n\nШаг 4. |DK|² = a²/4 + a² + h²/4 = 3+12+9=24 → |DK|=2√6. |SC|² = a²+a²+h²=12+12+36=60 → |SC|=2√15.\n\nШаг 5. cos угла = |DK·SC| / (|DK|·|SC|) = 24 / (2√6·2√15) = 24/(4√90) = 6/√90 = 6/(3√10) = 2/√10 = √10/5.\n\nОтвет: arccos(√10/5) (то же самое, что arctg(√6/2), ≈50.8°).',
    status: 'published',
  },
  {
    taskNumber: 15,
    topicSlug: 'inequalities-log-exp',
    topicName: 'Показательные и логарифмические неравенства',
    sourcePage: 3,
    rawStatement:
      'Решите неравенство (9^x − 3^(x+2) + 8) / (log_(1/6)²(5^x−2) + log_(1/6)(5^x−2)² + 1) ≤ 0.',
    conditionMd:
      'Решите неравенство (9^x − 3^(x+2) + 8) / (log_(1/6)²(5^x−2) + log_(1/6)(5^x−2)² + 1) ≤ 0.',
    imageUrl: null,
    answerType: 'interval',
    // A punctured interval (one excluded point) re-expressed as a union
    // of two open-ended sub-intervals split at that point — the
    // interval-set checker (packages/shared/src/intervalAnswer.ts)
    // supports unions of plain intervals, so this needs no special
    // "excluded point" syntax; re-verified numerically (sampled f(x)
    // across the domain) that this union exactly matches the sign
    // condition, see docs/imports/ege-2026-variant-1-report.md.
    correctAnswer: '(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]',
    explanationMd:
      'Что дано: дробно-рациональное относительно показательных/логарифмических выражений неравенство.\n\nИдея: ОДЗ требует 5^x−2>0. Обозначим t=log_(1/6)(5^x−2); знаменатель раскладывается как полный квадрат (t+1)², то есть его знак всегда неотрицателен (и он не может быть равен нулю — это исключённая точка). Значит знак дроби целиком определяется числителем.\n\nШаг 1. ОДЗ: 5^x>2 → x>log_5 2. Знаменатель (t+1)²>0 при t≠−1, то есть 5^x−2 ≠ 6 → x ≠ log_5 8.\n\nШаг 2. Числитель: пусть u=3^x. 9^x=u², 3^(x+2)=9u. Получаем u²−9u+8≤0 → (u−1)(u−8)≤0 → 1≤u≤8 → 0≤x≤log_3 8.\n\nШаг 3. Пересекаем с ОДЗ (x>log_5 2≈0.43) и убираем исключённую точку x=log_5 8≈1.29 (которая лежит внутри промежутка) — это разбивает один промежуток на два: (log_5 2; log_5 8) ∪ (log_5 8; log_3 8].\n\nШаг 4 (независимая проверка). Численно проверено значение f(x) при x от 0 до 2.15 с шагом 0.05: знак f(x) отрицателен (или f не определена — ОДЗ/исключённая точка) везде и только там, где предсказывает это решение.\n\nОтвет: x ∈ (log₅2; log₅8) ∪ (log₅8; log₃8].',
    status: 'published',
  },
  {
    taskNumber: 16,
    topicSlug: 'economics-problems',
    topicName: 'Экономические задачи',
    sourcePage: 3,
    rawStatement:
      'В июне 2028 года Пётр Иванович планирует взять кредит в банке на 5 лет в размере целого числа миллионов рублей. Условия его возврата таковы: в январе каждого года долг увеличивается на 20% от суммы долга на конец предыдущего года; в период с февраля по июнь в каждый из 2029, 2030 и 2031 годов необходимо выплатить только проценты по кредиту, начисленные в январе соответствующего года; в период с февраля по июнь в каждый из 2032 и 2033 годов платежи по кредиту равные, причём последний платёж должен погасить долг по кредиту полностью. Найдите наибольший размер кредита, при котором общая сумма выплат по кредиту не превысит 10 млн рублей.',
    conditionMd:
      'В июне 2028 года Пётр Иванович планирует взять кредит в банке на 5 лет в размере целого числа миллионов рублей. Условия его возврата таковы: в январе каждого года долг увеличивается на 20% от суммы долга на конец предыдущего года; в период с февраля по июнь в каждый из 2029, 2030 и 2031 годов необходимо выплатить только проценты по кредиту, начисленные в январе соответствующего года; в период с февраля по июнь в каждый из 2032 и 2033 годов платежи по кредиту равные, причём последний платёж должен погасить долг по кредиту полностью. Найдите наибольший размер кредита, при котором общая сумма выплат по кредиту не превысит 10 млн рублей.',
    imageUrl: null,
    correctAnswer: '5',
    explanationMd:
      'Что дано: кредит A млн руб. (целое число), долг растёт на 20% каждый январь; в 2029-2031 платятся только проценты (долг возвращается к A); в 2032-2033 — два равных платежа P, второй полностью гасит долг.\n\nИдея: выразить суммарные выплаты через A и найти наибольшее целое A, при котором сумма выплат ≤10 млн.\n\nШаг 1. В 2029, 2030, 2031: каждый январь долг становится 1.2A, выплачиваются только проценты 0.2A, долг возвращается к A. Итого за три года выплачено 3·0.2A=0.6A, долг на начало 2032 остаётся A.\n\nШаг 2. Январь 2032: долг становится 1.2A. Платёж P снижает его до 1.2A−P. Январь 2033: долг становится (1.2A−P)·1.2=1.44A−1.2P. Второй платёж P полностью гасит долг: 1.44A−1.2P−P=0 → P=1.44A/2.2=36A/55.\n\nШаг 3. Общая сумма выплат: 0.6A + 2P = 0.6A + 72A/55 = 33A/55+72A/55 = 105A/55 = 21A/11.\n\nШаг 4. Условие: 21A/11 ≤ 10 → A ≤ 110/21 ≈ 5.24. Наибольшее целое A = 5.\n\nОтвет: 5.',
    status: 'published',
  },
  {
    taskNumber: 17,
    topicSlug: 'planimetry-circles',
    topicName: 'Планиметрия: окружности',
    sourcePage: 4,
    rawStatement:
      'В прямоугольную трапецию ABCD с большим основанием CD и прямыми углами A и D вписана окружность с центром в точке O радиуса R. Точка G — точка касания данной окружности и стороны AB трапеции ABCD. Биссектриса угла ADC перпендикулярна стороне BC и пересекает её в точке N. а) Докажите, что BN=(√2−1)R. б) Найдите радиус окружности, вписанной в четырёхугольник BNOG, если R=6.',
    conditionMd:
      'В прямоугольную трапецию ABCD с большим основанием CD и прямыми углами A и D вписана окружность с центром в точке O радиуса R. Точка G — точка касания данной окружности и стороны AB трапеции ABCD. Биссектриса угла ADC перпендикулярна стороне BC и пересекает её в точке N. а) Докажите, что BN=(√2−1)R. б) Найдите радиус окружности, вписанной в четырёхугольник BNOG, если R=6.',
    imageUrl: null,
    correctAnswer: '6-3√2',
    explanationMd:
      'Что дано: прямоугольная трапеция с прямыми углами при A и D, вписанная окружность радиуса R с центром O, точка касания G на AB, биссектриса угла D (=90°) перпендикулярна BC и пересекает её в N.\n\nИдея: удобно ввести координаты D=(0,0), A=(0,2R) (высота трапеции AD=2R, так как обе параллельные стороны касаются окружности), C=(c,0), B=(b,2R), O=(R,R). Биссектриса угла D — прямая y=x (45° между осями). Условие перпендикулярности этой биссектрисы стороне BC даёт c=b+2R. Условие касания BC окружности задаёт ещё одно уравнение, из которого находится c=R(2+√2), b=R√2.\n\nШаг 1 (а). N — пересечение прямой y=x с BC: получаем N=(c/2,c/2). Вычисляя BN через координаты B и N, получаем |BN| = R(√2−1) — что и требовалось доказать.\n\nШаг 2. Точка G — точка касания окружности со стороной AB: G=(R,2R) (прямо над центром O).\n\nШаг 3 (б). Стороны четырёхугольника BNOG: BN=R(√2−1), NO=R, OG=R, GB=R(√2−1) — заметим, что BN=GB и NO=OG, то есть BNOG — дельтоид (кайт), а любой кайт имеет вписанную окружность.\n\nШаг 4. Вычисляя площадь BNOG по координатам (формула площади многоугольника) и полупериметр s=(BN+NO+OG+GB)/2, получаем Площадь = R²(√2−1), s=R√2.\n\nШаг 5. Радиус вписанной окружности r = Площадь / s = R²(√2−1) / (R√2) = R(√2−1)/√2 = R(2−√2)/2.\n\nШаг 6. При R=6: r = 6·(2−√2)/2 = 3(2−√2) = 6−3√2 ≈ 1.76.\n\nОтвет: 6−3√2.',
    status: 'published',
  },
  {
    taskNumber: 18,
    topicSlug: 'parameters',
    topicName: 'Задачи с параметром',
    sourcePage: 4,
    rawStatement:
      'Найдите все значения a, при каждом из которых система уравнений {(|x|−a²)²+(y−4a)(y+4a)=9a²−2y−1, y+1=6√a} имеет ровно два различных решения.',
    conditionMd:
      'Найдите все значения a, при каждом из которых система уравнений {(|x|−a²)²+(y−4a)(y+4a)=9a²−2y−1, y+1=6√a} имеет ровно два различных решения.',
    imageUrl: null,
    correctAnswer: '36/25; (√13-2;4)',
    explanationMd:
      'Что дано: система с параметром a; второе уравнение содержит √a, значит a≥0.\n\nИдея: выразить y из второго уравнения, подставить в первое и свести его к уравнению вида (|x|−a²)²=K(a), где K зависит только от a; количество решений системы по x напрямую определяется знаком выражений a²±√K.\n\nШаг 1. y=6√a−1. Раскрываем (y−4a)(y+4a)=y²−16a² в первом уравнении: (|x|−a²)² = 9a²−2y−1−y²+16a² = 25a² − (y+1)².\n\nШаг 2. Так как (y+1)²=(6√a)²=36a, получаем (|x|−a²)² = 25a²−36a = a(25a−36) = K.\n\nШаг 3. Нужно K≥0 и a≥0, откуда a=0 или a≥36/25. При a=0 получаем ровно одно решение (x=0,y=−1) — не подходит.\n\nШаг 4. При a=36/25 (K=0): |x|=a², то есть x=±a² — два различных x (так как a²>0), значит ровно 2 решения. Это значение подходит.\n\nШаг 5. При a>36/25 (K>0): |x|=a²+√K всегда даёт 2 решения; |x|=a²−√K добавляет ещё 2 решения, если это выражение положительно, или 1 решение, если оно равно 0, или 0 решений, если оно отрицательно. Чтобы решений было ровно 2 (не 3 и не 4), нужно a²−√K<0 строго.\n\nШаг 6. Возводя строго в квадрат (обе части неотрицательны только когда a²<√K, что и требуется): a⁴<25a²−36a → a³−25a+36<0 (после деления на a>0). Раскладываем: a³−25a+36=(a−4)(a²+4a−9), корни второго множителя a=−2±√13.\n\nШаг 7. Знак кубического многочлена отрицателен на интервале (−2+√13; 4) — проверено подстановкой пробных точек. Это целиком лежит в области a>36/25.\n\nОтвет: a=36/25 или a∈(√13−2; 4).',
    status: 'published',
  },
  {
    taskNumber: 19,
    topicSlug: 'number-theory',
    topicName: 'Числа и их свойства',
    sourcePage: 4,
    rawStatement:
      'У Ивана Ильича есть коллекция монет. Если все его монеты разложить в одинаковые большие кляссеры, то потребуется k кляссеров, причём 5 ячеек в одном кляссере останутся пустыми. Если же их разложить в одинаковые маленькие кляссеры, то потребуется k+2 кляссеров и также 5 ячеек в одном кляссере останутся пустыми. Известно, что в большом кляссере больше 150, но меньше 160 ячеек, а в маленьком — больше 100, но меньше 120 ячеек. а) Может ли k быть равно 3? б) Какое наименьшее количество монет может быть в коллекции у Ивана Ильича? в) Какое наибольшее количество монет может быть в коллекции у Ивана Ильича?',
    conditionMd:
      'У Ивана Ильича есть коллекция монет. Если все его монеты разложить в одинаковые большие кляссеры, то потребуется k кляссеров, причём 5 ячеек в одном кляссере останутся пустыми. Если же их разложить в одинаковые маленькие кляссеры, то потребуется k+2 кляссеров и также 5 ячеек в одном кляссере останутся пустыми. Известно, что в большом кляссере больше 150, но меньше 160 ячеек, а в маленьком — больше 100, но меньше 120 ячеек. а) Может ли k быть равно 3? б) Какое наименьшее количество монет может быть в коллекции у Ивана Ильича? в) Какое наибольшее количество монет может быть в коллекции у Ивана Ильича?',
    imageUrl: null,
    answerType: 'multi_part',
    // Re-verified via a fresh exhaustive search over every integer
    // (Б,М) pair in the allowed ranges (see the report) before
    // publishing — not just re-using the S3 result unchecked.
    correctAnswer: serializeMultiPartSpec({
      parts: [
        { id: 'a', label: 'а', answerType: 'short_answer', correctAnswer: 'нет' },
        { id: 'b', label: 'б', answerType: 'short_answer', correctAnswer: '607' },
        { id: 'c', label: 'в', answerType: 'short_answer', correctAnswer: '1066' },
      ],
    }),
    explanationMd:
      'Что дано: N монет; N=k·Б−5 (Б — ячеек в большом кляссере, 150<Б<160) и N=(k+2)·М−5 (М — ячеек в маленьком, 100<М<120), Б и М — целые.\n\nИдея: приравнять оба выражения для N, получить k через Б и М, затем перебрать все целые Б∈[151,159], М∈[101,119] и проверить, при каких k получается целым и положительным.\n\nШаг 1. k·Б=(k+2)·М → k(Б−М)=2М → k=2М/(Б−М).\n\n### А\nПри k=3: 3Б=5М → Б=5М/3. При М от 101 до 119 (целые, кратные 3 для целого Б: 102,105,...,117) получаем Б от 170 до 195 — все значения больше 159, то есть вне допустимого диапазона большого кляссера. Значит k=3 невозможно.\n\nОтвет: нет.\n\n### Б и В\nПолным перебором целых Б∈[151,159], М∈[101,119] с условием, что 2М делится на (Б−М) нацело и k=2М/(Б−М)≥1, находятся все допустимые тройки (k,Б,М) и соответствующие N=k·Б−5: (k=4,Б=153,М=102,N=607), (k=4,Б=156,М=104,N=619), (k=4,Б=159,М=106,N=631), (k=5,Б=154,М=110,N=765), (k=6,Б=152,М=114,N=907), (k=6,Б=156,М=117,N=931), (k=7,Б=153,М=119,N=1066).\n\nНаименьшее N среди найденных — 607, наибольшее — 1066.\n\nОтвет: б) 607, в) 1066.',
    status: 'published',
  },
];

/** Rough part classification for the report only — Part 1 = 1-12, Part 2 = 13-19; not stored as its own column since it's a deterministic function of taskNumber for this subject. */
export function partForTaskNumber(taskNumber: number): 1 | 2 {
  return taskNumber <= 12 ? 1 : 2;
}

/**
 * Difficulty follows the exam's own documented Part 1 / Part 2 split
 * (Part 1 = базовый/повышенный, Part 2 = высокий), not a per-task
 * subjective judgement call we have no reliable way to make yet.
 */
function difficultyForTaskNumber(taskNumber: number): 1 | 2 | 3 {
  return partForTaskNumber(taskNumber) === 1 ? 2 : 3;
}

function normalizeForHash(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function contentHashFor(subjectId: string, taskNumber: number, statement: string): string {
  return createHash('sha256')
    .update(`${subjectId}|${taskNumber}|${normalizeForHash(statement)}`)
    .digest('hex');
}

export async function importVariant1(db: Database) {
  await db
    .insert(schema.subjects)
    .values({ id: 'math', name: 'Математика' })
    .onConflictDoUpdate({ target: schema.subjects.id, set: { name: 'Математика' } });

  const topicIdBySlug = new Map<string, string>();
  for (const slug of new Set(importTasks.map((t) => t.topicSlug))) {
    const topicName = importTasks.find((t) => t.topicSlug === slug)!.topicName;
    const [topic] = await db
      .insert(schema.topics)
      .values({ subjectId: 'math', slug, name: topicName })
      .onConflictDoUpdate({
        target: [schema.topics.subjectId, schema.topics.slug],
        set: { name: topicName },
      })
      .returning();
    topicIdBySlug.set(slug, topic!.id);
  }

  const [collection] = await db
    .insert(schema.collections)
    .values({
      subjectId: 'math',
      slug: COLLECTION_SLUG,
      title: COLLECTION_TITLE,
      publisher: COLLECTION_PUBLISHER,
      year: SOURCE_YEAR,
      status: 'published',
    })
    .onConflictDoUpdate({
      target: schema.collections.slug,
      set: { title: COLLECTION_TITLE, publisher: COLLECTION_PUBLISHER, year: SOURCE_YEAR },
    })
    .returning();

  const [variant] = await db
    .insert(schema.variants)
    .values({
      collectionId: collection!.id,
      variantNumber: VARIANT,
      title: VARIANT_TITLE,
      year: SOURCE_YEAR,
      status: 'published',
      sourceFile: SOURCE_FILE,
      sourcePageStart: SOURCE_PAGE_START,
      sourcePageEnd: SOURCE_PAGE_END,
    })
    .onConflictDoUpdate({
      target: [schema.variants.collectionId, schema.variants.variantNumber],
      set: {
        title: VARIANT_TITLE,
        sourceFile: SOURCE_FILE,
        sourcePageStart: SOURCE_PAGE_START,
        sourcePageEnd: SOURCE_PAGE_END,
        updatedAt: new Date(),
      },
    })
    .returning();

  // variant_tasks references tasks by id, and the tasks below are about
  // to be deleted and recreated with fresh ids — drop this variant's
  // membership rows first so that delete never trips the FK constraint.
  await db.delete(schema.variantTasks).where(eq(schema.variantTasks.variantId, variant!.id));

  await db
    .delete(schema.tasks)
    .where(
      and(
        eq(schema.tasks.subjectId, 'math'),
        eq(schema.tasks.source, SOURCE),
        eq(schema.tasks.sourceVariant, VARIANT),
      ),
    );

  const rows = importTasks.map((t) => ({
    subjectId: 'math',
    taskNumber: t.taskNumber,
    topicId: topicIdBySlug.get(t.topicSlug),
    difficulty: difficultyForTaskNumber(t.taskNumber),
    conditionMd: t.conditionMd,
    imageUrl: t.imageUrl,
    answerType: t.answerType ?? ('short_answer' as const),
    correctAnswer: t.correctAnswer,
    explanationMd: t.explanationMd,
    source: SOURCE,
    sourceUrl: null,
    sourceYear: SOURCE_YEAR,
    sourceDocument: SOURCE_DOCUMENT,
    sourceVariant: VARIANT,
    sourcePage: t.sourcePage,
    rawStatement: t.rawStatement,
    contentHash: contentHashFor('math', t.taskNumber, t.rawStatement),
    tags: [IMPORT_TAG],
    status: t.status,
  }));

  const inserted = await db.insert(schema.tasks).values(rows).returning();

  // position = taskNumber: this variant's full-exam order is exactly
  // the official question numbering, 1-19 with no gaps.
  await db.insert(schema.variantTasks).values(
    inserted.map((task) => ({
      variantId: variant!.id,
      taskId: task.id,
      position: task.taskNumber,
    })),
  );

  return {
    total: importTasks.length,
    published: importTasks.filter((t) => t.status === 'published').length,
    needsReview: importTasks.filter((t) => t.status === 'needs_review').length,
    collectionId: collection!.id,
    variantId: variant!.id,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  const client = postgres(databaseUrl, { max: 1 });
  try {
    const db = drizzle(client, { schema });
    const result = await importVariant1(db);
    console.log(
      `Imported ${result.total} tasks from Вариант 1 (${result.published} published, ${result.needsReview} needs_review).`,
    );
  } finally {
    await client.end();
  }
}

if (isMainModule(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
