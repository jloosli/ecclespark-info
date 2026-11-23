# What the EmDash starter provides for head, icons and crawlers

- **Date:** 2026-11-23
- **Ticket:** [#281](https://github.com/jloosli/ecclespark-info/issues/281), part of the map [#267](https://github.com/jloosli/ecclespark-info/issues/267)
- **Question:** What does the `starter-cloudflare` template already provide for the page `<head>` (title, description, Open Graph), favicons, `robots.txt` and `site.webmanifest`? What must be ported from this repo's `src/assets/` and `src/index.html`? Does EmDash expose `/_emdash/` admin routes to crawlers, and should `robots.txt` disallow them?
- **Method:** I read the EmDash monorepo at commit [`23a23ad`](https://github.com/emdash-cms/emdash/commit/23a23add888bb3138f18f5b466ae00993e5ed726) (2026-11-23, `emdash` core 1.6.0): the `templates/starter-cloudflare` template, the core package source, and the docs source. I also read Google Search Central and Cloudflare Workers docs, and this repo's files. Statements labelled **[Judgment]** are my opinion. Statements labelled **[Unverified]** are inferences I did not test on a running site.

---

## Short answer

| Item | Starter / EmDash provides | Port from this repo? |
|---|---|---|
| `<title>` | Yes. `Base.astro` renders `{title} — {siteTitle}`, with the site title from **Settings > General** | No. Set the site title (seed default is "My Site") |
| Meta description | Yes, from the page's `description` prop, falling back to the site tagline | No. Set the tagline (seed default is "Built with EmDash") |
| Open Graph / Twitter tags, JSON-LD | Yes. `<EmDashHead>` emits `og:type`, `og:title`, `og:description`, `og:site_name`, `twitter:card`, a `WebSite` JSON-LD graph, and `og:image` if one is set | Nothing to port; the current site has none |
| `<link rel="icon">` | One tag, only if a favicon is uploaded in **Settings > General**. It points at `/_emdash/api/media/file/...` | **Yes**: ship the static files instead (see below) |
| `apple-touch-icon`, extra PNG sizes | No | **Yes** |
| `site.webmanifest` | No | **Yes** |
| `robots.txt` | Yes, generated at `/robots.txt`, editable in **Settings > SEO** | Only the *policy* (today's file blocks everything); not the file |
| `/sitemap.xml` | Yes | Nothing to port |
| Hiding `/_emdash/` from crawlers | Yes. The default `robots.txt` has `Disallow: /_emdash/` | Keep the default; no change needed |

**[Judgment] Recommendation:** put the existing favicon PNG/ICO/SVG files, `apple-touch-icon.png`, the Android icons and `site.webmanifest` in the new site's `public/` directory unchanged. Add their `<link>` tags to `src/layouts/Base.astro` after `<EmDashHead>`. Leave the favicon in **Settings > General** empty. Keep EmDash's generated `robots.txt`, and settle the indexing policy as its own decision (see "Open question" below).

---

## 1. What this repo has today

From `src/index.html`, `src/assets/` and `angular.json`:

- `<title>EcclesPark</title>`. There is **no** meta description and **no** Open Graph or Twitter tags.
- Icon links: `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/favicon-32x32.png`, `/favicon-16x16.png`, and `<link rel="manifest" href="/site.webmanifest">`.
- `src/assets/favicon/` also holds `android-chrome-192x192.png` and `android-chrome-512x512.png`. `site.webmanifest` references them, with name "Eccles Park", short_name "Eccles", white theme and background colours, and `display: standalone`.
- `angular.json` copies the favicon folder, `robots.txt` and `site.webmanifest` to the site root.
- `src/assets/robots.txt` is:
  ```txt
  User-agent: *
  Disallow: /
  ```
  It has been this way since commit `47a0f18` ("Added robots.txt", 2020-10-29). **The site currently asks every crawler to stay away.**

## 2. What the starter's `<head>` renders

`templates/starter-cloudflare/src/layouts/Base.astro` ([source](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/templates/starter-cloudflare/src/layouts/Base.astro)) renders `<meta charset>`, `<meta viewport>`, `<title>` and `<EmDashHead page={pageCtx} />`. It builds the page context with `createPublicPageContext()` from the site settings:

- **Title:** `fullTitle` is `"{title} — {siteTitle}"`, or just `title` when that already equals or ends with the site title. `siteTitle` comes from the site settings and falls back to "My Site" ([`src/utils/site-identity.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/templates/starter-cloudflare/src/utils/site-identity.ts)). `<EmDashHead>` does not render `<title>` itself ([SEO guide](https://docs.emdashcms.com/guides/seo/)).
- **Description:** the page's `description` prop, otherwise the site tagline (default "Built with EmDash"). The seed sets `settings: { title: "My Site", tagline: "Built with EmDash" }` ([`seed/seed.json`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/templates/starter-cloudflare/seed/seed.json)), so **the seed or the setup wizard must set a real title and tagline**, or those placeholders go out as the meta description and `og:site_name`.

`<EmDashHead>` ([`EmDashHead.astro`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/components/EmDashHead.astro), [`seo-contributions.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/page/seo-contributions.ts)) emits:

- `<meta name="description">` when a description exists.
- `og:type` (`website`), `og:title`, `og:description`, `og:site_name`, and `og:url` plus `<link rel="canonical">` **only when a canonical URL is passed**. The starter passes `canonical` as an optional prop that the home page does not set.
- `og:image` / `twitter:image` from the page's `image`, else **Settings > SEO > Default Social Image**. `twitter:card` is `summary_large_image` with an image and `summary` without one.
- A `WebSite` JSON-LD graph when `siteName` is set (it is, in the starter).
- `google-site-verification` / `msvalidate.01` from **Settings > SEO** when those are filled in.
- `<meta name="robots" content="noindex, nofollow">` on every page **while the site is in staging** (section 5).
- One `<link rel="icon">` from the site-settings favicon (section 3).

**[Judgment]** This is a strict improvement on today's head, which has no description or social tags. The only port is the title text ("EcclesPark" or "Eccles Park") and a one-line tagline, set as site settings rather than in code.

## 3. Favicons and icons

EmDash's favicon support is a single setting. [`page/site-identity.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/page/site-identity.ts) emits **only** `<link rel="icon" href="…" type="…">` from the media item chosen in **Settings > General**. Its own comment says `apple-touch-icon`, `theme-color` and `application-name` "need their own configurable fields in `SiteSettings` before they ship". There is nothing for a manifest. The starter has **no `public/` directory** and no icon files of its own.

The uploaded favicon is served from the media route, `/_emdash/api/media/file/{storageKey}` ([`settings/index.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/settings/index.ts)), unless R2 has a public custom domain (`publicUrl`). **That path is under `/_emdash/`, which EmDash's default `robots.txt` disallows** (section 4). Google's favicon guidelines say "Googlebot-Image must be able to crawl the favicon file. These URLs must not be blocked from crawling by a robots.txt file" ([Google: favicon in search](https://developers.google.com/search/docs/appearance/favicon-in-search)). Google also does not list SVG as a supported favicon format.

**So port the icons as static files**:

1. Copy `src/assets/favicon/*` and `src/assets/site.webmanifest` into `site/public/`. Astro copies `public/` to the build output unchanged, and Workers static assets are served from the site root. By default Cloudflare "checks for a matching asset first" before invoking the Worker ([Workers static assets routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)).
2. Add the five `<link>` tags from today's `src/index.html` (icon ×4, apple-touch-icon, manifest) to `Base.astro`'s `<head>`.
3. Leave the Settings favicon unset, so `<EmDashHead>` doesn't add a second `rel="icon"` pointing at a crawler-blocked URL. If someone sets it later, browsers tolerate the duplicate (EmDash 0.9 changelog, [#847](https://github.com/emdash-cms/emdash/pull/847)).

The admin panel's favicon falls back to the Settings favicon, then the EmDash mark ([#1505](https://github.com/emdash-cms/emdash/pull/1505)). With the Settings favicon unset, Editors see the EmDash mark in the admin tab. That is cosmetic. `admin.favicon: "/favicon.svg"` in the `emdash()` integration options would brand it if wanted ([configuration reference](https://docs.emdashcms.com/reference/configuration/)).

The same robots issue applies to a **Default Social Image** uploaded through the media library. **[Unverified]** whether social scrapers such as Slack or Facebook honour `Disallow: /_emdash/` for `og:image` fetches. If an `og:image` is wanted, a static file in `public/` passed as an absolute URL in the layout's `image` prop avoids the question. The current site has no `og:image`, so this is optional.

## 4. `robots.txt` and the `/_emdash/` routes

EmDash injects `/robots.txt` ([`astro/routes/robots.txt.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/astro/routes/robots.txt.ts)). The default is:

```txt
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /_emdash/

Sitemap: https://<site URL>/sitemap.xml
```

- **Settings > SEO > robots.txt** replaces this text. EmDash appends a `Sitemap:` line if the custom text has none. **Disallow AI training** adds a block for AI crawlers. The response is `Cache-Control: public, max-age=86400`, or `no-store` while in staging ([SEO guide](https://docs.emdashcms.com/guides/seo/#robotstxt)).
- A file at `src/pages/robots.txt.ts` (or `.js` etc.) stops EmDash injecting its route (`hasUserDefinedPublicRoute` in [`integration/routes.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/astro/integration/routes.ts)). The check only looks in `src/pages/`. **[Unverified]** A `public/robots.txt` would not stop the injection, but Cloudflare would serve the static file first, so the Settings field would silently do nothing. **[Judgment]** Don't copy `robots.txt` into `public/`.
- `/sitemap.xml` and `/sitemap-{collection}.xml` are also generated, for SEO-enabled routable collections.

**Are `/_emdash/` routes exposed to crawlers?** They are publicly reachable URLs. The admin shell at `/_emdash/admin/[...path]` and every `/_emdash/api/*` route are injected into the public Worker ([`routes.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/astro/integration/routes.ts)). However:

- The default `robots.txt` already disallows `/_emdash/`.
- The admin shell is a client-rendered SPA that sends `Cache-Control: private, no-store` ([`admin.astro`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/astro/routes/admin.astro)). It renders no content without a sign-in. It sets **no** `noindex` meta tag and no `X-Robots-Tag` header (I found neither in the source).
- Unauthenticated `/_emdash/api/*` requests return `401` ([emdash#1326](https://github.com/emdash-cms/emdash/issues/1326), finding 3).

**Answer:** yes, `robots.txt` should disallow `/_emdash/`, and EmDash's default already does, so there's nothing to add. `robots.txt` is not access control: the admin is protected by sign-in, not by crawler rules. The cutover plan already covers the one real exposure, the unprotected setup wizard before Admin is claimed ([#273](https://github.com/jloosli/ecclespark-info/issues/273)). The trade-off of the `/_emdash/` disallow is that media-library images (favicon, social image) become uncrawlable, which section 3 works around.

## 5. Staging hides the new site from search engines until "Go live"

"A site created with the setup wizard starts in staging." While in staging, `<EmDashHead>` puts `noindex, nofollow` on every page, overriding everything else. `robots.txt` keeps its normal content so crawlers can see the tag. An Admin ends staging with **Settings > General > Site Status > Go live** ([SEO guide](https://docs.emdashcms.com/guides/seo/#hide-a-site-until-it-goes-live), [`EmDashHead.astro`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/components/EmDashHead.astro)).

This matters for the cutover: **after the Monday deploy, the new site is `noindex` until someone presses Go live.** Add that as an explicit cutover step, or skip it on purpose (next section).

## Open question for the owner: should the new site be indexed at all?

Today's `robots.txt` is `Disallow: /`. EmDash's default is to allow everything except `/_emdash/` and to publish a sitemap. Porting the files verbatim is not the choice to make; the *policy* is. There are three options:

1. **Indexed (EmDash default).** Keep the generated `robots.txt` and press Go live. Google can show the site and its favicon.
2. **Not indexed, the robust way.** Leave the site in staging permanently (`noindex, nofollow` on every page), keep the default `robots.txt` so crawlers can see that tag. The admin keeps showing a "Staging" badge. **[Judgment]** This is a better match for "don't list us" than `Disallow: /`, because Google says a page blocked by `robots.txt` can still be indexed from links, while `noindex` removes it.
3. **Keep today's behaviour literally.** Set **Settings > SEO > robots.txt** to `User-agent: *` / `Disallow: /`. EmDash will append a `Sitemap:` line. Weaker than option 2, for the reason above.

**[Judgment]** Since Broadcast links are public join URLs (#269), the owner may prefer options 2 or 3 to keep the link out of search results. Either way it's a one-click setting, not code.

## What to port: checklist

- [ ] `site/public/`: `favicon.ico`, `favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `site.webmanifest` (unchanged).
- [ ] `site/src/layouts/Base.astro`: the five icon/manifest `<link>` tags from today's `src/index.html`.
- [ ] Seed or setup: site title (e.g. "Eccles Park") and a real tagline, used as the meta description and `og:site_name`.
- [ ] Don't port `robots.txt` as a file. Decide the indexing policy (section above) and apply it in Settings or via staging.
- [ ] Cutover step: press **Go live**, or deliberately don't.
- [ ] Optional: `admin.favicon` in `astro.config.mjs` to brand the admin tab, and a static `og:image`.
- [ ] Drop: `<base href="/">` and the Angular `<body class=…>` / `<app-root>`. They are Angular artefacts with no meaning in Astro.

## Sources

- EmDash repo at [`23a23ad`](https://github.com/emdash-cms/emdash/tree/23a23add888bb3138f18f5b466ae00993e5ed726): `templates/starter-cloudflare/*`, `packages/core/src/components/EmDashHead.astro`, `packages/core/src/page/{seo-contributions,site-identity}.ts`, `packages/core/src/astro/routes/{robots.txt.ts,admin.astro}`, `packages/core/src/astro/integration/routes.ts`, `packages/core/src/settings/index.ts`
- EmDash docs: [Built-in SEO features](https://docs.emdashcms.com/guides/seo/), [Site settings](https://docs.emdashcms.com/guides/site-settings/), [Configuration reference](https://docs.emdashcms.com/reference/configuration/)
- EmDash issues/PRs: [#847](https://github.com/emdash-cms/emdash/pull/847) (centralised favicon), [#1505](https://github.com/emdash-cms/emdash/pull/1505) (admin favicon fallback), [#1326](https://github.com/emdash-cms/emdash/issues/1326) (API returns 401)
- Google: [Define a favicon to show in search results](https://developers.google.com/search/docs/appearance/favicon-in-search), [robots.txt intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- Cloudflare: [Workers static assets: Worker script routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- This repo: `src/index.html`, `src/assets/`, `angular.json`, commit `47a0f18`
