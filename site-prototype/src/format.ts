import { TZ } from './model';

export const fmtLong = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' }).format(d);
export const fmtDay = (d: Date) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ }).format(d);
export const fmtTime = (d: Date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' }).format(d);
export const fmtDow = (d: Date) => new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ }).format(d);
export const fmtDate = (d: Date) => new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: TZ }).format(d);
export const fmtMon = (d: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: TZ }).format(d);

/** Platform-agnostic link (#269): only used for a friendly hint, never required. */
export const linkHint = (url: string) => {
  try {
    const h = new URL(url).hostname;
    if (h.includes('zoom')) return 'Zoom';
    if (h.includes('youtu')) return 'YouTube';
    return h;
  } catch { return 'link'; }
};
