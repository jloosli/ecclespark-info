import 'dotenv/config';

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
    clientId: process.env['NG_YOUTUBE_CLIENT_ID'] ?? '',
    apiKey: process.env['NG_YOUTUBE_API_KEY'] ?? '',
    streamId: process.env['NG_YOUTUBE_STREAM_ID'] ?? '',
  },
};
