import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, limit, query } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const canonicalTopLevel = new Set([
  'title',
  'description',
  'listingType',
  'propertyType',
  'categoryId',
  'categoryTitle',
  'status',
  'availability',
  'isVisible',
  'ownerId',
  'features',
  'pricing',
  'location',
  'specs',
  'contact',
  'media',
  'rating',
  'createdAt',
  'updatedAt',
  'approvedAt',
  'approvedBy',
  'featured',
  'isFeatured',
  'featuredUntil',
  'featuredStartedAt',
  'featuredBy',
  'featuredPlan',
  'featuredNote',
  'featuredOrder',
  'promotionStatus',
  'promotionType',
  'projectInfo',
  'panorama_tour',
]);

const requiredTopLevel = ['title', 'listingType', 'propertyType', 'status', 'isVisible', 'ownerId', 'pricing', 'location', 'media'];
const deprecatedFields = new Set([
  'price',
  'salePrice',
  'sellingPrice',
  'selling_price',
  'selling_price_currency',
  'rentPrice',
  'dailyPrice',
  'daily_price',
  'daily_price_currency',
  'monthly_price',
  'yearly_price',
  'startingPrice',
  'starting_price',
  'property_type',
  'property_category_id',
  'property_category_title',
  'listing_type',
  'offerType',
  'offer_type',
  'purpose',
  'transactionType',
  'currency',
  'priceCurrency',
  'city',
  'country',
  'countryCode',
  'address',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'mainImage',
  'images',
  'bathrooms',
  'bedrooms',
  'area',
  'contact_name',
  'contact_number',
  'phoneCountryCode',
  'country_code',
  'averageRating',
  'ratingCount',
  'isSold',
  'isDistinct',
  'area_unit',
]);

const aliases = {
  price: ['price', 'salePrice', 'sellingPrice', 'selling_price', 'rentPrice', 'daily_price', 'monthly_price', 'yearly_price', 'startingPrice', 'starting_price'],
  listingType: ['listingType', 'listing_type', 'offerType', 'offer_type', 'purpose', 'transactionType'],
  propertyType: ['propertyType', 'property_type', 'type', 'category', 'property_category_title'],
  currency: ['currency', 'priceCurrency', 'selling_price_currency', 'daily_price_currency'],
  location: ['location', 'city', 'country', 'countryCode', 'address', 'latitude', 'longitude', 'lat', 'lng'],
  media: ['media', 'mainImage', 'images', 'imageUrl'],
  contact: ['contact', 'contact_name', 'contact_number', 'phoneCountryCode', 'country_code', 'phone'],
  rating: ['rating', 'averageRating', 'ratingCount'],
};

const expectedTypes = {
  title: 'string',
  description: 'string',
  listingType: 'string',
  propertyType: 'string',
  status: 'string',
  availability: 'string',
  isVisible: 'boolean',
  ownerId: 'string',
  features: 'array',
  pricing: 'object',
  location: 'object',
  specs: 'object',
  contact: 'object',
  media: 'object',
  rating: 'object',
  projectInfo: 'object',
};

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (value && typeof value === 'object') return 'object';
  return typeof value;
}

function fieldsPresent(data, names) {
  return names.filter((name) => data[name] !== undefined && data[name] !== null && data[name] !== '');
}

function analyzeDoc(id, data) {
  const keys = Object.keys(data).sort();
  const missingFields = requiredTopLevel.filter((key) => data[key] === undefined || data[key] === null || data[key] === '');
  const deprecated = keys.filter((key) => deprecatedFields.has(key));
  const duplicateAliases = Object.fromEntries(
    Object.entries(aliases)
      .map(([group, names]) => [group, fieldsPresent(data, names)])
      .filter(([, present]) => present.length > 1),
  );
  const typeMismatches = Object.entries(expectedTypes)
    .filter(([key, expected]) => data[key] !== undefined && valueType(data[key]) !== expected)
    .map(([key, expected]) => ({ field: key, expected, actual: valueType(data[key]) }));
  const unknownFields = keys.filter((key) => !canonicalTopLevel.has(key) && !deprecatedFields.has(key));

  return { id, keys, missingFields, deprecated, duplicateAliases, typeMismatches, unknownFields };
}

function fieldInventory(analyses) {
  const counts = new Map();
  analyses.forEach((doc) => {
    doc.keys.forEach((key) => counts.set(key, (counts.get(key) || 0) + 1));
  });
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function mdList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- None';
}

function renderReport(analyses) {
  const inventory = fieldInventory(analyses);
  const docsWithProblems = analyses.filter(
    (item) =>
      item.missingFields.length ||
      item.deprecated.length ||
      Object.keys(item.duplicateAliases).length ||
      item.typeMismatches.length ||
      item.unknownFields.length,
  );

  return `# Firestore Property Schema Audit

Generated: ${new Date().toISOString()}

Project: ${firebaseConfig.projectId || 'unknown'}

Documents audited: ${analyses.length}

## Fields That Should Become Canonical

${mdList([...canonicalTopLevel].sort())}

## Deprecated Fields

${mdList([...deprecatedFields].sort())}

## Fields Used Only By Flutter

${mdList(['property_type', 'selling_price', 'selling_price_currency', 'daily_price', 'daily_price_currency', 'averageRating', 'ratingCount', 'book_status', 'booked_periods', 'statusColor', 'isSold'])}

## Fields Used Only By React

${mdList(['offerType', 'listing_type', 'salePrice', 'sellingPrice', 'rentPrice', 'startingPrice', 'pricing', 'projectInfo', 'location.countryCode'])}

## Field Inventory

| Field | Documents |
|---|---:|
${inventory.map(([field, count]) => `| \`${field}\` | ${count} |`).join('\n')}

## Document Findings

${docsWithProblems
  .map(
    (doc) => `### ${doc.id}

Missing fields:
${mdList(doc.missingFields.map((field) => `\`${field}\``))}

Deprecated fields:
${mdList(doc.deprecated.map((field) => `\`${field}\``))}

Duplicate aliases:
${mdList(Object.entries(doc.duplicateAliases).map(([group, fields]) => `\`${group}\`: ${fields.map((field) => `\`${field}\``).join(', ')}`))}

Type mismatches:
${mdList(doc.typeMismatches.map((item) => `\`${item.field}\`: expected ${item.expected}, actual ${item.actual}`))}

Unknown fields:
${mdList(doc.unknownFields.map((field) => `\`${field}\``))}
`,
  )
  .join('\n') || 'No document-level findings.'}
`;
}

async function main() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Missing VITE_FIREBASE_* environment variables.');
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snap = await getDocs(query(collection(db, 'properties'), limit(1000)));
  const analyses = snap.docs.map((doc) => analyzeDoc(doc.id, doc.data()));
  const output = renderReport(analyses);
  const outputPath = path.resolve('FIRESTORE_PROPERTY_SCHEMA_AUDIT.md');
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(JSON.stringify({ outputPath, documents: analyses.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
