import { createDb } from '@zybrilka/db';
import { getDistinctAttemptUserIds } from '../modules/learning/errorSignatures/repo.js';
import { rebuildUserErrorStatistics } from '../modules/learning/errorSignatures/service.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const { db, close } = createDb(databaseUrl);
try {
  const userIds = await getDistinctAttemptUserIds(db);
  let totalSignaturesRecorded = 0;
  for (const userId of userIds) {
    const { signaturesRecorded } = await rebuildUserErrorStatistics(db, userId);
    totalSignaturesRecorded += signaturesRecorded;
  }
  console.log(
    `Rebuilt error statistics for ${userIds.length} user(s), ${totalSignaturesRecorded} signature occurrence(s) total.`,
  );
} finally {
  await close();
}
