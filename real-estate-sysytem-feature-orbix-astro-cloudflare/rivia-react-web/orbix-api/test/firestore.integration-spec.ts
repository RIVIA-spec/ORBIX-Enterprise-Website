import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { AuditService } from '../src/modules/audit/audit.service';
import { FirebaseTokenVerifier } from '../src/modules/firebase/firebase-token-verifier.service';

type MockUser = { uid: string; email: string; roles: string[] };

const users = new Map<string, MockUser>([
  ['customer-token', { uid: 'it-customer', email: 'customer@example.test', roles: ['customer'] }],
  ['owner-token', { uid: 'it-owner', email: 'owner@example.test', roles: ['partner'] }],
  ['other-token', { uid: 'it-other', email: 'other@example.test', roles: ['partner'] }],
  ['moderator-token', { uid: 'it-moderator', email: 'moderator@example.test', roles: ['moderator'] }]
]);

function decoded(user: MockUser): DecodedIdToken {
  return {
    uid: user.uid,
    email: user.email,
    email_verified: true,
    roles: user.roles,
    aud: 'orbix-local-dev',
    auth_time: 1,
    exp: 2,
    firebase: { identities: {}, sign_in_provider: 'password' },
    iat: 1,
    iss: 'https://securetoken.google.com/orbix-local-dev',
    sub: user.uid
  } as DecodedIdToken;
}

