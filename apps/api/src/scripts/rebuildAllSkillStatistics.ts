import { createDb, schema } from '@zybrilka/db';
import { rebuildUserSkillStatistics } from '../modules/learning/service.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const { db, close } = createDb(databaseUrl);
try {
  const rows = await db.selectDistinct({ userId: schema.attempts.userId }).from(schema.attempts);
  let totalSkillsUpdated = 0;
  for (const row of rows) {
    const { skillsUpdated } = await rebuildUserSkillStatistics(db, row.userId);
    totalSkillsUpdated += skillsUpdated;
  }
  console.log(`Rebuilt skill statistics for ${rows.length} user(s), ${totalSkillsUpdated} skill row(s) total.`);
} finally {
  await close();
}
