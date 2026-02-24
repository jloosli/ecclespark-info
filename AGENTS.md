# AGENTS.md

Guidelines for AI agents working in this repository.

## Project Overview

**ecclespark.info** is a Hugo-powered church information website with embedded React applications for managing YouTube livestream broadcasts. It serves the Eccles Park Ward and integrates with Google APIs (YouTube, Google Accounts) and Airtable.

**Tech stack:**
- Hugo (static site generator, Go-based)
- React 19 + TypeScript 5.8 (compiled via Hugo's asset pipeline)
- Tailwind CSS v4 (compiled via PostCSS — no SCSS/Sass dependency)
- Firebase Hosting (production)
- GitHub Pages (alternative deployment)

## Repository Structure

```
/
├── assets/
│   ├── apps/broadcast-apps/   # React broadcast management app
│   │   ├── ui/                # React components
│   │   ├── business/          # Utility functions
│   │   └── data/              # API calls (YouTube, Airtable)
│   └── css/                   # Tailwind CSS entry point (app.css)
├── content/                   # Hugo content (Markdown)
│   ├── _index.md              # Main announcements page
│   └── setup.md               # Setup instructions
├── data/
│   ├── week.yml               # Current week's meeting info
│   └── meetings.yml           # Meeting schedule
├── layouts/                   # Hugo HTML templates
├── static/                    # Static public assets
├── config.toml                # Hugo configuration
├── docker-compose.yml         # Local dev environment
├── firebase.json              # Firebase hosting config
└── .env.example               # Required environment variables
```

## Development Environment

### Prerequisites
- Docker (recommended for local dev)
- Node.js + npm (for CSS builds)
- `.env` file based on `.env.example` with real API keys

### Running Locally

```bash
# Start Hugo dev server (hot reload, port 1313)
docker compose up server

# Build production site
docker compose up build
```

The dev server runs at `http://localhost:1313`.

### Environment Variables

Required in `.env` (see `.env.example`):
- `HUGO_CLIENT_ID` — Google OAuth client ID
- `HUGO_API_KEY` — Google API key
- `HUGO_CHANNEL_ID` — YouTube channel ID

These are passed through Hugo's template system to the client-side React app.

## Key Conventions

### Hugo Templates
- Base layout: `layouts/_default/baseof.html`
- React pages use `layouts/_default/react.html`
- Partials live in `layouts/partials/`
- Data files in `data/` are available in templates via `.Site.Data`

### React Components
- All React code lives under `assets/apps/broadcast-apps/`
- TypeScript is used throughout; keep types strict (tsconfig has `strict: true`)
- Components go in `ui/`, API/data logic in `data/`, utilities in `business/`
- No test framework is configured — manual verification is expected

### Styling
- **Tailwind CSS v4** is the single styling system — no SCSS/Sass dependency
- `assets/css/app.css` is the only CSS entry point; it defines `@theme` (custom palette), `@source` paths for Tailwind scanning, and `@layer base` for typography resets
- Apply styles using Tailwind utility classes directly in Hugo templates (`.html`) and React components (`.tsx`)
- **Color palette**: deep warm slate primary (`oklch(28% 0.05 250)`), sky-blue accent (`oklch(62% 0.17 220)`)
- **Dark mode**: `prefers-color-scheme` via Tailwind `dark:` prefixes — no extra config needed
- Hugo processes `assets/css/app.css` via `css.PostCSS` (with `@tailwindcss/postcss` plugin)
- Styles rebuild automatically on `hugo server` or `hugo build`

### Data Updates (Weekly)
- Update `data/week.yml` each week: set `date`, `odd`/`even`, and `sacrament` YouTube link
- Update `content/_index.md` for announcements

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/`) which:
1. Install Hugo 0.140.2, Node deps (no Dart Sass required)
2. Build the site with Hugo
3. Deploy to GitHub Pages and Firebase Hosting

Do not push directly to `main` for experimental changes — use feature branches.

## External Services

- **YouTube API** — for creating and managing livestream broadcasts
- **Google Accounts API** — for OAuth authentication in the broadcast app
- **Airtable** — for meeting data storage/retrieval
- **Firebase Hosting** — production hosting at https://ecclespark.info/

Credentials must never be committed to the repository. Use `.env` locally and GitHub Actions secrets for CI/CD.

## Cursor Cloud specific instructions

### System dependencies

Hugo extended v0.140.2 must be installed separately (not available via npm). Install with:
```
wget -q https://github.com/gohugoio/hugo/releases/download/v0.140.2/hugo_extended_0.140.2_linux-amd64.deb && sudo dpkg -i hugo_extended_0.140.2_linux-amd64.deb
```

### Running the dev server (without Docker)

In the Cloud VM, run Hugo natively instead of via Docker:
```bash
hugo server --bind 0.0.0.0 --port 1313
```
The `.env` file must exist (copy from `.env.example` if needed); placeholder values are fine for building/serving the site. The React broadcast features (YouTube API, Airtable) won't function without real credentials, but the site builds and renders correctly.

### Lint / type-checking

`npx tsc --noEmit` reports pre-existing errors (missing DOM lib, `@types/react`, `@types/react-dom`, and Hugo's virtual `@params` module). These do **not** block the Hugo build — Hugo's `js.Build` handles TypeScript/JSX compilation independently.

### Build

```bash
hugo                          # production build
hugo --environment development  # development build
```

### No automated test framework

This project has no test runner. Manual verification via the browser is the expected workflow (see "Key Conventions > React Components" above).
