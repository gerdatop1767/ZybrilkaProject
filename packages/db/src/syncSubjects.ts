import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Database } from './client.js';
import { canonicalSubjects } from './canonicalSubjects.js';
import { isMainModule } from './isMainModule.js';
import * as schema from './schema.js';

/**
 * Upserts the canonical `subjects` rows (see `canonicalSubjects.ts`) —
 * idempotent and safe to run unconditionally on a live database with
 * real users: it only ever inserts-or-updates a row by its stable `id`,
 * never touches `tasks`/`attempts`/`user_subject_profiles`.
 *
 * Exists as its own one-shot deploy step (wired into
 * `infra/docker-compose.yml` the same way as `migrate`/`sync-content`)
 * because `apps/api/src/modules/learningProfile/routes.ts`'s PUT
 * handler rejects any `subjectId` that isn't already a row here with
 * `400 unknown_subject` — and before this existed, only `migrate`
 * (schema) and `sync-content`/`importEge2026Variant1.ts` (which only
 * ever upserts the single `'math'` row) ran on every deploy. A
 * production database that was never seeded with the full subject list
 * only had `'math'`, so Onboarding's "какие предметы сдаёшь?" step
 * accepted any of Web's other subject chips (`русский`,
 * `английский`, ...) in the UI, then failed to save with a generic
 * "Не удалось сохранить профиль" the moment the user picked one of
 * them — see `apps/api/src/modules/learningProfile/routes.test.ts`'s
 * "production without a full subject seed" test for the exact
 * reproduction.
 */
export async function syncSubjects(db: Database) {
  for (const subject of canonicalSubjects) {
    await db
      .insert(schema.subjects)
      .values(subject)
      .onConflictDoUpdate({ target: schema.subjects.id, set: { name: subject.name } });
  }
  return { subjectCount: canonicalSubjects.length };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  const client = postgres(databaseUrl, { max: 1 });
  try {
    const db = drizzle(client, { schema });
    const result = await syncSubjects(db);
    console.log(`Synced ${result.subjectCount} canonical subjects.`);
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
