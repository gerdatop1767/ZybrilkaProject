import { randomUUID } from 'node:crypto';
import { canonicalSubjects, syncSubjects } from '@zybrilka/db';
import { createSeededTestDb, createTestDb } from '@zybrilka/db/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('learning profile (Phase 1 vertical slice — real onboarding persistence)', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createSeededTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('GET/PUT both require an x-anon-id header', async () => {
    const get = await app.inject({ method: 'GET', url: '/api/v1/me/learning-profile' });
    expect(get.statusCode).toBe(400);
    const put = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      payload: { subjects: [] },
    });
    expect(put.statusCode).toBe(400);
  });

  it('GET for a brand-new user returns an empty, not-completed profile', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ onboardingCompleted: false, subjects: [] });
  });

  it('PUT rejects an empty subject list (onboarding needs at least one subject)', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: { subjects: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('PUT rejects a subject missing selfReportedScore/targetScore', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: { subjects: [{ subjectId: 'math', targetScore: '80_plus' }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('PUT rejects a subjectId that does not exist', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [
          { subjectId: 'not_a_real_subject', selfReportedScore: 'unknown', targetScore: 'unknown' },
        ],
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_subject');
  });

  it('"unknown" self-reported score is a valid, accepted value (not an error)', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [{ subjectId: 'math', selfReportedScore: 'unknown', targetScore: '90_plus' }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().subjects).toEqual([
      { subjectId: 'math', selfReportedScore: 'unknown', targetScore: '90_plus' },
    ]);
  });

  it('PUT then GET round-trips multiple subjects and marks onboarding completed', async () => {
    const anonId = randomUUID();
    const put = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [
          { subjectId: 'math', selfReportedScore: '60_plus', targetScore: '80_plus' },
          { subjectId: 'russian', selfReportedScore: '70_plus', targetScore: '90_plus' },
        ],
      },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json().onboardingCompleted).toBe(true);

    const get = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
    });
    const body = get.json();
    expect(body.onboardingCompleted).toBe(true);
    expect(body.subjects).toHaveLength(2);
    expect(body.subjects).toEqual(
      expect.arrayContaining([
        { subjectId: 'math', selfReportedScore: '60_plus', targetScore: '80_plus' },
        { subjectId: 'russian', selfReportedScore: '70_plus', targetScore: '90_plus' },
      ]),
    );
  });

  it('target score and self-reported score are stored independently (never conflated)', async () => {
    const anonId = randomUUID();
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [{ subjectId: 'math', selfReportedScore: '40_plus', targetScore: '100' }],
      },
    });
    const get = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
    });
    const [subject] = get.json().subjects;
    expect(subject.selfReportedScore).toBe('40_plus');
    expect(subject.targetScore).toBe('100');
    expect(subject.selfReportedScore).not.toBe(subject.targetScore);
  });

  it('re-sending the same onboarding payload is idempotent (no duplicate rows, same result)', async () => {
    const anonId = randomUUID();
    const payload = {
      subjects: [{ subjectId: 'math', selfReportedScore: '50_plus', targetScore: '70_plus' }],
    };
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload,
    });
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload,
    });
    const get = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
    });
    expect(get.json().subjects).toHaveLength(1);
  });

  it('updating scores for an existing subject replaces the row rather than adding a new one', async () => {
    const anonId = randomUUID();
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [{ subjectId: 'math', selfReportedScore: 'unknown', targetScore: 'unknown' }],
      },
    });
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [{ subjectId: 'math', selfReportedScore: '90_plus', targetScore: '100' }],
      },
    });
    const get = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
    });
    expect(get.json().subjects).toEqual([
      { subjectId: 'math', selfReportedScore: '90_plus', targetScore: '100' },
    ]);
  });

  it('replacing the subject set removes subjects no longer selected (replace semantics, not merge)', async () => {
    const anonId = randomUUID();
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [
          { subjectId: 'math', selfReportedScore: 'unknown', targetScore: 'unknown' },
          { subjectId: 'russian', selfReportedScore: 'unknown', targetScore: 'unknown' },
          { subjectId: 'english', selfReportedScore: 'unknown', targetScore: 'unknown' },
        ],
      },
    });
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [
          { subjectId: 'math', selfReportedScore: 'unknown', targetScore: 'unknown' },
          { subjectId: 'russian', selfReportedScore: 'unknown', targetScore: 'unknown' },
          { subjectId: 'social', selfReportedScore: 'unknown', targetScore: 'unknown' },
        ],
      },
    });
    const get = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
    });
    const subjectIds = get
      .json()
      .subjects.map((s: { subjectId: string }) => s.subjectId)
      .sort();
    expect(subjectIds).toEqual(['math', 'russian', 'social']);
  });

  it('never mixes learning profiles between two different users', async () => {
    const userOne = randomUUID();
    const userTwo = randomUUID();

    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': userOne },
      payload: {
        subjects: [{ subjectId: 'math', selfReportedScore: '80_plus', targetScore: '100' }],
      },
    });

    const userTwoGet = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': userTwo },
    });
    expect(userTwoGet.json()).toEqual({ onboardingCompleted: false, subjects: [] });
  });

  it('request body cannot smuggle a user_id — profile is always scoped to the resolved anon header', async () => {
    const realUser = randomUUID();
    const victim = randomUUID();

    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': victim },
      payload: {
        subjects: [{ subjectId: 'math', selfReportedScore: 'unknown', targetScore: 'unknown' }],
      },
    });

    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': realUser },
      payload: {
        userId: victim,
        subjects: [{ subjectId: 'russian', selfReportedScore: 'unknown', targetScore: 'unknown' }],
      },
    });

    const victimProfile = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': victim },
    });
    const victimSubjectIds = victimProfile
      .json()
      .subjects.map((s: { subjectId: string }) => s.subjectId);
    expect(victimSubjectIds).toEqual(['math']);
    expect(victimSubjectIds).not.toContain('russian');
  });
});

describe('learning profile — production deploy pipeline regression (no full demo seed)', () => {
  /**
   * Production's real `docker compose up` never runs `seed()` (the
   * task-engine demo seed) — only `migrate` (schema) and, separately,
   * `sync-content`/`importEge2026Variant1.ts` (which only ever upserts
   * the single `'math'` subject row as a side effect of importing math
   * tasks). Every other test in this file uses `createSeededTestDb()`,
   * which calls the full `seed()` and so already has every canonical
   * subject — that's exactly why this gap reached production
   * undetected. This block builds a DB the same way `docker compose
   * up` actually does (migrations + the new `sync-subjects` one-shot
   * step only, no demo seed) to prove the real bug and its fix.
   */
  let testDb: Awaited<ReturnType<typeof createTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createTestDb();
    await syncSubjects(testDb.db);
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('every subject Onboarding can present (apps/web/src/data/subjects.ts) saves successfully', async () => {
    for (const subject of canonicalSubjects) {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/me/learning-profile',
        headers: { 'x-anon-id': randomUUID() },
        payload: {
          subjects: [
            { subjectId: subject.id, selfReportedScore: 'unknown', targetScore: 'unknown' },
          ],
        },
      });
      expect(res.statusCode, `subjectId "${subject.id}" must save`).toBe(200);
    }
  });

  it('a real multi-subject onboarding (math + russian, as every EGE student takes both) saves successfully', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': randomUUID() },
      payload: {
        subjects: [
          { subjectId: 'math', selfReportedScore: '60_plus', targetScore: '80_plus' },
          { subjectId: 'russian', selfReportedScore: '70_plus', targetScore: '90_plus' },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().onboardingCompleted).toBe(true);
  });
});
