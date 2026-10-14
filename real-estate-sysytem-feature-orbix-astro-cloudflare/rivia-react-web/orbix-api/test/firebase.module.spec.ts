import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as firebaseApp from 'firebase-admin/app';
import appConfig from '../src/config/app.config';
import { validateEnv } from '../src/config/env.validation';
import { FIREBASE_APP } from '../src/modules/firebase/firebase.constants';
import { FirebaseModule } from '../src/modules/firebase/firebase.module';

const credentialEnvironmentKeys = [
  'FIREBASE_CREDENTIAL_SOURCE',
  'FIREBASE_DEVELOPMENT_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_JSON_BASE64'
];

describe('FirebaseModule', () => {
  afterEach(() => {
    jest.restoreAllMocks();

    for (const key of credentialEnvironmentKeys) {
      delete process.env[key];
    }
  });

  it('initializes Firebase Admin only once and uses ADC-compatible options', async () => {
    process.env.APP_ENV = 'local';
    process.env.NODE_ENV = 'test';
    process.env.DATA_BACKEND = 'firestore';
    process.env.FIREBASE_TARGET = 'emulator';
    process.env.ALLOW_REAL_FIREBASE = 'false';
    process.env.FIREBASE_PROJECT_ID = 'orbix-local-dev';
    process.env.FIREBASE_CREDENTIAL_SOURCE = 'adc';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    delete process.env.FIREBASE_EMULATOR_AUTH_HOST;
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

    const app = {
      name: '[DEFAULT]',
      options: { projectId: 'orbix-local-dev' }
    } as firebaseApp.App;

    const getApps = jest
      .spyOn(firebaseApp, 'getApps')
      .mockReturnValueOnce([])
      .mockReturnValueOnce([app]);

    const initializeApp = jest
      .spyOn(firebaseApp, 'initializeApp')
      .mockReturnValue(app);

    const getAuth = jest
      .spyOn(await import('firebase-admin/auth'), 'getAuth')
      .mockReturnValue(
        {} as ReturnType<
          typeof import('firebase-admin/auth').getAuth
        >
      );

    const firstModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: false,
          load: [appConfig],
          validate: validateEnv
        }),
        FirebaseModule
      ]
    }).compile();

    const secondModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: false,
          load: [appConfig],
          validate: validateEnv
        }),
        FirebaseModule
      ]
    }).compile();

    expect(firstModule.get(FIREBASE_APP)).toBe(app);
    expect(secondModule.get(FIREBASE_APP)).toBe(app);
    expect(getApps).toHaveBeenCalledTimes(2);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(initializeApp).toHaveBeenCalledWith({
      projectId: 'orbix-local-dev'
    });
    expect(getAuth).toHaveBeenCalledWith(app);
  });

  it('uses the validated Development credential for Railway', async () => {
    const projectId = 'orbix-dev-test-123';
    const privateKey =
      '-----BEGIN PRIVATE KEY-----\nfake-development-key\n-----END PRIVATE KEY-----\n';
    const clientEmail = 'firebase-development@example.invalid';

    process.env.APP_ENV = 'development';
    process.env.NODE_ENV = 'development';
    process.env.DATA_BACKEND = 'firestore';
    process.env.FIREBASE_TARGET = 'development';
    process.env.ALLOW_REAL_FIREBASE = 'true';
    process.env.FIREBASE_PROJECT_ID = projectId;
    process.env.FIREBASE_DEVELOPMENT_PROJECT_ID = projectId;
    process.env.FIREBASE_CREDENTIAL_SOURCE = 'base64';
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 =
      Buffer.from(
        JSON.stringify({
          type: 'service_account',
          project_id: projectId,
          client_email: clientEmail,
          private_key: privateKey
        })
      ).toString('base64');

    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_EMULATOR_AUTH_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    const credential = {} as firebaseApp.Credential;
    const app = {
      name: '[DEFAULT]',
      options: { projectId }
    } as firebaseApp.App;

    jest.spyOn(firebaseApp, 'getApps').mockReturnValue([]);
    const cert = jest
      .spyOn(firebaseApp, 'cert')
      .mockReturnValue(credential);
    const initializeApp = jest
      .spyOn(firebaseApp, 'initializeApp')
      .mockReturnValue(app);

    jest
      .spyOn(await import('firebase-admin/auth'), 'getAuth')
      .mockReturnValue(
        {} as ReturnType<
          typeof import('firebase-admin/auth').getAuth
        >
      );

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: false,
          load: [appConfig],
          validate: validateEnv
        }),
        FirebaseModule
      ]
    }).compile();

    expect(moduleRef.get(FIREBASE_APP)).toBe(app);
    expect(cert).toHaveBeenCalledWith({
      projectId,
      clientEmail,
      privateKey
    });
    expect(initializeApp).toHaveBeenCalledWith({
      projectId,
      credential
    });
  });
});
