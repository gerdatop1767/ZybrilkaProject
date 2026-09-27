import type { Database } from '@zybrilka/db';
import type { CollectionPublic, VariantDetail, VariantPublic } from '@zybrilka/shared';
import { toPublicTask } from '../tasks/service.js';
import * as repo from './repo.js';

function toVariantPublic(row: repo.VariantWithCollection['variant']): VariantPublic {
  return {
    id: row.id,
    collectionId: row.collectionId,
    variantNumber: row.variantNumber,
    title: row.title,
    year: row.year,
  };
}

function toCollectionPublic(row: repo.VariantWithCollection['collection']): CollectionPublic {
  return {
    id: row.id,
    subjectId: row.subjectId,
    slug: row.slug,
    title: row.title,
    publisher: row.publisher,
    year: row.year,
    description: row.description,
  };
}

/**
 * The full ordered exam view (§18/§20): a published variant's
 * published tasks in exam order, each in the same never-leaks-the-
 * answer shape as every other public task listing. Undefined for a
 * missing, draft, archived, or needs_review-only variant — the route
 * maps that to a 404, same as any other not-found.
 */
export async function getVariantDetail(
  db: Database,
  id: string,
): Promise<VariantDetail | undefined> {
  const row = await repo.getPublishedVariantById(db, id);
  if (!row) return undefined;

  const taskRows = await repo.listVariantTasks(db, row.variant.id);
  return {
    variant: toVariantPublic(row.variant),
    collection: toCollectionPublic(row.collection),
    tasks: taskRows.map((t) => ({
      position: t.position,
      task: toPublicTask({ task: t.task, topicName: t.topicName }),
    })),
  };
}
