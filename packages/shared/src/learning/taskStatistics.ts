/** `GET /tasks/:taskId/statistics` response — aggregated across all
 * users, never user-specific (see `calculateTaskDifficulty`). */
export interface TaskStatisticsEntry {
  readonly taskId: string;
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly incorrectAttempts: number;
  readonly accuracy: number | null;
  readonly difficulty: number | null;
  readonly confidence: number;
  readonly averageTimeMs: number | null;
  readonly lastAttemptAt: string | null;
}
