import type { Property } from '../types/models';
import { formatDate, formatNumber } from './formatters';
import { detectPropertyFlowKind, type PropertyFlowKind } from './propertyFlow';
import { getPropertySeoPrice } from './seo';

type RecordLike = Record<string, unknown>;

export type DetailRow = {
  key: string;
  labelKey: string;
  value: string;
};

export type PropertyPricingDisplay = {
  labelKey: string;
  value: string;
  flowKind: PropertyFlowKind;
};

function nestedValue(record: RecordLike, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as RecordLike)[key] : undefined), record);
}

export function textValue(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text && text.toLowerCase() !== 'undefined' && text.toLowerCase() !== 'null') return text;
  }
  return '';
}

export function positiveNumberValue(...values: unknown[]): string {
  const text = textValue(...values);
  if (!text) return '';
  const parsed = Number(text.replace(/,/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return text;
}

export function isProjectProperty(property: Partial<Property> & RecordLike): boolean {
  const source = [
    property.property_type,
    property.propertyType,
    property.type,
    property.category,
    property.property_category_title,
    nestedValue(property, 'projectInfo.projectStatus'),
    nestedValue(property, 'projectInfo.totalUnits'),
    nestedValue(property, 'projectInfo.numberOfBuildings'),
  ]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
  return /\bproject\b|مشروع/.test(source);
}

function formatMoney(amount: string, currency: string) {
  return `${formatNumber(amount)} ${currency}`.trim();
}

export function getPricingDisplay(property: Property): PropertyPricingDisplay | null {
  const record = property as RecordLike;
  const flowKind = detectPropertyFlowKind(property);
  const seoPrice = getPropertySeoPrice(property);
  const currency = seoPrice.currency || textValue(property.currency, property.selling_price_currency, property.daily_price_currency);

  if (flowKind === 'offPlan') {
    const amount = positiveNumberValue(seoPrice.startingPrice, nestedValue(record, 'pricing.startingPrice'), property.startingPrice, property.starting_price, property.price);
    return amount ? { labelKey: 'propertyDetails.pricing.startingFrom', value: formatMoney(amount, currency), flowKind } : null;
  }

  if (flowKind === 'rent') {
    const rentalPeriod = textValue(nestedValue(record, 'pricing.rentalPeriod'), record.rentalPeriod).toLowerCase();
    const periodCandidates: Array<[string, string, unknown[]]> = [
      ['daily', 'propertyDetails.pricing.daily', [nestedValue(record, 'pricing.dailyPrice'), property.dailyPrice, property.daily_price]],
      ['weekly', 'propertyDetails.pricing.weekly', [nestedValue(record, 'pricing.weeklyPrice'), property.weeklyPrice, property.weekly_price]],
      ['monthly', 'propertyDetails.pricing.monthly', [nestedValue(record, 'pricing.monthlyPrice'), property.monthlyPrice, property.monthly_price]],
      ['yearly', 'propertyDetails.pricing.yearly', [nestedValue(record, 'pricing.yearlyPrice'), property.yearlyPrice, property.yearly_price]],
    ];
    const selected = periodCandidates.find(([period]) => rentalPeriod === period);
    const orderedCandidates = selected ? [selected, ...periodCandidates.filter(([period]) => period !== selected[0])] : periodCandidates;
    for (const [, labelKey, values] of orderedCandidates) {
      const amount = positiveNumberValue(...values);
      if (amount) return { labelKey, value: formatMoney(amount, currency), flowKind };
    }
    const fallback = positiveNumberValue(nestedValue(record, 'pricing.rentPrice'), property.rentPrice, property.price);
    return fallback ? { labelKey: 'propertyDetails.pricing.rent', value: formatMoney(fallback, currency), flowKind } : null;
  }

  const amount = positiveNumberValue(nestedValue(record, 'pricing.salePrice'), property.salePrice, property.sellingPrice, property.selling_price, property.price);
  return amount ? { labelKey: 'propertyDetails.pricing.sale', value: formatMoney(amount, currency), flowKind } : null;
}

export function getOffPlanRows(property: Property): DetailRow[] {
  const record = property as RecordLike;
  const projectInfo = (record.projectInfo && typeof record.projectInfo === 'object' ? record.projectInfo : {}) as RecordLike;
  const price = getPricingDisplay(property);
  const rawRows: DetailRow[] = [
    { key: 'startingPrice', labelKey: 'propertyDetails.offPlan.startingFrom', value: price?.flowKind === 'offPlan' ? price.value : '' },
    { key: 'developerName', labelKey: 'propertyDetails.offPlan.developerName', value: textValue(projectInfo.developerName, record.developerName, record.developer_name) },
    { key: 'expectedDeliveryDate', labelKey: 'propertyDetails.offPlan.expectedDeliveryDate', value: formatOptionalDate(projectInfo.expectedDeliveryDate || record.expectedDeliveryDate || record.expected_delivery_date) },
    { key: 'constructionProgress', labelKey: 'propertyDetails.offPlan.constructionProgress', value: formatPercent(projectInfo.constructionProgress || record.constructionProgress || record.construction_progress) },
    { key: 'downPayment', labelKey: 'propertyDetails.offPlan.downPayment', value: formatOptionalMoney(projectInfo.downPayment || record.downPayment || record.down_payment, property) },
    { key: 'paymentPlan', labelKey: 'propertyDetails.offPlan.paymentPlan', value: textValue(projectInfo.paymentPlan, record.paymentPlan, record.payment_plan) },
    { key: 'projectStatus', labelKey: 'propertyDetails.offPlan.projectStatus', value: textValue(projectInfo.projectStatus, record.projectStatus, record.project_status) },
    { key: 'numberOfBuildings', labelKey: 'propertyDetails.offPlan.numberOfBuildings', value: positiveNumberValue(projectInfo.numberOfBuildings, record.numberOfBuildings, record.number_of_buildings) },
    { key: 'totalUnits', labelKey: 'propertyDetails.offPlan.totalUnits', value: positiveNumberValue(projectInfo.totalUnits, record.totalUnits, record.total_units) },
  ];
  return rawRows.filter((row) => row.value);
}

export function getProjectRows(property: Property): DetailRow[] {
  const record = property as RecordLike;
  const projectInfo = (record.projectInfo && typeof record.projectInfo === 'object' ? record.projectInfo : {}) as RecordLike;
  return [
    { key: 'projectStatus', labelKey: 'propertyDetails.offPlan.projectStatus', value: textValue(projectInfo.projectStatus, record.projectStatus, record.project_status) },
    { key: 'numberOfBuildings', labelKey: 'propertyDetails.offPlan.numberOfBuildings', value: positiveNumberValue(projectInfo.numberOfBuildings, record.numberOfBuildings, record.number_of_buildings) },
    { key: 'totalUnits', labelKey: 'propertyDetails.offPlan.totalUnits', value: positiveNumberValue(projectInfo.totalUnits, record.totalUnits, record.total_units) },
  ].filter((row) => row.value);
}

export function getSummaryStats(property: Property): string[] {
  const project = isProjectProperty(property);
  const stats = [
    !project && positiveNumberValue(property.bedrooms) ? `${formatNumber(property.bedrooms)} غرف` : '',
    !project && positiveNumberValue(property.bathrooms) ? `${formatNumber(property.bathrooms)} حمامات` : '',
    positiveNumberValue(property.area) ? `${formatNumber(property.area)} م²` : '',
    textValue(property.property_type, property.propertyType, property.category, property.type, property.listingType, property.dealType),
  ];
  return stats.filter(Boolean);
}

export function getPublicContact(property: Property) {
  const name = textValue(property.contactName, property.contact_name, property.ownerName);
  const phone = textValue(property.contactPhone, property.contact_number, property.ownerPhone, property.phone);
  return name || phone ? { name, phone } : null;
}

function formatOptionalDate(value: unknown) {
  const text = textValue(value);
  return text ? formatDate(text) : '';
}

function formatOptionalMoney(value: unknown, property: Property) {
  const amount = positiveNumberValue(value);
  if (!amount) return '';
  const currency = getPropertySeoPrice(property).currency || textValue(property.currency, property.selling_price_currency, property.daily_price_currency);
  return formatMoney(amount, currency);
}

function formatPercent(value: unknown) {
  const amount = positiveNumberValue(value);
  return amount ? `${formatNumber(amount)}%` : '';
}
