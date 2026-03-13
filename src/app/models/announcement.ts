import { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id?: string;
  markdown_text: string;
  active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
