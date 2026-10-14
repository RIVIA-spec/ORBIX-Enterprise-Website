import type { Property } from '../types/models';
import { detectPropertyFlowKind } from './propertyFlow';

export function formatNumber(value: unknown): string {
  const number = Number(String(value ?? '0').replace(/,/g, ''));
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('ar').format(number);
}

function recordValue(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined), record);
}

function textValue(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function firstPrice(...values: unknown[]) {
  for (const value of values) {
    const text = textValue(value);
    if (!text) continue;
    const parsed = Number(text.replace(/,/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) return text;
  }
  return '';
}

export function getPropertyPrice(property: Property): string {
  const flowKind = detectPropertyFlowKind(property);
  const record = property as Record<string, unknown>;
  const pricing = (record.pricing && typeof record.pricing === 'object' ? record.pricing : {}) as Record<string, unknown>;
  const currency = textValue(pricing.currency, property.currency, property.selling_price_currency, property.daily_price_currency, property.nightly_currency);

  if (flowKind === 'rent') {
    const rentalPeriod = textValue(pricing.rentalPeriod, record.rentalPeriod).toLowerCase();
    const candidates: Array<[string, string, unknown[]]> = [
      ['daily', 'يوم', [pricing.dailyPrice, property.dailyPrice, property.daily_price]],
      ['weekly', 'أسبوع', [pricing.weeklyPrice, property.weeklyPrice, property.weekly_price]],
      ['monthly', 'شهر', [pricing.monthlyPrice, property.monthly_price]],
      ['yearly', 'سنة', [pricing.yearlyPrice, property.yearly_price]],
      ['nightly', 'ليلة', [property.nightlyPrice, property.nightly_price]],
    ];
    const selected = candidates.find(([period]) => rentalPeriod === period);
    const ordered = selected ? [selected, ...candidates.filter(([period]) => period !== selected[0])] : candidates;
    for (const [, periodLabel, values] of ordered) {
      const amount = firstPrice(...values);
      if (amount) return `${formatNumber(amount)} ${currency}${periodLabel ? ` / ${periodLabel}` : ''}`.trim();
    }
    const fallback = firstPrice(pricing.rentPrice, property.rentPrice, property.price);
    return fallback ? `${formatNumber(fallback)} ${currency}`.trim() : 'السعر غير محدد';
  }

  if (flowKind === 'offPlan') {
    const amount = firstPrice(pricing.startingPrice, property.startingPrice, property.starting_price, property.price);
    return amount ? `${formatNumber(amount)} ${currency}`.trim() : 'السعر غير محدد';
  }

  if (flowKind === 'sale') {
    const amount = firstPrice(pricing.salePrice, property.selling_price, property.sellingPrice, property.salePrice, property.price);
    return amount ? `${formatNumber(amount)} ${currency}`.trim() : 'السعر غير محدد';
  }

  const fallback = firstPrice(
    property.price,
    property.daily_price,
    property.nightly_price,
    property.monthly_price,
    property.weekly_price,
    property.yearly_price,
    property.selling_price,
    property.starting_price,
    recordValue(record, 'pricing.startingPrice'),
  );
  return fallback ? `${formatNumber(fallback)} ${currency}`.trim() : '';
}

export function getLocationLabel(item: { city?: string; country?: string; address?: string; location?: { city?: string; country?: string; address?: string } }): string {
  const city = item.city || item.location?.city;
  const country = item.country || item.location?.country;
  if (city || country) return [city, country].filter(Boolean).join('، ');
  return item.address || item.location?.address || '';
}

export function imageFromList(imagesOrMain?: string | string[] | null, images?: string[]): string {
  if (Array.isArray(imagesOrMain)) return imagesOrMain.find(Boolean) || '';
  return imagesOrMain || images?.find(Boolean) || '';
}

export function formatDate(value: unknown): string {
  if (!value) return 'غير محدد';
  const candidate =
    typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : typeof value === 'object' && value !== null && 'seconds' in value && typeof value.seconds === 'number'
        ? new Date(value.seconds * 1000)
        : value;
  const date = candidate instanceof Date ? candidate : new Date(String(candidate));
  if (Number.isNaN(date.getTime())) return 'غير محدد';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(date);
}
