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

```bash
ng build --configuration production
```

Output is written to `dist/app/browser/`.

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
