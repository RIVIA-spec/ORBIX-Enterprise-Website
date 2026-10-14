import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
const data = JSON.parse(await readFile(resolve(dist, 'prerender-data.json'), 'utf8').catch(() => '{"siteUrl":"https://orbixcity.com","properties":[],"hotels":[]}'));
const siteUrl = data.siteUrl.replace(/\/$/, '');
const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mojibake = /[Ã˜Ã™ÃƒÃ‚]/;
const knownSegments = [[/(rif[-\s]?damascus|Ø±ÙŠÙ\s*Ø¯Ù…Ø´Ù‚)/i, 'rif-damascus'], [/(homs|Ø­Ù…Øµ)/i, 'homs'], [/(damascus|Ø¯Ù…Ø´Ù‚)/i, 'damascus'], [/(aleppo|Ø­Ù„Ø¨)/i, 'aleppo'], [/(tartous|tartus|Ø·Ø±Ø·ÙˆØ³)/i, 'tartous'], [/(latakia|Ø§Ù„Ù„Ø§Ø°Ù‚ÙŠØ©)/i, 'latakia'], [/(hama|Ø­Ù…Ø§Ø©)/i, 'hama']];
function sanitizeSlugSegment(value, fallback) { const input = String(value || '').trim().toLowerCase(); if (!input || mojibake.test(input)) return fallback; const known = knownSegments.find(([pattern]) => pattern.test(input)); if (known) return known[1]; return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback; }
function flowKind(item) { const source = [item.offerType, item.offer_type, item.listingType, item.listing_type, item.dealType, item.property_type, item.type].filter(Boolean).join(' ').toLowerCase().replace(/[_\s]+/g, '-'); if (/off-?plan|new-?project/.test(source)) return 'offPlan'; if (/rent|rental|lease/.test(source)) return 'rent'; if (/sale|sell|buy/.test(source)) return 'sale'; return 'sale'; }
function offerLabel(kind) { return kind === 'rent' ? 'للإيجار' : kind === 'offPlan' ? 'على المخطط' : 'للبيع'; }
function propertyPrice(item) { const pricing = item.pricing || {}; const currency = pricing.currency || item.currency || item.selling_price_currency || item.daily_price_currency || 'SAR'; const kind = flowKind(item); const startingPrice = pricing.startingPrice || item.startingPrice || item.starting_price; const salePrice = pricing.salePrice || item.salePrice || item.sellingPrice || item.selling_price || item.price; const rentPrice = pricing.rentPrice || pricing.dailyPrice || pricing.monthlyPrice || pricing.yearlyPrice || item.rentPrice || item.dailyPrice || item.daily_price || item.monthly_price || item.yearly_price || item.price; if (kind === 'offPlan' && startingPrice) return { startingPrice, currency }; return { price: kind === 'rent' ? rentPrice : salePrice, currency }; }
function propertySeo(item) { const kind = flowKind(item); const title = item.title || item.name || 'عقار'; const city = item.city || item.location?.city || 'المدينة'; const type = item.property_category_title || item.propertyType || item.property_type || item.category || item.type || 'عقار'; const price = propertyPrice(item); const priceText = price.startingPrice ? `بسعر يبدأ من ${price.startingPrice} ${price.currency}` : price.price ? `بسعر ${price.price} ${price.currency}` : 'مع تفاصيل السعر'; return { title: `${title} | Orbix`, description: [type, offerLabel(kind), `في ${city}`, item.area ? `مساحة ${item.area}` : '', priceText, item.bedrooms && kind !== 'offPlan' ? `${item.bedrooms} غرف نوم` : ''].filter(Boolean).join(' ، '), kind, price }; }
function propertySchema(path, item) { const seo = propertySeo(item); const images = [item.mainImage, item.imageUrl, ...(item.images || [])].filter(Boolean); const offers = { '@type': 'Offer', availability: 'https://schema.org/InStock', priceCurrency: seo.price.currency, businessFunction: seo.kind === 'rent' ? 'https://schema.org/LeaseOut' : 'https://schema.org/Sell' }; if (seo.price.price) offers.price = seo.price.price; if (seo.price.startingPrice) offers.startingPrice = seo.price.startingPrice; return { '@context': 'https://schema.org', '@type': 'RealEstateListing', name: item.title || item.name || 'عقار', description: item.description || seo.description, url: `${siteUrl}${path}`, image: images.length ? images : undefined, address: { '@type': 'PostalAddress', addressLocality: item.city || item.location?.city, streetAddress: item.address || item.location?.address, addressCountry: item.country || item.location?.country || 'SA' }, offerType: seo.kind, propertyType: item.property_category_title || item.propertyType || item.property_type || item.category || item.type || 'عقار', offers }; }
function writeRoute(path, title, description, schema, image) {
  const url = `${siteUrl}${path}`;
  const head = `<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:type" content="website"><meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
  const page = html.replace(/<title>[\s\S]*?<\/title>/, '').replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root"><main data-prerendered="true"><h1>${esc(title)}</h1><p>${esc(description)}</p></main></div>`);
  const output = path === '/' ? resolve(dist, 'index.html') : resolve(dist, path.slice(1), 'index.html');
  return mkdir(resolve(output, '..'), { recursive: true }).then(() => writeFile(output, page));
}
const staticRoutes = [
  ['/', 'Orbix | عقارات وفنادق', 'اكتشف العقارات والفنادق المتاحة في Orbix.'],
  ['/buy', 'عقارات للبيع | Orbix', 'اكتشف العقارات المعروضة للبيع على Orbix.'],
  ['/rent', 'عقارات للإيجار | Orbix', 'اكتشف العقارات المعروضة للإيجار على Orbix.'],
  ['/hotels', 'فنادق وإقامات | Orbix', 'اكتشف الفنادق والإقامات المتاحة على Orbix.'],
  ['/articles', 'Orbix Articles', 'Articles and guides managed in Strapi for Orbix.'],
  ['/services', 'Orbix Services', 'Service pages managed in Strapi for Orbix.'],
  ['/guides', 'Orbix Guides', 'Guides for cities, partners, buyers, renters, and photography workflows.'],
  ['/faqs', 'Orbix FAQs', 'Frequently asked questions managed in Strapi for Orbix.'],
  ['/media', 'Orbix Media Mentions', 'Press and media coverage for Orbix.'],
  ['/downloads', 'Orbix Downloads', 'Public documents, brochures, forms, and media kit downloads.'],
  ['/privacy-policy', 'سياسة الخصوصية | Orbix', 'سياسة خصوصية Orbix وبيان البيانات المستخدمة لتشغيل منصة العقارات والفنادق وتحسينها.'],
  ['/terms-of-use', 'شروط الاستخدام | Orbix', 'شروط استخدام Orbix للموقع والتطبيق وقواعد الحسابات والمحتوى والاستخدام المسموح.'],
  ['/cookie-policy', 'سياسة ملفات تعريف الارتباط | Orbix', 'سياسة ملفات تعريف الارتباط الكوكيز والتخزين المحلي في Orbix وكيفية إدارة الموافقة.'],
];
const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Orbix', url: siteUrl, inLanguage: 'ar-SA' };
const routes = [...staticRoutes];
for (const citySlug of [...new Set(data.properties.map((item) => item.citySlug).filter(Boolean))]) {
  routes.push([`/city/${citySlug}`, `Properties in ${citySlug} | Orbix`, `Discover available properties in ${citySlug} on Orbix.`]);
  routes.push([`/buy/${citySlug}`, `Properties for sale in ${citySlug} | Orbix`, `Discover properties for sale in ${citySlug} on Orbix.`]);
  routes.push([`/rent/${citySlug}`, `Properties for rent in ${citySlug} | Orbix`, `Discover properties for rent in ${citySlug} on Orbix.`]);
}
for (const item of data.properties) { const path = `/property/${item.slug}`; const seo = propertySeo(item); routes.push([path, seo.title, item.description || seo.description, item, propertySchema(path, item)]); }
for (const item of data.hotels) routes.push([`/hotel/${item.slug}`, `${item.name || item.title || item.hotel_name || 'فندق'} | Orbix`, item.description || `تفاصيل فندق في ${item.city || 'Orbix'}.`, item]);
await Promise.all(routes.map(([path, title, description, item, schema]) => writeRoute(path, title, description, schema || website, item?.mainImage || item?.imageUrl || item?.images?.[0])));
const redirects = `${routes.filter(([path]) => path !== '/').map(([path]) => `${path}  ${path}/index.html  200`).join('\n')}\n/*  /index.html  200\n`;
await writeFile(resolve(dist, '_redirects'), redirects);
console.log(`Prerendered ${routes.length} public routes.`);
