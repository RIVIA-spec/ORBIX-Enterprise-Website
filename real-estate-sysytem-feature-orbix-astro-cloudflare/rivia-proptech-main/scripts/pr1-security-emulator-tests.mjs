const projectId = process.env.GCLOUD_PROJECT || 'rivia-proptech-a0ff2';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001';
const bucket = process.env.STORAGE_BUCKET || `${projectId}.appspot.com`;
const databaseRoot = `http://${firestoreHost}/v1/projects/${projectId}/databases/(default)/documents`;
const skipStorage = process.env.SKIP_STORAGE === '1';

const results = [];

function value(input) {
  if (input === null) return { nullValue: null };
  if (typeof input === 'boolean') return { booleanValue: input };
  if (typeof input === 'number' && Number.isInteger(input)) return { integerValue: String(input) };
  if (typeof input === 'number') return { doubleValue: input };
  if (input instanceof Date) return { timestampValue: input.toISOString() };
  return { stringValue: String(input) };
}

function fields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, item]) => [key, value(item)]));
}

async function request(method, url, token, body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof Uint8Array) ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? (body instanceof Uint8Array ? body : JSON.stringify(body)) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { response, json };
}

async function signUp(uidHint) {
  const email = `${uidHint}-${Date.now()}@example.test`;
  const { response, json } = await request(
    'POST',
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`,
    null,
    { email, password: 'Password123!', returnSecureToken: true },
  );
  if (!response.ok) throw new Error(`Auth signup failed: ${response.status} ${JSON.stringify(json)}`);
  return { uid: json.localId, token: json.idToken, email };
}

async function setDoc(path, data, token = 'owner') {
  return request('PATCH', `${databaseRoot}/${path}`, token, { fields: fields(data) });
}

async function getDoc(path, token) {
  return request('GET', `${databaseRoot}/${path}`, token);
}

async function patchDoc(path, data, token) {
  return request('PATCH', `${databaseRoot}/${path}?updateMask.fieldPaths=${Object.keys(data).map(encodeURIComponent).join('&updateMask.fieldPaths=')}`, token, { fields: fields(data) });
}

async function deleteDoc(path, token) {
  return request('DELETE', `${databaseRoot}/${path}`, token);
}

async function callFunction(name, token, data) {
  return request('POST', `http://${functionsHost}/${projectId}/us-central1/${name}`, token, { data });
}

async function uploadObject(path, token, bytes, contentType) {
  return request(
    'POST',
    `http://${storageHost}/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`,
    token,
    bytes,
    { 'content-type': contentType },
  );
}

async function expectStatus(name, promise, expected) {
  try {
    const { response, json } = await promise;
    const passed = Array.isArray(expected) ? expected.includes(response.status) : response.status === expected;
    results.push({ name, status: passed ? 'Passed' : 'Failed', detail: `expected ${expected}, got ${response.status}`, body: json });
  } catch (error) {
    results.push({ name, status: 'Failed', detail: error.message });
  }
}

async function expectCallableError(name, promise, code) {
  try {
    const { response, json } = await promise;
    const actual = json?.error?.status || json?.error?.message || response.status;
    const passed = JSON.stringify(json).toLowerCase().includes(code.toLowerCase());
    results.push({ name, status: passed ? 'Passed' : 'Failed', detail: `expected ${code}, got ${actual}`, body: json });
  } catch (error) {
    results.push({ name, status: 'Failed', detail: error.message });
  }
}

async function main() {
  const customer = await signUp('customer');
  const owner = await signUp('owner');
  const unrelated = await signUp('unrelated');
  const admin = await signUp('admin');
  const superadmin = await signUp('superadmin');
  const ownerRole = await signUp('ownerrole');

  await setDoc(`users/${customer.uid}`, { uid: customer.uid, username: 'Customer', email: customer.email, isActive: true, isVerified: true });
  await setDoc(`users/${owner.uid}`, { uid: owner.uid, username: 'Owner', email: owner.email, isActive: true, isVerified: true });
  await setDoc(`users/${unrelated.uid}`, { uid: unrelated.uid, username: 'Other', email: unrelated.email, isActive: true, isVerified: true });
  await setDoc(`users/${admin.uid}`, { uid: admin.uid, username: 'Admin', email: admin.email, role: 'admin', isActive: true, isVerified: true });
  await setDoc(`users/${superadmin.uid}`, { uid: superadmin.uid, username: 'Super', email: superadmin.email, platformRole: 'superadmin', isActive: true, isVerified: true });
  await setDoc(`users/${ownerRole.uid}`, { uid: ownerRole.uid, username: 'OwnerRole', email: ownerRole.email, role: 'owner', isActive: true, isVerified: true });

  await setDoc('properties/publicProp', { title: 'Public property', isVisible: true });
  await setDoc('hotels/publicHotel', { title: 'Public hotel', isVisible: true });
  await setDoc('deals/deal1', {
    dealId: 'deal1',
    propertyId: 'prop1',
    ownerUserId: owner.uid,
    customerUserId: customer.uid,
    listingType: 'property',
    status: 'pending',
    contractStatus: 'not_created',
    paymentStatus: 'unpaid',
    customerNote: 'hello',
  });
  await setDoc(`users/${customer.uid}/user_bookings/booking1`, {
    bookingId: 'booking1',
    propertyId: 'prop1',
    ownerUserId: owner.uid,
    customerUserId: customer.uid,
    status: 'pending',
  });

  await expectCallableError('createContract unauthenticated denied', callFunction('createContractForDeal', null, { dealId: 'deal1' }), 'UNAUTHENTICATED');
  await expectCallableError('legacy createContract disabled for customer', callFunction('createContractForDeal', customer.token, { dealId: 'deal1' }), 'FAILED_PRECONDITION');
  await expectCallableError('legacy createContract disabled for owner', callFunction('createContractForDeal', owner.token, { dealId: 'deal1' }), 'FAILED_PRECONDITION');
  await expectCallableError('legacy createContract disabled for admin', callFunction('createContractForDeal', admin.token, { dealId: 'deal1' }), 'FAILED_PRECONDITION');

  await expectCallableError('queueEmail unauthenticated denied', callFunction('queueAdminEmail', null, { emailType: 'purchase', dealId: 'deal1' }), 'UNAUTHENTICATED');
  await expectCallableError('queueEmail unsupported type denied', callFunction('queueAdminEmail', customer.token, { emailType: 'evil', dealId: 'deal1' }), 'INVALID_ARGUMENT');
  await expectCallableError('queueEmail arbitrary recipient denied', callFunction('queueAdminEmail', customer.token, { emailType: 'purchase', dealId: 'deal1', recipients: ['x@example.test'] }), 'INVALID_ARGUMENT');
  await expectCallableError('queueEmail arbitrary html url denied', callFunction('queueAdminEmail', customer.token, { emailType: 'purchase', dealId: 'deal1', metadata: { html: '<b>x</b>', url: 'https://evil.test' } }), 'INVALID_ARGUMENT');
  await expectCallableError('queueEmail sender role denied', callFunction('queueAdminEmail', customer.token, { emailType: 'purchase', dealId: 'deal1', senderRole: 'admin' }), 'INVALID_ARGUMENT');
  await expectCallableError('queueEmail unrelated deal denied', callFunction('queueAdminEmail', unrelated.token, { emailType: 'purchase', dealId: 'deal1' }), 'PERMISSION_DENIED');
  await expectCallableError('queueEmail unrelated booking denied', callFunction('queueAdminEmail', unrelated.token, { emailType: 'property_booking', bookingId: 'booking1' }), 'NOT_FOUND');
  await expectStatus('queueEmail valid purchase validation reaches worker', callFunction('queueAdminEmail', customer.token, { emailType: 'purchase', dealId: 'deal1' }), [200, 500]);
  await expectCallableError('queueEmail repeated request rate-limited', callFunction('queueAdminEmail', customer.token, { emailType: 'purchase', dealId: 'deal1' }), 'ALREADY_EXISTS');
  await expectStatus('queueEmail valid property booking validation reaches worker', callFunction('queueAdminEmail', customer.token, { emailType: 'property_booking', bookingId: 'booking1' }), [200, 500]);
  await expectStatus('queueEmail admin contract request validation reaches worker', callFunction('queueAdminEmail', admin.token, { emailType: 'contract_request', relatedId: 'deal1' }), [200, 500]);

  const newUser = await signUp('newuser');
  await expectStatus('rules users valid own profile create', setDoc(`users/${newUser.uid}`, { uid: newUser.uid, username: 'New', email: newUser.email, isActive: true, isVerified: false, created_at: new Date() }, newUser.token), 200);
  const badUser = await signUp('baduser');
  await expectStatus('rules users role create denied', setDoc(`users/${badUser.uid}`, { uid: badUser.uid, username: 'Bad', role: 'admin' }, badUser.token), 403);
  await expectStatus('rules users allowed profile update', patchDoc(`users/${newUser.uid}`, { displayName: 'Updated' }, newUser.token), 200);
  await expectStatus('rules users role update denied', patchDoc(`users/${newUser.uid}`, { role: 'admin' }, newUser.token), 403);
  await expectStatus('rules users verification update denied', patchDoc(`users/${newUser.uid}`, { isVerified: true }, newUser.token), 403);
  await expectStatus('rules users unrelated update denied', patchDoc(`users/${newUser.uid}`, { displayName: 'Bad' }, unrelated.token), 403);
  await expectStatus('rules users unauthorized delete denied', deleteDoc(`users/${newUser.uid}`, newUser.token), 403);

  await expectStatus('rules deals party can read own deal', getDoc('deals/deal1', customer.token), 200);
  await expectStatus('rules deals unrelated cannot read', getDoc('deals/deal1', unrelated.token), 403);
  await expectStatus('rules deals client cannot mark paid', patchDoc('deals/deal1', { paymentStatus: 'paid' }, customer.token), 403);
  await expectStatus('rules deals client cannot change contract status', patchDoc('deals/deal1', { contractStatus: 'signed' }, customer.token), 403);
  await expectStatus('rules deals client cannot change total amount', patchDoc('deals/deal1', { totalAmount: 999 }, customer.token), 403);
  await expectStatus('rules deals client cannot change parties', patchDoc('deals/deal1', { ownerUserId: unrelated.uid }, customer.token), 403);
  await expectStatus('rules deals allowed note update succeeds', patchDoc('deals/deal1', { customerNote: 'updated' }, customer.token), 200);
  await expectStatus('rules deals client delete denied', deleteDoc('deals/deal1', customer.token), 403);
  await expectStatus('rules deals admin sensitive update succeeds', patchDoc('deals/deal1', { paymentStatus: 'paid' }, admin.token), 200);

  await expectStatus('regression public property read', getDoc('properties/publicProp', null), 200);
  await expectStatus('regression public hotel read', getDoc('hotels/publicHotel', null), 200);
  await expectStatus('regression booking create remains permitted', setDoc(`users/${customer.uid}/user_bookings/regressionBooking`, { bookingId: 'regressionBooking', customerUserId: customer.uid, status: 'pending' }, customer.token), 200);

  if (!skipStorage) {
    await expectStatus('storage valid property image succeeds', uploadObject(`properties/${customer.uid}/property_images/ok.png`, customer.token, new Uint8Array([1, 2, 3]), 'image/png'), 200);
    await expectStatus('storage oversized property image denied', uploadObject(`properties/${customer.uid}/property_images/big.png`, customer.token, new Uint8Array(11 * 1024 * 1024), 'image/png'), 403);
    await expectStatus('storage executable denied', uploadObject(`properties/${customer.uid}/property_images/a.exe`, customer.token, new Uint8Array([1, 2]), 'application/x-msdownload'), 403);
    await expectStatus('storage invalid contentType denied', uploadObject(`properties/${customer.uid}/property_images/a.txt`, customer.token, new Uint8Array([1, 2]), 'text/plain'), 403);
    await expectStatus('storage valid panorama succeeds', uploadObject(`properties/${customer.uid}/panorama_tours/pano.webp`, customer.token, new Uint8Array([1, 2, 3]), 'image/webp'), 200);
    await expectStatus('storage unauthorized id verification read denied', request('GET', `http://${storageHost}/v0/b/${bucket}/o/${encodeURIComponent(`id_verifications/${customer.uid}/front.jpg`)}`, unrelated.token), 403);
    await expectStatus('storage non-staff hotel upload denied', uploadObject('hotels/hotel1/images/ok.png', customer.token, new Uint8Array([1, 2]), 'image/png'), 403);
    await expectStatus('storage staff hotel upload succeeds', uploadObject('hotels/hotel1/images/ok.png', admin.token, new Uint8Array([1, 2]), 'image/png'), 200);
    await expectStatus('storage non-staff ads upload denied', uploadObject('ads/ad.png', customer.token, new Uint8Array([1, 2]), 'image/png'), 403);
    await expectStatus('storage staff ads upload succeeds', uploadObject('ads/ad.png', admin.token, new Uint8Array([1, 2]), 'image/png'), 200);
  }

  console.table(results.map(({ name, status, detail }) => ({ name, status, detail })));
  const failed = results.filter((item) => item.status !== 'Passed');
  if (failed.length > 0) {
    console.error(JSON.stringify(failed, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
