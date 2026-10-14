import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { extractPropertyCoordinates } from './mapService';
import { isPropertyIndexable } from '../lib/seo';
import { fromPropertyDocData, toCanonicalPropertyUpdate } from '../lib/propertySchema';
import type { Property } from '../types/models';

export type PropertyFetchDiagnostics = {
  attemptedStrategies: string[];
  strategyUsed?: string;
  loadedCount: number;
  visibleCount: number;
  firstDocId?: string;
  firstDocKeys?: string[];
  propertyRequestsCount?: number;
  propertyRequestsNote?: string;
  featuredCount?: number;
  normalCount?: number;
  errorCode?: string;
  errorMessage?: string;
};

export type PropertyFetchResult = {
  properties: Property[];
  diagnostics: PropertyFetchDiagnostics;
};

export type PropertyFilters = {
  text?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  listingType?: string;
  type?: string;
  property_type?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  minArea?: string;
  maxArea?: string;
  status?: string;
  visibility?: string;
  isVisible?: string;
  featured?: string;
  features?: string[];
};

export type FeaturedPropertyInput = {
  featuredUntil?: string | null;
  featuredOrder?: string;
  featuredPlan?: string;
  featuredNote?: string;
};

let lastPropertyFetchDiagnostics: PropertyFetchDiagnostics | null = null;
const propertyFetchCache = new Map<string, { expiresAt: number; result?: PropertyFetchResult; promise?: Promise<PropertyFetchResult> }>();
const PROPERTY_FETCH_CACHE_MS = 15_000;

