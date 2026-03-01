# ecclespark.info

[![Angular Build & Deploy](https://github.com/jloosli/ecclespark-info/actions/workflows/angular.yml/badge.svg)](https://github.com/jloosli/ecclespark-info/actions/workflows/angular.yml)

An Angular SPA for displaying live and scheduled YouTube broadcasts. Deployed to Firebase Hosting.

## Local Development

```bash
npm install --legacy-peer-deps
ng serve
```

Open `http://localhost:4200`.

## Production Build

The production build injects environment variables at build time using a custom script:

```bash
npm run build:prod
```

This command:
1. Runs `scripts/inject-env.js` to read environment variables and inject them into `angular.json`
2. Builds the Angular app with the production configuration
3. Replaces declared constants with actual values at compile time

Output is written to `dist/app/browser/`.

**Note:** Environment variables must be set before running the build. The script will warn if any required variables are missing.

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```
NG_YOUTUBE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
NG_YOUTUBE_API_KEY=your-youtube-api-key
NG_YOUTUBE_STREAM_ID=your-youtube-stream-id
```

Firebase config is injected via GitHub Secrets during CI (see `.github/workflows/angular.yml`).

## Deployment

Pushes to `main` trigger the `angular.yml` workflow, which builds the app and deploys to Firebase Hosting automatically.

Required GitHub Secrets:
- `NG_FIREBASE_API_KEY`
- `NG_FIREBASE_AUTH_DOMAIN`
- `NG_FIREBASE_MESSAGING_SENDER_ID`
- `NG_FIREBASE_APP_ID`
- `NG_YOUTUBE_CLIENT_ID`
- `NG_YOUTUBE_API_KEY`
- `NG_YOUTUBE_STREAM_ID`
- `FIREBASE_SERVICE_ACCOUNT_ECCLESPARK_INFO`
