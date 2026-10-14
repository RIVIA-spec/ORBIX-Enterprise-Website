import type { Property, PropertyRequest } from '../types/models';

export type CanonicalListingType = 'sale' | 'rent' | 'offPlan' | 'unknown';

type AnyRecord = Record<string, unknown>;

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizedText(value: unknown): string {
  return text(value)
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\s+/g, ' ');
}

function isSale(value: unknown): boolean {
  return ['sale', 'sell', 'purchase', 'for sale', 'بيع', 'للبيع'].includes(normalizedText(value));
}

function isRent(value: unknown): boolean {
  return ['rent', 'rental', 'lease', 'for rent', 'daily', 'nightly', 'ايجار', 'إيجار', 'للايجار', 'للإيجار'].includes(normalizedText(value));
}

function isOffPlan(value: unknown): boolean {
  const normalized = normalizedText(value).replace(/[\s_]+/g, '-');
  return ['offplan', 'off-plan', 'newproject', 'new-project', 'على-المخطط', 'مشروع-جديد'].includes(normalized);
}

export function detectListingType(input: AnyRecord): CanonicalListingType {
  const candidates = [
    input.listingType,
    input.listing_type,
    input.offerType,
    input.offer_type,
    input.purpose,
    input.transactionType,
    input.property_type,
    input.propertyType,
    input.type,
  ];
  if (candidates.some(isOffPlan)) return 'offPlan';
  if (candidates.some(isSale)) return 'sale';
  if (candidates.some(isRent)) return 'rent';

  const pricing = (input.pricing && typeof input.pricing === 'object' ? input.pricing : {}) as AnyRecord;
  if (firstValue(pricing.startingPrice, input.startingPrice, input.starting_price)) return 'offPlan';
  if (firstValue(pricing.salePrice, input.salePrice, input.sellingPrice, input.selling_price)) return 'sale';
  if (firstValue(pricing.rentPrice, pricing.dailyPrice, input.rentPrice, input.daily_price, input.monthly_price, input.yearly_price)) return 'rent';
  return 'unknown';
}

function numberLike(value: unknown) {
  const raw = text(value).replace(/,/g, '');
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function scalar(value: unknown): string | number | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return value == null ? undefined : String(value);
}

export function toCanonicalPropertyWrite(input: AnyRecord): AnyRecord {
  const pricing = (input.pricing && typeof input.pricing === 'object' ? input.pricing : {}) as AnyRecord;
  const location = (input.location && typeof input.location === 'object' ? input.location : {}) as AnyRecord;
  const media = (input.media && typeof input.media === 'object' ? input.media : {}) as AnyRecord;
  const specs = (input.specs && typeof input.specs === 'object' ? input.specs : {}) as AnyRecord;
  const contact = (input.contact && typeof input.contact === 'object' ? input.contact : {}) as AnyRecord;
  const rating = (input.rating && typeof input.rating === 'object' ? input.rating : {}) as AnyRecord;
  const listingType = detectListingType(input);
  const currency = text(firstValue(pricing.currency, input.currency, input.priceCurrency, input.selling_price_currency, input.daily_price_currency));
  const salePrice = numberLike(firstValue(pricing.salePrice, input.salePrice, input.sellingPrice, input.selling_price, listingType === 'sale' ? input.price : undefined));
  const rentPrice = numberLike(firstValue(pricing.rentPrice, pricing.dailyPrice, input.rentPrice, input.daily_price, input.monthly_price, input.yearly_price, listingType === 'rent' ? input.price : undefined));
  const startingPrice = numberLike(firstValue(pricing.startingPrice, input.startingPrice, input.starting_price, listingType === 'offPlan' ? input.price : undefined));
  const images = stringList(firstValue(media.images, input.images));
  const mainImage = text(firstValue(media.mainImage, input.mainImage, input.imageUrl, images[0]));
  const nextPricing: AnyRecord = { currency };

  if (listingType === 'sale' && salePrice !== undefined) nextPricing.salePrice = salePrice;
  if (listingType === 'rent') {
    nextPricing.rentalPeriod = text(firstValue(pricing.rentalPeriod, input.rentalPeriod, input.daily_price ? 'daily' : input.monthly_price ? 'monthly' : input.yearly_price ? 'yearly' : 'daily'));
    if (rentPrice !== undefined) nextPricing.rentPrice = rentPrice;
  }
  if (listingType === 'offPlan' && startingPrice !== undefined) nextPricing.startingPrice = startingPrice;

  return {
    title: text(firstValue(input.title, input.titleAr, input.name)),
    description: text(input.description),
    listingType,
    propertyType: text(firstValue(input.propertyType, input.property_category_title, input.category, input.type, input.property_type)),
    categoryId: text(firstValue(input.categoryId, input.property_category_id)),
    categoryTitle: text(firstValue(input.categoryTitle, input.property_category_title)),
    status: text(input.status || 'pending'),
    availability: text(firstValue(input.availability, input.status, 'available')),
    isVisible: input.isVisible !== false,
    ownerId: text(input.ownerId),
    features: stringList(input.features),
    pricing: nextPricing,
    location: {
      country: text(firstValue(location.country, input.country)),
      countryCode: text(firstValue(location.countryCode, input.countryCode)),
      city: text(firstValue(location.city, input.city)),
      address: text(firstValue(location.address, input.address)),
      latitude: firstValue(location.latitude, location.lat, input.latitude, input.lat) ?? '',
      longitude: firstValue(location.longitude, location.lng, input.longitude, input.lng) ?? '',
    },
    specs: {
      area: numberLike(firstValue(specs.area, input.area)) ?? '',
      areaUnit: text(firstValue(specs.areaUnit, input.area_unit)),
      bathrooms: numberLike(firstValue(specs.bathrooms, input.bathrooms)) ?? '',
      bedrooms: numberLike(firstValue(specs.bedrooms, input.bedrooms)) ?? '',
    },
    contact: {
      name: text(firstValue(contact.name, input.contact_name, input.ownerName)),
      phone: text(firstValue(contact.phone, input.contact_number, input.contactPhone, input.ownerPhone, input.phone)),
      phoneCountryCode: text(firstValue(contact.phoneCountryCode, input.phoneCountryCode, input.country_code)),
    },
    media: {
      mainImage,
      images,
    },
    rating: {
      average: numberLike(firstValue(rating.average, input.averageRating)) ?? 0,
      count: numberLike(firstValue(rating.count, input.ratingCount)) ?? 0,
    },
    rules: text(input.rules),
    ...(input.projectInfo ? { projectInfo: input.projectInfo } : {}),
    ...(input.panorama_tour ? { panorama_tour: input.panorama_tour } : {}),
  };
}

