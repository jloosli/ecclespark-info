/** Request payload for the createBroadcast callable function. */
export interface CreateBroadcastRequest {
  title: string;
  /** ISO 8601 date-time string. */
  scheduledStartTime: string;
}

/** Response from the createBroadcast callable function. */
export interface CreateBroadcastResponse {
  youtubeId: string;
  /** ISO 8601 date-time string. */
  scheduledStartTime: string;
  /** ISO 8601 date-time string. */
  publishedAt: string;
  watchUrl: string;
  firestoreId: string;
}
