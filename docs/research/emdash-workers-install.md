# Fresh-install facts for EmDash on Cloudflare Workers

- **Date:** 2026-11-22
- **Ticket:** [#268](https://github.com/jloosli/ecclespark-info/issues/268) (map: [#267](https://github.com/jloosli/ecclespark-info/issues/267))
- **Question:** What does a fresh EmDash 1.5 install on Cloudflare Workers actually require for this site (one page: Broadcasts + Announcements)?
- **Method:** Primary sources only: docs.emdashcms.com, the `emdash-cms/emdash` repo (templates, issues, PRs, releases), developers.cloudflare.com, and the `cloudflare/workers-sdk` and `cloudflare/wrangler-action` repos. **[Judgment]** marks my opinion. **[Unverified]** marks things no first-party source confirmed.

> Version note: `emdash@1.6.0` was released on 2026-11-22, the day of this research (1.5.0 on 2026-11-11). Nothing below depends on 1.6-only behaviour, but pin whichever version you scaffold with (GitHub releases API).

---

## TL;DR

| Question | Answer |
|---|---|
| Template | `cloudflare:starter` (`@emdash-cms/template-starter-cloudflare`). It is the smallest Cloudflare template: Posts and Pages, no categories, tags or widgets. Replace its two collections in `seed/seed.json` with Broadcasts and Announcements **before first setup**. |
| Workers Free or Paid? | **Plan on Workers Paid ($5/mo).** EmDash's own maintainers measured editing requests at 10-22 ms of CPU against Free's 10 ms limit. An open issue (#4218) reports about 1% of admin requests killed with `exceededCpu` on Free, and an open docs PR (#4894) adds that warning to the deployment guide. |
| CI deploy | Either `cloudflare/wrangler-action@v4` or `npx wrangler deploy` works; both read `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`. Core D1 migrations apply automatically on the first request by default, so no CI migration step is needed at first. The seed is applied once on first request too, so there is no seed step in CI. |
| Custom domain over the Firebase A record | **No need to delete the A record first.** Wrangler detects the conflicting DNS record and replaces it: it asks for confirmation when run in a terminal, and **overrides it without asking** when run non-interactively (CI). Only an existing **CNAME** blocks a Custom Domain. Attaching the domain *is* the cutover. |
| PR previews | Feasible with **Worker Previews** (`wrangler preview`), but they need their own D1, R2 bucket and KV namespace, share one preview database by default, run no Cron Triggers, and have public URLs where the first visitor can claim admin. Version URLs don't work because the template uses a Durable Object. |

---

## 1. Which template, and what it scaffolds

### Templates
EmDash ships these templates (`templates/` in the repo, and [Themes overview](https://docs.emdashcms.com/themes/overview/)):

| Purpose | Node | Cloudflare |
|---|---|---|
| Empty project shell | `template-blank` | *no Cloudflare counterpart* |
| Basic pages site | `template-starter` | `template-starter-cloudflare` |
| Posts, pages, categories, tags, widgets | `template-blog` | `template-blog-cloudflare` |
| Project portfolio | `template-portfolio` | `template-portfolio-cloudflare` |
| Marketing pages from versioned blocks | `template-marketing` | `template-marketing-cloudflare` |

**[Judgment]** Use **starter-cloudflare**. It is the smallest Cloudflare option. There is no blank Cloudflare template, and Blog/Marketing/Portfolio add taxonomies, widgets and block layouts this site doesn't need.

### Command
From the Cloudflare framework guide ([developers.cloudflare.com/workers/framework-guides/web-apps/emdash](https://developers.cloudflare.com/workers/framework-guides/web-apps/emdash/)):

```sh
npm create emdash@latest -- ecclespark --template cloudflare:starter --yes
```

Interactively, the choices are: deploy target **Cloudflare Workers**, template **Starter**, install dependencies **Yes**, sandboxed plugins **No**. Requires **Node.js 22.23.4+** ([getting started](https://docs.emdashcms.com/getting-started/)). The scaffolder writes a generated `EMDASH_ENCRYPTION_KEY` to a gitignored `.env`. Don't commit it, and upload it with `wrangler secret put EMDASH_ENCRYPTION_KEY`.

### What it scaffolds
From `templates/starter-cloudflare/` on `main` (GitHub API, 2026-11-22):

- `astro.config.mjs`: `output: "server"`, the `@astrojs/cloudflare` adapter, React (admin UI), `emdash({ database: d1({ binding: "DB", session: "auto", coalesce: true }), storage: r2({ binding: "MEDIA" }) })`.
- `wrangler.jsonc`:
  - D1 `DB` (`my-emdash-site`) and R2 `MEDIA` (`my-emdash-media`).
  - The `EMDASH_ROOMS` Durable Object (`EmDashRoom`, SQLite-backed) for co-editing.
  - A `* * * * *` Cron Trigger.
  - `nodejs_compat`.
  - `worker_loaders` **commented out**: it needs Workers Paid and is only for sandboxed plugins.
- `src/worker.ts`: the Astro handler plus `scheduled: createScheduledHandler()`. It exports `EmDashRoom`, `EmDashRoomSite` and `PluginBridge`.
- `src/live.config.ts`, `src/layouts/Base.astro`, and `src/pages/`: `index.astro`, `[slug].astro`, `posts/`, `category/`, `tag/`, `404.astro`.
- `seed/seed.json` (pointed to by `package.json#emdash.seed`) with two collections:
  - `posts`: `title`, `featured_image`, `content`, `excerpt`.
  - `pages`: `title`, `content`.
- AI tooling: `AGENTS.md`, `.agents/skills/*`, and `.mcp.json` / `.cursor` / `.vscode` MCP configs.
- Scripts: `dev`, `build`, `deploy` (`astro build && wrangler deploy`), and `typecheck`.

At build time, `@astrojs/cloudflare` also adds a `SESSION` KV binding, an `IMAGES` binding and an `ASSETS` binding (CF framework guide). On the first `wrangler deploy`, Wrangler creates the D1 database, R2 bucket and KV namespace ([EmDash: Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)).

### Seed timing matters
EmDash reads the seed at **build time** and inlines it. It is applied **once**, on the first request before the setup wizard completes. "Deploying a changed seed file against an existing database does nothing." After that, the model changes only through the admin or `emdash schema` ([Evolving a deployed site](https://docs.emdashcms.com/deployment/schema-evolution/), [Themes overview](https://docs.emdashcms.com/themes/overview/)). So the Broadcasts/Announcements collections belong in `seed/seed.json` before the first production deploy, and the Posts/Pages routes should be removed or rewritten.

---

## 2. Workers Free (10 ms CPU) or Workers Paid ($5/mo)?

### Platform facts ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [pricing](https://developers.cloudflare.com/workers/platform/pricing/))
| | Workers Free | Workers Paid |
|---|---|---|
| CPU time per invocation | **10 ms** | up to 5 min |
| Requests | 100,000/day | no limit (10M/mo included) |
| Subrequests | 50/request | 10,000/request |
| Cron Triggers per account | 5 | 1,000 |
| Price | $0 | **$5/mo minimum** per account |

Other platform facts:
- Durable Objects with SQLite storage, which the co-editing room uses, are available on Free ([DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)).
- Dynamic Workers (`worker_loaders`, sandboxed plugins) require Paid. This site doesn't need them ([emdash#149](https://github.com/emdash-cms/emdash/issues/149), CF framework guide).
- D1 on Free allows 10 databases per account, 500 MB per database, and 7 days of Time Travel. Paid allows 30 days of Time Travel ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)).

### First-party evidence that Free is not enough for editing
- **[emdash#4218](https://github.com/emdash-cms/emdash/issues/4218)** (open, opened 2026-10-17): "Ordinary requests on Workers Free use the 10 ms CPU budget before route work; routine admin actions fail with exceededCpu."
  - The report covers a small site with 1-2 editors on 1.2.0: 46% of fetches went over 10 ms and 1.1% were killed (`exceededCpu`, 503).
  - The killed requests were entry lock, content read, content save and preview render.
  - Median CPU: `GET /` (SSR) 15 ms, and `POST …/lock` 14 ms.
- An EmDash contributor (`danielmlr`) measured a fresh **1.4.0** blog site on Workers Free:
  - "a save takes about 22 ms and a preview 10 to 22 ms"
  - the first request on a new isolate is "about 90 ms"
  - "editing does go over the limit in practice, so the deployment guide will say that"
  - "Workers Paid lifts the limit if the 503s get in your way."
- **[emdash PR #4894](https://github.com/emdash-cms/emdash/pull/4894)** (open, 2026-11-16) adds that warning to `deployment/cloudflare.mdx`. It says Cloudflare can stop requests (error 1102) and cron runs, and that a cron run took about 34 ms. The current deployment guide still lists only "A Cloudflare account" as a prerequisite.
- **[emdash#3858](https://github.com/emdash-cms/emdash/issues/3858)** (closed by PR #3861): every-minute cron ticks were being killed on cold isolates on Free, so "scheduled work is lost overnight." The fix moved heavy cleanup to hourly, but per #4894 a cron run still measured about 34 ms on 1.4.0.
- **[emdash#4212](https://github.com/emdash-cms/emdash/issues/4212)** (closed, PR #4213): large JPEG upload confirmation took about 1.7-2 s of CPU in production. A pixel guard now skips placeholder generation for images above 4 MP.

Cloudflare tolerates occasional overruns ("some built-in flexibility", quoted in #4218 from the limits page). That is why most over-budget requests still succeed, but the leeway isn't guaranteed.

**[Judgment]** Budget **Workers Paid ($5/mo)** from day one. Free might mostly work for anonymous page views, especially behind Workers Cache. But the people this migration is for are the Editors, and their saves and previews are exactly the requests that go over. The every-minute cron would also routinely exceed 10 ms. At this site's traffic, Paid should stay at the $5 minimum (10M requests and 30M CPU-ms included).

---

## 3. Deploying from GitHub Actions

### Action vs plain Wrangler
Cloudflare documents both ([GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [wrangler-action README](https://github.com/cloudflare/wrangler-action)):
- `cloudflare/wrangler-action@v4` (defaults to Wrangler v4) with `apiToken` / `accountId` inputs. It has a `command:` input and preview outputs (`preview-url`, etc.), and can create GitHub Deployments.
- Plain `npx wrangler deploy` with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in `env`. EmDash's own CI example uses `pnpm wrangler deploy` ([Core migrations](https://docs.emdashcms.com/deployment/core-migrations/)).

**[Judgment]** Use plain `npx wrangler deploy` after `npm ci && npm run build`. It runs the project's pinned Wrangler. That matters because Previews need Wrangler 4.135.0+ in the project's dependencies ([Previews](https://developers.cloudflare.com/workers/previews/); the wrangler-action README says 4.136.3+ for its preview mode), and EmDash's `emdash migrate` must run from the same project as the build. Switch to wrangler-action if you want its PR deployment outputs.

### Secrets and token scope
- GitHub secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Token: create it from the **"Edit Cloudflare Workers"** template, scoped to this account and zone (CF GitHub Actions docs).
- For D1 migrations from CI, EmDash says the token needs **D1 Edit** ([Core migrations](https://docs.emdashcms.com/deployment/core-migrations/)).
- For Previews, "the API token needs permission to edit Workers Scripts and the resources used by the Preview" ([Preview examples](https://developers.cloudflare.com/workers/previews/examples/)).
- **[Unverified]** Exactly which permissions the "Edit Cloudflare Workers" template includes (D1? DNS edit for Custom Domains?). Check the token's permission list when you create it, and add **D1 Edit** explicitly.
- Runtime secrets are not CI secrets. Set `EMDASH_ENCRYPTION_KEY` (and SMTP or Access settings if used) once with `wrangler secret put`. Never use `import.meta.env` for them (EmDash Cloudflare guide).

### D1 migrations and seeds in CI
- **Two kinds of "migration".**
  - EmDash **core** migrations change EmDash's own tables.
  - Your content model (collections and fields) is **not** a migration. It lives in the database, starts from the seed, and then changes only through the admin or `emdash schema` ([Evolving a deployed site](https://docs.emdashcms.com/deployment/schema-evolution/)).
  - Wrangler's own `d1 migrations` mechanism is not used.
- **Default (`auto`) needs no CI step.** The deployed Worker applies pending core migrations on its first request. A migration that would touch more than about 5,000 content rows returns 503 until you run `emdash migrate` from the CLI. That is irrelevant at this site's size.
- **Optional pipeline-managed mode.** `pnpm build` writes `.emdash/migrations.json` (gitignore it). CI then runs `emdash migrate --status`, then `emdash migrate --expected-target-fingerprint …`, then `wrangler deploy`, then `emdash migrate --check`. It needs:
  - secret `CLOUDFLARE_API_TOKEN` (D1 Edit)
  - variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID` and `EMDASH_TARGET_FINGERPRINT` (read from a reviewed local `--status`)
  - a `concurrency` group per account and database

  Then switch the runtime mode `auto` → `check` → `manual`. D1 targets need `--wrangler-config wrangler.jsonc` or `--d1 <uuid>`. `emdash migrate` never creates the database. The full sample workflow is on the [Core migrations](https://docs.emdashcms.com/deployment/core-migrations/) page.
- **Rollback boundary.** Redeploying old code does not undo a core migration. Take a D1 backup (or note a Time Travel bookmark) first (same page).
- **Seeds:** there is no CI step. The seed is inlined at build and applied once on the first request of an empty database. Sample content is applied only if the admin ticks it in the setup wizard ([Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)).

**[Judgment]** Start with `auto`: a workflow of checkout, `npm ci`, `npm run build`, `npx wrangler deploy`, on push to `main`. Add the fingerprinted `emdash migrate` job only if an upgrade ever bites.

---

## 4. Attaching `ecclespark.info` + `www` while the apex A record still points at Firebase

### What the docs say
- Prerequisites: "an active Cloudflare zone" in the same account. The zone is already on Cloudflare; see `docs/research/emdash-zoom-migration.md`.
- "**You cannot create a Custom Domain on a hostname with an existing CNAME DNS record**." A records are not mentioned as a blocker.
- "After you set up a Custom Domain for your Worker, Cloudflare will create DNS records and issue necessary certificates on your behalf."
- Custom Domains match the hostname exactly, so `www` needs **its own Custom Domain entry**, or a proxied placeholder record plus a redirect rule.

Source: [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

### What Wrangler actually does (source code)
In `cloudflare/workers-sdk`, `packages/deploy-helpers/src/triggers/publish-routes.ts` → `publishCustomDomains()`:
- It first asks the API for a changeset that lists `conflicting` hostnames.
- **Interactive terminal:** for conflicts it prompts "You already have DNS records that conflict for these Custom Domains: … Update them to point to this script instead?" Answering yes sets `override_existing_dns_record: true`.
- **Non-interactive (CI):** it sets `override_existing_origin = true` and `override_existing_dns_record = true` **without asking**.

### Answer
**You don't have to remove the Firebase A record first.** Wrangler, or the API with `override_existing_dns_record`, replaces it with the Worker's record. The flip side is that the first deploy containing `routes: [{ pattern: "ecclespark.info", custom_domain: true }]` **is the cutover**, and from CI it happens silently.

**[Unverified]** Whether the dashboard's "Add Custom Domain" button shows the same override prompt or refuses. Use Wrangler.

### Cutover implications
- **Don't put the `routes` block in `wrangler.jsonc` until cutover day.** Before that, test on `*.workers.dev`. The EmDash guide says to add the route only "after the Worker responds successfully at its workers.dev URL."
- **Do the first cutover deploy from a terminal, not CI,** so you see and confirm the conflict prompt.
- **Before cutover, record** the current apex A record (`199.36.158.100`) and the `www` record. Rollback means restoring them.
- **Passkeys are bound to the hostname used at setup.** "Run setup on the production domain, or set `EMDASH_SITE_URL` to it before setup." Changing it later breaks existing passkeys (EmDash Cloudflare guide). **[Judgment]** Set `EMDASH_SITE_URL=https://ecclespark.info` in `vars` from the start, or run the setup wizard only after cutover. The setup wizard must be finished quickly either way: "The first person to finish the setup wizard becomes the administrator."
- **Search visibility:** a site created through the setup wizard starts in **staging**, hidden from search engines, until you "go live" (EmDash Cloudflare guide).
- **Certificates:** a Custom Domain gets an Advanced Certificate. The certificate is not deleted when the domain is removed (CF Custom Domains).

---

## 5. PR preview deploys

### Options (EmDash Cloudflare guide, CF [Previews](https://developers.cloudflare.com/workers/previews/), [Resources and isolation](https://developers.cloudflare.com/workers/previews/resources/))
- **Worker Previews** (`wrangler preview --name pr-<n>`): per-branch URLs on the production Worker. Requires Wrangler 4.135.0+. Limits: Free 100 Previews per Worker, Paid 500. Delete with `wrangler preview delete --name …`. Cloudflare publishes a GitHub Actions workflow that creates one Preview per PR and comments its URL ([Preview examples](https://developers.cloudflare.com/workers/previews/examples/)).
- **Named Wrangler environment** (`--env preview`): a separate Worker with its own bindings.
- **Version URLs: not usable.** "Version URLs are not generated for Workers that implement a Durable Object." The template's `EmDashRoom` is one ([Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)).

### What a Preview needs for EmDash
- **Separate resources.** Previews inherit no bindings. Create a preview D1, R2 bucket **and** KV namespace (for `SESSION`: `wrangler preview` rejects the adapter's auto-provisioned KV without an ID), and list them in a `previews` block. "Never point a preview binding at a production database or bucket."
- **Durable Objects** get a fresh namespace per Preview automatically.
- **Site URL per Preview.** Pass `--var EMDASH_SITE_URL:https://pr-<n>-<worker>.<subdomain>.workers.dev` on every `wrangler preview`. Don't set `siteUrl` in `astro.config.mjs`, or setup and sign-in break on previews.

### Caveats (EmDash Cloudflare guide)
- **All Previews share the one preview D1 by default.** The first request applies pending core migrations, so a branch that upgrades EmDash migrates the shared preview DB. Isolating a branch means creating another D1, which hits Free's **10-database** limit fast.
- **An empty preview DB shows the setup wizard on a public URL.** The first visitor becomes admin. Finish setup immediately or put Previews behind Cloudflare Access.
- **Cron Triggers don't run on Previews,** so scheduled publishing won't fire there.
- **Passkeys are per hostname.** Production passkeys don't work on previews. On a shared preview DB, signing in on another preview needs magic links, which means an email provider.
- **Repository secrets** are unavailable to fork PRs (CF examples).

**[Judgment]** Feasible, and roughly equivalent to today's `angular-preview.yml`. The simple shape is one shared preview D1/R2/KV, set up once, plus a `pull_request` workflow running `npm run build` then `npx wrangler preview --name pr-<n> --var EMDASH_SITE_URL:…`, with `wrangler preview delete` on close. Expect to sign in to each new preview URL by magic link, or to add Cloudflare Access. For a one-page site with two Editors, it's reasonable to skip previews at first and decide in the testing-story ticket.

---

## Sources

**EmDash (docs, read 2026-11-22)**
- https://docs.emdashcms.com/getting-started/
- https://docs.emdashcms.com/deployment/cloudflare/
- https://docs.emdashcms.com/deployment/core-migrations/
- https://docs.emdashcms.com/deployment/schema-evolution/
- https://docs.emdashcms.com/themes/overview/
- https://docs.emdashcms.com/reference/cli/

**EmDash (GitHub, read 2026-11-22)**
- https://github.com/emdash-cms/emdash/tree/main/templates/starter-cloudflare (`wrangler.jsonc`, `package.json`, `seed/seed.json`, `src/pages/index.astro`)
- https://github.com/emdash-cms/emdash/issues/4218
- https://github.com/emdash-cms/emdash/pull/4894
- https://github.com/emdash-cms/emdash/issues/3858 and https://github.com/emdash-cms/emdash/pull/3861
- https://github.com/emdash-cms/emdash/issues/4212
- https://github.com/emdash-cms/emdash/issues/149
- Releases: `gh release list --repo emdash-cms/emdash`

**Cloudflare**
- https://developers.cloudflare.com/workers/framework-guides/web-apps/emdash/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://developers.cloudflare.com/workers/previews/ (plus `/resources/` and `/examples/`)
- https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
- https://github.com/cloudflare/wrangler-action (README)
- https://github.com/cloudflare/workers-sdk/blob/main/packages/deploy-helpers/src/triggers/publish-routes.ts

**Still unverified**
- Which permissions Cloudflare's "Edit Cloudflare Workers" token template includes (D1 Edit, DNS Edit).
- Whether the dashboard flow for adding a Custom Domain overrides an existing A record the way Wrangler does.
