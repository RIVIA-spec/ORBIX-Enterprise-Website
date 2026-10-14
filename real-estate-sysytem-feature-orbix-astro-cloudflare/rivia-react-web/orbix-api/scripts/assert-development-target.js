const placeholderPattern = /replace-with|placeholder|your-|example/i;

const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
const expectedDevelopmentProjectId = (process.env.FIREBASE_DEVELOPMENT_PROJECT_ID || '').trim();
const blockedProductionProjectId = (process.env.FIREBASE_PRODUCTION_PROJECT_ID || '').trim();
const firebaseTarget = process.env.FIREBASE_TARGET;
const allowRealFirebase = process.env.ALLOW_REAL_FIREBASE;

function fail(message) {
  console.error(`Development Firebase target check failed: ${message}`);
  process.exit(1);
}

if (!projectId) {
  fail('FIREBASE_PROJECT_ID is required.');
}

if (!expectedDevelopmentProjectId) {
  fail('FIREBASE_DEVELOPMENT_PROJECT_ID is required.');
}

if (placeholderPattern.test(projectId)) {
  fail('FIREBASE_PROJECT_ID must not be a placeholder.');
}

if (placeholderPattern.test(expectedDevelopmentProjectId)) {
  fail('FIREBASE_DEVELOPMENT_PROJECT_ID must not be a placeholder.');
}

if (firebaseTarget !== 'development') {
  fail('FIREBASE_TARGET must be development.');
}

if (allowRealFirebase !== 'true') {
  fail('ALLOW_REAL_FIREBASE must be true for real Firebase operations.');
}

if (projectId !== expectedDevelopmentProjectId) {
  fail('FIREBASE_PROJECT_ID must match FIREBASE_DEVELOPMENT_PROJECT_ID.');
}

if (blockedProductionProjectId && projectId === blockedProductionProjectId) {
  fail('FIREBASE_PROJECT_ID is blocked.');
}

if (process.env.FIRESTORE_EMULATOR_HOST) {
  fail('FIRESTORE_EMULATOR_HOST must be unset for real Development Firebase operations.');
}

console.log(`Development Firebase target: ${projectId}`);
