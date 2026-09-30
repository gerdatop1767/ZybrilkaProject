import { describe, expect, it } from 'vitest';
import { formatDateLong, formatDateShort } from './formatDate.js';

describe('formatDate (canvas/QA v2 block — real API sends full ISO datetimes, not bare dates)', () => {
  it('formatDateShort handles a bare date (legacy/mock shape)', () => {
    expect(formatDateShort('2026-09-25')).toBe('25 сен 2026');
  });

  it('formatDateShort handles a full ISO datetime — the real /api/v1/mistakes createdAt shape', () => {
    expect(formatDateShort('2026-09-25T14:30:00.000Z')).toBe('25 сен 2026');
  });

  it('formatDateLong handles a bare date', () => {
    expect(formatDateLong('2026-09-24')).toBe('24 сентября');
  });

  it('formatDateLong handles a full ISO datetime without producing "NaN undefined"', () => {
    const result = formatDateLong('2026-09-24T09:15:42.123Z');
    expect(result).toBe('24 сентября');
    expect(result).not.toContain('NaN');
    expect(result).not.toContain('undefined');
  });
});
