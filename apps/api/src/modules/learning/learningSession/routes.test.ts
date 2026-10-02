import { randomUUID } from 'node:crypto';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';

describe('learning session routes (ZUBRILKA LEARNING INTELLIGENCE Phase 9)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  describe('POST /me/learning/sessions', () => {
    it('requires an x-anon-id header', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('404s when no subject can be resolved (no profile, no explicit subjectId)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': randomUUID() },
        payload: {},
      });
      expect(res.statusCode).toBe(404);
    });

    it('starts a session with default limit 5', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': randomUUID() },
        payload: { subjectId: 'math' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('active');
      expect(body.total).toBe(5);
      expect(body.position).toBe(1);
      expect(body.subject).toBe('math');
      expect(body.task.id).toBeTruthy();
      expect('correctAnswer' in body.task).toBe(false);
    });

    it('respects an explicit limit within range', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': randomUUID() },
        payload: { subjectId: 'math', limit: 3 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().total).toBe(3);
    });

    it('400s for limit below the minimum', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': randomUUID() },
        payload: { subjectId: 'math', limit: 0 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('400s for limit above the maximum', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': randomUUID() },
        payload: { subjectId: 'math', limit: 11 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('404s for an explicit subjectId with no published tasks', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': randomUUID() },
        payload: { subjectId: '__nonexistent__' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('auto-resolves subject from the onboarded learning profile', async () => {
      const anonId = randomUUID();
      await app.inject({
        method: 'PUT',
        url: '/api/v1/me/learning-profile',
        headers: { 'x-anon-id': anonId },
        payload: {
          subjects: [{ subjectId: 'math', selfReportedScore: 'under_40', targetScore: '90_plus' }],
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': anonId },
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().subject).toBe('math');
    });
  });

  describe('GET /me/learning/sessions/:sessionId/next', () => {
    it('requires an x-anon-id header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${randomUUID()}/next`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('400s for a malformed sessionId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/me/learning/sessions/not-a-uuid/next',
        headers: { 'x-anon-id': randomUUID() },
      });
      expect(res.statusCode).toBe(400);
    });

    it('404s for an unknown sessionId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${randomUUID()}/next`,
        headers: { 'x-anon-id': randomUUID() },
      });
      expect(res.statusCode).toBe(404);
    });

    it('404s when the session belongs to a different anon user', async () => {
      const owner = randomUUID();
      const attacker = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': owner },
        payload: { subjectId: 'math' },
      });
      const sessionId = startRes.json().sessionId;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${sessionId}/next`,
        headers: { 'x-anon-id': attacker },
      });
      expect(res.statusCode).toBe(404);
    });

    it('advances through a full session end-to-end, including real attempts and completion', async () => {
      const anonId = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': anonId },
        payload: { subjectId: 'math', limit: 2 },
      });
      const started = startRes.json();
      expect(started.status).toBe('active');
      expect(started.position).toBe(1);

      // Submit a real answer through the EXISTING attempt endpoint —
      // the session never duplicates this write path.
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${started.task.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: '__wrong__' },
      });

      const secondRes = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}/next`,
        headers: { 'x-anon-id': anonId },
      });
      expect(secondRes.statusCode).toBe(200);
      const second = secondRes.json();
      expect(second.status).toBe('active');
      expect(second.position).toBe(2);
      expect(second.task.id).not.toBe(started.task.id);

      const thirdRes = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}/next`,
        headers: { 'x-anon-id': anonId },
      });
      expect(thirdRes.statusCode).toBe(200);
      const third = thirdRes.json();
      expect(third.status).toBe('completed');
      expect(third.position).toBe(2);
      expect(third.total).toBe(2);
      expect(third.summary.attempted).toBe(1);
      expect(third.summary.incorrect).toBe(1);
      expect(third.summary.correct).toBe(0);
    });

    it('is deterministic — repeated next calls on an already-completed session return the same summary', async () => {
      const anonId = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': anonId },
        payload: { subjectId: 'math', limit: 1 },
      });
      const started = startRes.json();

      const firstCompleted = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}/next`,
        headers: { 'x-anon-id': anonId },
      });
      const secondCompleted = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}/next`,
        headers: { 'x-anon-id': anonId },
      });
      expect(firstCompleted.json()).toEqual(secondCompleted.json());
    });

    it('exposes no mutation endpoint for sessions other than start/next (no DELETE/PUT)', async () => {
      const anonId = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': anonId },
        payload: { subjectId: 'math' },
      });
      const sessionId = startRes.json().sessionId;

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/me/learning/sessions/${sessionId}`,
        headers: { 'x-anon-id': anonId },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /me/learning/sessions/:sessionId (Phase 10 — refresh recovery)', () => {
    it('requires an x-anon-id header', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${randomUUID()}`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('400s for a malformed sessionId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/me/learning/sessions/not-a-uuid',
        headers: { 'x-anon-id': randomUUID() },
      });
      expect(res.statusCode).toBe(400);
    });

    it('404s for an unknown sessionId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${randomUUID()}`,
        headers: { 'x-anon-id': randomUUID() },
      });
      expect(res.statusCode).toBe(404);
    });

    it('404s when the session belongs to a different anon user', async () => {
      const owner = randomUUID();
      const attacker = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': owner },
        payload: { subjectId: 'math' },
      });
      const sessionId = startRes.json().sessionId;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${sessionId}`,
        headers: { 'x-anon-id': attacker },
      });
      expect(res.statusCode).toBe(404);
    });

    it('recovers the current task without advancing the session (refresh-safe)', async () => {
      const anonId = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': anonId },
        payload: { subjectId: 'math', limit: 5 },
      });
      const started = startRes.json();

      const snapshotRes = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}`,
        headers: { 'x-anon-id': anonId },
      });
      expect(snapshotRes.statusCode).toBe(200);
      const snapshot = snapshotRes.json();
      expect(snapshot.status).toBe('active');
      expect(snapshot.position).toBe(1);
      expect(snapshot.task.id).toBe(started.task.id);
      // Never re-runs scoring on a plain recovery read.
      expect(snapshot.recommendation).toBeUndefined();

      // A second recovery read must still show the SAME position —
      // this endpoint must never consume a task slot on its own.
      const snapshotAgainRes = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}`,
        headers: { 'x-anon-id': anonId },
      });
      expect(snapshotAgainRes.json().position).toBe(1);
    });

    it('returns the real completed summary once the session has finished', async () => {
      const anonId = randomUUID();
      const startRes = await app.inject({
        method: 'POST',
        url: '/api/v1/me/learning/sessions',
        headers: { 'x-anon-id': anonId },
        payload: { subjectId: 'math', limit: 1 },
      });
      const started = startRes.json();

      await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}/next`,
        headers: { 'x-anon-id': anonId },
      });

      const snapshotRes = await app.inject({
        method: 'GET',
        url: `/api/v1/me/learning/sessions/${started.sessionId}`,
        headers: { 'x-anon-id': anonId },
      });
      expect(snapshotRes.statusCode).toBe(200);
      expect(snapshotRes.json().status).toBe('completed');
      expect(snapshotRes.json().summary).toBeDefined();
    });
  });
});
