/**
 * Production environment configuration.
 * Build-time constants are injected via angular.json "define" option.
 * These global constants are replaced at build time with actual environment variable values.
 */

// Global constants injected by Angular builder at build time
declare const NG_FIREBASE_API_KEY: string;
declare const NG_FIREBASE_AUTH_DOMAIN: string;
declare const NG_FIREBASE_MESSAGING_SENDER_ID: string;
declare const NG_FIREBASE_APP_ID: string;
declare const NG_YOUTUBE_CLIENT_ID: string;
declare const NG_YOUTUBE_API_KEY: string;
declare const NG_YOUTUBE_STREAM_ID: string;

export const environment = {
  production: true,
  firebase: {
    apiKey: NG_FIREBASE_API_KEY,
    authDomain: NG_FIREBASE_AUTH_DOMAIN,
    projectId: 'ecclespark-info',
    storageBucket: 'ecclespark-info.firebasestorage.app',
    messagingSenderId: NG_FIREBASE_MESSAGING_SENDER_ID,
    appId: NG_FIREBASE_APP_ID,
  },
  youtube: {
    clientId: NG_YOUTUBE_CLIENT_ID,
    apiKey: NG_YOUTUBE_API_KEY,
    streamId: NG_YOUTUBE_STREAM_ID,
  },
};
