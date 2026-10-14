import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as firebaseApp from 'firebase-admin/app';
import appConfig from '../src/config/app.config';
import { validateEnv } from '../src/config/env.validation';
import { FirebaseModule } from '../src/modules/firebase/firebase.module';

describe('environment safety validation', () => {
  const base = {
    APP_ENV: 'local',
    NODE_ENV: 'test',
    DATA_BACKEND: 'memory',
    ALLOW_REAL_FIREBASE: 'false'
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects development without ALLOW_REAL_FIREBASE=true', () => {
    expect(() =>
      validateEnv({
        ...base,
        APP_ENV: 'development',
        NODE_ENV: 'development',
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'development',
        FIREBASE_PROJECT_ID: 'development-project-example'
      })
    ).toThrow('ALLOW_REAL_FIREBASE=true');
  });

  it('rejects development without FIREBASE_PROJECT_ID', () => {
    expect(() =>
      validateEnv({
        ...base,
        APP_ENV: 'development',
        NODE_ENV: 'development',
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'development',
        ALLOW_REAL_FIREBASE: 'true'
      })
    ).toThrow('FIREBASE_PROJECT_ID is required');
  });

  it('rejects placeholder Project ID', () => {
    expect(() =>
      validateEnv({
        ...base,
        APP_ENV: 'development',
        NODE_ENV: 'development',
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'development',
        ALLOW_REAL_FIREBASE: 'true',
        FIREBASE_PROJECT_ID: 'replace-with-development-project-id'
      })
    ).toThrow('placeholder');
  });

  it('rejects production always', () => {
    expect(() =>
      validateEnv({
        ...base,
        APP_ENV: 'production',
        NODE_ENV: 'production',
        FIREBASE_TARGET: 'production',
        FIREBASE_PROJECT_ID: 'some-project'
      })
    ).toThrow('Production Firebase target is disabled');
  });

  it('rejects emulator without FIRESTORE_EMULATOR_HOST', () => {
    expect(() =>
      validateEnv({
        ...base,
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'emulator',
        FIREBASE_PROJECT_ID: 'orbix-local-dev'
      })
    ).toThrow('FIRESTORE_EMULATOR_HOST');
  });

  it('rejects emulator with an unnecessary real project id', () => {
    expect(() =>
      validateEnv({
        ...base,
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'emulator',
        FIREBASE_PROJECT_ID: 'development-project-example',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080'
      })
    ).toThrow('orbix-local-dev');
  });

  it('allows memory without Firebase', () => {
    expect(validateEnv(base)).toMatchObject(base);
  });

  it('allows emulator with correct local settings', () => {
    expect(
      validateEnv({
        ...base,
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'emulator',
        FIREBASE_PROJECT_ID: 'orbix-local-dev',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080'
      })
    ).toBeDefined();
  });

  it('does not initialize Firebase Admin when validation fails', async () => {
    const initializeApp = jest.spyOn(firebaseApp, 'initializeApp');
    process.env.APP_ENV = 'development';
    process.env.NODE_ENV = 'development';
    process.env.DATA_BACKEND = 'firestore';
    process.env.FIREBASE_TARGET = 'development';
    process.env.ALLOW_REAL_FIREBASE = 'false';
    process.env.FIREBASE_PROJECT_ID = 'development-project-example';
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_EMULATOR_AUTH_HOST;

    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            cache: false,
            load: [appConfig],
            validate: validateEnv
          }),
          FirebaseModule
        ]
      }).compile()
    ).rejects.toThrow('ALLOW_REAL_FIREBASE=true');
    expect(initializeApp).not.toHaveBeenCalled();
  });
});
