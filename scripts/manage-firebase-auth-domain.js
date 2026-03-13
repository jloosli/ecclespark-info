#!/usr/bin/env node

/**
 * Manage Firebase Auth Authorized Domains
 *
 * Adds or removes domains from the Firebase Auth authorized domains list
 * using the Identity Toolkit REST API. Used by CI to enable OAuth on
 * Firebase Hosting preview channels.
 *
 * Usage:
 *   node scripts/manage-firebase-auth-domain.js add <domain>
 *   node scripts/manage-firebase-auth-domain.js remove <domain>
 *   node scripts/manage-firebase-auth-domain.js remove-pattern <prefix>
 *
 * Environment:
 *   GOOGLE_APPLICATION_CREDENTIALS_JSON - Service account JSON string
 *   FIREBASE_PROJECT_ID - (optional, defaults to 'ecclespark-info')
 */

const https = require('https');
const crypto = require('crypto');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'ecclespark-info';

// ── Argument parsing ──────────────────────────────────────────────

const [action, target] = process.argv.slice(2);

if (!['add', 'remove', 'remove-pattern'].includes(action) || !target) {
  console.error(
    'Usage: manage-firebase-auth-domain.js <add|remove|remove-pattern> <domain|prefix>'
  );
  process.exit(1);
}

// ── Service account loading ───────────────────────────────────────

let sa;
try {
  sa = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
} catch {
  console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON');
  process.exit(1);
}

// ── JWT creation (RS256, built-in crypto) ─────────────────────────

function createJwt(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const b64url = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/identitytoolkit',
  });

  const unsigned = `${header}.${payload}`;
  const sig = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(serviceAccount.private_key, 'base64url');

  return `${unsigned}.${sig}`;
}

// ── HTTP helpers ──────────────────────────────────────────────────

function request(method, url, accessToken, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function exchangeJwtForToken(jwt) {
  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).access_token);
        } else {
          reject(new Error(`Token exchange failed: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;

  // 1. Get access token
  const jwt = createJwt(sa);
  const token = await exchangeJwtForToken(jwt);

  // 2. Get current config
  const config = await request('GET', configUrl, token);
  const currentDomains = config.authorizedDomains || [];
  console.log(
    `Current authorized domains (${currentDomains.length}): ${currentDomains.join(', ')}`
  );

  // 3. Compute new domains
  let newDomains;

  if (action === 'add') {
    if (currentDomains.includes(target)) {
      console.log(
        `Domain "${target}" already authorized. No changes needed.`
      );
      return;
    }
    newDomains = [...currentDomains, target];
    console.log(`Adding domain: ${target}`);
  } else if (action === 'remove') {
    if (!currentDomains.includes(target)) {
      console.log(`Domain "${target}" not found. No changes needed.`);
      return;
    }
    newDomains = currentDomains.filter((d) => d !== target);
    console.log(`Removing domain: ${target}`);
  } else if (action === 'remove-pattern') {
    const matching = currentDomains.filter((d) => d.startsWith(target));
    if (matching.length === 0) {
      console.log(
        `No domains matching pattern "${target}*". No changes needed.`
      );
      return;
    }
    newDomains = currentDomains.filter((d) => !d.startsWith(target));
    console.log(
      `Removing ${matching.length} domain(s) matching "${target}*": ${matching.join(', ')}`
    );
  }

  // 4. Update config
  const patchUrl = `${configUrl}?updateMask=authorizedDomains`;
  await request('PATCH', patchUrl, token, { authorizedDomains: newDomains });
  console.log(
    `Successfully updated authorized domains (${newDomains.length} total).`
  );
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  // Exit 0 so CI doesn't fail — auth on preview is nice-to-have
  process.exit(0);
});
