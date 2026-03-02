/**
 * Safe env access - process.env is Node-only; undefined in browser.
 * For dev, use empty strings. For production, use angular.json "define" to inject at build time.
 */
function getEnv(key: string): string {
  if (typeof process === 'undefined' || !process.env) return '';
  return process.env[key] ?? '';
}

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyDRR4-b3yqtkMzgOBYanNVcTKa4AETQOak',
    authDomain: 'ecclespark-info.firebaseapp.com',
    projectId: 'ecclespark-info',
    storageBucket: 'ecclespark-info.firebasestorage.app',
    messagingSenderId: '634730540408',
    appId: '1:634730540408:web:51e6c9a55592fcf7a92c8d',
  },
  youtube: {
    clientId: getEnv('NG_YOUTUBE_CLIENT_ID'),
    apiKey: getEnv('NG_YOUTUBE_API_KEY'),
    streamId: getEnv('NG_YOUTUBE_STREAM_ID'),
  },
};
