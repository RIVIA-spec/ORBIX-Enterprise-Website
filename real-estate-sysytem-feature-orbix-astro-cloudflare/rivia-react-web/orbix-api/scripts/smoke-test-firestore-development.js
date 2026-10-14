const { randomUUID } = require('node:crypto');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const collectionName = '_systemDevelopmentChecks';

function fail(message) {
  throw new Error(`Development Firestore smoke test failed: ${message}`);
}

function requireEnv(name, expectedValue) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    fail(`${name} is required.`);
  }
  if (expectedValue !== undefined && value !== expectedValue) {
    fail(`${name} must be ${expectedValue}.`);
  }
  return value;
}

async function main() {
  requireEnv('APP_ENV', 'development');
  requireEnv('DATA_BACKEND', 'firestore');
  requireEnv('FIREBASE_TARGET', 'development');
  requireEnv('ALLOW_REAL_FIREBASE', 'true');

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    fail('FIRESTORE_EMULATOR_HOST must be unset.');
  }

  const projectId = requireEnv('FIREBASE_PROJECT_ID');
  const expectedDevelopmentProjectId = requireEnv('FIREBASE_DEVELOPMENT_PROJECT_ID');
  const blockedProductionProjectId = (process.env.FIREBASE_PRODUCTION_PROJECT_ID || '').trim();

  if (projectId !== expectedDevelopmentProjectId) {
    fail('FIREBASE_PROJECT_ID must match FIREBASE_DEVELOPMENT_PROJECT_ID.');
  }

  if (blockedProductionProjectId && projectId === blockedProductionProjectId) {
    fail('FIREBASE_PROJECT_ID is blocked.');
  }

  const app = initializeApp({ projectId });
  const db = getFirestore(app);
  const docRef = db.collection(collectionName).doc(`smoke-${randomUUID()}`);

  try {
    if (app.options.projectId !== expectedDevelopmentProjectId) {
      fail('Firebase Admin initialized with an unexpected projectId.');
    }

    await docRef.set({
      type: 'smoke-test',
      environment: 'development',
      createdAt: FieldValue.serverTimestamp()
    });

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      fail('smoke document was not readable after write.');
    }

    const data = snapshot.data() || {};
    if (data.type !== 'smoke-test') {
      fail('smoke document type mismatch.');
    }
    if (data.environment !== 'development') {
      fail('smoke document environment mismatch.');
    }
    if (!data.createdAt) {
      fail('smoke document createdAt was not resolved.');
    }

    console.log(`Development Firestore smoke document read succeeded in ${collectionName}.`);
  } finally {
    await docRef.delete().catch((error) => {
      console.error(`Smoke document cleanup failed: ${error.message}`);
    });

    const deletedSnapshot = await docRef.get().catch((error) => {
      console.error(`Smoke document post-delete check failed: ${error.message}`);
      return null;
    });

    if (deletedSnapshot && deletedSnapshot.exists) {
      throw new Error('Development Firestore smoke test failed: smoke document still exists after cleanup.');
    }

    await deleteApp(app);
  }

  console.log('Development Firestore smoke document cleanup verified.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
