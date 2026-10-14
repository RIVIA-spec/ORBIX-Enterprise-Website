const admin = require('firebase-admin');

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Seed refused: FIRESTORE_EMULATOR_HOST is required');
}
if (process.env.FIREBASE_TARGET !== 'emulator') {
  throw new Error('Seed refused: FIREBASE_TARGET=emulator is required');
}
if (process.env.ALLOW_REAL_FIREBASE === 'true') {
  throw new Error('Seed refused: ALLOW_REAL_FIREBASE must not be true');
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'orbix-local-dev';
if (projectId !== 'orbix-local-dev') {
  throw new Error('Seed refused: only orbix-local-dev is allowed');
}

admin.initializeApp({ projectId });
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();

async function seed() {
  const batch = db.batch();

  batch.set(db.collection('users').doc('admin-demo'), {
    email: 'admin.demo@example.test',
    displayName: 'Admin Demo',
    role: 'admin',
    status: 'active',
    locale: 'en',
    createdAt: now,
    updatedAt: now
  });
  batch.set(db.collection('users').doc('customer-demo'), {
    email: 'customer.demo@example.test',
    displayName: 'Customer Demo',
    role: 'customer',
    status: 'active',
    locale: 'en',
    createdAt: now,
    updatedAt: now
  });
  batch.set(db.collection('users').doc('owner-demo'), {
    email: 'owner.demo@example.test',
    displayName: 'Partner Owner Demo',
    role: 'partner',
    status: 'active',
    locale: 'en',
    createdAt: now,
    updatedAt: now
  });

  const partnerId = 'partner-demo';
  batch.set(db.collection('partners').doc(partnerId), {
    type: 'real_estate_office',
    legalName: 'Demo Real Estate Office',
    displayName: 'Demo Office',
    ownerUid: 'owner-demo',
    status: 'active',
    verificationStatus: 'verified',
    createdAt: now,
    updatedAt: now
  });
  batch.set(db.collection('partnerMembers').doc('partner-demo-owner'), {
    partnerId,
    userId: 'owner-demo',
    role: 'owner',
    status: 'active',
    createdAt: now,
    updatedAt: now
  });
  batch.set(db.collection('properties').doc('property-draft-demo'), {
    partnerId,
    ownerUid: 'owner-demo',
    listingType: 'sale',
    propertyType: 'apartment',
    title: 'Draft Demo Property',
    city: 'Riyadh',
    price: 100000,
    features: [],
    mediaIds: [],
    status: 'draft',
    verificationStatus: 'unverified',
    createdAt: now,
    updatedAt: now
  });
  batch.set(db.collection('properties').doc('property-published-demo'), {
    partnerId,
    ownerUid: 'owner-demo',
    listingType: 'sale',
    propertyType: 'villa',
    title: 'Published Demo Property',
    city: 'Riyadh',
    price: 250000,
    features: [],
    mediaIds: [],
    status: 'published',
    verificationStatus: 'verified',
    createdAt: now,
    updatedAt: now,
    publishedAt: now
  });

  await batch.commit();
  console.log('Seeded Firestore emulator for orbix-local-dev');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
