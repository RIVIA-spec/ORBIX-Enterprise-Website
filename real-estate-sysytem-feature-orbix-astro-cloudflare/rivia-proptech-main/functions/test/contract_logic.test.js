const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {
  CONTRACT_STATUSES,
  COMMISSION_STATUSES,
  isOpenContractStatus,
  statusFromDocusealSubmission,
  buildWebhookEventKey,
  verifyDocusealSignature,
  verifyStripeSignature,
  calculateCommission,
} = require('../contract_logic');

test('detects active direct-party contract statuses for duplicate prevention', () => {
  assert.equal(isOpenContractStatus(CONTRACT_STATUSES.DRAFT), true);
  assert.equal(isOpenContractStatus(CONTRACT_STATUSES.AWAITING_PARTY_A_SIGNATURE), true);
  assert.equal(isOpenContractStatus(CONTRACT_STATUSES.AWAITING_PARTY_B_SIGNATURE), true);
  assert.equal(isOpenContractStatus(CONTRACT_STATUSES.COMPLETED), false);
  assert.equal(isOpenContractStatus(CONTRACT_STATUSES.EXPIRED), false);
});

test('moves direct-party contract to party B after party A signs', () => {
  const contract = {partyAExternalId: 'contract_1:partyA', partyBExternalId: 'contract_1:partyB'};
  const submission = {
    submitters: [
      {external_id: 'contract_1:partyA', role: 'Party A', status: 'completed'},
      {external_id: 'contract_1:partyB', role: 'Party B', status: 'sent'},
    ],
  };
  assert.equal(
    statusFromDocusealSubmission(contract, submission, 'form.completed'),
    CONTRACT_STATUSES.AWAITING_PARTY_B_SIGNATURE
  );
});

test('moves direct-party contract to completed only when both parties signed', () => {
  const contract = {partyAExternalId: 'contract_1:partyA', partyBExternalId: 'contract_1:partyB'};
  const submission = {
    submitters: [
      {external_id: 'contract_1:partyA', role: 'Party A', status: 'completed'},
      {external_id: 'contract_1:partyB', role: 'Party B', status: 'completed'},
    ],
  };
  assert.equal(
    statusFromDocusealSubmission(contract, submission, 'submission.completed'),
    CONTRACT_STATUSES.COMPLETED
  );
});

test('webhook event key is stable for idempotency', () => {
  const payload = {event_type: 'form.completed', timestamp: '2026-08-27T12:00:00Z', data: {id: 9, submission_id: 3}};
  assert.equal(buildWebhookEventKey(payload), buildWebhookEventKey({...payload}));
});

test('verifies official DocuSeal timestamped HMAC signature', () => {
  const secret = 'whsec_docuseal_test';
  const timestamp = 1798372800;
  const rawBody = Buffer.from('{"event_type":"submission.completed"}');
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  assert.equal(verifyDocusealSignature(rawBody, `${timestamp}.${signature}`, secret, timestamp * 1000), true);
  assert.equal(verifyDocusealSignature(rawBody, `${timestamp}.${signature}`, secret, (timestamp + 301) * 1000), false);
});

test('verifies Stripe webhook signature', () => {
  const secret = 'whsec_stripe_test';
  const timestamp = 1798372800;
  const rawBody = Buffer.from('{"type":"checkout.session.completed"}');
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  assert.equal(verifyStripeSignature(rawBody, `t=${timestamp},v1=${signature}`, secret, timestamp * 1000), true);
  assert.equal(verifyStripeSignature(rawBody, `t=${timestamp},v1=bad`, secret, timestamp * 1000), false);
});

test('calculates Orbix commission from server-side transaction type', () => {
  const sale = calculateCommission({type: 'property_sale', currency: 'usd'});
  const hotel = calculateCommission({type: 'hotel_booking', currency: 'usd'});
  assert.equal(sale.amount, 2500);
  assert.equal(sale.ruleSnapshot.source, 'mvp_property_sale');
  assert.equal(hotel.amount, 500);
  assert.equal(COMMISSION_STATUSES.DUE, 'due');
});
