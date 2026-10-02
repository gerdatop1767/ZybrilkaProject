import { createDb } from '@zybrilka/db';
import { rebuildTaskStatistics } from '../modules/learning/taskStatistics/service.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const { db, close } = createDb(databaseUrl);
try {
  const { tasksUpdated } = await rebuildTaskStatistics(db);
  console.log(`Rebuilt task statistics for ${tasksUpdated} task(s).`);
} finally {
  await close();
}
