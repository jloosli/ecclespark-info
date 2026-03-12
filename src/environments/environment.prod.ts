/**
 * Production environment configuration template.
 * 
 * This file serves as a template and fallback. During production builds,
 * scripts/inject-env.js generates environment.prod.generated.ts with actual
 * environment variable values, which replaces this file via Angular's
 * fileReplacements configuration.
 * 
 * The generated file is gitignored to prevent credential leaks.
 */

export const environment = {
  production: true,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: 'ecclespark-info',
    storageBucket: 'ecclespark-info.firebasestorage.app',
    messagingSenderId: '',
    appId: '',
  },
};
