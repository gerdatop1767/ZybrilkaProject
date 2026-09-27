import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { migrationsFolder } from './migrate.js';
import { seed } from './seed.js';
import { importVariant1 } from './importEge2026Variant1.js';
import * as schema from './schema.js';

// In-memory Postgres (PGlite) with all migrations applied. Tests only.
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return { db, close: () => client.close() };
}

// Same, plus the demo task-engine seed — for API/web tests that need
// real tasks to exist rather than asserting against an empty catalog.
export async function createSeededTestDb() {
  const testDb = await createTestDb();
  await seed(testDb.db);
  return testDb;
}

// Same, plus the real EGE-2026 Вариант 1 import — for tests that need
// real imported tasks (with provenance/needs_review rows) to exist.
export async function createImportedTestDb() {
  const testDb = await createTestDb();
  await seed(testDb.db);
  await importVariant1(testDb.db);
  return testDb;
}
