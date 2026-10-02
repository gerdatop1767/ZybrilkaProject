/** `GET /me/learning/errors` response row — current user's own error
 * profile only, never another user's. */
export interface UserErrorStatisticEntry {
  readonly errorSignature: string;
  readonly count: number;
  readonly lastOccurredAt: string | null;
}
