import { Controller, Get } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { DecodedIdToken } from 'firebase-admin/auth';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { FirebaseTokenVerifier } from '../src/modules/firebase/firebase-token-verifier.service';

@Controller('test-error')
class TestErrorController {
  @Get()
  getError(): never {
    throw new Error('unexpected failure');
  }
}

describe('Auth routes', () => {
  let app: INestApplication;
  let tokenVerifier: { verifyIdToken: jest.Mock<Promise<DecodedIdToken>, [string]> };

  async function createApp(nodeEnv = 'test', swaggerEnabled = false, corsOrigins = 'http://localhost:5173'): Promise<void> {
    process.env.APP_ENV = 'local';
    process.env.NODE_ENV = nodeEnv;
    process.env.DATA_BACKEND = 'memory';
    process.env.ALLOW_REAL_FIREBASE = 'false';
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_TARGET;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_EMULATOR_AUTH_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    process.env.CORS_ORIGINS = corsOrigins;
    process.env.SWAGGER_ENABLED = swaggerEnabled ? 'true' : 'false';

    tokenVerifier = {
      verifyIdToken: jest.fn().mockRejectedValue(new Error('invalid-token'))
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestErrorController]
    })
      .overrideProvider(FirebaseTokenVerifier)
      .useValue(tokenVerifier)
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  }

  beforeEach(async () => {
    await createApp();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('rejects requests without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401).expect(({ body }) => {
      expect(body.message).toBe('Missing bearer token');
      expect(body.statusCode).toBe(401);
    });
  });

  it('rejects requests with an invalid bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid-token').expect(401).expect(({ body }) => {
      expect(body.message).toBe('Invalid bearer token');
      expect(body.statusCode).toBe(401);
    });
  });

  it('returns the current user for a valid mocked Firebase token without calling production', async () => {
    tokenVerifier.verifyIdToken.mockResolvedValue({
      uid: 'firebase-user-1',
      email: 'user@example.com',
      email_verified: true,
      roles: ['customer'],
      aud: 'orbix-test',
      auth_time: 1,
      exp: 2,
      firebase: { identities: {}, sign_in_provider: 'password' },
      iat: 1,
      iss: 'https://securetoken.google.com/orbix-test',
      sub: 'firebase-user-1'
    } as DecodedIdToken);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token')
      .set('x-user-uid', 'frontend-spoof')
      .expect(200)
      .expect(({ body }) => {
        expect(body.uid).toBe('firebase-user-1');
        expect(body.email).toBe('user@example.com');
        expect(body.roles).toEqual(['customer']);
      });
  });

  it('returns a successful health response', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect(({ body }) => {
      expect(body.status).toBe('ok');
      expect(body.service).toBe('orbix-api');
    });
  });

  it('does not enable Swagger in production', async () => {
    await app.close();
    await createApp('production', true);

    await request(app.getHttpServer()).get('/docs').expect(404);
  });

  it('does not return stack traces from the exception filter in production', async () => {
    await app.close();
    await createApp('production');

    await request(app.getHttpServer()).get('/api/v1/test-error').expect(500).expect(({ body }) => {
      expect(body.message).toBe('Internal server error');
      expect(body.stack).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain('unexpected failure');
    });
  });

  it('does not allow origins absent from CORS_ORIGINS', async () => {
    await request(app.getHttpServer())
      .options('/api/v1/health')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .expect((response) => {
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      });
  });
});
