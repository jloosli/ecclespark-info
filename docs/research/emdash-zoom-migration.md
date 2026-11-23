# Moving ecclespark.info to EmDash with Zoom links: research and plan

- **Date:** 2026-11-22
- **Question (from the owner):** "Evolve this into an emDash project (https://emdashcms.com/), mainly so 1-2 other people can update content as needed. We'll likely go away from an automated YouTube setup and switch to video links coming from Zoom. Is that a good route to go? How would I do it?"
- **Method:** I read the repo (source files are cited by path) and first-party docs: EmDash docs and GitHub, the Cloudflare docs and blog, Zoom Support and Zoom Developer docs, Firebase docs, and each alternative's own docs or pricing page. Statements labelled **[Judgment]** are my opinion. Statements labelled **[Unverified]** are things I could not confirm from a first-party source.

---

## TL;DR / recommendation

**Yes, EmDash is a reasonable route, with caveats.** If you choose it, run it on **Cloudflare Workers** and treat it as a **rewrite**, not an evolution of the Angular code. If the only goal is "let 1-2 people edit a list of meetings," there is a cheaper option (Option A below), and you should weigh it honestly.

Why EmDash fits:
- **Editor experience.** It has a real admin UI with form-based editing, drafts, scheduled publishing, revisions, trash, and edit locking ([admin panel](https://docs.emdashcms.com/concepts/admin-panel/), [content lifecycle](https://docs.emdashcms.com/reference/content-lifecycle/)).
- **Accounts.** Editors sign in with passkeys, magic links, or Google/GitHub/Microsoft OAuth, and there are built-in **Editor/Author/Contributor** roles ([authentication](https://docs.emdashcms.com/guides/authentication/)). Adding 1-2 editors means sending an invite link.
- **Content model.** You can define a "Meeting" type with `datetime`, `url`, `select` and `string` fields from the admin UI, without code ([field types](https://docs.emdashcms.com/reference/field-types/), [collections](https://docs.emdashcms.com/concepts/collections/)).
- **Cost.** It is MIT-licensed ([repo](https://github.com/emdash-cms/emdash)), and the project says it "can be deployed for free to Cloudflare" ([1.0 post](https://emdashcms.com/blog/emdash-1-0)).
- **DNS.** Your domain's DNS is **already on Cloudflare**. `dig NS ecclespark.info` returns `rose.ns.cloudflare.com` and `will.ns.cloudflare.com`, checked 2026-11-22. A Workers custom domain requires "an active Cloudflare zone" ([custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)), so you meet that requirement.
- **Less to maintain.** Switching to Zoom links removes the reason for most of the current custom code: the YouTube OAuth, three Cloud Functions, the Secret Manager secrets, and the Firebase Blaze plan.

Main risks:
1. **Young project.** The repo was created on 2026-04-01 and launched as a "v0.1.0 preview" / "early developer beta" ([Cloudflare blog](https://blog.cloudflare.com/emdash-wordpress/)). It reached **1.0 on 2026-09-28**, and **1.5.0 shipped on 2026-11-11** (GitHub releases API). That is five minor releases (1.1 through 1.5) in about six weeks. The project has about 14.6k stars, 30 contributors, and 274 open issues (40 labelled `bug`), with commits landing daily (GitHub API, 2026-11-22). First-party plugins are still 0.x ([README](https://github.com/emdash-cms/emdash)). **[Judgment]** The project is actively maintained, but expect to keep up with upgrades.
2. **It's a rewrite.** EmDash requires **Astro 6+** and server output ([existing project](https://docs.emdashcms.com/existing-project/), [architecture](https://docs.emdashcms.com/concepts/architecture/)). None of the Angular components carry over. The page design and Tailwind classes can be reused by hand.
3. **It cannot run on Firebase Hosting (static).** "An EmDash site needs server rendering because the admin, API routes, and current content are served at runtime" ([architecture](https://docs.emdashcms.com/concepts/architecture/)). Hosting therefore moves to Cloudflare, or to a Node server with a persistent disk or Postgres.
4. **You run the operations.** The EmDash docs say "the team is responsible for the database, media storage, backups, upgrades" ([why EmDash](https://docs.emdashcms.com/why-emdash/)). For a site this small that work is light, but it doesn't disappear.
5. **Zoom join links are the bigger risk.** Posting a join link on a public website is what Zoom names as the cause of disruptions: "Disruptions typically occur when meeting information is made open to the public" ([Zoom security guide](https://www.zoom.com/en/products/virtual-meetings/resources/securing-your-meetings/)). Plan a Waiting Room and passcode, or publish a livestream or recording link instead (see the Zoom section below).

**[Judgment]** How to decide:
- Choose **EmDash** if you want a proper CMS that non-technical people can use for meetings, announcements, and possibly a few pages, and you're comfortable moving to Astro and Cloudflare.
- Choose **Option A** (keep Angular and Firestore, delete the YouTube code, add a small editor page) if you want the least change. Option A requires fixing the currently broken Angular dependency state first. `package.json` has `@angular/build ^22.2.4` next to Angular 20 core, and `@angular/common`/`platform-server` are on 21. You also keep writing your own editor UI.
- I would **not** pick a Git-based CMS (Decap or Sveltia) for these editors, because every editor needs a GitHub account with write access to the repo.

---

## 1. What the site is today (from the repo)

| Piece | What it does | Source |
|---|---|---|
| Angular 20 SPA + SSG, Tailwind v4 | Home page shows announcements and broadcasts | `package.json`, `src/app/app.routes.ts`, `src/app/components/home/home.ts` |
| Firestore `streams` | `{title, scheduled_at, status: SCHEDULED/BROADCAST/ARCHIVED, youtube_id, created_by}`. The public list queries `status in [SCHEDULED, BROADCAST]` ordered by `scheduled_at desc` | `src/app/models/stream.ts`, `src/app/services/streams.service.ts` |
| Firestore `announcements` | `{markdown_text, active, created_at, updated_at}`, rendered with `marked`. The repo has **no write path** for these. **[Unverified]** They are probably edited in the Firebase console or FireCMS: `firestore.rules` has a catch-all rule for `request.auth.token.fireCMSUser` | `src/app/models/announcement.ts`, `firestore.rules` |
| `/setup` page | Google sign-in, then calls the Cloud Functions below | `src/app/components/setup/**`, `src/app/services/functions.service.ts` |
| `functions/`: `createBroadcast` (callable) | Checks the caller's email against the `allowed_users` collection, creates a YouTube live broadcast with the **channel owner's stored refresh token**, binds it to a fixed stream, and writes a `streams` doc | `functions/src/index.ts`, `functions/src/youtube.ts` |
| `functions/`: `deleteBroadcast` (callable) | Uses the same allowlist. Deletes the YouTube broadcast and the Firestore doc (SCHEDULED only) | `functions/src/index.ts` |
| `functions/`: `manageStreamStatuses` (scheduled daily at 11:00 America/Denver) | Moves SCHEDULED to BROADCAST when YouTube reports the stream live or complete. Deletes SCHEDULED docs more than 24h old, along with their YouTube broadcast. Archives BROADCAST docs at least 6 days old | `functions/src/index.ts` |
| Secrets | `YOUTUBE_OWNER_REFRESH_TOKEN`, `YOUTUBE_CLIENT_ID/SECRET`, `YOUTUBE_STREAM_ID` in Firebase Secret Manager. The token is obtained once with `functions/scripts/get-owner-token.ts` | `functions/src/index.ts`, `functions/scripts/get-owner-token.ts` |
| CI/CD | `angular.yml` on push to main runs tests and the build, deploys Hosting, then deploys Functions. `angular-preview.yml` deploys PR previews. `dependabot-auto-merge.yml` | `.github/workflows/*` |
| Firebase plan | Cloud Functions are only available on Blaze ([Firebase pricing](https://firebase.google.com/pricing)), so the project must be on **Blaze** today | — |

With Zoom replacing YouTube automation, all of the `functions/` directory, the `/setup` page, the YouTube secrets, and the `allowed_users` allowlist become unnecessary.

---

## 2. EmDash

### What it is
- **Built by:** Cloudflare. It was announced on the Cloudflare Blog on **2026-04-01** by Matt "TK" Taylor and Matt Kane as "a full-stack serverless JavaScript CMS built on Astro 6.0" and was then "v0.1.0 preview" ([Cloudflare blog](https://blog.cloudflare.com/emdash-wordpress/)).
- **License:** MIT, chosen over GPL ([1.0 post](https://emdashcms.com/blog/emdash-1-0), [repo](https://github.com/emdash-cms/emdash)).
- **Maturity:** 1.0 was published **2026-09-28** and called "stable" and "proven in production" ([1.0 post](https://emdashcms.com/blog/emdash-1-0)). The README says it is "stable and ready for production." Core packages follow semver, but first-party plugins and plugin tooling are still 0.x ([README](https://github.com/emdash-cms/emdash)). The latest release is `emdash@1.5.0` (2026-11-11). Before 1.0 there were roughly 40 0.x minor releases between June and September 2026 (GitHub releases API).
- **Activity (GitHub API, 2026-11-22):** about 14,556 stars, 30 contributors, 274 open issues, last push the same day.
- **Positioning:** "the spiritual successor to WordPress." It includes a WordPress importer and an MCP server, REST API, and CLI ([emdashcms.com](https://emdashcms.com/), [1.0 post](https://emdashcms.com/blog/emdash-1-0)).

### Architecture and hosting
- It is an Astro integration: the admin panel and the public site are **one Astro app, deployed together** ([introduction](https://docs.emdashcms.com/introduction/), [why EmDash](https://docs.emdashcms.com/why-emdash/)). The admin lives at `/_emdash/admin` ([Cloudflare deploy](https://docs.emdashcms.com/deployment/cloudflare/)).
- It needs SSR (`output: "server"`). You can prerender individual pages, but "a prerendered page ... cannot show later edits until another build" ([architecture](https://docs.emdashcms.com/concepts/architecture/)). **It cannot be deployed as static files to Firebase Hosting.**
- **On Cloudflare:** D1 holds content, R2 holds media, and KV holds sessions and cache. A **Cron Trigger** runs scheduled publishing and maintenance (the templates run it every minute). The Worker Loader / sandbox is needed **only** for marketplace or sandboxed plugins ([Cloudflare deploy](https://docs.emdashcms.com/deployment/cloudflare/)).
- **On Node:** SQLite, libSQL, or PostgreSQL, with local disk or S3 media. It is a long-running server: "Keep at least one Node.js process running continuously in production" ([Node deploy](https://docs.emdashcms.com/deployment/nodejs/)). SQLite "requires a persistent filesystem" and "does not work on platforms with ephemeral storage without additional configuration" ([database options](https://docs.emdashcms.com/deployment/database/)). **[Judgment]** That rules out SQLite on Cloud Run or Firebase. Staying on Google would mean Cloud SQL or a hosted libSQL, which is more cost and complexity than Cloudflare.
- **Firebase App Hosting** lists preconfigured support only for Next.js and Angular, not Astro ([App Hosting frameworks](https://firebase.google.com/docs/app-hosting/frameworks-tooling)). **[Judgment]** Don't try to keep EmDash on Firebase.
- **Caching:** the route cache tags pages by content and purges them on publish. "Pages can stay cached for days while a publish usually becomes visible within seconds." Caveat from the docs: "scheduled publishing may leave cached pages stale on Node and Cloudflare" ([route caching](https://docs.emdashcms.com/deployment/route-caching/)).

### Editors, auth, roles
- **Sign-in:** passkeys are the default. Magic links work only if an email provider is configured. GitHub, Google, and Microsoft OAuth are built in, and Cloudflare Access is an alternative mode ([authentication](https://docs.emdashcms.com/guides/authentication/)).
- **Roles:** Subscriber, Contributor (drafts need approval), Author (publishes own content), Editor (manages all content), and Admin. "The first user is always created as Admin." **For your 1-2 helpers, use Editor**, or Author if they should only touch their own entries ([authentication](https://docs.emdashcms.com/guides/authentication/)).
- **Invites:** Admin goes to Invite User. Without an email provider, you copy the invite link and send it yourself. "Invite links are single-use and expire after 7 days" ([authentication](https://docs.emdashcms.com/guides/authentication/), [email](https://docs.emdashcms.com/guides/email/)). Email can come from SMTP or Cloudflare Email Sending ([email](https://docs.emdashcms.com/guides/email/)).
- **Editor UI:** form fields generated from the content type, save as draft, publish, schedule, edit locks, and trash with undo ([admin panel](https://docs.emdashcms.com/concepts/admin-panel/)).

### Content modeling and scheduling
- Admins create collections and fields under **Content Types** at runtime. Drafts, revisions, preview, and search can be toggled per collection, and "Scheduling is enabled by default" ([collections](https://docs.emdashcms.com/concepts/collections/)).
- There are 17 field types. The relevant ones here are `string`, `text`, `url` (rejects `javascript:`/`data:`), `datetime` (stored as UTC), `select`, `boolean`, and `portableText` ([field types](https://docs.emdashcms.com/reference/field-types/)). **An "event/meeting" type is straightforward.**
- Lifecycle: draft, scheduled, published, unpublished, trash, and revisions ([content lifecycle](https://docs.emdashcms.com/reference/content-lifecycle/)).
- The schema and content can be exported as a seed file (`emdash export-seed`) and applied with `emdash seed`. Content can be created from the CLI (`emdash content create <collection> --file`) or with `POST /_emdash/api/content/{collection}` using a bearer token ([CLI](https://docs.emdashcms.com/reference/cli/), [seed files](https://docs.emdashcms.com/themes/seed-files/), [REST API](https://docs.emdashcms.com/reference/rest-api/)).
- Caution: "Deleting a collection removes the collection and all of its entries" ([why EmDash](https://docs.emdashcms.com/why-emdash/)).

### Plugins
- There are two plugin formats. Native plugins run with the host app's access. Standard-format plugins can run sandboxed, in a Dynamic Worker on Cloudflare or `workerd` on Node. Plugins can add hooks, settings, API routes, admin pages, and widgets ([introduction](https://docs.emdashcms.com/introduction/), [README](https://github.com/emdash-cms/emdash)).
- "it will be a long time before EmDash is anywhere close" to WordPress's plugin ecosystem ([1.0 post](https://emdashcms.com/blog/emdash-1-0)). This site doesn't need any plugins.

### Cost (Cloudflare)
| Item | Free plan | Source |
|---|---|---|
| Workers requests | 100,000/day; **10 ms CPU per request** | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Cron Triggers | 5 per account | [limits](https://developers.cloudflare.com/workers/platform/limits/) |
| D1 | 5M rows read/day, 100k rows written/day, 5 GB | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| R2 | 10 GB-month, 1M Class A ops, 10M Class B ops, free egress | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |
| Workers Paid | $5/month minimum, 30M CPU-ms included, 5 min max CPU per request | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Backups | D1 Time Travel keeps 7 days on Free, 30 on Paid | [backups](https://docs.emdashcms.com/guides/backups/) |

**[Unverified / Judgment]** I found no EmDash doc stating that the Workers **Free** plan's 10 ms CPU limit is enough for SSR plus the admin UI. Route caching should keep public pages cheap. Budget **$5/month for Workers Paid** in case admin requests hit the CPU limit.

---

## 3. Zoom options

| Option | What visitors get | Plan needed | Link stability | Automatable? |
|---|---|---|---|---|
| **(a) Publish the meeting join link** | Join the live meeting (can participate) | Free (Basic) works, but meetings are capped at **40 minutes**. Pro allows 30 hours ([zoom.us/pricing](https://zoom.us/pricing)) | Use a **recurring meeting with "No Fixed Time"** to get a permanent link ([Zoom KB0074318](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0074318)). Schedule it in the web portal, because the desktop client removed the option in 5.14.5 ([Zoom KB0065228](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065228)). **[Unverified]** The common "recurring IDs expire after 365 days without use" rule appears only on Zoom's community forum and university pages, not in an official KB I could find | Not needed: paste the link once and reuse it |
| **(b) Share cloud recordings afterward** | Watch a replay | Cloud recording needs **Pro, Business, Education or Enterprise**. Pro includes 10 GB per license ([Zoom KB0067670](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067670)). Pro costs $16.99/user/mo monthly or $14.16 annually ([zoom.us/pricing](https://zoom.us/pricing)) | Each recording gets its own share link. Options include "Everyone with the recording link," a passcode (can be embedded), an **optional expiry date**, and download on or off. "A new, unique cloud recording link is generated when the shared users or groups are changed" ([Zoom KB0067567](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067567)). An account-level **auto-delete after N days** setting would break old links ([Zoom KB0065362](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065362)) | Yes, with a `recording.completed` webhook (below). Manual paste is simpler |
| **(c) Zoom livestream to YouTube or custom RTMP** | Watch live on YouTube, view only (about a 20 s delay) | Pro or higher, licensed host, admin enables "Allow livestreaming of meetings" ([Zoom KB0062284](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0062284)). Custom RTMP can be preconfigured on a scheduled meeting ([Zoom KB0064210](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0064210)) | The host starts it with **More > Live on YouTube** and picks Public/Unlisted/Private each time ([KB0062284](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0062284)). **[Unverified]** Whether each session yields a new YouTube watch URL; I did not check YouTube's docs | The link would come from YouTube, not Zoom |

### Security of publishing join links
- Zoom: "Disruptions typically occur when meeting information is made open to the public." Zoom recommends a random Meeting ID (not your PMI) with a passcode shared only with intended attendees, a Waiting Room, sign-in-only entry, locking the meeting after it starts, and removing or suspending participants ([Zoom security guide](https://www.zoom.com/en/products/virtual-meetings/resources/securing-your-meetings/)).
- Every meeting must have at least one security option, and on single-license and Pro accounts this "is automatically required." "If no security option is enabled, Zoom will automatically secure all meetings with Waiting Room" ([Zoom KB0059862](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059862)).
- **[Judgment]** If the passcode is embedded in a link on a public website (`?pwd=`), it no longer protects anything; anyone who can read the page can get in. Choose one of these:
  1. **Waiting Room always on** (a host admits people). This is the safest option if you publish the join link.
  2. Put the join link behind something light, such as "email us for the link."
  3. Publish only the **YouTube livestream** (option c) and recordings publicly, and share the Zoom join link privately with participants.

### Automation vs. manual paste
- Zoom webhooks require a Zoom Marketplace app with Event Subscriptions enabled. The endpoint must be public HTTPS and must answer a CRC challenge (HMAC-SHA256 with the secret token) **within 3 seconds**. Zoom revalidates every 72 hours, and you verify each request with the `x-zm-signature` header. Failed deliveries are retried 3 times, and after six failed revalidations Zoom disables the subscription ([Zoom webhooks](https://developers.zoom.us/docs/api/webhooks/)).
- `recording.completed` fires when a cloud recording is ready, and its payload includes a share URL and download URLs. The `download_token` expires after 24 hours ([Zoom developer blog](https://developers.zoom.us/blog/meeting-api-querying-tips-part4/)). I could not see the event's full schema in the [Meetings webhooks reference](https://developers.zoom.us/docs/api/meetings/events/) through automated fetch **[Unverified]**.
- **[Judgment]** For a few meetings a month, **manual paste wins**. With a permanent recurring join link, editors only need to set the date and title. Recording links take about 30 seconds to paste. A webhook would need an EmDash plugin API route or a separate Worker, a Zoom app, and secret management. That is the same kind of custom machinery you're trying to get rid of. Revisit if volume grows.

---

## 4. Alternatives compared

| | **EmDash on Cloudflare** | **A. Keep Angular + Firestore, add editor page** | **B. Git-based CMS (Decap / Sveltia)** | **C. Hosted headless CMS (e.g. Sanity)** |
|---|---|---|---|---|
| Editor UX | Full admin: drafts, scheduling, roles, passkey or Google login ([auth](https://docs.emdashcms.com/guides/authentication/)) | Whatever you build. Google sign-in and an allowlist already exist (`allowed_users` in `functions/src/index.ts`). Custom claims checked in rules are the standard pattern ([Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)) | Decent form UI, but **every editor needs GitHub write access** ([Decap GitHub](https://decapcms.org/docs/github-backend/), [Sveltia GitHub](https://sveltiacms.app/en/docs/backends/github)). Edits redeploy the site | Polished Studio. The free plan has up to 20 seats but only Administrator and Viewer roles ([Sanity pricing](https://www.sanity.io/pricing)) |
| Ops burden | One Worker plus D1/R2, EmDash upgrades, backups | Low, but you maintain Angular, which is currently broken (see TL;DR) | Very low (static) plus an OAuth proxy Worker | Very low on the CMS side; you still need a frontend |
| Cost | $0, or $5/mo Workers Paid ([pricing](https://developers.cloudflare.com/workers/platform/pricing/)) | Can drop to **Spark ($0)** once Functions are deleted; Spark Firestore gives 50k reads/day ([Firebase pricing](https://firebase.google.com/pricing)) | $0 | $0 on the free plan; Growth is $15/seat/mo ([Sanity pricing](https://www.sanity.io/pricing)) |
| Migration effort | **High**: rewrite in Astro, new hosting | **Low to medium**: delete the YouTube code, add one form page, fix dependencies | Medium: new static site generator plus content as files | Medium: rewrite data access in Angular, or a new frontend |
| Longevity / maturity risk | **Medium**: about 8 months old, 1.0 two months ago, fast churn; backed by Cloudflare | Low: Firebase is mature; the risk is your own code | Decap is long-lived; Sveltia is newer. Both are MIT | Low (commercial vendor), but vendor lock-in and free-plan limits |

Other options I considered:
- **TinaCMS:** free for 2 users, then $24/project/mo ([Tina pricing](https://tina.io/pricing)). It is Git-backed, which has the same drawbacks as option B.
- **FireCMS Cloud:** €9.99/user/mo after a one-month trial. The self-hosted community edition is MIT ([FireCMS pricing](https://firecms.co/pricing)). FireCMS is notable because `firestore.rules` already has a FireCMS rule. It could give editors a generic admin over the existing Firestore with almost no app changes **[Judgment]**.

**[Judgment]** Scores for this site (1-2 editors, a list of meetings with links, a few announcements):
- **Least effort:** Option A, or A plus FireCMS for the editor UI.
- **Best editor experience per dollar, with a future-proof CMS:** EmDash.
- **Avoid:** Git-based CMSs, for editors who don't use GitHub.

---

## 5. Migration plan (if you choose EmDash)

### Phase 0: Decide the Zoom model first
1. In the Zoom web portal, create **one recurring "No Fixed Time" meeting** with Waiting Room on ([KB0074318](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0074318), [KB0059862](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059862)). Decide whether the join link is public or private (see the security section above).
2. If you want recordings or YouTube livestreams, get Zoom **Pro** ([zoom.us/pricing](https://zoom.us/pricing)). Check that **cloud recording auto-delete** is off, or long enough that published links don't break ([KB0065362](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065362)).

### Phase 1: Scaffold in a new worktree or repo
3. Create the site from an EmDash Cloudflare template (`npm create emdash@latest`, Node 22.23.4+) ([getting started](https://docs.emdashcms.com/getting-started/), [Cloudflare deploy](https://docs.emdashcms.com/deployment/cloudflare/)). **[Judgment]** Start from the template rather than adding EmDash to an empty Astro project.
4. Port the visual design: header, card, and announcement styles in Tailwind v4, plus the assets from `src/assets/` (favicons, `robots.txt`, `site.webmanifest`). The Angular components are reference material only.
5. **Content model** (create it in the admin, then `emdash export-seed` and commit the seed) ([collections](https://docs.emdashcms.com/concepts/collections/), [seed files](https://docs.emdashcms.com/themes/seed-files/)):
   - `meetings` with these fields:
     - `title` (string, required)
     - `starts_at` (datetime, required)
     - `kind` (select: `live` / `recording`)
     - `join_url` (url)
     - `recording_url` (url)
     - `notes` (text)
   - `announcements` with `body` (portableText) and `active` (boolean). Alternatively, use draft and publish instead of an `active` flag **[Judgment]**.
   - `datetime` is stored as UTC ([field types](https://docs.emdashcms.com/reference/field-types/)). Render it in `America/Denver`, the timezone the current scheduler uses (`functions/src/index.ts`).
6. **Public page:** query `meetings` with `getEmDashCollection()` ([architecture](https://docs.emdashcms.com/concepts/architecture/)), and split the results into "Upcoming" and "Past (with recording)" by `starts_at`. This replaces the old SCHEDULED/BROADCAST/ARCHIVED status logic and the daily scheduler entirely. Configure route caching tagged by collection ([route caching](https://docs.emdashcms.com/deployment/route-caching/)).

### Phase 2: Deploy to Cloudflare
7. Configure the `wrangler.jsonc` bindings (D1 `DB`, R2 `MEDIA`, KV `SESSION`) and the Cron Trigger. Then run `wrangler deploy` and test on the `workers.dev` URL. Check that a public page loads, that you can sign in at `/_emdash/admin`, and that the scheduled handler runs (`wrangler tail`) ([Cloudflare deploy](https://docs.emdashcms.com/deployment/cloudflare/)). Leave the sandbox / Worker Loader out, since you need no plugins.
8. **CI:** replace `angular.yml` with a workflow that runs build and then `wrangler deploy`. **[Judgment]** Use the official `cloudflare/wrangler-action` or plain `npx wrangler deploy` with an API token secret. I did not fetch Cloudflare's CI docs for this **[Unverified]**.
9. **Email (optional):** configure SMTP or Cloudflare Email Sending if you want magic links or emailed invites. Otherwise send invite links by hand ([email](https://docs.emdashcms.com/guides/email/)).

### Phase 3: Data
10. **[Judgment]** **The `streams` data is not worth migrating.** It holds YouTube IDs for past broadcasts, and the scheduler already archives docs after 6 days. Copy the 1-3 active **announcements** by hand in the admin, or by script with `emdash content create announcements --file` or the REST API ([CLI](https://docs.emdashcms.com/reference/cli/), [REST API](https://docs.emdashcms.com/reference/rest-api/)). Keep a Firestore export as an archive before you decommission it.

### Phase 4: Editors
11. You register first and become **Admin** ([authentication](https://docs.emdashcms.com/guides/authentication/)). Optionally enable Google OAuth so editors can use their Google accounts.
12. Invite the 1-2 helpers as **Editor**. Invite links are single-use and expire after 7 days.
13. Write a 5-line how-to for them: "Content > Meetings > New, then fill in title, date, and Zoom link, then Publish (or Schedule)."
14. **Backups:** note a D1 Time Travel bookmark before risky changes. Take a periodic offsite SQL dump. Store `EMDASH_ENCRYPTION_KEY` separately, because JSON backups from the admin **cannot be restored** ([backups](https://docs.emdashcms.com/guides/backups/)).

### Phase 5: DNS cutover
15. The zone is already on Cloudflare. Add the Worker as a **custom domain** (`custom_domain: true`) for `ecclespark.info` and `www` ([Cloudflare deploy](https://docs.emdashcms.com/deployment/cloudflare/), [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
    - Today the apex A record resolves to `199.36.158.100` (dig, 2026-11-22). **[Judgment]** That is presumably the Firebase Hosting record.
    - **[Unverified]** Whether you must delete the existing A record before Cloudflare will attach the custom domain. Check this in the dashboard at cutover time.
    - **[Judgment]** Do the cutover outside meeting times.

### Phase 6: Rollback and decommission
16. **Rollback:** leave the last Firebase Hosting deploy live and untouched for 2-4 weeks. To roll back, point the apex and `www` records back to the old Firebase targets. **[Judgment]** Record them before the cutover.
17. **After a stable period, delete the old Google-side resources:**
    - The Cloud Functions `createBroadcast`, `deleteBroadcast` and `manageStreamStatuses`, plus the Cloud Scheduler job behind `manageStreamStatuses`.
    - The Secret Manager secrets (`YOUTUBE_*`).
    - **Revoke the YouTube owner OAuth grant** in the Google account.
    - The OAuth client in Google Cloud.
    - The Firestore data, after exporting it.
    - Then downgrade from Blaze or delete the Firebase project.
18. **Delete in the new repo or branch:** `functions/`, `src/app/**`, `angular.json`, `firebase.json`, `firestore.rules`, `scripts/inject-env.js`, the Angular and Firebase workflows, and the `NG_*` / `FIREBASE_SERVICE_ACCOUNT_*` GitHub secrets.

### If you choose Option A instead (outline)
1. Fix the dependency state so `@angular/*` versions line up.
2. Delete `functions/`, `/setup`, and the YouTube services.
3. Add `join_url` and `recording_url` to `Stream` (`src/app/models/stream.ts`) and update the card.
4. Add an `/admin` route that uses Firebase Auth. Gate writes in `firestore.rules` on a custom claim such as `request.auth.token.editor == true`. Set the claim once per editor with the Admin SDK from a local script ([custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)).
5. Drop the status lifecycle and query by date instead.
6. Move to the Spark plan.

---

## Sources

**Repo (read 2026-11-22):** `package.json`, `firebase.json`, `firestore.rules`, `functions/src/index.ts`, `functions/src/youtube.ts`, `functions/scripts/get-owner-token.ts`, `src/app/app.routes.ts`, `src/app/models/*.ts`, `src/app/services/*.ts`, `.github/workflows/angular.yml`, `README.md`, and `git log`. DNS checked with `dig`.

**EmDash**
- https://emdashcms.com/
- https://emdashcms.com/blog/emdash-1-0
- https://github.com/emdash-cms/emdash (and the GitHub REST API for releases, stars, issues, and contributors)
- https://blog.cloudflare.com/emdash-wordpress/
- https://docs.emdashcms.com/introduction/
- https://docs.emdashcms.com/why-emdash/
- https://docs.emdashcms.com/getting-started/
- https://docs.emdashcms.com/existing-project/
- https://docs.emdashcms.com/concepts/architecture/
- https://docs.emdashcms.com/concepts/admin-panel/
- https://docs.emdashcms.com/concepts/collections/
- https://docs.emdashcms.com/reference/field-types/
- https://docs.emdashcms.com/reference/content-lifecycle/
- https://docs.emdashcms.com/reference/cli/
- https://docs.emdashcms.com/reference/rest-api/
- https://docs.emdashcms.com/themes/seed-files/
- https://docs.emdashcms.com/guides/authentication/
- https://docs.emdashcms.com/guides/email/
- https://docs.emdashcms.com/guides/backups/
- https://docs.emdashcms.com/deployment/cloudflare/
- https://docs.emdashcms.com/deployment/nodejs/
- https://docs.emdashcms.com/deployment/database/
- https://docs.emdashcms.com/deployment/route-caching/

**Cloudflare**
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

**Zoom**
- https://zoom.us/pricing
- https://www.zoom.com/en/products/virtual-meetings/resources/securing-your-meetings/
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0059862 (one security option required)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0074318 (permanent meeting link)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065228 (No Fixed Time missing in desktop client)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067670 (cloud recording storage)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067567 (managing and sharing cloud recordings)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065362 (cloud recording settings)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0062284 (livestream to YouTube)
- https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0064210 (livestream to custom service)
- https://developers.zoom.us/docs/api/webhooks/
- https://developers.zoom.us/docs/api/meetings/events/
- https://developers.zoom.us/blog/meeting-api-querying-tips-part4/

**Firebase**
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/app-hosting/frameworks-tooling
- https://firebase.google.com/docs/auth/admin/custom-claims

**Alternatives**
- https://decapcms.org/docs/backends-overview/
- https://decapcms.org/docs/github-backend/
- https://github.com/sveltia/sveltia-cms
- https://sveltiacms.app/en/docs/backends/github
- https://tina.io/pricing
- https://www.sanity.io/pricing
- https://firecms.co/pricing

**Known gaps:**
- The official Zoom source for the 365-day expiry of recurring meeting IDs.
- The full `recording.completed` schema in Zoom's reference.
- Whether the Workers Free plan's 10 ms CPU limit is enough for EmDash.
- Whether an existing DNS A record blocks attaching a Workers custom domain.
- Whether each Zoom-to-YouTube livestream gets a new watch URL.
