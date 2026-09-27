import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { and, asc, eq } from 'drizzle-orm';

export interface VariantWithCollection {
  variant: typeof schema.variants.$inferSelect;
  collection: typeof schema.collections.$inferSelect;
}

/**
 * Only ever matches a *published* variant inside a *published*
 * collection — an archived/draft one is indistinguishable from a
 * missing id, so §19's "only published reaches a normal user" is
 * enforced here, not left to the caller to remember.
 */
export async function getPublishedVariantById(
  db: Database,
  id: string,
): Promise<VariantWithCollection | undefined> {
  const [row] = await db
    .select({ variant: schema.variants, collection: schema.collections })
    .from(schema.variants)
    .innerJoin(schema.collections, eq(schema.variants.collectionId, schema.collections.id))
    .where(
      and(
        eq(schema.variants.id, id),
        eq(schema.variants.status, 'published'),
        eq(schema.collections.status, 'published'),
      ),
    );
  return row;
}

export interface VariantTaskRow {
  position: number;
  task: typeof schema.tasks.$inferSelect;
  topicName: string | null;
}

/** Ordered by `position` — the exam's own order, never shuffled. Excludes
 * any task that isn't (or is no longer) `published`, so a task pulled
 * back to draft/needs_review silently drops out of the variant instead
 * of leaking. */
export async function listVariantTasks(db: Database, variantId: string): Promise<VariantTaskRow[]> {
  return db
    .select({
      position: schema.variantTasks.position,
      task: schema.tasks,
      topicName: schema.topics.name,
    })
    .from(schema.variantTasks)
    .innerJoin(schema.tasks, eq(schema.variantTasks.taskId, schema.tasks.id))
    .leftJoin(schema.topics, eq(schema.tasks.topicId, schema.topics.id))
    .where(and(eq(schema.variantTasks.variantId, variantId), eq(schema.tasks.status, 'published')))
    .orderBy(asc(schema.variantTasks.position));
}
