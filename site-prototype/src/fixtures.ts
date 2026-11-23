// PROTOTYPE — in-memory fixtures, placed relative to "now" so they always look current.
import type { Announcement, Broadcast } from './model';

const H = 60 * 60 * 1000;
const D = 24 * H;

/** Next Sunday 10:00 America/Denver (approximated as 17:00 UTC). */
function nextSunday(now: Date): Date {
  const d = new Date(now);
  d.setUTCHours(17, 0, 0, 0);
  const add = (7 - d.getUTCDay()) % 7;
  d.setTime(d.getTime() + add * D);
  if (d.getTime() + 2 * H < now.getTime()) d.setTime(d.getTime() + 7 * D);
  return d;
}

export const SCENARIOS = ['typical', 'empty', 'announcement-only', 'busy', 'filtered', 'during-meeting'] as const;
export type Scenario = (typeof SCENARIOS)[number];

export function fixtures(scenario: Scenario, now: Date): { broadcasts: Broadcast[]; announcements: Announcement[] } {
  const sun = nextSunday(now);
  const lastSun = new Date(sun.getTime() - 7 * D);
  const zoom = 'https://us02web.zoom.us/j/81234567890?pwd=PROTOTYPE';
  const yt = 'https://youtube.com/live/PROTOTYPE123';

  const weekly = (start: Date, link = zoom): Broadcast => ({
    id: 'b-' + start.toISOString(), title: 'Sacrament Meeting', starts_at: start, link, status: 'published',
  });

  const ann1: Announcement = {
    id: 'a1', title: 'Ward Christmas party', status: 'published', published_at: new Date(now.getTime() - 2 * D),
    show_until: new Date(now.getTime() + 12 * D),
    bodyHtml: '<p><strong>Ward Christmas party</strong> — Saturday, December 12 at 6:00 pm in the cultural hall. Bring a side dish to share.</p>',
  };
  const ann2: Announcement = {
    id: 'a2', title: 'Building cleaning', status: 'published', published_at: new Date(now.getTime() - 5 * D),
    bodyHtml: '<p>Building cleaning sign-ups are open. <a href="#">Sign up here</a>.</p>',
  };
  const annLong: Announcement = {
    id: 'a3', title: 'Stake conference', status: 'published', published_at: new Date(now.getTime() - 1 * D),
    bodyHtml: '<p><strong>Stake conference</strong> replaces our regular meeting in two weeks.</p><ul><li>Saturday adult session at 7:00 pm</li><li>Sunday general session at 10:00 am</li></ul><p>Both sessions will be broadcast; links will appear below once they are posted.</p>',
  };

  switch (scenario) {
    case 'typical':
      return { broadcasts: [weekly(lastSun, yt), weekly(sun)], announcements: [ann1, ann2] };
    case 'empty':
      return { broadcasts: [], announcements: [] };
    case 'announcement-only':
      return { broadcasts: [], announcements: [ann1] };
    case 'busy':
      return {
        broadcasts: [
          weekly(lastSun, yt),
          weekly(sun),
          { id: 'b-devo', title: 'Christmas Devotional (stake broadcast)', starts_at: new Date(sun.getTime() + 4 * D + 2 * H), link: yt, status: 'published' },
          weekly(new Date(sun.getTime() + 7 * D)),
        ],
        announcements: [annLong, ann1, ann2],
      };
    case 'filtered':
      return {
        broadcasts: [
          weekly(new Date(lastSun.getTime() - 7 * D), yt), // > 6 days past: hidden
          weekly(sun),
          { ...weekly(new Date(sun.getTime() + 7 * D)), id: 'b-draft', status: 'draft' }, // draft: hidden
          { ...weekly(new Date(sun.getTime() + 14 * D)), id: 'b-sched', status: 'scheduled', publish_at: new Date(now.getTime() + 3 * D) },
        ],
        announcements: [
          { ...ann1, id: 'a-exp', show_until: new Date(now.getTime() - H) }, // expired
          ann2,
        ],
      };
    case 'during-meeting': {
      // starts 20 minutes before "now": label already says Past (no Live state, #270)
      const s = new Date(now.getTime() - 20 * 60 * 1000);
      return { broadcasts: [weekly(s), weekly(new Date(s.getTime() + 7 * D))], announcements: [ann2] };
    }
  }
}
