import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health.js';

describe('healthResponseSchema', () => {
  it('accepts a valid response', () => {
    const value = { status: 'ok', version: '0.0.0', uptimeSeconds: 1.5, db: 'ok' };
    expect(healthResponseSchema.parse(value)).toEqual(value);
  });

  it('rejects an unknown db status', () => {
    const result = healthResponseSchema.safeParse({
      status: 'ok',
      version: '0.0.0',
      uptimeSeconds: 0,
      db: 'maybe',
    });
    expect(result.success).toBe(false);
  });
});
