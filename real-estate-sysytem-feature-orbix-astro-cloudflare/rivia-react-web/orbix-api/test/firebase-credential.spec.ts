import { decodeFirebaseServiceAccountBase64 } from '../src/config/firebase-credential';
import { validateEnv } from '../src/config/env.validation';

const developmentProjectId = 'orbix-dev-test-123';

function encodeCredential(projectId: string): string {
  return Buffer.from(
    JSON.stringify({
      type: 'service_account',
      project_id: projectId,
      client_email: 'firebase-development@example.invalid',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nfake-development-key\n-----END PRIVATE KEY-----\n'
    })
  ).toString('base64');
}

describe('Firebase Railway credential safety', () => {
  it('decodes a valid base64 service account structure', () => {
    expect(
      decodeFirebaseServiceAccountBase64(
        encodeCredential(developmentProjectId)
      )
    ).toMatchObject({
      projectId: developmentProjectId,
      clientEmail: 'firebase-development@example.invalid'
    });
  });

  it('rejects malformed base64 credentials', () => {
    expect(() =>
      decodeFirebaseServiceAccountBase64('not-valid-base64')
    ).toThrow('valid base64-encoded');
  });

  it('accepts a credential matching the Development project', () => {
    expect(
      validateEnv({
        APP_ENV: 'development',
        NODE_ENV: 'development',
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'development',
        ALLOW_REAL_FIREBASE: 'true',
        FIREBASE_PROJECT_ID: developmentProjectId,
        FIREBASE_DEVELOPMENT_PROJECT_ID: developmentProjectId,
        FIREBASE_CREDENTIAL_SOURCE: 'base64',
        FIREBASE_SERVICE_ACCOUNT_JSON_BASE64:
          encodeCredential(developmentProjectId)
      })
    ).toBeDefined();
  });

  it('rejects a credential belonging to another project', () => {
    expect(() =>
      validateEnv({
        APP_ENV: 'development',
        NODE_ENV: 'development',
        DATA_BACKEND: 'firestore',
        FIREBASE_TARGET: 'development',
        ALLOW_REAL_FIREBASE: 'true',
        FIREBASE_PROJECT_ID: developmentProjectId,
        FIREBASE_DEVELOPMENT_PROJECT_ID: developmentProjectId,
        FIREBASE_CREDENTIAL_SOURCE: 'base64',
        FIREBASE_SERVICE_ACCOUNT_JSON_BASE64:
          encodeCredential('another-project-123')
      })
    ).toThrow('does not match the Development project');
  });
});
