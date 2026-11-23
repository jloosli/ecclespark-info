# Keeping time-based visibility correct under EmDash route caching

- **Date:** 2026-11-22
- **Ticket:** [#275](https://github.com/jloosli/ecclespark-info/issues/275), part of map [#267](https://github.com/jloosli/ecclespark-info/issues/267)
- **Question:** The page shows or hides content by the clock: a Broadcast switches from Upcoming to Past at `starts_at` and drops off 6 days later, and an Announcement disappears after `show_until` ([#270](https://github.com/jloosli/ecclespark-info/issues/270)). Does EmDash's route caching on Cloudflare keep those results correct, and what is the recommended pattern?
- **Method:** I read the EmDash docs and source at commit `bbe73ed` (2026-11-22) of [emdash-cms/emdash](https://github.com/emdash-cms/emdash), its issue tracker, the Astro caching guide, and the Cloudflare Workers Cache and pricing docs. **[Judgment]** marks my opinion.

---

## TL;DR

- **Route caching is opt-in, and the `cloudflare:starter` template leaves it off.** Its `astro.config.mjs` has no `cache.provider` and no `routeRules`. Every `Astro.cache.set()` call in the template sits behind `if (Astro.cache?.enabled)`, so with no provider nothing is cached and every page view renders in the Worker against the current clock.
- **If it were turned on, nothing purges the cache when time passes.** A cached home page stays stale for up to `maxAge` plus one `swr` window. Purging from cron, the obvious fix, **does not work on Cloudflare today**: a purge from `scheduled()` returns `success: true` but evicts nothing (open bugs [cloudflare/developer-platform#163](https://github.com/cloudflare/developer-platform/issues/163) and [emdash-cms/emdash#4957](https://github.com/emdash-cms/emdash/issues/4957)). The same bug also leaves pages stale after EmDash's own scheduled publishes.
- **Cost:** Cache hits are billed as Worker requests anyway and save only CPU. At this site's traffic, rendering every view stays far inside Workers Paid's 30 million included CPU ms a month.
- **Recommendation [Judgment]:** **Don't enable route caching.** Keep the starter's default, decide visibility and the Upcoming/Past label on the server per request, and send `Cache-Control: no-cache` (or `no-store`) for browsers. Optionally add a tiny script that flips the label for a tab left open across `starts_at`. If caching is ever wanted, use a short TTL on `/` computed per request so it never outlives the next clock transition (pattern below). Don't use cron purges.

---

## 1. How long can a cached public page go stale?

**With the starter as shipped: never, because nothing is cached.**

- The starter's `astro.config.mjs` sets `output: "server"`, `adapter: cloudflare()` and the EmDash integration, with no `cache` key and no `routeRules` (`templates/starter-cloudflare/astro.config.mjs`). Its pages and `Base.astro` only call `Astro.cache.set(cacheHint)` inside `if (Astro.cache?.enabled)` (`templates/starter-cloudflare/src/pages/index.astro:14`, `src/layouts/Base.astro:24-26`).
- Route caching needs a provider: "Route caching needs a cache provider" ... on Cloudflare `cacheCloudflare()`, and "the `@astrojs/cloudflare` adapter enables the Workers Cache automatically" only "when a cache provider is configured" ([Route caching](https://docs.emdashcms.com/deployment/route-caching/); [Cloudflare deployment: Workers Cache](https://docs.emdashcms.com/deployment/cloudflare/#workers-cache)).

**If route caching were enabled with `cacheCloudflare()`:**

- Publishes made from the admin purge the collection and entry tags within seconds: "publishing, unpublishing, deleting, or restoring an entry ... invalidate the tags `[collection, id]`" ([Route caching: invalidation on publish](https://docs.emdashcms.com/deployment/route-caching/#invalidation-on-publish-is-built-in)).
- **Nothing purges on the passage of time.** A page rendered at 09:59 with a Broadcast labelled "Upcoming" for 10:00 keeps that label until the entry expires. The docs: "`maxAge` also bounds how long a page can stay stale, plus one stale response while `swr` revalidates it." The docs' example rule (`maxAge: 86_400, swr: 604_800`) would show a Broadcast as Upcoming for up to a day after it starts, and keep an expired Announcement up for up to a day.
- **Default lifetime trap:** if a provider is configured but `/` has no rule, the layout's settings/menu hints still make the page cacheable, and "Workers Cache falls back to its default cache lifetimes (2 hours for a `200` response)" ([Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/#workers-cache)).
- **Scheduled publishing is also stale under caching.** The cron sweep calls `provider.invalidate({ tags })` after publishing (`packages/cloudflare/src/worker.ts`, `invalidatePublishedTags`), but "Workers Cache purges from cron have been reported to leave cached pages unchanged even when the Workers Cache API returns `{ success: true }`" ([Route caching: provider differences](https://docs.emdashcms.com/deployment/route-caching/#cloudflare-with-cachecloudflare)). The reporter measured 5 of 5 scheduled publishes left pages stale, while 10 of 10 purges from `fetch` worked ([emdash#4957](https://github.com/emdash-cms/emdash/issues/4957); minimal non-EmDash repro in [cloudflare/developer-platform#163](https://github.com/cloudflare/developer-platform/issues/163), open since 2026-11-19). That matters because [#270](https://github.com/jloosli/ecclespark-info/issues/270) keeps scheduled publishing on so Editors can prepare next week's Broadcast.
- **Purges can also be dropped.** Workers Cache purges always use Free-plan limits, "5 requests per minute with a burst of 25, per account", whatever the plan, and "a rate-limited purge fails without an error in the admin" ([Route caching: purge rate limits](https://docs.emdashcms.com/deployment/route-caching/#purge-rate-limits); [Workers Cache purge](https://developers.cloudflare.com/workers/cache/purge/)).
- **Browsers are a separate cache.** "Browser caching is separate ... browser caches are not invalidated"; set `Cache-Control` yourself with `no-cache` or a short lifetime ([Route caching: browser caching](https://docs.emdashcms.com/deployment/route-caching/#browser-caching-is-separate)). This applies whether or not route caching is on.

## 2. Options evaluated

| Option | Correct at the transition? | Notes |
|---|---|---|
| **A. No route caching (starter default)** | Yes, every view renders with the current clock | Nothing to configure. Admin publishes, unpublishes and scheduled publishes all show on the next view, so the cron purge bug doesn't apply. |
| **B. Short TTL on `/`** | Stale for up to `maxAge` + `swr` | A fixed TTL like 60 s means the label flips up to about a minute late. Better: compute `maxAge` per request as the seconds until the next transition (below), capped at a few minutes to also bound stale scheduled publishes. |
| **C. Purge from the every-minute job** | **No, not today** | Purges from `scheduled()` report success but evict nothing ([developer-platform#163](https://github.com/cloudflare/developer-platform/issues/163)). It would also need custom code in `src/worker.ts` and uses the 5-per-minute purge budget shared with Editor saves. |
| **D. Clock check in the browser** | Yes, if JS runs and the visitor's clock is right | The HTML must carry entries that may already be expired (an "expired" Announcement stays in the page source). It fails without JS and with a wrong device clock. Fine as a cosmetic layer on top of A or B, not as the source of truth. |

**Per-request TTL pattern, if caching is ever enabled (option B).** Astro lets route code override the rule's `maxAge`: "Per-route `cache.set()` calls merge with config-level route rules", with scalar values like `maxAge` "last-write-wins" ([Astro caching guide](https://docs.astro.build/en/guides/caching/)). So the home page can do:

```ts
// after loading broadcasts + announcements and filtering them by `now` (all times in epoch ms)
const transitions = [
  ...broadcasts.flatMap((b) => [b.starts_at, b.starts_at + SIX_DAYS_MS]),
  ...announcements.flatMap((a) => (a.show_until ? [a.show_until] : [])),
].filter((t) => t > now);
const untilNext = transitions.length ? Math.ceil((Math.min(...transitions) - now) / 1000) : 300;
if (Astro.cache?.enabled) {
  Astro.cache.set(cacheHint); // tags: broadcasts / announcements
  Astro.cache.set({ maxAge: Math.max(0, Math.min(untilNext, 300)), swr: 0 });
}
```

Keep `swr: 0` (or very small) on this route: `swr` serves one stale response after expiry, which is exactly the wrong page at a transition. Give `/` an explicit route rule so the 2-hour default never applies, and set `toolbar: "client"` as the docs recommend for cached sites. **[Judgment]** This is sound but is extra code to test for little gain at this site's traffic.

## 3. Cost on Workers Paid

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers Cache](https://developers.cloudflare.com/workers/cache/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

- **Requests:** Paid includes 10 million requests a month, then $0.30 per million. "Requests served from the Worker's cache are billed at the same per-request rate as requests that invoke the Worker." **Caching saves no request charges.**
- **CPU:** Paid includes 30 million CPU ms a month, then $0.02 per million. "CPU time is only billed when the Worker runs (on a cache miss or bypass)," so caching only saves CPU.
- **How much CPU an uncached view costs:** one EmDash site measured `GET /` (SSR) at a median of 15 ms and a max of 58 ms, and all GETs at p50 7 ms / p90 47 ms ([emdash#4218](https://github.com/emdash-cms/emdash/issues/4218)). **[Judgment]** Even at 100,000 page views a month, about 20x what a ward-meetings page plausibly gets, that is about 2 million CPU ms, under 7% of the included 30 million. Option A costs **$0 beyond the $5 base**.
- **D1:** Paid includes 25 billion rows read a month. A home page that reads a handful of Broadcasts and Announcements is negligible.
- **Option C:** The template's every-minute cron already exists ([#268](https://github.com/jloosli/ecclespark-info/issues/268)): about 43,200 invocations a month and about 34 ms each. Adding a purge adds no meaningful cost, but it doesn't work (above).
- **Option D:** No server cost; a few hundred bytes of JS.

## 4. Recommendation [Judgment]

1. **Ship without route caching.** Don't add `cacheCloudflare()` or `routeRules`. The home page reads Broadcasts and Announcements and filters and labels them with `new Date()` on every request:
   - Broadcast shown while `now < starts_at + 6 days`; label "Upcoming" if `now < starts_at`, else "Past".
   - Announcement shown while `show_until` is unset or `now < show_until`.

   Do the filtering in the page (or in the query, if EmDash's filter supports date comparisons), not in anything cached across requests. EmDash's object cache (KV) is also opt-in and the starter doesn't enable it ([Cloudflare deployment: object cache](https://docs.emdashcms.com/deployment/cloudflare/#object-cache)). Even if it were enabled, it caches query results, not the clock comparison done in the page.
2. **Set browser caching explicitly** on the home page: `Astro.response.headers.set("Cache-Control", "no-cache")`, so a returning visitor's browser revalidates.
3. **Optional:** a small inline script that re-checks `starts_at` against the browser clock and flips Upcoming to Past for a tab left open. The server stays the source of truth.
4. **Revisit only if traffic or latency demands it.** Then use the per-request TTL pattern (section 2B), capped at a few minutes, and keep checking [developer-platform#163](https://github.com/cloudflare/developer-platform/issues/163) before relying on cron purges.

## Open questions / unverified

- Whether EmDash's collection query `where` filter supports `datetime` comparisons (`starts_at > now - 6 days`), or whether the page must filter after fetching. Either is correct for this ticket; it's a build detail.
- The time zone used to display Broadcast times is a separate open item on the map ("Timezone display of Broadcast times"). The visibility comparisons above use absolute instants and don't depend on it.
