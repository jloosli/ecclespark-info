// PROTOTYPE — the #270 rules, decided on the server for each request (#275).
import type { Announcement, Broadcast } from './model';

const DAY = 24 * 60 * 60 * 1000;

export type Shown<T> = { item: T; shown: true; label?: 'Upcoming' | 'Past' };
export type Hidden<T> = { item: T; shown: false; reason: string };

function isLive(status: string, publish_at: Date | undefined, now: Date): string | null {
  if (status === 'draft') return 'draft';
  if (status === 'scheduled' && publish_at && publish_at > now) return 'scheduled for ' + publish_at.toISOString();
  return null;
}

export function evaluateBroadcasts(all: Broadcast[], now: Date) {
  const results: (Shown<Broadcast> | Hidden<Broadcast>)[] = all.map((b) => {
    const notLive = isLive(b.status, b.publish_at, now);
    if (notLive) return { item: b, shown: false, reason: notLive };
    if (now.getTime() > b.starts_at.getTime() + 6 * DAY) return { item: b, shown: false, reason: 'more than 6 days after starts_at' };
    return { item: b, shown: true, label: now < b.starts_at ? 'Upcoming' : 'Past' };
  });
  const visible = results
    .filter((r): r is Shown<Broadcast> => r.shown)
    .sort((a, b) => a.item.starts_at.getTime() - b.item.starts_at.getTime()); // soonest first
  return { visible, results };
}

export function evaluateAnnouncements(all: Announcement[], now: Date) {
  const results: (Shown<Announcement> | Hidden<Announcement>)[] = all.map((a) => {
    const notLive = isLive(a.status, a.publish_at, now);
    if (notLive) return { item: a, shown: false, reason: notLive };
    if (a.show_until && now > a.show_until) return { item: a, shown: false, reason: 'past show_until' };
    return { item: a, shown: true };
  });
  const visible = results
    .filter((r): r is Shown<Announcement> => r.shown)
    .sort((a, b) => b.item.published_at.getTime() - a.item.published_at.getTime()); // newest first
  return { visible, results };
}
