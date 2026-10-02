import type { Database } from '@zybrilka/db';
import type { Skill } from '@zybrilka/shared';
import * as repo from './repo.js';

export function getSkillsForTask(db: Database, taskId: string): Promise<Skill[]> {
  return repo.getSkillsForTask(db, taskId);
}

export function getTasksForSkill(db: Database, skillId: string): Promise<string[]> {
  return repo.getTasksForSkill(db, skillId);
}

export function getSkillsBySubject(db: Database, subjectId: string): Promise<Skill[]> {
  return repo.getSkillsBySubject(db, subjectId);
}
