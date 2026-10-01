import type { Database } from '@zybrilka/db';
import type { LearningProfileResponse, SaveLearningProfileRequest } from '@zybrilka/shared';
import * as repo from './repo.js';

export async function getLearningProfile(
  db: Database,
  userId: string,
): Promise<LearningProfileResponse> {
  const [subjects, onboardingCompleted] = await Promise.all([
    repo.getSubjectProfiles(db, userId),
    repo.isOnboardingCompleted(db, userId),
  ]);
  return { onboardingCompleted, subjects };
}

export async function saveLearningProfile(
  db: Database,
  userId: string,
  request: SaveLearningProfileRequest,
): Promise<LearningProfileResponse> {
  await repo.replaceSubjectProfiles(db, userId, request);
  return getLearningProfile(db, userId);
}
