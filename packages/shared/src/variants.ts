import { z } from 'zod';
import { taskPublicSchema } from './tasks.js';

/**
 * A collection (e.g. "ЕГЭ 2026 Ященко") and its variants — the S3.2
 * membership layer above `tasks` (docs/PRODUCTION_DATA_MODEL.md). Never
 * carries the tasks themselves; see `variantDetailSchema` for that.
 */
export const collectionPublicSchema = z.object({
  id: z.uuid(),
  subjectId: z.string(),
  slug: z.string(),
  title: z.string(),
  publisher: z.string().nullable(),
  year: z.number().int().nullable(),
  description: z.string().nullable(),
});
export type CollectionPublic = z.infer<typeof collectionPublicSchema>;

export const variantPublicSchema = z.object({
  id: z.uuid(),
  collectionId: z.uuid(),
  variantNumber: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
});
export type VariantPublic = z.infer<typeof variantPublicSchema>;

/** One task's slot inside a full variant — `position` is the exam's own
 * order (1..N) and is never reshuffled; see checkAnswer's caller for
 * where shuffle applies instead (practice/random queries only). */
export const variantTaskItemSchema = z.object({
  position: z.number().int().positive(),
  task: taskPublicSchema,
});
export type VariantTaskItem = z.infer<typeof variantTaskItemSchema>;

/** GET /api/v1/variants/:id response — the full ordered exam. Only
 * published variants/collections/tasks ever reach this shape; anything
 * else is a 404, enforced server-side, never left to the client. */
export const variantDetailSchema = z.object({
  variant: variantPublicSchema,
  collection: collectionPublicSchema,
  tasks: z.array(variantTaskItemSchema),
});
export type VariantDetail = z.infer<typeof variantDetailSchema>;
