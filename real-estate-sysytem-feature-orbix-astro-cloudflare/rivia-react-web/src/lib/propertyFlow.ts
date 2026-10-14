import type { Property } from '../types/models';

export type PropertyFlowKind = 'sale' | 'rent' | 'offPlan' | 'unknown';

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\s+/g, ' ');
}

export function isSaleListingType(value: unknown): boolean {
  const normalized = normalizeText(value);
  return ['\u0628\u064a\u0639', '\u0644\u0644\u0628\u064a\u0639', 'sale', 'sell', 'purchase', 'for sale'].includes(normalized);
}

export function isRentListingType(value: unknown): boolean {
  const normalized = normalizeText(value);
  return ['\u0627\u064a\u062c\u0627\u0631', '\u0644\u0644\u0627\u064a\u062c\u0627\u0631', 'rent', 'rental', 'lease', 'daily', 'nightly', 'for rent'].includes(normalized);
}

export function isOffPlanListingType(value: unknown): boolean {
  const normalized = normalizeText(value).replace(/[_\s]+/g, '-');
  return [
    'offplan',
    'off-plan',
    'newproject',
    'new-project',
    'off-plan-new-project',
    'new-project-off-plan',
    '\u0639\u0644\u0649-\u0627\u0644\u0645\u062e\u0637\u0637',
    '\u0645\u0634\u0631\u0648\u0639-\u062c\u062f\u064a\u062f',
  ].includes(normalized);
}

function flattenValues(property: Partial<Property> & Record<string, unknown>): string {
  return [
    property.property_type,
    property.propertyType,
    property.type,
    property.category,
    property.listing_type,
    property.listingType,
    property.offer_type,
    property.offerType,
    property.dealType,
    property.status,
    property.title,
    property.name,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ');
}

export function detectPropertyFlowKind(property: Partial<Property> & Record<string, unknown>): PropertyFlowKind {
  const explicitCandidates = [
    property.listing_type,
    property.listingType,
    property.offer_type,
    property.offerType,
    property.dealType,
    property.request_type,
  ];
  if (explicitCandidates.some(isOffPlanListingType)) return 'offPlan';
  if (explicitCandidates.some(isSaleListingType)) return 'sale';
  if (explicitCandidates.some(isRentListingType)) return 'rent';

  const legacyCandidates = [property.property_type, property.propertyType, property.type];
  if (legacyCandidates.some(isOffPlanListingType)) return 'offPlan';
  if (legacyCandidates.some(isSaleListingType)) return 'sale';
  if (legacyCandidates.some(isRentListingType)) return 'rent';

  const source = flattenValues(property);
  if (/(off[-\s]?plan|new[-\s]?project|\u0639\u0644\u0649\s+\u0627\u0644\u0645\u062e\u0637\u0637|\u0645\u0634\u0631\u0648\u0639\s+\u062c\u062f\u064a\u062f)/i.test(source)) return 'offPlan';
  if (/(\u0628\u064a\u0639|\u0644\u0644\u0628\u064a\u0639|sale|sell|purchase|for sale)/i.test(source)) return 'sale';
  if (/(\u0627\u064a\u062c\u0627\u0631|\u0644\u0644\u0627\u064a\u062c\u0627\u0631|rent|rental|lease|daily|nightly|for rent)/i.test(source)) return 'rent';
  return 'unknown';
}

export function isStayStyleProperty(property: Partial<Property> & Record<string, unknown>): boolean {
  const source = flattenValues(property);
  return /(\u0641\u0646\u062f\u0642|hotel|daily|nightly|tourism|\u0633\u064a\u0627\u062d\u064a|\u0634\u0627\u0644\u064a\u0647|resort|guest|short stay|holiday|daily rent|\u0627\u064a\u062c\u0627\u0631 \u064a\u0648\u0645\u064a|\u064a\u0648\u0645\u064a)/i.test(source);
}

export function getPropertyContactHref(property: Partial<Property> & Record<string, unknown>): string | null {
  const rawPhone = property.contactPhone || property.contact_number || property.ownerPhone || property.phone;
  const phone = normalizeText(rawPhone);
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

export function getPropertyContactLabel(property: Partial<Property> & Record<string, unknown>): string {
  return getPropertyContactHref(property) ? '\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u0627\u0644\u0643' : '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631\u0629';
}
