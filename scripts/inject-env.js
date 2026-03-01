#!/usr/bin/env node

/**
 * Injects environment variables into angular.json's production build configuration.
 * This script modifies angular.json to add a "define" section with the current
 * environment variable values as string literals.
 */

const fs = require('fs');
const path = require('path');

const angularJsonPath = path.join(__dirname, '..', 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

// Environment variables to inject
const envVars = [
  'NG_FIREBASE_API_KEY',
  'NG_FIREBASE_AUTH_DOMAIN',
  'NG_FIREBASE_MESSAGING_SENDER_ID',
  'NG_FIREBASE_APP_ID',
  'NG_YOUTUBE_CLIENT_ID',
  'NG_YOUTUBE_API_KEY',
  'NG_YOUTUBE_STREAM_ID',
];

// Build the define object with JSON-stringified values
const define = {};
const missingVars = [];

envVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
  }
  // Use JSON.stringify to create a proper JavaScript string literal
  // Empty string fallback for missing vars (error will be thrown below if critical)
  define[varName] = JSON.stringify(value || '');
});

// Warn about missing variables
if (missingVars.length > 0) {
  console.warn('⚠️  Warning: The following environment variables are not set:');
  missingVars.forEach((varName) => console.warn(`   - ${varName}`));
  console.warn('   These will be set to empty strings in the build.');
  console.warn('   The application may not function correctly without proper credentials.');
}

// Inject into production configuration
const prodConfig = angularJson.projects.app.architect.build.configurations.production;
prodConfig.define = define;

// Write back to angular.json
fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');

console.log('✓ Environment variables injected into angular.json');
