import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { asc, eq } from 'drizzle-orm';

export type CollectionRow = typeof schema.collections.$inferSelect;
export type VariantRow = typeof schema.variants.$inferSelect;

export interface CollectionWithVariants {
  collection: CollectionRow;
  variants: VariantRow[];
}

/** Small, unpaginated on purpose — the number of collections is tiny
 * compared to tasks, and a "Сборник" picker needs the whole list at
 * once. Only ever published collections/variants, same gate as every
 * other public listing. */
export async function listPublishedCollectionsWithVariants(
  db: Database,
): Promise<CollectionWithVariants[]> {
  const collections = await db
    .select()
    .from(schema.collections)
    .where(eq(schema.collections.status, 'published'))
    .orderBy(asc(schema.collections.title));

  const variants = await db
    .select()
    .from(schema.variants)
    .where(eq(schema.variants.status, 'published'))
    .orderBy(asc(schema.variants.variantNumber));

  return collections.map((collection) => ({
    collection,
    variants: variants.filter((v) => v.collectionId === collection.id),
  }));
}
