import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { and, eq, isNotNull } from 'drizzle-orm';
import { getCanonicalMethodTagsForTask } from '../tasks/canonicalSolution.js';

interface MethodTagSkillMeta {
  readonly subjectId: string;
  readonly slug: string;
  readonly name: string;
}

/**
 * Stable 1:1 methodTag → skill mapping (ZUBRILKA LEARNING INTELLIGENCE
 * Phase 2). Per the project's explicit rule: no AI/ML anywhere — this
 * is a hand-maintained, deterministic lookup, and each entry here
 * exists only because the methodTag is actually used by a real,
 * authored canonical solution (see
 * `packages/shared/src/solutionTemplates/math/{13..19}/*.ts`). Two
 * different methodTags are never merged into one skill without
 * verifying every task that uses either of them — so this map is
 * additive only: add an entry for a newly authored methodTag, never
 * rename or collapse an existing one casually.
 */
const METHOD_TAG_SKILLS: Readonly<Record<string, MethodTagSkillMeta>> = {
  substitution: { subjectId: 'math', slug: 'substitution', name: 'Замена переменной' },
  factoring: { subjectId: 'math', slug: 'factoring', name: 'Разложение на множители' },
  quadratic_in_trig_function: {
    subjectId: 'math',
    slug: 'quadratic_in_trig_function',
    name: 'Квадратное уравнение относительно тригонометрической функции',
  },
  coordinate_method: {
    subjectId: 'math',
    slug: 'coordinate_method',
    name: 'Координатный метод',
  },
  vectors: { subjectId: 'math', slug: 'vectors', name: 'Векторы' },
  plane_intersection: {
    subjectId: 'math',
    slug: 'plane_intersection',
    name: 'Пересечение плоскостей',
  },
  domain_analysis: { subjectId: 'math', slug: 'domain_analysis', name: 'Анализ ОДЗ' },
  sign_analysis: { subjectId: 'math', slug: 'sign_analysis', name: 'Метод интервалов' },
  variable_introduction: {
    subjectId: 'math',
    slug: 'variable_introduction',
    name: 'Введение новой переменной',
  },
  percentage_growth: {
    subjectId: 'math',
    slug: 'percentage_growth',
    name: 'Процентный рост',
  },
  equal_payment_equation: {
    subjectId: 'math',
    slug: 'equal_payment_equation',
    name: 'Уравнение равного платежа',
  },
  incircle_tangency: {
    subjectId: 'math',
    slug: 'incircle_tangency',
    name: 'Касательные вписанной окружности',
  },
  kite_properties: {
    subjectId: 'math',
    slug: 'kite_properties',
    name: 'Свойства дельтоида',
  },
  parameter_investigation: {
    subjectId: 'math',
    slug: 'parameter_investigation',
    name: 'Исследование параметра',
  },
  case_analysis: { subjectId: 'math', slug: 'case_analysis', name: 'Разбор случаев' },
  cubic_factoring: {
    subjectId: 'math',
    slug: 'cubic_factoring',
    name: 'Разложение кубического выражения',
  },
  divisibility: { subjectId: 'math', slug: 'divisibility', name: 'Делимость' },
  bounding_argument: {
    subjectId: 'math',
    slug: 'bounding_argument',
    name: 'Метод оценки (границы)',
  },
};

export interface SyncSkillsResult {
  readonly skillsCreated: number;
  readonly linksCreated: number;
}

/**
 * Idempotent: re-running creates zero new rows once every covered
 * task's `methodTags` already has a matching skill and a `task_skills`
 * link — relies on `skills_subject_slug_idx` / `task_skills_task_skill_idx`
 * (`onConflictDoNothing`), never a read-then-write race. A methodTag
 * with no entry in `METHOD_TAG_SKILLS` is skipped, never used to
 * fabricate a new skill on the fly.
 */
export async function syncSkillsFromCanonicalSolutions(db: Database): Promise<SyncSkillsResult> {
  const tasks = await db
    .select({
      id: schema.tasks.id,
      subjectId: schema.tasks.subjectId,
      taskNumber: schema.tasks.taskNumber,
      contentHash: schema.tasks.contentHash,
      correctAnswer: schema.tasks.correctAnswer,
      correctAnswerDisplay: schema.tasks.correctAnswerDisplay,
    })
    .from(schema.tasks)
    .where(isNotNull(schema.tasks.contentHash));

  let skillsCreated = 0;
  let linksCreated = 0;
  const skillIdByTag = new Map<string, string>();

  for (const task of tasks) {
    const methodTags = getCanonicalMethodTagsForTask(task);
    if (!methodTags) continue;

    for (const tag of methodTags) {
      const meta = METHOD_TAG_SKILLS[tag];
      if (!meta) continue;

      let skillId = skillIdByTag.get(tag);
      if (!skillId) {
        const [inserted] = await db
          .insert(schema.skills)
          .values({ subjectId: meta.subjectId, slug: meta.slug, name: meta.name })
          .onConflictDoNothing({ target: [schema.skills.subjectId, schema.skills.slug] })
          .returning({ id: schema.skills.id });

        if (inserted) {
          skillId = inserted.id;
          skillsCreated++;
        } else {
          const [existing] = await db
            .select({ id: schema.skills.id })
            .from(schema.skills)
            .where(
              and(eq(schema.skills.subjectId, meta.subjectId), eq(schema.skills.slug, meta.slug)),
            );
          skillId = existing!.id;
        }
        skillIdByTag.set(tag, skillId);
      }

      const [link] = await db
        .insert(schema.taskSkills)
        .values({ taskId: task.id, skillId, source: 'canonical' })
        .onConflictDoNothing({ target: [schema.taskSkills.taskId, schema.taskSkills.skillId] })
        .returning({ id: schema.taskSkills.id });

      if (link) linksCreated++;
    }
  }

  return { skillsCreated, linksCreated };
}
