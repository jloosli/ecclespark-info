# AGENTS.md

Guidelines for AI agents working in this repository.

## Project Overview

**ecclespark.info** is a Hugo-powered church information website with embedded React applications for managing YouTube livestream broadcasts. It serves the Eccles Park Ward and integrates with Google APIs (YouTube, Google Accounts) and Airtable.

**Tech stack:**
- Hugo (static site generator, Go-based)
- React 19 + TypeScript 5.8 (compiled via Hugo's asset pipeline)
- Tailwind CSS (compiled via PostCSS)
- SCSS for additional styling
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
│   └── scss/                  # SCSS stylesheets
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

# Build Tailwind CSS (run when changing css/tailwind.css)
npm run build
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
- Tailwind CSS for utility classes (source: `css/tailwind.css`, output: `public/build/tailwind.css`)
- SCSS for component styles under `assets/scss/`
- Color palette defined in `assets/scss/_palette.scss` (accent: `#3F51B5`)
- Run `npm run build` after changing Tailwind source

### Data Updates (Weekly)
- Update `data/week.yml` each week: set `date`, `odd`/`even`, and `sacrament` YouTube link
- Update `content/_index.md` for announcements

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/`) which:
1. Install Hugo 0.140.2, Dart Sass, Node deps
2. Build the site with Hugo
3. Deploy to GitHub Pages and Firebase Hosting

Do not push directly to `main` for experimental changes — use feature branches.

## External Services

- **YouTube API** — for creating and managing livestream broadcasts
- **Google Accounts API** — for OAuth authentication in the broadcast app
- **Airtable** — for meeting data storage/retrieval
- **Firebase Hosting** — production hosting at https://ecclespark.info/

Credentials must never be committed to the repository. Use `.env` locally and GitHub Actions secrets for CI/CD.
