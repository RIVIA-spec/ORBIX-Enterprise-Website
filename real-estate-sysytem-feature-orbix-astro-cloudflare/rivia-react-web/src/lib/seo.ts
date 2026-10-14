import type { Hotel, Property } from '../types/models';
import { detectPropertyFlowKind, type PropertyFlowKind } from './propertyFlow';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://orbixcity.com').replace(/\/$/, '');
export function absoluteUrl(path = '/') { return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`; }

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedAt?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.image,
    datePublished: input.publishedAt,
    publisher: { '@type': 'Organization', name: 'Orbix', url: SITE_URL },
  };
}

export function serviceSchema(input: { title: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@type': 'Organization', name: 'Orbix', url: SITE_URL },
  };
}

export function faqPageSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

const mojibake = /[ØÙÃÂ]/;
const knownSegments: Array<[RegExp, string]> = [
  [/(rif[-\s]?damascus|ريف\s*دمشق)/i, 'rif-damascus'], [/(homs|حمص)/i, 'homs'], [/(damascus|دمشق)/i, 'damascus'], [/(aleppo|حلب)/i, 'aleppo'], [/(tartous|tartus|طرطوس)/i, 'tartous'], [/(latakia|اللاذقية)/i, 'latakia'], [/(hama|حماة)/i, 'hama'],
  [/(rent|rental|lease|إيجار|ايجار)/i, 'rent'], [/(sale|sell|buy|بيع|للبيع)/i, 'sale'],
  [/(apartment|flat|شقة)/i, 'apartment'], [/(villa|فيلا)/i, 'villa'], [/(farm|مزرعة)/i, 'farm'], [/(land|أرض|ارض)/i, 'land'], [/(office|مكتب)/i, 'office'], [/(shop|محل)/i, 'shop'], [/(hotel|فندق)/i, 'hotel'], [/(property|عقار)/i, 'property'],
];

function recoverMojibake(value: string) {
  if (!mojibake.test(value)) return value;
  try {
    const recovered = decodeURIComponent(escape(value));
    return /[\u0600-\u06ff]/.test(recovered) ? recovered : value;
  } catch {
    return value;
  }
}

/** Converts known Arabic labels to stable ASCII, rejects mojibake, and never returns Unicode. */
export function sanitizeSlugSegment(value: unknown, fallback: string) {
  const raw = String(value || '').trim().toLowerCase();
  const input = recoverMojibake(raw);
  if (!input || mojibake.test(input)) return fallback;
  const known = knownSegments.find(([pattern]) => pattern.test(input));
  if (known) return known[1];
  const ascii = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return ascii || fallback;
}
function mappedSlugSegment(value: unknown) {
  const input = recoverMojibake(String(value || '').trim().toLowerCase());
  return knownSegments.find(([pattern]) => pattern.test(input))?.[1] || '';
}

/** Compatibility alias for city landing routes. */
export function slugify(value: unknown) { return sanitizeSlugSegment(value, 'city'); }
function firstSlugSegment(values: unknown[], fallback: string) {
  for (const value of values) {
    const segment = sanitizeSlugSegment(value, '');
    if (segment) return segment;
  }
  return fallback;
}
export function propertySlug(property: Property) {
  const record = property as Record<string, unknown>;
  const city = firstSlugSegment([property.city, property.location?.city, record.governorate, record.province, record.region, record.district], '');
  const purpose = firstSlugSegment([property.offerType, record.offer_type, property.listingType, property.listing_type, record.purpose, record.operation, record.dealType, record.transactionType, property.property_type], '');
  const type = firstSlugSegment([property.propertyType, record.property_category_title, record.property_category_name, property.property_type, property.category, record.propertyCategory, property.type], '') || mappedSlugSegment(property.title) || mappedSlugSegment(property.name);
  // Firestore auto IDs are case-sensitive. Do not slugify this suffix: it is
  // the value used by the client to read the document after hydration.
  const documentId = String(property.id || 'property');
  if (!city || !purpose || !type) return `property-${documentId}`;
  return [city, purpose, type, documentId].join('-');
}
export function hotelSlug(hotel: Hotel) {
  const record = hotel as Record<string, unknown>;
  const city = firstSlugSegment([hotel.city, hotel.location?.city, record.governorate, record.province, record.region, record.district], '');
  // See propertySlug: retain the exact, case-sensitive Firestore ID.
  return [...(city ? [city] : []), 'hotel', String(hotel.id || 'hotel')].join('-');
}
export function propertyPath(property: Property) { return `/property/${propertySlug(property)}`; }
export function hotelPath(hotel: Hotel) { return `/hotel/${hotelSlug(hotel)}`; }

const firestoreAutoId = /^[A-Za-z0-9]{20}$/;

/**
 * SEO slugs end in a Firestore auto ID. Only use that final segment for a
 * document read; the descriptive slug prefix is not a document ID.
 */
export function documentIdFromSlug(value?: string) {
  const routeValue = String(value || '').trim();
  if (!routeValue.includes('-')) return '';
  const documentId = routeValue.split('-').filter(Boolean).pop() || '';
  return firestoreAutoId.test(documentId) ? documentId : '';
}

/**
 * Resolve an SEO slug to its document ID, while preserving legacy id-only
 * routes and legacy document IDs that do not use the auto-ID format.
 */
export function idFromSlug(value?: string) {
  const routeValue = String(value || '').trim();
  return documentIdFromSlug(routeValue) || routeValue;
}
export function firstImage(item: Property | Hotel) { return item.mainImage || item.imageUrl || item.images?.find(Boolean); }

function recordValue<T = unknown>(record: Record<string, unknown>, path: string): T | undefined {
  return path.split('.').reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined), record) as T | undefined;
}

function normalizeStatus(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function truthy(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1' || String(value).toLowerCase() === 'yes';
}

export function isPropertyIndexable(property: Partial<Property> & Record<string, unknown>): boolean {
  const status = normalizeStatus(property.status);
  if (['draft', 'pending', 'hidden', 'rejected', 'deleted', 'archived', 'inactive'].includes(status)) return false;
  const approved = truthy(property.approved) || truthy(property.isApproved) || status === 'approved' || status === 'published';
  const visible = property.isVisible === true || property.visible === true || truthy(property.visibility);
  const published = status === 'published' || status === 'approved' || truthy(property.published);
  return approved && visible && published;
}

function textValue(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function numberLike(value: unknown): string {
  const raw = String(value ?? '').trim();
  return raw ? raw.replace(/,/g, '') : '';
}

export function getPropertySeoPrice(property: Partial<Property> & Record<string, unknown>): { price?: string; startingPrice?: string; currency: string } {
  const pricing = recordValue<Record<string, unknown>>(property, 'pricing') || {};
  const currency = textValue(
    pricing.currency ||
      property.currency ||
      property.selling_price_currency ||
      property.daily_price_currency ||
      property.nightly_currency,
    'SAR',
  );
  const flowKind = detectPropertyFlowKind(property);
  const startingPrice = numberLike(pricing.startingPrice || property.startingPrice || property.starting_price);
  const salePrice = numberLike(pricing.salePrice || property.salePrice || property.sellingPrice || property.selling_price || property.price);
  const rentPrice = numberLike(
      pricing.rentPrice ||
      pricing.dailyPrice ||
      pricing.weeklyPrice ||
      pricing.monthlyPrice ||
      pricing.yearlyPrice ||
      property.rentPrice ||
      property.dailyPrice ||
      property.daily_price ||
      property.weeklyPrice ||
      property.weekly_price ||
      property.monthly_price ||
      property.yearly_price ||
      property.price,
  );

  if (flowKind === 'offPlan' && startingPrice) return { startingPrice, currency };
  if (flowKind === 'rent' && rentPrice) return { price: rentPrice, currency };
  if (salePrice) return { price: salePrice, currency };
  if (startingPrice) return { startingPrice, currency };
  if (rentPrice) return { price: rentPrice, currency };
  return { currency };
}

export function getPropertySeoOfferLabel(flowKind: PropertyFlowKind): string {
  if (flowKind === 'rent') return '\u0644\u0644\u0625\u064a\u062c\u0627\u0631';
  if (flowKind === 'offPlan') return '\u0639\u0644\u0649 \u0627\u0644\u0645\u062e\u0637\u0637';
  return '\u0644\u0644\u0628\u064a\u0639';
}

export function getPropertySeoMetadata(property: Property) {
  const flowKind = detectPropertyFlowKind(property);
  const title = textValue(property.title || property.name, '\u0639\u0642\u0627\u0631');
  const city = textValue(property.city || property.location?.city, '\u0627\u0644\u0645\u062f\u064a\u0646\u0629');
  const propertyType = textValue(property.property_category_title || property.propertyType || property.property_type || property.category || property.type, '\u0639\u0642\u0627\u0631');
  const offerLabel = getPropertySeoOfferLabel(flowKind);
  const price = getPropertySeoPrice(property);
  const priceText = price.startingPrice
    ? `\u0628\u0633\u0639\u0631 \u064a\u0628\u062f\u0623 \u0645\u0646 ${price.startingPrice} ${price.currency}`
    : price.price
      ? `\u0628\u0633\u0639\u0631 ${price.price} ${price.currency}`
      : '\u0645\u0639 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0633\u0639\u0631';
  const areaText = property.area ? `\u0645\u0633\u0627\u062d\u0629 ${property.area}` : '';
  const bedroomsText = property.bedrooms != null && flowKind !== 'offPlan' ? `${property.bedrooms} \u063a\u0631\u0641 \u0646\u0648\u0645` : '';
  return {
    title: `${title} | Orbix`,
    description: [propertyType, offerLabel, `\u0641\u064a ${city}`, areaText, priceText, bedroomsText].filter(Boolean).join(' \u060C '),
    flowKind,
    city,
    propertyType,
    offerLabel,
    price,
  };
}

export function buildPropertyJsonLd(property: Property) {
  const metadata = getPropertySeoMetadata(property);
  const canonicalPath = propertyPath(property);
  const images = [property.mainImage, property.imageUrl, ...(property.images || [])].filter(Boolean);
  const record = property as Record<string, unknown>;
  const projectInfo = (record.projectInfo && typeof record.projectInfo === 'object' ? record.projectInfo : {}) as Record<string, unknown>;
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    availability: isPropertyIndexable(property) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    priceCurrency: metadata.price.currency,
    businessFunction: metadata.flowKind === 'rent' ? 'https://schema.org/LeaseOut' : 'https://schema.org/Sell',
  };
  if (metadata.price.price) offer.price = metadata.price.price;
  if (metadata.price.startingPrice) offer.startingPrice = metadata.price.startingPrice;
  const offPlanFields: Record<string, unknown> = {};
  const projectFieldMap: Array<[string, unknown]> = [
    ['developerName', projectInfo.developerName || record.developerName || record.developer_name],
    ['expectedDeliveryDate', projectInfo.expectedDeliveryDate || record.expectedDeliveryDate || record.expected_delivery_date],
    ['constructionProgress', projectInfo.constructionProgress || record.constructionProgress || record.construction_progress],
    ['downPayment', projectInfo.downPayment || record.downPayment || record.down_payment],
    ['paymentPlan', projectInfo.paymentPlan || record.paymentPlan || record.payment_plan],
    ['projectStatus', projectInfo.projectStatus || record.projectStatus || record.project_status],
    ['numberOfBuildings', projectInfo.numberOfBuildings || record.numberOfBuildings || record.number_of_buildings],
    ['totalUnits', projectInfo.totalUnits || record.totalUnits || record.total_units],
  ];
  for (const [key, value] of projectFieldMap) {
    const text = String(value ?? '').trim();
    if (text) offPlanFields[key] = text;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title || property.name || '\u0639\u0642\u0627\u0631',
    description: property.description || metadata.description,
    url: absoluteUrl(canonicalPath),
    image: images.length > 0 ? images : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city || property.location?.city,
      streetAddress: property.address || property.location?.address,
      addressCountry: property.country || property.location?.country || 'SA',
    },
    offerType: metadata.flowKind,
    propertyType: metadata.propertyType,
    offers: offer,
    ...offPlanFields,
  };
}
