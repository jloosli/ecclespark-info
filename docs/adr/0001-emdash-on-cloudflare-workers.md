# EmDash on Cloudflare Workers replaces the Angular/Firebase app

We are rebuilding the site as a fresh EmDash (Astro) install hosted on Cloudflare Workers (D1, R2, KV), replacing the Angular SPA, Firestore and Cloud Functions in this repo. The goal is a real admin UI so 1-2 Editors can paste each week's Broadcast link and post Announcements without code; EmDash cannot run as static files on Firebase Hosting, and the domain's DNS is already on Cloudflare. Broadcast links are entered by hand: the YouTube automation (OAuth, Cloud Functions, scheduler) is dropped, not ported.

## Considered Options

- **Keep Angular + Firestore and add an editor page ("Option A")**: least change, but we keep writing and maintaining our own editor UI and must first repair the mismatched Angular dependencies.
- **FireCMS over the existing Firestore**: near-zero app changes, but a paid or self-hosted generic admin bolted onto a stack we otherwise want to shrink.
- **Git-based CMS (Decap, Sveltia, Tina)**: every Editor would need a GitHub account with write access.

See `docs/research/emdash-zoom-migration.md` for the full comparison.
