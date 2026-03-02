/**
 * Safe env access - process.env is Node-only; undefined in browser.
 * Production builds should use angular.json "define" to inject values at build time.
 */
function getEnv(key: string): string {
  if (typeof process === 'undefined' || !process.env) return '';
  return process.env[key] ?? '';
}

export const environment = {
  production: true,
  firebase: {
    apiKey: getEnv('NG_FIREBASE_API_KEY'),
    authDomain: getEnv('NG_FIREBASE_AUTH_DOMAIN'),
    projectId: 'ecclespark-info',
    storageBucket: 'ecclespark-info.firebasestorage.app',
    messagingSenderId: getEnv('NG_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('NG_FIREBASE_APP_ID'),
  },
  youtube: {
    clientId: getEnv('NG_YOUTUBE_CLIENT_ID'),
    apiKey: getEnv('NG_YOUTUBE_API_KEY'),
    streamId: getEnv('NG_YOUTUBE_STREAM_ID'),
  },
};
