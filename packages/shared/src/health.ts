import { z } from 'zod';

export const dbStatusSchema = z.enum(['ok', 'down', 'not_configured']);
export type DbStatus = z.infer<typeof dbStatusSchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  db: dbStatusSchema,
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