describe('Firestore emulator persistence', () => {
  jest.setTimeout(120000);
  let app: INestApplication;
  let audit: AuditService;

  beforeAll(() => {
    process.env.APP_ENV = 'local';
    process.env.NODE_ENV = 'test';
    process.env.DATA_BACKEND = 'firestore';
    process.env.FIREBASE_TARGET = 'emulator';
    process.env.ALLOW_REAL_FIREBASE = 'false';
    process.env.FIREBASE_PROJECT_ID = 'orbix-local-dev';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  });

  beforeEach(async () => {
    await clearEmulator();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(FirebaseTokenVerifier)
      .useValue({
        verifyIdToken: jest.fn((token: string) => {
          const user = users.get(token);
          if (!user) return Promise.reject(new Error('invalid-token'));
          return Promise.resolve(decoded(user));
        })
      })
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    audit = app.get(AuditService);
  });

  afterEach(async () => {
    await app?.close();
  });

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async function createPartner(token = 'owner-token') {
    const response = await request(app.getHttpServer())
      .post('/api/v1/partners')
      .set(auth(token))
      .send({ type: 'real_estate_office', legalName: 'Integration Office', displayName: 'Integration Office' })
      .expect(201);
    return response.body as { id: string };
  }

  async function createDraft(partnerId: string, title = 'Integration Property') {
    const response = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth('owner-token'))
      .send({ partnerId, listingType: 'sale', propertyType: 'apartment', title, city: 'Riyadh', price: 100000 })
      .expect(201);
    return response.body as { id: string; createdAt: string; partnerId: string; status: string };
  }

  async function publish(propertyId: string) {
    await request(app.getHttpServer()).post(`/api/v1/properties/${propertyId}/submit`).set(auth('owner-token')).expect(201);
    return request(app.getHttpServer()).post(`/api/v1/admin/properties/${propertyId}/publish`).set(auth('moderator-token')).expect(201);
  }

  it('persists records and reads them after repository restart', async () => {
    const first = await request(app.getHttpServer()).get('/api/v1/users/me').set(auth('customer-token')).expect(200);
    await app.close();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(FirebaseTokenVerifier)
      .useValue({ verifyIdToken: jest.fn(() => Promise.resolve(decoded(users.get('customer-token') as MockUser))) })
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    await request(app.getHttpServer()).get('/api/v1/users/me').set(auth('customer-token')).expect(200).expect(({ body }) => {
      expect(body.uid).toBe(first.body.uid);
    });
  });

  it('creates partner, owner membership, and audit atomically', async () => {
    const partner = await createPartner();
    await request(app.getHttpServer()).get(`/api/v1/partners/${partner.id}/members`).set(auth('owner-token')).expect(200).expect(({ body }) => {
      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ userId: 'it-owner', role: 'owner' })]));
    });
    await expect(audit.listForTesting()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ action: 'partner.created', entityId: partner.id })]));
  });

  it('rolls back partner transaction when audit write path fails', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/partners')
      .set(auth('owner-token'))
      .send({ type: 'real_estate_office', legalName: '__fail_audit__', displayName: 'Rollback' })
      .expect(500);

    await request(app.getHttpServer()).get('/api/v1/partners/my').set(auth('owner-token')).expect(200).expect(({ body }) => {
      expect(body).toHaveLength(0);
    });
  });

  it('blocks non-member partner updates and isolates partner data', async () => {
    const partner = await createPartner();
    await request(app.getHttpServer()).patch(`/api/v1/partners/${partner.id}`).set(auth('other-token')).send({ displayName: 'Nope' }).expect(403);
    await request(app.getHttpServer()).get(`/api/v1/partners/${partner.id}/leads`).set(auth('other-token')).expect(403);
  });

  it('does not expose draft properties publicly by list or id', async () => {
    const partner = await createPartner();
    const property = await createDraft(partner.id);
    await request(app.getHttpServer()).get('/api/v1/properties').expect(200).expect(({ body }) => expect(body.items).toHaveLength(0));
    await request(app.getHttpServer()).get(`/api/v1/properties/${property.id}`).expect(404);
  });

  it('enforces valid and invalid property transitions', async () => {
    const partner = await createPartner();
    const property = await createDraft(partner.id);
    await request(app.getHttpServer()).post(`/api/v1/admin/properties/${property.id}/publish`).set(auth('moderator-token')).expect(409);
    await publish(property.id);
    await request(app.getHttpServer()).post(`/api/v1/properties/${property.id}/archive`).set(auth('owner-token')).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/properties/${property.id}/submit`).set(auth('owner-token')).expect(409);
  });

  it('creates leads only for published properties and derives partnerId', async () => {
    const partner = await createPartner();
    const property = await createDraft(partner.id);
    await request(app.getHttpServer()).post('/api/v1/leads').set(auth('customer-token')).send({ type: 'property_inquiry', propertyId: property.id, name: 'Lead', source: 'web' }).expect(404);
    await publish(property.id);
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth('customer-token'))
      .send({ type: 'property_inquiry', propertyId: property.id, partnerId: 'fake', name: 'Lead', source: 'web', token: 'secret' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth('customer-token'))
      .send({ type: 'property_inquiry', propertyId: property.id, partnerId: 'fake', name: 'Lead', source: 'web' })
      .expect(201)
      .expect(({ body }) => expect(body.partnerId).toBe(partner.id));
  });

  it('paginates with cursor and maps dates to ISO strings', async () => {
    const partner = await createPartner();
    const one = await createDraft(partner.id, 'One');
    await createDraft(partner.id, 'Two');
    await request(app.getHttpServer()).get(`/api/v1/partners/${partner.id}/properties?limit=1`).set(auth('owner-token')).expect(200).expect(({ body }) => {
      expect(body.items).toHaveLength(1);
      expect(typeof body.items[0].createdAt).toBe('string');
      expect(body.items[0].createdAt).toContain('T');
      expect(body.nextCursor).toBeDefined();
    });
    await publish(one.id);
    const lead = await request(app.getHttpServer()).post('/api/v1/leads').set(auth('customer-token')).send({ type: 'property_inquiry', propertyId: one.id, name: 'Lead', source: 'web' }).expect(201);
    await request(app.getHttpServer()).post('/api/v1/leads').set(auth('customer-token')).send({ type: 'partnership_request', name: 'Partner Lead', source: 'web' }).expect(201);
    await request(app.getHttpServer()).get('/api/v1/leads/my?limit=1').set(auth('customer-token')).expect(200).expect(({ body }) => {
      expect(body.items).toHaveLength(1);
      expect(typeof body.items[0].createdAt).toBe('string');
      expect(body.nextCursor).toBeDefined();
    });
    expect(lead.body.customerUid).toBe('it-customer');
  });

  it('does not store tokens in audit logs and blocks mass assignment', async () => {
    const partner = await createPartner();
    const property = await createDraft(partner.id);
    await publish(property.id);
    const lead = await request(app.getHttpServer()).post('/api/v1/leads').set(auth('customer-token')).send({ type: 'property_inquiry', propertyId: property.id, name: 'Lead', source: 'web' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/leads/${lead.body.id}/status`).set(auth('owner-token')).send({ status: 'contacted', token: 'do-not-store' }).expect(400);
    await request(app.getHttpServer()).patch(`/api/v1/leads/${lead.body.id}/status`).set(auth('owner-token')).send({ status: 'contacted' }).expect(200);
    const logs = await audit.listForTesting();
    expect(JSON.stringify(logs)).not.toContain('do-not-store');
    await request(app.getHttpServer()).patch('/api/v1/users/me').set(auth('customer-token')).send({ uid: 'fake', status: 'suspended' }).expect(400);
  });
});

async function clearEmulator(): Promise<void> {
  const app = getApps()[0] ?? initializeApp({ projectId: 'orbix-local-dev' }, 'integration-cleaner');
  const db = getFirestore(app);
  for (const collection of ['users', 'partners', 'partnerMembers', 'properties', 'leads', 'auditLogs']) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}
