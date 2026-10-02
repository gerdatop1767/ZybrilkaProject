import { createDb } from '@zybrilka/db';
import { syncSkillsFromCanonicalSolutions } from '../modules/skills/sync.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const { db, close } = createDb(databaseUrl);
try {
  const result = await syncSkillsFromCanonicalSolutions(db);
  console.log(
    `Skills sync: ${result.skillsCreated} skill(s) created, ${result.linksCreated} task_skill link(s) created.`,
  );
} finally {
  await close();
}
