import { registerAs } from '@nestjs/config';

function parseCorsOrigins(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default registerAs('app', () => ({
  appEnv: process.env.APP_ENV ?? 'local',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  dataBackend: process.env.DATA_BACKEND ?? 'memory',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
  firebase: {
    target: process.env.FIREBASE_TARGET,
    allowRealFirebase: process.env.ALLOW_REAL_FIREBASE === 'true',
    projectId: process.env.FIREBASE_PROJECT_ID,
    developmentProjectId: process.env.FIREBASE_DEVELOPMENT_PROJECT_ID,
    credentialSource: process.env.FIREBASE_CREDENTIAL_SOURCE ?? 'adc',
    serviceAccountJsonBase64:
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64,
    authEmulatorHost:
      process.env.FIREBASE_AUTH_EMULATOR_HOST ??
      process.env.FIREBASE_EMULATOR_AUTH_HOST,
    firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST
  }
}));