function devLog(message: string, data?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[properties] ${message}`, data ?? '');
  }
}

function fromPropertyDoc(id: string, data: Record<string, unknown>): Property {
  return fromPropertyDocData(id, data);
}

function isReadableProperty(property: Property): boolean {
  return isPropertyIndexable(property);
}

function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number };
    if (typeof candidate.toDate === 'function') return candidate.toDate().getTime();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return 0;
}

function boolFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function isActiveFeaturedProperty(property: Property): boolean {
  const markedFeatured = boolFlag(property.isFeatured) || boolFlag(property.isDistinct) || boolFlag(property.featured);
  if (!markedFeatured) return false;
  if (property.promotionStatus === 'expired' || property.promotionStatus === 'cancelled') return false;
  const until = timestampMillis(property.featuredUntil);
  return !until || until >= Date.now();
}

export const isPropertyFeatured = isActiveFeaturedProperty;

function newestPropertyTime(property: Property): number {
  return timestampMillis(property.updatedAt) || timestampMillis(property.created_at) || timestampMillis(property.createdAt);
}

function numberValue(value: unknown): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function propertyPriceNumber(property: Property): number | null {
  return numberValue(
    property.price ||
      property.daily_price ||
      property.nightly_price ||
      property.monthly_price ||
      property.yearly_price ||
      property.selling_price ||
      property.rentPrice ||
      property.salePrice,
  );
}

export function sortPublicProperties(properties: Property[]): Property[] {
  return [...properties].sort((a, b) => {
    const aFeatured = isActiveFeaturedProperty(a);
    const bFeatured = isActiveFeaturedProperty(b);
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

    if (aFeatured && bFeatured) {
      const aOrder = numberValue(a.featuredOrder) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = numberValue(b.featuredOrder) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;

      const aStarted = timestampMillis(a.featuredStartedAt);
      const bStarted = timestampMillis(b.featuredStartedAt);
      if (aStarted !== bStarted) return bStarted - aStarted;
    }

    return newestPropertyTime(b) - newestPropertyTime(a);
  });
}

export const sortPropertiesForPublicListing = sortPublicProperties;

function documentSummary(docs: Array<{ id: string; data: () => unknown }>) {
  const first = docs[0];
  const firstData = first?.data();
  return {
    firstDocId: first?.id,
    firstDocKeys: firstData && typeof firstData === 'object' ? Object.keys(firstData as Record<string, unknown>) : undefined,
  };
}

async function runPropertyQuery(strategy: string, queryRef: ReturnType<typeof query>) {
  devLog(`Fetching properties... strategy=${strategy}`);
  const snap = await getDocs(queryRef);
  const summary = documentSummary(snap.docs);
  devLog(`documents count=${snap.docs.length}`, summary);
  return {
    docs: snap.docs,
    properties: snap.docs.map((item) => fromPropertyDoc(item.id, item.data() as Record<string, unknown>)),
    ...summary,
  };
}

async function countPropertyRequestsForDiagnostics(max = 20): Promise<number | undefined> {
  if (!import.meta.env.DEV) return undefined;
  try {
    const snap = await getDocs(query(collection(db, 'property_requests'), limit(max)));
    devLog(`property_requests diagnostic count=${snap.docs.length}`);
    return snap.docs.length;
  } catch (error) {
    devLog('property_requests diagnostic read failed', error);
    return undefined;
  }
}

export function getLastPropertyFetchDiagnostics() {
  return lastPropertyFetchDiagnostics;
}

export async function fetchPropertiesFlexible(max = 80): Promise<PropertyFetchResult> {
  const cacheKey = String(max);
  const cached = propertyFetchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.result) {
      devLog(`using cached properties result max=${max}`);
      return cached.result;
    }
    if (cached.promise) {
      devLog(`reusing in-flight properties fetch max=${max}`);
      return cached.promise;
    }
  }

  const fetchPromise = fetchPropertiesFlexibleUncached(max).then((result) => {
    propertyFetchCache.set(cacheKey, { expiresAt: Date.now() + PROPERTY_FETCH_CACHE_MS, result });
    return result;
  }).catch((error) => {
    propertyFetchCache.delete(cacheKey);
    throw error;
  });

  propertyFetchCache.set(cacheKey, { expiresAt: Date.now() + PROPERTY_FETCH_CACHE_MS, promise: fetchPromise });
  return fetchPromise;
}

async function fetchPropertiesFlexibleUncached(max = 80): Promise<PropertyFetchResult> {
  const attemptedStrategies: string[] = [];
  const diagnostics: PropertyFetchDiagnostics = {
    attemptedStrategies,
    loadedCount: 0,
    visibleCount: 0,
  };

  const strategies: Array<[string, ReturnType<typeof query>]> = [
    ['properties where isVisible == true', query(collection(db, 'properties'), where('isVisible', '==', true), limit(max))],
    ['properties where status == approved', query(collection(db, 'properties'), where('status', '==', 'approved'), limit(max))],
    ['properties unfiltered', query(collection(db, 'properties'), limit(max))],
  ];

  for (const [strategy, queryRef] of strategies) {
    attemptedStrategies.push(strategy);
    try {
      const result = await runPropertyQuery(strategy, queryRef);
      diagnostics.loadedCount = result.properties.length;
      diagnostics.firstDocId = result.firstDocId;
      diagnostics.firstDocKeys = result.firstDocKeys;
      const visibleProperties = sortPublicProperties(result.properties.filter(isReadableProperty));
      diagnostics.visibleCount = visibleProperties.length;
      diagnostics.featuredCount = visibleProperties.filter(isActiveFeaturedProperty).length;
      diagnostics.normalCount = visibleProperties.length - diagnostics.featuredCount;

      if (result.properties.length > 0) {
        diagnostics.strategyUsed = strategy;
        lastPropertyFetchDiagnostics = diagnostics;
        devLog('query strategy used', diagnostics);
        return { properties: visibleProperties, diagnostics };
      }
    } catch (error) {
      const err = error as { code?: string; message?: string };
      diagnostics.errorCode = err.code;
      diagnostics.errorMessage = err.message;
      devLog(`strategy failed=${strategy}`, error);
    }
  }

  const propertyRequestsCount = await countPropertyRequestsForDiagnostics();
  diagnostics.propertyRequestsCount = propertyRequestsCount;
  if (propertyRequestsCount && propertyRequestsCount > 0) {
    diagnostics.propertyRequestsNote = 'لا توجد عقارات منشورة حاليًا. توجد طلبات إضافة بانتظار المراجعة.';
  }

  lastPropertyFetchDiagnostics = diagnostics;
  devLog('all property strategies returned zero or failed', diagnostics);
  return { properties: [], diagnostics };
}

export async function getVisibleProperties(max = 24): Promise<Property[]> {
  return (await fetchPropertiesFlexible(max)).properties;
}

export async function getLatestProperties(max = 60): Promise<Property[]> {
  return getVisibleProperties(max);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const snap = await getDoc(doc(db, 'properties', id));
  if (!snap.exists()) return null;
  return fromPropertyDoc(snap.id, snap.data());
}

export async function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  const docs = await Promise.all(uniqueIds.map((id) => getPropertyById(id)));
  return docs.filter((item): item is Property => Boolean(item));
}

export async function getMyProperties(uid: string): Promise<Property[]> {
  const snap = await getDocs(query(collection(db, 'properties'), where('ownerId', '==', uid), limit(80)));
  return sortPublicProperties(snap.docs.map((item) => fromPropertyDoc(item.id, item.data())));
}

export async function getAdminProperties(max = 160): Promise<Property[]> {
  const snap = await getDocs(query(collection(db, 'properties'), limit(max)));
  return sortPublicProperties(snap.docs.map((item) => fromPropertyDoc(item.id, item.data())));
}

const EMPTY_FILTER_LABELS = new Set(
  [
    '',
    'all',
    'الكل',
    'كل',
    'كل الدول',
    'كل المدن',
    'كل الأنواع',
    'كل الانواع',
    'كل التصنيفات',
    'كل الحالات',
    'كل الأسعار',
    'كل المساحات',
  ].map(normalizeArabic),
);

function normalizeArabic(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ');
}

export function normalizeFilterValue(value: unknown): string {
  const normalized = normalizeArabic(value);
  return EMPTY_FILTER_LABELS.has(normalized) ? '' : normalized;
}

function candidatesMatch(candidates: unknown[], filterValue: string): boolean {
  if (!filterValue) return true;
  return candidates.some((candidate) => {
    const normalized = normalizeFilterValue(candidate);
    return normalized === filterValue || normalized.includes(filterValue) || filterValue.includes(normalized);
  });
}

function booleanLike(value: unknown): boolean | null {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return null;
}

function plusNumberValue(value: unknown): { value: number | null; plus: boolean } {
  const raw = String(value ?? '').trim();
  const plus = raw.endsWith('+');
  return { value: numberValue(raw.replace('+', '')), plus };
}

function isFeaturedOnlyFilter(value: string): boolean {
  return ['featuredonly', 'true', 'مميز فقط'].map(normalizeArabic).includes(value);
}

export function isHotelFilterValue(value: unknown): boolean {
  const normalized = normalizeFilterValue(value);
  return ['فندق', 'فنادق', 'hotel', 'hotels'].includes(normalized);
}

export function isHotelFilterSelected(filters: PropertyFilters): boolean {
  return isHotelFilterValue(filters.category) || isHotelFilterValue(filters.type) || isHotelFilterValue(filters.property_type);
}

function propertyFilterFields(property: Property) {
  const location = property.location;
  const country = property.country || location?.country;
  const countryCode = property.countryCode || location?.countryCode;
  const city = property.city || location?.city;
  const address = property.address || location?.address;
  const listingCandidates = [property.listing_type, property.listingType, property.property_type, property.propertyType, property.type];
  const typeCandidates = [property.type, property.propertyType, property.property_type, property.category, property.property_category_title];
  const categoryCandidates = [property.category, property.property_category_title, property.property_category_id, property.type];
  const featureCandidates = Array.isArray(property.features) ? property.features : typeof property.features === 'string' ? [property.features] : [];
  const sourceCandidates = [
    property.title,
    property.name,
    city,
    address,
    property.description,
    country,
    countryCode,
    ...typeCandidates,
    ...categoryCandidates,
    ...featureCandidates,
  ];
  const source = normalizeArabic(sourceCandidates.filter(Boolean).join(' '));

  return {
    source,
    country,
    countryCode,
    city,
    address,
    listingCandidates,
    typeCandidates,
    categoryCandidates,
    featureCandidates,
    price: propertyPriceNumber(property),
    area: numberValue(property.area),
    bedrooms: numberValue(property.bedrooms),
    bathrooms: numberValue(property.bathrooms),
    status: normalizeFilterValue(property.status),
    isVisible: booleanLike(property.isVisible),
    featured: isActiveFeaturedProperty(property),
  };
}

function firstFilterFailure(property: Property, filters: PropertyFilters): string | null {
  const fields = propertyFilterFields(property);
  const text = normalizeFilterValue(filters.text);
  const country = normalizeFilterValue(filters.country || filters.countryCode);
  const city = normalizeFilterValue(filters.city);
  const listingType = normalizeFilterValue(filters.listingType);
  const propertyType = normalizeFilterValue(filters.type || filters.property_type);
  const category = normalizeFilterValue(filters.category);
  const minPrice = numberValue(filters.minPrice);
  const maxPrice = numberValue(filters.maxPrice);
  const minArea = numberValue(filters.minArea);
  const maxArea = numberValue(filters.maxArea);
  const bedrooms = plusNumberValue(filters.bedrooms);
  const bathrooms = plusNumberValue(filters.bathrooms);
  const status = normalizeFilterValue(filters.status);
  const isVisible = normalizeFilterValue(filters.visibility || filters.isVisible);
  const featured = normalizeFilterValue(filters.featured);

  if (!isReadableProperty(property)) return 'not readable: deleted, hidden, or missing title/name';
  if (text && !fields.source.includes(text)) return 'text search did not match';
  if (country && !candidatesMatch([fields.country, fields.countryCode], country)) return 'country did not match';
  if (city && !candidatesMatch([fields.city], city)) return 'city did not match';
  if (listingType && !candidatesMatch(fields.listingCandidates, listingType)) return 'listingType did not match';
  if (propertyType && !candidatesMatch(fields.typeCandidates, propertyType)) return 'property_type did not match';
  if (category && !candidatesMatch(fields.categoryCandidates, category)) return 'category did not match';
  if (minPrice != null && fields.price == null) return 'price missing while minPrice is active';
  if (minPrice != null && fields.price != null && fields.price < minPrice) return 'price below minPrice';
  if (maxPrice != null && fields.price == null) return 'price missing while maxPrice is active';
  if (maxPrice != null && fields.price != null && fields.price > maxPrice) return 'price above maxPrice';
  if (bedrooms.value != null && fields.bedrooms == null) return 'bedrooms missing while bedrooms filter is active';
  if (bedrooms.value != null && fields.bedrooms != null && (bedrooms.plus ? fields.bedrooms < bedrooms.value : fields.bedrooms !== bedrooms.value)) return 'bedrooms did not match';
  if (bathrooms.value != null && fields.bathrooms == null) return 'bathrooms missing while bathrooms filter is active';
  if (bathrooms.value != null && fields.bathrooms != null && (bathrooms.plus ? fields.bathrooms < bathrooms.value : fields.bathrooms !== bathrooms.value)) return 'bathrooms did not match';
  if (minArea != null && fields.area == null) return 'area missing while minArea is active';
  if (minArea != null && fields.area != null && fields.area < minArea) return 'area below minArea';
  if (maxArea != null && fields.area == null) return 'area missing while maxArea is active';
  if (maxArea != null && fields.area != null && fields.area > maxArea) return 'area above maxArea';
  if (filters.features?.some((feature) => !candidatesMatch(fields.featureCandidates, normalizeFilterValue(feature)))) return 'features did not match';
  if (status && fields.status !== status) return 'status did not match';
  if (isVisible === 'true' && fields.isVisible === false) return 'isVisible is false';
  if (isVisible === 'false' && fields.isVisible !== false) return 'isVisible is not false';
  if (isFeaturedOnlyFilter(featured) && !fields.featured) return 'featured did not match';
  return null;
}

export function filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
  const text = normalizeFilterValue(filters.text);
  const country = normalizeFilterValue(filters.country || filters.countryCode);
  const city = normalizeFilterValue(filters.city);
  const listingType = normalizeFilterValue(filters.listingType);
  const propertyType = normalizeFilterValue(filters.type || filters.property_type);
  const category = normalizeFilterValue(filters.category);
  const minPrice = numberValue(filters.minPrice);
  const maxPrice = numberValue(filters.maxPrice);
  const minArea = numberValue(filters.minArea);
  const maxArea = numberValue(filters.maxArea);
  const bedrooms = plusNumberValue(filters.bedrooms);
  const bathrooms = plusNumberValue(filters.bathrooms);
  const status = normalizeFilterValue(filters.status);
  const isVisible = normalizeFilterValue(filters.visibility || filters.isVisible);
  const featured = normalizeFilterValue(filters.featured);
  const featureFilters = (filters.features || []).map(normalizeFilterValue).filter(Boolean);

  if (isHotelFilterSelected(filters)) {
    devLog('hotel filter selected; hotels are listed outside properties', filters);
    return [];
  }

  const hasActiveFilters = Boolean(
    text ||
      country ||
      city ||
      listingType ||
      propertyType ||
      category ||
      minPrice != null ||
      maxPrice != null ||
      bedrooms.value != null ||
      bathrooms.value != null ||
      minArea != null ||
      maxArea != null ||
      status ||
      isVisible ||
      featureFilters.length > 0 ||
      isFeaturedOnlyFilter(featured),
  );

  if (!hasActiveFilters) {
    return sortPublicProperties(properties);
  }

  const result = properties.filter((property) => {
    const fields = propertyFilterFields(property);

    return (
      isReadableProperty(property) &&
      (!text || fields.source.includes(text)) &&
      (!country || candidatesMatch([fields.country, fields.countryCode], country)) &&
      (!city || candidatesMatch([fields.city], city)) &&
      (!listingType || candidatesMatch(fields.listingCandidates, listingType)) &&
      (!propertyType || candidatesMatch(fields.typeCandidates, propertyType)) &&
      (!category || candidatesMatch(fields.categoryCandidates, category)) &&
      (minPrice == null || (fields.price != null && fields.price >= minPrice)) &&
      (maxPrice == null || (fields.price != null && fields.price <= maxPrice)) &&
      (bedrooms.value == null || (fields.bedrooms != null && (bedrooms.plus ? fields.bedrooms >= bedrooms.value : fields.bedrooms === bedrooms.value))) &&
      (bathrooms.value == null || (fields.bathrooms != null && (bathrooms.plus ? fields.bathrooms >= bathrooms.value : fields.bathrooms === bathrooms.value))) &&
      (minArea == null || (fields.area != null && fields.area >= minArea)) &&
      (maxArea == null || (fields.area != null && fields.area <= maxArea)) &&
      (!status || fields.status === status) &&
      (!isVisible || (isVisible === 'true' ? fields.isVisible !== false : fields.isVisible === false)) &&
      featureFilters.every((feature) => candidatesMatch(fields.featureCandidates, feature)) &&
      (!isFeaturedOnlyFilter(featured) || fields.featured)
    );
  });

  if (import.meta.env.DEV && properties.length > 0 && result.length === 0) {
    const firstProperty = properties[0];
    console.warn('[properties] filter returned zero properties', {
      activeFilters: filters,
      firstPropertyFields: propertyFilterFields(firstProperty),
      firstFailedReason: firstFilterFailure(firstProperty, filters) || 'passed filters',
    });
  }

  return sortPublicProperties(result);
}

export function getPropertiesWithCoordinates(properties: Property[]): Property[] {
  return properties.filter((property) => extractPropertyCoordinates(property));
}

export async function getFilteredProperties(filters: PropertyFilters, max = 80): Promise<Property[]> {
  const result = await fetchPropertiesFlexible(max);
  return filterProperties(result.properties, filters);
}

export async function updateProperty(id: string, fields: Partial<Property>): Promise<void> {
  await updateDoc(doc(db, 'properties', id), {
    ...toCanonicalPropertyUpdate(fields as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function markPropertyFeatured(id: string, adminUid: string, input: FeaturedPropertyInput = {}): Promise<void> {
  const featuredUntil = input.featuredUntil ? new Date(`${input.featuredUntil}T23:59:59`) : null;
  const featuredOrder = numberValue(input.featuredOrder);
  await updateDoc(doc(db, 'properties', id), {
    isFeatured: true,
    featured: true,
    featuredStartedAt: serverTimestamp(),
    featuredUntil,
    featuredBy: adminUid,
    featuredPlan: input.featuredPlan || '',
    featuredNote: input.featuredNote || '',
    featuredOrder: featuredOrder ?? null,
    promotionStatus: 'active',
    promotionType: 'manual',
    updatedAt: serverTimestamp(),
  });
}

export async function removePropertyFeatured(id: string): Promise<void> {
  await updateDoc(doc(db, 'properties', id), {
    isFeatured: false,
    featured: false,
    promotionStatus: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

export async function hideProperty(id: string): Promise<void> {
  await updateProperty(id, { isVisible: false });
}

export async function softDeleteProperty(id: string): Promise<void> {
  await updateProperty(id, { status: 'deleted', isVisible: false });
}

