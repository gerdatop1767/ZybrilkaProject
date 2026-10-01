/** `GET /tasks/:taskId/similar` response row — aggregated metadata
 * similarity, never user-specific. */
export interface SimilarTaskEntry {
  readonly taskId: string;
  readonly taskNumber: number;
  /** 0..100 — see `calculateTaskSimilarity`. */
  readonly score: number;
}
