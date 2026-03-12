/**
 * One-time script to obtain a YouTube OAuth refresh token for the channel owner.
 *
 * Prerequisites:
 *   1. Create an OAuth 2.0 client ID (Desktop app type) in Google Cloud Console
 *   2. Enable YouTube Data API v3 for the project
 *
 * Usage:
 *   YOUTUBE_CLIENT_ID=xxx YOUTUBE_CLIENT_SECRET=yyy npx tsx scripts/get-owner-token.ts
 *
 * After obtaining the token, store it in Firebase Secret Manager:
 *   firebase functions:secrets:set YOUTUBE_OWNER_REFRESH_TOKEN
 *   (paste the refresh token when prompted)
 */

import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET ?? '';
const REDIRECT_PORT = 3333;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET environment variables.',
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
});

async function main() {
  console.log('\nOpen this URL in your browser to sign in:\n');
  console.log(authorizeUrl);
  console.log(
    '\nSign in with the channel OWNER account (e.g., jloosli@gmail.com) and grant YouTube access.\n',
  );

  const server = http.createServer(async (req, res) => {
    const queryParams = url.parse(req.url ?? '', true).query;
    const code = queryParams.code as string | undefined;

    if (!code) {
      res.writeHead(400);
      res.end('Missing authorization code');
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Success! You can close this tab.</h1>');

      console.log('\n--- Refresh Token ---');
      console.log(tokens.refresh_token);
      console.log('---------------------\n');
      console.log('Store this token in Firebase Secret Manager:');
      console.log(
        '  firebase functions:secrets:set YOUTUBE_OWNER_REFRESH_TOKEN',
      );
      console.log('  (paste the token above when prompted)\n');
      console.log('Also store these secrets:');
      console.log('  firebase functions:secrets:set YOUTUBE_CLIENT_ID');
      console.log('  firebase functions:secrets:set YOUTUBE_CLIENT_SECRET');
      console.log('  firebase functions:secrets:set YOUTUBE_STREAM_ID\n');
    } catch (err) {
      res.writeHead(500);
      res.end('Failed to exchange authorization code');
      console.error('Token exchange error:', err);
    } finally {
      server.close();
    }
  });

  server.listen(REDIRECT_PORT, () => {
    console.log(
      `Listening for OAuth callback on http://localhost:${REDIRECT_PORT}...`,
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
