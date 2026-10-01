import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import type { Skill } from '@zybrilka/shared';
import { eq } from 'drizzle-orm';

const skillColumns = {
  id: schema.skills.id,
  subjectId: schema.skills.subjectId,
  slug: schema.skills.slug,
  name: schema.skills.name,
  description: schema.skills.description,
};

export async function getSkillsForTask(db: Database, taskId: string): Promise<Skill[]> {
  return db
    .select(skillColumns)
    .from(schema.taskSkills)
    .innerJoin(schema.skills, eq(schema.taskSkills.skillId, schema.skills.id))
    .where(eq(schema.taskSkills.taskId, taskId));
}

export async function getTasksForSkill(db: Database, skillId: string): Promise<string[]> {
  const rows = await db
    .select({ taskId: schema.taskSkills.taskId })
    .from(schema.taskSkills)
    .where(eq(schema.taskSkills.skillId, skillId));
  return rows.map((r) => r.taskId);
}

export async function getSkillsBySubject(db: Database, subjectId: string): Promise<Skill[]> {
  return db.select(skillColumns).from(schema.skills).where(eq(schema.skills.subjectId, subjectId));
}
