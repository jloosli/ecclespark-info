// PROTOTYPE — mirrors the content model decided in #270.
export interface Broadcast {
  id: string;
  title: string;
  starts_at: Date;
  link: string;
  status: 'published' | 'draft' | 'scheduled'; // EmDash lifecycle (subset)
  publish_at?: Date; // for status 'scheduled'
}

export interface Announcement {
  id: string;
  title: string; // internal only, never rendered (admin list label)
  bodyHtml: string; // stand-in for portableText
  published_at: Date;
  show_until?: Date;
  status: 'published' | 'draft' | 'scheduled';
  publish_at?: Date;
}

export const TZ = 'America/Denver';
