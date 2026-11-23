# Rollback and recovery facts for EmDash on Cloudflare Workers

Research for [#276](https://github.com/jloosli/ecclespark-info/issues/276), on the map [Move ecclespark.info to EmDash](https://github.com/jloosli/ecclespark-info/issues/267). Checked on 2026-11-23 against the EmDash docs (docs.emdashcms.com), EmDash source at commit [`23a23ad`](https://github.com/emdash-cms/emdash/tree/23a23add888bb3138f18f5b466ae00993e5ed726), and the Cloudflare docs.

Claims marked **[Unverified]** come from reading source code or from inference, not from documentation. Claims marked **[Judgment]** are recommendations for this site.

## TL;DR

- **`wrangler rollback` works with `EmDashRoom`** as long as no Durable Object class was added, renamed or deleted between the live version and the target. The starter declares `EmDashRoom` once, through `exports`, so ordinary code rollbacks are not blocked. A rollback never touches D1, R2 or KV data.
- **Rolling back code does not roll back the database.** EmDash core migrations are forward-only. The old code usually still runs, because the runtime treats a database with extra migration records as current and core migrations follow expand/deploy/contract. If it doesn't, EmDash's documented answer is to restore the pre-migration database **and** the matching code together. On D1 that means **Time Travel**, or a dump you took yourself.
- **D1 Time Travel** restores the whole database in place, to any minute in the last **30 days on Workers Paid** (7 on Free). The restore is destructive but can be undone, because each restore prints the bookmark of the state it replaced. It does not cover R2 media, KV or secrets.
- **Offsite dumps:** a plain `wrangler d1 export --remote` **fails** on an EmDash database once search is enabled (FTS5 virtual tables). EmDash documents exporting table by table into four SQL files instead. `export-seed` and the admin's JSON backups **cannot restore a site**. `emdash site export` is a complete, importable package of content and media but has **no users**. Nothing EmDash documents backs up KV sessions, and losing them should only sign people out.
- **Admin recovery through `wrangler d1 execute`** is **not documented**. The docs say only "reset your site's authentication through the database". The concrete `UPDATE users SET role = 50 …` from #271 matches the current schema, but it is unsupported.

## 1. `wrangler rollback` and the `EmDashRoom` Durable Object

**What the starter declares.** [`templates/starter-cloudflare/wrangler.jsonc`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/templates/starter-cloudflare/wrangler.jsonc) binds `EMDASH_ROOMS` to class `EmDashRoom` and declares the class in the newer `exports` block (`{ "type": "durable-object", "storage": "sqlite" }`). It has no legacy `migrations` array. EmDash's Cloudflare guide says that a project which already has a `migrations` array must declare the class there instead (tag `emdash-rooms`, `new_sqlite_classes: ["EmDashRoom"]`), because a Worker can use only one of the two ([EmDash: Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)).

**What blocks a rollback.** According to [Cloudflare: Rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/):

- A rollback is blocked if a Durable Object class lifecycle change (through `exports` or the legacy `migrations` array) happened between the active version and the target. [Cloudflare: Durable Objects migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/) says the same: "rollbacks cannot cross a lifecycle change". Lifecycle changes are atomic, can't be rolled out gradually, and aren't applied by `wrangler versions upload`.
- A rollback is blocked if the target binds an R2 bucket, KV namespace or queue that no longer exists, or if bound resources such as KV or D1 were deleted or modified between the versions.
- Only the 100 most recent versions are eligible, and versions older than 30 days may be deleted.
- "Resources connected to your Worker will not be changed during a rollback." Rollback is code and config only. The docs also warn that it can cause errors "if the data structure changed between versions".

**What that means here.** The class is created by the very first deploy, and there is no earlier version to roll back to. After that, a rollback is only blocked by a release that adds, renames or deletes a Durable Object class. **[Unverified]** Nothing in the EmDash changelogs or docs reviewed here plans to rename `EmDashRoom`. If a future EmDash release did, the rename would need Cloudflare's three-deploy tombstone sequence, and the rollback window would close at that deploy.

- Once a Worker deploys with `exports`, it can never go back to a `migrations` array. Keep the starter's `exports` form ([Durable Objects migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)).
- A `deleted` tombstone permanently removes the namespace and its stored data, with no Trash. Room storage holds unsaved co-editing edits ([Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)).
- **[Judgment]** Room state is not critical for this site: two Editors make short weekly edits. Losing it costs at most an unsaved draft.

## 2. Old code against a newer D1 schema

**When migrations run.** In the default `auto` mode, a deployed Worker applies pending core migrations on its first request. Migrations that would touch more than about 5,000 content rows are not applied at runtime; the Worker returns 503 until someone runs `emdash migrate`. That limit won't matter at this site's size ([EmDash: Manage core database migrations](https://docs.emdashcms.com/deployment/core-migrations/)).

**Documented rollback boundary** (verbatim, from [core migrations](https://docs.emdashcms.com/deployment/core-migrations/#rollback-boundary)):

> Deploying the previous application artifact does not reverse a core migration. Before applying pending migrations, take a restorable database backup and record the application artifact that matches it. If the previous application cannot run against the migrated schema, restore the pre-migration database and application together. Do not delete rows from `_emdash_migrations` or run a migration's internal `down()` function as an operational rollback.

Other facts from the same guide and the [CLI reference](https://docs.emdashcms.com/reference/cli/):

- "Core migrations are forward-only." There is no `emdash migrate down` and no dry run.
- Core migrations "follow expand/deploy/contract sequencing", so old and new isolates can run against the expanded schema during a rolling deploy. One exception is listed: `095_plugin_storage_unique_scope`.
- In `check` mode, migration records from a newer build are tolerated "for this rolling-deployment direction only". The CLI's `--check` reports them as unknown (exit 3), and `emdash migrate` refuses to apply over them.
- The [updating guide](https://docs.emdashcms.com/deployment/updating/) gives the same answer: "Reinstalling does not undo core migrations. If the previous artifact cannot use the migrated database, stop traffic and restore the pre-update database and artifact together." It also asks for a recovery point whenever `.emdash/UPGRADE.md` lists added migrations.

**Does old code boot in the default `auto` mode? [Unverified, from source]** Yes. [`runner.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/database/migrations/runner.ts) treats the database as current when the applied-migration count is `>=` the build's own count. Its comments say this is deliberate, so "a database with extra rows from a newer build (e.g. mid-deploy old isolate, or downgrade) still counts as current". Old code therefore boots without touching the schema. Whether every page then works depends on whether the newer migration only expanded the schema. Usually it will; the docs promise expand/contract but not that every migration is backward compatible.

**Is Time Travel the only way back?** For an already-migrated D1 database, effectively yes. The documented options are:

1. Roll the code forward with a fix, the usual answer if the old code runs fine.
2. A D1 Time Travel restore to the pre-migration bookmark, plus `wrangler rollback` to the matching code.
3. Restore an offsite SQL dump (section 4) into a **new** D1 database and repoint the binding. This is slower and loses everything written after the dump.

Data-destroying migrations have happened. [emdash-cms/emdash#1021](https://github.com/emdash-cms/emdash/issues/1021) (closed): migration 036 in 0.12.0 silently deleted every row of `content_taxonomies` on D1, and the workaround began with a Time Travel restore. This is why the docs insist on a recovery point before each upgrade.

**[Judgment]** Before deploying an EmDash or Astro update (the hand-merged Dependabot group from #274), run `wrangler d1 time-travel info <db>` and note the bookmark next to the version ID of the code that was live. Rolling back is then two commands: `wrangler rollback <version-id>` and `wrangler d1 time-travel restore <db> --bookmark=<bookmark>`. Any Broadcasts or Announcements entered between the two points are lost and must be re-entered. With weekly manual entry that is a few minutes' work.

## 3. D1 Time Travel

From [Cloudflare: Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) and [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/):

| Question | Answer |
| --- | --- |
| Retention | **30 days on Workers Paid**, 7 on Free. Always on, no extra cost. |
| Granularity | Any minute in the window, by Unix or RFC 3339 timestamp, or by bookmark. |
| Scope | The **whole database**, overwritten in place. No per-table or per-row restore, and no clone or fork "yet". |
| Side effects | "Destructive", cancels in-flight queries, which return errors to clients. |
| Undo | Each restore prints the bookmark of the state it replaced. Restoring to it undoes the restore. Older bookmarks survive restores. |
| Rate limit | 10 restores per 10 minutes per database. |
| Commands | `wrangler d1 time-travel info <db> [--timestamp=…]`, `wrangler d1 time-travel restore <db> --bookmark=… \| --timestamp=…` |
| Requirement | The production storage backend (`wrangler d1 info` shows `version: production`). The legacy `alpha` backend has snapshots only. A new database will be on production. |
| Beyond 30 days | Cloudflare suggests exporting to R2 with Workflows. |

What it brings back in EmDash terms: "content, users, settings, plugin data, and migration records". It does **not** bring back R2 media or `EMDASH_ENCRYPTION_KEY` ([EmDash: Backups and recovery](https://docs.emdashcms.com/guides/backups/)). **[Unverified]** Sessions in KV are separate too, so after a restore an Editor may still hold a session for a user the restored database no longer has, or the other way round. The likely effect is a forced sign-in.

## 4. Offsite dump options and what they leave out

| Mechanism | Restores a site? | Content and model | Users and passkeys | R2 media files | KV (sessions, cache) | Source |
| --- | --- | --- | --- | --- | --- | --- |
| D1 Time Travel | Yes, in place | Yes | Yes | No | No | [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) |
| Table-by-table `wrangler d1 export` (EmDash recipe) | Yes, into a **new** D1 database | Yes | Yes | No (media metadata and folders yes) | No | [Backups](https://docs.emdashcms.com/guides/backups/) |
| Plain `wrangler d1 export --remote` | Fails once search is on | n/a | n/a | n/a | n/a | [Backups](https://docs.emdashcms.com/guides/backups/), [D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/) |
| `emdash site export` (site package) | Yes, into an **empty** EmDash site | Yes, including drafts, scheduled and trashed entries and revisions | **No**, only author names and emails | **Yes**, ready files | No | [Site transfer](https://docs.emdashcms.com/guides/site-transfer/) |
| `emdash export-seed [--with-content]` | Seed semantics only | Model; content only with `--with-content`, and scheduled entries become drafts | No | No (`$media` dropped without `--media-base-url`) | No | [CLI](https://docs.emdashcms.com/reference/cli/) |
| Admin JSON backup (**Download backup** / **Back up now** / daily cron to `backups/`) | **No**: "EmDash cannot restore them" | Inspection only | No | No | No | [Backups](https://docs.emdashcms.com/guides/backups/) |
| `aws s3 sync` of the R2 bucket | Media only, into a recovery bucket | n/a | n/a | Yes | n/a | [Backups](https://docs.emdashcms.com/guides/backups/) |

Details:

- **Plain `wrangler d1 export`** fails on EmDash databases with search enabled: "cannot export databases with Virtual Tables (fts5)". Cloudflare's own workaround is to drop the virtual tables, export, and recreate them. EmDash instead documents exporting tables by name into four files (schema, media folders, data, indexes and triggers), checking for lines over 100,000 bytes that would fail with `SQLITE_TOOBIG`, and importing them in that order with `wrangler d1 execute --remote --file=` into a **new, empty** database, never into production. The search index rebuilds on the first `/_emdash/api/search` call. An export also blocks other database requests while it runs ([D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)).
- **The site package** also leaves out sessions, OAuth accounts, API tokens, plugin state, audit logs, migration history and secrets. Imports into an existing site have had bugs: [emdash-cms/emdash#4378](https://github.com/emdash-cms/emdash/issues/4378) (closed) made every `site import` fail at the collection step. Rehearse before relying on it.
- **Secrets are never in any backup.** Keep `EMDASH_ENCRYPTION_KEY` (if set), `EMDASH_OAUTH_GOOGLE_CLIENT_ID` and `EMDASH_OAUTH_GOOGLE_CLIENT_SECRET` in a password manager ([Backups](https://docs.emdashcms.com/guides/backups/)).
- **KV.** The adapter adds a `SESSION` KV binding, and `CACHE` is an optional object cache ([Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)). EmDash's backup guide does not mention KV. **[Unverified]** Neither holds data that can't be rebuilt: losing `SESSION` signs everyone out, and losing `CACHE` refills it from D1.

**[Judgment]** For this site (a handful of Broadcasts each week, a few Announcements, almost no media), Time Travel plus the code in git covers 30 days. Beyond that, the cheapest durable copy is a monthly `emdash site export` (content and media, no users) kept offsite. Users are just 3 people and can be re-invited. The table-by-table SQL dump is only worth it if you want a full-fidelity copy including users. Treat both as rehearse-once, then routine.

## 5. Admin recovery through `wrangler d1 execute`

**Documented?** No. The only official text is in [Authentication → Lost all passkeys](https://docs.emdashcms.com/guides/authentication/): ask another Admin for a recovery magic link (needs email), and "If you're the only admin and email isn't configured, you'll need to reset your site's authentication through the database." No commands or schema are given. No GitHub issue was found that documents a procedure.

**What it involves [Unverified, from source].** The `users` table has an integer `role` column ([`008_auth.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/database/migrations/008_auth.ts)), with levels `SUBSCRIBER 10`, `CONTRIBUTOR 20`, `AUTHOR 30`, `EDITOR 40` and `ADMIN 50` ([`packages/auth/src/types.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/auth/src/types.ts)). Promoting an existing user who can still sign in (for example an Editor with a working passkey or Google login) is a single statement:

```bash
npx wrangler d1 execute <db> --remote --command "UPDATE users SET role = 50 WHERE email = 'someone@example.com'"
```

This is the same last resort recorded in the [#271 resolution](https://github.com/jloosli/ecclespark-info/issues/271). Take a Time Travel bookmark first. [`009_user_disabled.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/database/migrations/009_user_disabled.ts) adds a `disabled` flag to users, so check that it is `0` too. The schema can change in any release, so run `SELECT` statements against the table before `UPDATE`. Signing in as a user with no working credential at all would mean writing passkey or OAuth rows by hand, which is far more fragile. Avoid it.

**[Judgment]** With Google login as the recovery path (#271) and two Editors who can be promoted, the database route should never be needed. The runbook entry above is enough.

## Open questions surfaced

- **Recovery runbook:** where to keep it (the bookmark-before-update habit, the rollback commands, secrets in a password manager), and whether to rehearse a Time Travel restore and a `site export`/`site import` once before cutover.
- **Pin `migrations.runtime`?** The default `auto` mode migrates on first request after `wrangler deploy`, so the pre-update bookmark has to be taken before the deploy, by hand or in CI. Is that a manual checklist item or a CI step?
- **Long-term offsite copy:** is a periodic `emdash site export` (or SQL dump) wanted at all for a site whose content goes stale after 24 hours, or is 30 days of Time Travel enough?

## Sources

- EmDash: [Backups and recovery](https://docs.emdashcms.com/guides/backups/), [Manage core database migrations](https://docs.emdashcms.com/deployment/core-migrations/), [Updating](https://docs.emdashcms.com/deployment/updating/), [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/), [Database](https://docs.emdashcms.com/deployment/database/), [CLI reference](https://docs.emdashcms.com/reference/cli/), [Site transfer](https://docs.emdashcms.com/guides/site-transfer/), [Evolving a deployed site](https://docs.emdashcms.com/deployment/schema-evolution/), [Authentication](https://docs.emdashcms.com/guides/authentication/)
- EmDash source at [`23a23ad`](https://github.com/emdash-cms/emdash/tree/23a23add888bb3138f18f5b466ae00993e5ed726): [`runner.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/database/migrations/runner.ts), [`008_auth.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/core/src/database/migrations/008_auth.ts), [`types.ts`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/packages/auth/src/types.ts), [starter `wrangler.jsonc`](https://github.com/emdash-cms/emdash/blob/23a23add888bb3138f18f5b466ae00993e5ed726/templates/starter-cloudflare/wrangler.jsonc)
- EmDash issues: [#1021](https://github.com/emdash-cms/emdash/issues/1021), [#4378](https://github.com/emdash-cms/emdash/issues/4378)
- Cloudflare: [Rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/), [Durable Objects migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/), [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/)
