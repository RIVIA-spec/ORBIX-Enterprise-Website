const { spawnSync } = require('node:child_process');

const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
const expectedDevelopmentProjectId = (process.env.FIREBASE_DEVELOPMENT_PROJECT_ID || '').trim();
const blockedProductionProjectId = (process.env.FIREBASE_PRODUCTION_PROJECT_ID || '').trim();

function fail(message) {
  console.error(`Development Firestore deploy failed: ${message}`);
  process.exit(1);
}

if (!projectId) {
  fail('FIREBASE_PROJECT_ID is required.');
}

if (!expectedDevelopmentProjectId) {
  fail('FIREBASE_DEVELOPMENT_PROJECT_ID is required.');
}

if (projectId !== expectedDevelopmentProjectId) {
  fail('FIREBASE_PROJECT_ID must match FIREBASE_DEVELOPMENT_PROJECT_ID.');
}

if (blockedProductionProjectId && projectId === blockedProductionProjectId) {
  fail('FIREBASE_PROJECT_ID is blocked.');
}

const result = spawnSync(
  'firebase',
  ['deploy', '--only', 'firestore:rules,firestore:indexes', '--project', projectId],
  { stdio: 'inherit', shell: process.platform === 'win32' }
);

process.exit(result.status ?? 1);
