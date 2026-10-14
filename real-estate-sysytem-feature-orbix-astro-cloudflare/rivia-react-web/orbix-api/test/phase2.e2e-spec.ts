import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { DecodedIdToken } from 'firebase-admin/auth';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { AuditService } from '../src/modules/audit/audit.service';
import { FirebaseTokenVerifier } from '../src/modules/firebase/firebase-token-verifier.service';

type MockUser = {
  uid: string;
  email: string;
  roles?: string[];
};

function decoded(user: MockUser): DecodedIdToken {
  return {
    uid: user.uid,
    email: user.email,
    email_verified: true,
    roles: user.roles ?? ['customer'],
    aud: 'orbix-test',
    auth_time: 1,
    exp: 2,
    firebase: { identities: {}, sign_in_provider: 'password' },
    iat: 1,
    iss: 'https://securetoken.google.com/orbix-test',
    sub: user.uid
  } as DecodedIdToken;
}

describe('Phase 2 modules', () => {
  let app: INestApplication;
  let audit: AuditService;

  const tokens = new Map<string, MockUser>([
    ['customer-token', { uid: 'customer-1', email: 'customer@example.com', roles: ['customer'] }],
    ['other-token', { uid: 'other-1', email: 'other@example.com', roles: ['customer'] }],
    ['owner-token', { uid: 'owner-1', email: 'owner@example.com', roles: ['partner'] }],
    ['manager-token', { uid: 'manager-1', email: 'manager@example.com', roles: ['partner_staff'] }],
    ['moderator-token', { uid: 'moderator-1', email: 'moderator@example.com', roles: ['moderator'] }],
    ['admin-token', { uid: 'admin-1', email: 'admin@example.com', roles: ['admin'] }]
  ]);

  beforeEach(async () => {
    process.env.APP_ENV = 'local';
    process.env.NODE_ENV = 'test';
    process.env.DATA_BACKEND = 'memory';
    process.env.ALLOW_REAL_FIREBASE = 'false';
    process.env.SWAGGER_ENABLED = 'false';
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_TARGET;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_EMULATOR_AUTH_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(FirebaseTokenVerifier)
      .useValue({
        verifyIdToken: jest.fn((token: string) => {
          const user = tokens.get(token);
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
      .send({ type: 'real_estate_office', legalName: 'Rivia Real Estate LLC', displayName: 'Rivia Office' })
      .expect(201);
    return response.body as { id: string };
  }

  async function createSubmittedProperty(partnerId: string) {
    const created = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth('owner-token'))
      .send({ partnerId, listingType: 'sale', propertyType: 'apartment', title: 'City Apartment', city: 'Riyadh', price: 100000 })
      .expect(201);

    await request(app.getHttpServer()).post(`/api/v1/properties/${created.body.id}/submit`).set(auth('owner-token')).expect(201);
    return created.body as { id: string; partnerId: string };
  }

  it('creates the current user profile on first login', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').set(auth('customer-token')).expect(200).expect(({ body }) => {
      expect(body.uid).toBe('customer-1');
      expect(body.role).toBe('customer');
      expect(body.status).toBe('active');
    });
  });

  it('prevents users from changing role through PATCH /users/me', async () => {
    await request(app.getHttpServer()).patch('/api/v1/users/me').set(auth('customer-token')).send({ displayName: 'Customer', role: 'admin' }).expect(400);
  });

  it('prevents a normal user from managing users', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/users').set(auth('customer-token')).expect(403);
  });

  it('makes the partner creator the owner', async () => {
    const partner = await createPartner();
    await request(app.getHttpServer()).get(`/api/v1/partners/${partner.id}/members`).set(auth('owner-token')).expect(200).expect(({ body }) => {
      expect(body).toEqual(expect.arrayContaining([expect.objectContaining({ userId: 'owner-1', role: 'owner', status: 'active' })]));
    });
  });

  it('prevents non-members from updating a partner', async () => {
    const partner = await createPartner();
    await request(app.getHttpServer()).patch(`/api/v1/partners/${partner.id}`).set(auth('other-token')).send({ displayName: 'Other' }).expect(403);
  });

  it('prevents a partner from verifying itself', async () => {
    const partner = await createPartner();
    await request(app.getHttpServer()).patch(`/api/v1/admin/partners/${partner.id}/verification`).set(auth('owner-token')).send({ verificationStatus: 'verified' }).expect(403);
  });

  it('enforces partner team permissions', async () => {
    const partner = await createPartner();
    await request(app.getHttpServer()).post(`/api/v1/partners/${partner.id}/members`).set(auth('owner-token')).send({ userId: 'manager-1', role: 'manager' }).expect(201);
    await request(app.getHttpServer()).patch(`/api/v1/partners/${partner.id}`).set(auth('manager-token')).send({ displayName: 'Managed Office' }).expect(200);
  });

  it('creates properties as draft and prevents direct publication by partners', async () => {
    const partner = await createPartner();
    const created = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth('owner-token'))
      .send({ partnerId: partner.id, listingType: 'sale', propertyType: 'villa', title: 'Draft Villa' })
      .expect(201);
    expect(created.body.status).toBe('draft');

    await request(app.getHttpServer()).post(`/api/v1/admin/properties/${created.body.id}/publish`).set(auth('owner-token')).expect(403);
  });

  it('prevents updating another partner property', async () => {
    const partner = await createPartner();
    const created = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth('owner-token'))
      .send({ partnerId: partner.id, listingType: 'sale', propertyType: 'apartment', title: 'Owned' })
      .expect(201);

    await request(app.getHttpServer()).patch(`/api/v1/properties/${created.body.id}`).set(auth('other-token')).send({ title: 'Hijacked' }).expect(403);
  });

  it('shows only published properties publicly and lets moderators publish', async () => {
    const partner = await createPartner();
    const property = await createSubmittedProperty(partner.id);

    await request(app.getHttpServer()).get('/api/v1/properties').expect(200).expect(({ body }) => {
      expect(body.items).toHaveLength(0);
    });

    await request(app.getHttpServer()).post(`/api/v1/admin/properties/${property.id}/publish`).set(auth('moderator-token')).expect(201);
    await request(app.getHttpServer()).get('/api/v1/properties').expect(200).expect(({ body }) => {
      expect(body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: property.id, status: 'published' })]));
    });
  });

  it('rejects property submit when required fields are missing', async () => {
    const partner = await createPartner();
    const created = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set(auth('owner-token'))
      .send({ partnerId: partner.id, listingType: 'sale', propertyType: 'land' })
      .expect(201);

    await request(app.getHttpServer()).post(`/api/v1/properties/${created.body.id}/submit`).set(auth('owner-token')).expect(400);
  });

  it('prevents leads for unpublished properties and derives partnerId from published property', async () => {
    const partner = await createPartner();
    const property = await createSubmittedProperty(partner.id);

    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth('customer-token'))
      .send({ type: 'property_inquiry', propertyId: property.id, name: 'Customer', source: 'web' })
      .expect(404);

    await request(app.getHttpServer()).post(`/api/v1/admin/properties/${property.id}/publish`).set(auth('moderator-token')).expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth('customer-token'))
      .send({ type: 'property_inquiry', propertyId: property.id, name: 'Customer', source: 'web', partnerId: 'spoofed-partner' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.partnerId).toBe(partner.id);
      });
  });

  it('restricts lead visibility to the customer and the owning partner', async () => {
    const partner = await createPartner();
    const property = await createSubmittedProperty(partner.id);
    await request(app.getHttpServer()).post(`/api/v1/admin/properties/${property.id}/publish`).set(auth('moderator-token')).expect(201);
    const lead = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth('customer-token'))
      .send({ type: 'property_inquiry', propertyId: property.id, name: 'Customer', source: 'web' })
      .expect(201);

    await request(app.getHttpServer()).get('/api/v1/leads/my').set(auth('customer-token')).expect(200).expect(({ body }) => {
      expect(body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: lead.body.id, customerUid: 'customer-1' })]));
    });

    await request(app.getHttpServer()).get(`/api/v1/partners/${partner.id}/leads`).set(auth('other-token')).expect(403);
    await request(app.getHttpServer()).get(`/api/v1/partners/${partner.id}/leads`).set(auth('owner-token')).expect(200);
  });

  it('records lead status changes in the audit log', async () => {
    const partner = await createPartner();
    const property = await createSubmittedProperty(partner.id);
    await request(app.getHttpServer()).post(`/api/v1/admin/properties/${property.id}/publish`).set(auth('moderator-token')).expect(201);
    const lead = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set(auth('customer-token'))
      .send({ type: 'property_inquiry', propertyId: property.id, name: 'Customer', source: 'web' })
      .expect(201);

    await request(app.getHttpServer()).patch(`/api/v1/leads/${lead.body.id}/status`).set(auth('owner-token')).send({ status: 'contacted' }).expect(200);

    await expect(audit.listForTesting()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ action: 'lead.status_updated', entityId: lead.body.id })]));
  });
});
