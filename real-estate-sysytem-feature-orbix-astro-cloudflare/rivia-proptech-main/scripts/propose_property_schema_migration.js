/**
 * Dry-run helper for reviewing property documents that lack Flutter/React alias fields.
 *
 * This script intentionally does not write by default. To use it, install and
 * initialize firebase-admin credentials outside this repo, then run:
 *
 *   node scripts/propose_property_schema_migration.js
 *
 * Set APPLY_PROPERTY_SCHEMA_MIGRATION=true only after reviewing the printed
 * update plan. Do not run against production without a backup/export.
 */

const admin = require('firebase-admin');

const APPLY = process.env.APPLY_PROPERTY_SCHEMA_MIGRATION === 'true';

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

function text(value) {
  return String(value || '').trim().toLowerCase();
}

function flowKind(data) {
  const candidates = [
    data.listingType,
    data.listing_type,
    data.purpose,
    data.transactionType,
    data.offerType,
    data.offer_type,
    data.property_type,
    data.type,
  ].map(text);

  if (candidates.some((value) => ['sale', 'sell', 'purchase', 'for sale', 'بيع', 'للبيع'].includes(value))) return 'sale';
  if (candidates.some((value) => ['rent', 'rental', 'lease', 'for rent', 'إيجار', 'ايجار', 'للإيجار', 'للايجار'].includes(value))) return 'rent';
  if (candidates.some((value) => ['offplan', 'off-plan', 'newproject', 'new-project'].includes(value.replace(/[\s_]+/g, '-')))) return 'offPlan';
  if (first(data.pricing?.salePrice, data.salePrice, data.sellingPrice, data.selling_price)) return 'sale';
  if (first(data.pricing?.rentPrice, data.pricing?.dailyPrice, data.rentPrice, data.daily_price, data.monthly_price)) return 'rent';
  if (first(data.pricing?.startingPrice, data.startingPrice, data.starting_price)) return 'offPlan';
  return 'unknown';
}

function aliasesFor(data) {
  const update = {};
  const location = data.location || {};
  const pricing = data.pricing || {};
  const kind = flowKind(data);
  const currency = first(data.currency, data.priceCurrency, pricing.currency, data.selling_price_currency, data.daily_price_currency);
  const salePrice = first(pricing.salePrice, data.salePrice, data.sellingPrice, data.selling_price, kind === 'sale' ? data.price : undefined);
  const rentPrice = first(pricing.rentPrice, pricing.dailyPrice, data.rentPrice, data.daily_price, data.monthly_price, kind === 'rent' ? data.price : undefined);
  const startingPrice = first(pricing.startingPrice, data.startingPrice, data.starting_price, kind === 'offPlan' ? data.price : undefined);
  const price = first(kind === 'rent' ? rentPrice : undefined, kind === 'offPlan' ? startingPrice : undefined, kind === 'sale' ? salePrice : undefined, data.price);
  const title = first(data.title, data.titleAr, data.name);

  if (title && !data.title) update.title = title;
  if (!data.city && location.city) update.city = location.city;
  if (!data.address && location.address) update.address = location.address;
  if (!data.currency && currency) update.currency = currency;
  if (!data.priceCurrency && currency) update.priceCurrency = currency;
  if (!data.price && price) update.price = price;

  if (kind === 'sale') {
    if (!data.property_type) update.property_type = 'بيع';
    if (!data.salePrice && salePrice) update.salePrice = salePrice;
    if (!data.sellingPrice && salePrice) update.sellingPrice = salePrice;
    if (!data.selling_price && salePrice) update.selling_price = salePrice;
  }

  if (kind === 'rent') {
    if (!data.property_type) update.property_type = 'إيجار';
    if (!data.rentPrice && rentPrice) update.rentPrice = rentPrice;
    if (!data.daily_price && rentPrice) update.daily_price = rentPrice;
  }

  if (kind === 'offPlan' && startingPrice) {
    if (!data.startingPrice) update.startingPrice = startingPrice;
    if (!data.starting_price) update.starting_price = startingPrice;
  }

  return update;
}

async function main() {
  admin.initializeApp();
  const db = admin.firestore();
  const snap = await db.collection('properties').get();
  const writes = [];

  snap.forEach((doc) => {
    const update = aliasesFor(doc.data());
    if (Object.keys(update).length > 0) {
      writes.push({ id: doc.id, update });
    }
  });

  console.log(JSON.stringify({ apply: APPLY, count: writes.length, writes }, null, 2));

  if (!APPLY) return;
  const batch = db.batch();
  writes.forEach(({ id, update }) => batch.set(db.collection('properties').doc(id), update, { merge: true }));
  await batch.commit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
