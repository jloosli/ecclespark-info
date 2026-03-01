export const environment = {
  production: true,
  firebase: {
    apiKey: process.env['NG_FIREBASE_API_KEY'] ?? '',
    authDomain: process.env['NG_FIREBASE_AUTH_DOMAIN'] ?? '',
    projectId: 'ecclespark-info',
    storageBucket: 'ecclespark-info.firebasestorage.app',
    messagingSenderId: process.env['NG_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    appId: process.env['NG_FIREBASE_APP_ID'] ?? '',
  },
  youtube: {
    clientId: process.env['NG_YOUTUBE_CLIENT_ID'] ?? '',
    apiKey: process.env['NG_YOUTUBE_API_KEY'] ?? '',
    streamId: process.env['NG_YOUTUBE_STREAM_ID'] ?? '',
  },
};
