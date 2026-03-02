import { Timestamp } from 'firebase/firestore';

export interface Stream {
  id?: string;
  title: string;
  scheduled_at: Timestamp;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  stream_id?: string;
  youtube_id?: string;
  created_at?: Timestamp;
}
