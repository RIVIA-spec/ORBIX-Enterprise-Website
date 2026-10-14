import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const env = await readFile(resolve(root, '.env'), 'utf8').catch(() => '');
for (const line of env.split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const siteUrl = (process.env.VITE_SITE_URL || 'https://orbixcity.com').replace(/\/$/, '');
const urls = new Set([
  '/',
  '/buy',
  '/rent',
  '/hotels',
  '/articles',
  '/services',
  '/guides',
  '/faqs',
  '/media',
  '/downloads',
  '/privacy-policy',
  '/terms-of-use',
  '/cookie-policy',
]);
const data = { siteUrl, properties: [], hotels: [] };
const mojibake = /[ØÙÃÂ]/;
const knownSegments = [[/(rif[-\s]?damascus|ريف\s*دمشق)/i, 'rif-damascus'], [/(homs|حمص)/i, 'homs'], [/(damascus|دمشق)/i, 'damascus'], [/(aleppo|حلب)/i, 'aleppo'], [/(tartous|tartus|طرطوس)/i, 'tartous'], [/(latakia|اللاذقية)/i, 'latakia'], [/(hama|حماة)/i, 'hama'], [/(rent|rental|lease|إيجار|ايجار)/i, 'rent'], [/(sale|sell|buy|بيع|للبيع)/i, 'sale'], [/(apartment|flat|شقة)/i, 'apartment'], [/(villa|فيلا)/i, 'villa'], [/(farm|مزرعة)/i, 'farm'], [/(land|أرض|ارض)/i, 'land'], [/(office|مكتب)/i, 'office'], [/(shop|محل)/i, 'shop'], [/(hotel|فندق)/i, 'hotel'], [/(property|عقار)/i, 'property']];
function recoverMojibake(value) { if (!mojibake.test(value)) return value; try { const recovered = decodeURIComponent(escape(value)); return /[\u0600-\u06ff]/.test(recovered) ? recovered : value; } catch { return value; } }
function sanitizeSlugSegment(value, fallback) { const raw = String(value || '').trim().toLowerCase(); const input = recoverMojibake(raw); if (!input || mojibake.test(input)) return fallback; const known = knownSegments.find(([pattern]) => pattern.test(input)); if (known) return known[1]; return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback; }
function mappedSlugSegment(value) { const input = recoverMojibake(String(value || '').trim().toLowerCase()); return knownSegments.find(([pattern]) => pattern.test(input))?.[1] || ''; }
function firstSegment(values, fallback = '') { for (const value of values) { const segment = sanitizeSlugSegment(value, ''); if (segment) return segment; } return fallback; }
function value(field) { if (!field || typeof field !== 'object') return undefined; if ('stringValue' in field || 'integerValue' in field || 'doubleValue' in field || 'booleanValue' in field) return field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue; if ('arrayValue' in field) return (field.arrayValue.values || []).map(value); if ('mapValue' in field) return Object.fromEntries(Object.entries(field.mapValue.fields || {}).map(([key, item]) => [key, value(item)])); }
function fields(document) { return Object.fromEntries(Object.entries(document.fields || {}).map(([key, item]) => [key, value(item)])); }
function normalizeStatus(value) { return String(value ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-'); }
function truthy(value) { return value === true || value === 'true' || value === 1 || value === '1' || String(value).toLowerCase() === 'yes'; }
function isPublicProperty(item) {
  const status = normalizeStatus(item.status);
  if (['draft', 'pending', 'hidden', 'rejected', 'deleted', 'archived', 'inactive'].includes(status)) return false;
  const approved = truthy(item.approved) || truthy(item.isApproved) || status === 'approved' || status === 'published';
  const visible = item.isVisible === true || item.visible === true || truthy(item.visibility);
  const published = status === 'published' || status === 'approved' || truthy(item.published);
  return approved && visible && published;
}
async function collection(name) {
  const project = process.env.VITE_FIREBASE_PROJECT_ID; const key = process.env.VITE_FIREBASE_API_KEY;
  if (!project || !key) return [];
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${name}?pageSize=200&key=${key}`);
  if (!response.ok) throw new Error(`Firestore ${name}: ${response.status}`);
  return (await response.json()).documents || [];
}
try {
  const [properties, hotels] = await Promise.all([collection('properties'), collection('hotels')]);
  for (const document of properties) { const item = fields(document); const id = document.name.split('/').pop(); if (!id || !isPublicProperty(item)) continue; const city = firstSegment([item.city, item.location?.city, item.governorate, item.province, item.region, item.district]); const purpose = firstSegment([item.offerType, item.offer_type, item.listingType, item.listing_type, item.purpose, item.operation, item.dealType, item.transactionType, item.property_type]); const type = firstSegment([item.propertyType, item.property_category_title, item.property_category_name, item.property_type, item.category, item.propertyCategory, item.type]) || mappedSlugSegment(item.title) || mappedSlugSegment(item.name); const slug = city && purpose && type ? [city, purpose, type, id].join('-') : `property-${id}`; urls.add(`/property/${slug}`); if (city) urls.add(`/city/${city}`); data.properties.push({ id, slug, citySlug: city || undefined, ...item }); }
  for (const document of hotels) { const item = fields(document); const id = document.name.split('/').pop(); if (!id) continue; const city = firstSegment([item.city, item.location?.city, item.governorate, item.province, item.region, item.district]); const slug = [...(city ? [city] : []), 'hotel', sanitizeSlugSegment(id, 'hotel')].join('-'); urls.add(`/hotel/${slug}`); data.hotels.push({ id, slug, citySlug: city || undefined, ...item }); }
  console.log(`Sitemap: ${urls.size} URLs loaded from Firestore.`);
} catch (error) { console.warn(`Firestore unavailable; using static sitemap. ${error.message}`); }
await mkdir(resolve(root, 'dist'), { recursive: true });
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')}\n</urlset>\n`;
await Promise.all([writeFile(resolve(root, 'dist/sitemap.xml'), xml), writeFile(resolve(root, 'dist/prerender-data.json'), JSON.stringify(data))]);
