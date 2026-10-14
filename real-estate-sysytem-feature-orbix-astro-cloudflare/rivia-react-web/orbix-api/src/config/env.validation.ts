import { decodeFirebaseServiceAccountBase64 } from './firebase-credential';

type Env = Record<string, string | undefined>;

const environments = new Set(['development', 'test', 'staging', 'production']);
const appEnvironments = new Set([
  'local',
  'development',
  'staging',
  'production'
]);
const dataBackends = new Set(['memory', 'firestore']);
const firebaseTargets = new Set([
  'emulator',
  'development',
  'production'
]);
const credentialSources = new Set(['adc', 'base64']);
const placeholderPattern = /replace-with|placeholder|your-|example/i;
const localProjectId = 'orbix-local-dev';

export function validateEnv(env: Env): Env {
  const appEnv = env.APP_ENV ?? 'local';
  const nodeEnv = env.NODE_ENV ?? 'development';
  const dataBackend = env.DATA_BACKEND ?? 'memory';
  const firebaseTarget = env.FIREBASE_TARGET;
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  const developmentProjectId =
    env.FIREBASE_DEVELOPMENT_PROJECT_ID?.trim();
  const credentialSource =
    env.FIREBASE_CREDENTIAL_SOURCE?.trim() || 'adc';
  const encodedCredential =
    env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  const allowRealFirebase = env.ALLOW_REAL_FIREBASE === 'true';

  if (!appEnvironments.has(appEnv)) {
    throw new Error(
      'APP_ENV must be one of local, development, staging, production'
    );
  }

  if (!environments.has(nodeEnv)) {
    throw new Error(
      'NODE_ENV must be one of development, test, staging, production'
    );
  }

  if (!dataBackends.has(dataBackend)) {
    throw new Error('DATA_BACKEND must be one of memory, firestore');
  }

  if (firebaseTarget && !firebaseTargets.has(firebaseTarget)) {
    throw new Error(
      'FIREBASE_TARGET must be one of emulator, development, production'
    );
  }

  if (!credentialSources.has(credentialSource)) {
    throw new Error(
      'FIREBASE_CREDENTIAL_SOURCE must be one of adc, base64'
    );
  }

  const port = Number(env.PORT ?? 4000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  if (appEnv === 'production' || firebaseTarget === 'production') {
    throw new Error('Production Firebase target is disabled in this phase');
  }

  if (dataBackend === 'firestore' && !firebaseTarget) {
    throw new Error('DATA_BACKEND=firestore requires FIREBASE_TARGET');
  }

  if (firebaseTarget === 'emulator') {
    if (!env.FIRESTORE_EMULATOR_HOST) {
      throw new Error(
        'FIREBASE_TARGET=emulator requires FIRESTORE_EMULATOR_HOST'
      );
    }

    if (projectId && projectId !== localProjectId) {
      throw new Error(
        'FIREBASE_TARGET=emulator must use orbix-local-dev or omit FIREBASE_PROJECT_ID'
      );
    }

    if (credentialSource !== 'adc' || encodedCredential) {
      throw new Error(
        'Firebase emulator must not use a service account credential'
      );
    }
  }

  if (credentialSource === 'base64' && firebaseTarget !== 'development') {
    throw new Error(
      'FIREBASE_CREDENTIAL_SOURCE=base64 is allowed only for Firebase Development'
    );
  }

  if (credentialSource === 'adc' && encodedCredential) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 requires FIREBASE_CREDENTIAL_SOURCE=base64'
    );
  }

  if (firebaseTarget === 'development') {
    if (
      env.FIRESTORE_EMULATOR_HOST ||
      env.FIREBASE_AUTH_EMULATOR_HOST ||
      env.FIREBASE_EMULATOR_AUTH_HOST
    ) {
      throw new Error(
        'FIREBASE_TARGET=development must not use emulator host variables'
      );
    }

    if (!allowRealFirebase) {
      throw new Error(
        'FIREBASE_TARGET=development requires ALLOW_REAL_FIREBASE=true'
      );
    }

    requireProjectId(projectId);

    if (credentialSource === 'base64') {
      requireProjectId(
        developmentProjectId,
        'FIREBASE_DEVELOPMENT_PROJECT_ID'
      );

      if (projectId !== developmentProjectId) {
        throw new Error(
          'FIREBASE_PROJECT_ID must match FIREBASE_DEVELOPMENT_PROJECT_ID'
        );
      }

      const credential =
        decodeFirebaseServiceAccountBase64(encodedCredential);

      if (
        credential.projectId !== projectId ||
        credential.projectId !== developmentProjectId
      ) {
        throw new Error(
          'Firebase service account project_id does not match the Development project'
        );
      }
    }
  }

  if (
    dataBackend === 'firestore' &&
    firebaseTarget === 'development' &&
    !allowRealFirebase
  ) {
    throw new Error('Real Firestore requires ALLOW_REAL_FIREBASE=true');
  }

  if (projectId && placeholderPattern.test(projectId)) {
    throw new Error('FIREBASE_PROJECT_ID must not be a placeholder');
  }

  if (
    developmentProjectId &&
    placeholderPattern.test(developmentProjectId)
  ) {
    throw new Error(
      'FIREBASE_DEVELOPMENT_PROJECT_ID must not be a placeholder'
    );
  }

  if (nodeEnv === 'test' && firebaseTarget === 'development') {
    throw new Error('NODE_ENV=test must not target real Firebase');
  }

  return env;
}

function requireProjectId(
  projectId?: string,
  variableName = 'FIREBASE_PROJECT_ID'
): void {
  if (!projectId) {
    throw new Error(`${variableName} is required for real Firebase targets`);
  }

  if (placeholderPattern.test(projectId)) {
    throw new Error(`${variableName} must not be a placeholder`);
  }
}