export function toCanonicalPropertyUpdate(input: AnyRecord): AnyRecord {
  const propertyLikeKeys = [
    'title',
    'description',
    'property_type',
    'propertyType',
    'property_category_id',
    'property_category_title',
    'listing_type',
    'listingType',
    'offerType',
    'price',
    'salePrice',
    'sellingPrice',
    'selling_price',
    'rentPrice',
    'daily_price',
    'monthly_price',
    'yearly_price',
    'startingPrice',
    'starting_price',
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
    'area',
    'bathrooms',
    'bedrooms',
    'contact_name',
    'contact_number',
    'mainImage',
    'images',
    'features',
    'media',
    'pricing',
    'location',
    'specs',
    'contact',
    'rating',
    'averageRating',
    'ratingCount',
  ];
  const hasPropertyPayload = propertyLikeKeys.some((key) => Object.prototype.hasOwnProperty.call(input, key));
  if (!hasPropertyPayload) return { ...input };

  const canonical = toCanonicalPropertyWrite(input);
  return {
    ...canonical,
    ...(Object.prototype.hasOwnProperty.call(input, 'status') ? { status: input.status } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'availability') ? { availability: input.availability } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'isVisible') ? { isVisible: input.isVisible } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'isFeatured') ? { isFeatured: input.isFeatured } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featured') ? { featured: input.featured } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featuredUntil') ? { featuredUntil: input.featuredUntil } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featuredStartedAt') ? { featuredStartedAt: input.featuredStartedAt } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featuredBy') ? { featuredBy: input.featuredBy } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featuredPlan') ? { featuredPlan: input.featuredPlan } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featuredNote') ? { featuredNote: input.featuredNote } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'featuredOrder') ? { featuredOrder: input.featuredOrder } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'promotionStatus') ? { promotionStatus: input.promotionStatus } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'promotionType') ? { promotionType: input.promotionType } : {}),
  };
}

export function fromPropertyDocData(id: string, data: AnyRecord): Property {
  const canonical = toCanonicalPropertyWrite(data);
  const pricing = canonical.pricing as AnyRecord;
  const location = canonical.location as AnyRecord;
  const specs = canonical.specs as AnyRecord;
  const contact = canonical.contact as AnyRecord;
  const media = canonical.media as AnyRecord;
  const rating = canonical.rating as AnyRecord;

  return {
    id,
    ...(data as Omit<Property, 'id'>),
    ...(canonical as Omit<Property, 'id'>),
    property_type: text(data.property_type || canonical.propertyType),
    property_category_id: text(data.property_category_id || canonical.categoryId),
    property_category_title: text(data.property_category_title || canonical.categoryTitle),
    listing_type: text(data.listing_type || canonical.listingType),
    city: text(data.city || location.city),
    country: text(data.country || location.country),
    countryCode: text(data.countryCode || location.countryCode),
    address: text(data.address || location.address),
    latitude: scalar(data.latitude ?? location.latitude),
    longitude: scalar(data.longitude ?? location.longitude),
    area: scalar(data.area ?? specs.area),
    bathrooms: scalar(data.bathrooms ?? specs.bathrooms),
    bedrooms: scalar(data.bedrooms ?? specs.bedrooms),
    mainImage: text(data.mainImage || media.mainImage),
    images: stringList(data.images).length ? stringList(data.images) : stringList(media.images),
    contact_name: text(data.contact_name || contact.name),
    contact_number: text(data.contact_number || contact.phone),
    currency: text(data.currency || pricing.currency),
    price: scalar(data.price ?? pricing.salePrice ?? pricing.rentPrice ?? pricing.startingPrice),
    selling_price: scalar(data.selling_price ?? pricing.salePrice),
    sellingPrice: scalar(data.sellingPrice ?? pricing.salePrice),
    salePrice: scalar(data.salePrice ?? pricing.salePrice),
    rentPrice: scalar(data.rentPrice ?? pricing.rentPrice),
    daily_price: scalar(data.daily_price ?? pricing.rentPrice),
    startingPrice: scalar(data.startingPrice ?? pricing.startingPrice),
    averageRating: scalar(data.averageRating ?? rating.average),
    ratingCount: scalar(data.ratingCount ?? rating.count),
  };
}

export function toCanonicalPropertyRequest(input: Omit<PropertyRequest, 'id' | 'created_at' | 'updatedAt'>): AnyRecord {
  return {
    ...toCanonicalPropertyWrite(input as AnyRecord),
    request_type: input.request_type || 'publish',
    originalPropertyId: input.originalPropertyId,
  };
}
