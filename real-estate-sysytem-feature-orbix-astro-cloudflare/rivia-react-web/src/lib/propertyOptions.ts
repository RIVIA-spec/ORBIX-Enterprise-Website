import { COUNTRY_OPTIONS } from './countries';

export { COUNTRY_OPTIONS };

export const CITY_OPTIONS: Record<string, string[]> = {
  SY: ['دمشق', 'ريف دمشق', 'حمص', 'حلب', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب', 'درعا', 'السويداء', 'القنيطرة', 'دير الزور', 'الرقة', 'الحسكة'],
  LB: ['بيروت', 'جبل لبنان', 'طرابلس', 'صيدا', 'صور', 'زحلة', 'بعلبك', 'النبطية'],
  TR: ['إسطنبول', 'أنقرة', 'إزمير', 'بورصة', 'أنطاليا', 'غازي عنتاب', 'مرسين', 'قونية'],
  JO: ['عمان', 'إربد', 'الزرقاء', 'العقبة', 'السلط', 'مادبا', 'جرش', 'الكرك'],
};

export const PROPERTY_TYPE_OPTIONS = ['شقة', 'منزل', 'فيلا', 'مزرعة', 'شاليه', 'أرض', 'مكتب', 'محل تجاري', 'مستودع'];
export const LISTING_TYPE_OPTIONS = ['بيع', 'إيجار'];
export const CATEGORY_OPTIONS = ['سكني', 'تجاري', 'سياحي', 'زراعي', 'أرض'];
export const FEATURE_OPTIONS = ['واي فاي', 'تكييف', 'موقف سيارات', 'تلفاز', 'مطبخ مجهز', 'غسالة ملابس', 'حديقة', 'مسبح', 'مصعد', 'تدفئة', 'شرفة', 'أمن'];
export const STATUS_OPTIONS = ['متاح', 'محجوز', 'مباع', 'مؤجر'];
export const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5+'];
export const BATHROOM_OPTIONS = ['1', '2', '3', '4+'];

export const PRICE_RANGE_OPTIONS = [
  { key: 'under-50000', label: 'أقل من 50,000', min: '', max: '50000' },
  { key: '50000-100000', label: '50,000 - 100,000', min: '50000', max: '100000' },
  { key: '100000-250000', label: '100,000 - 250,000', min: '100000', max: '250000' },
  { key: '250000-500000', label: '250,000 - 500,000', min: '250000', max: '500000' },
  { key: 'over-500000', label: 'أكثر من 500,000', min: '500000', max: '' },
];

export const AREA_RANGE_OPTIONS = [
  { key: 'under-50', label: 'أقل من 50 م²', min: '', max: '50' },
  { key: '50-100', label: '50 - 100 م²', min: '50', max: '100' },
  { key: '100-200', label: '100 - 200 م²', min: '100', max: '200' },
  { key: '200-500', label: '200 - 500 م²', min: '200', max: '500' },
  { key: 'over-500', label: 'أكثر من 500 م²', min: '500', max: '' },
];

export const FEATURED_FILTER_OPTIONS = [
  { value: '', label: 'كل العقارات' },
  { value: 'featuredOnly', label: 'مميز فقط' },
];

export function normalizeArabicOption(value: unknown): string {
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

export function isDefaultFilterValue(value: unknown): boolean {
  return [
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
    'كل الاسعار',
    'كل المساحات',
  ].map(normalizeArabicOption).includes(normalizeArabicOption(value));
}

export function getCitiesByCountry(countryCodeOrName?: string) {
  const country = COUNTRY_OPTIONS.find((item) => item.code === countryCodeOrName || item.name === countryCodeOrName);
  if (!country) return Object.values(CITY_OPTIONS).flat();
  return CITY_OPTIONS[country.code] || [];
}

export function mapPriceRangeToFilter(rangeKey?: string) {
  const range = PRICE_RANGE_OPTIONS.find((item) => item.key === rangeKey);
  return { minPrice: range?.min || '', maxPrice: range?.max || '' };
}

export function mapAreaRangeToFilter(rangeKey?: string) {
  const range = AREA_RANGE_OPTIONS.find((item) => item.key === rangeKey);
  return { minArea: range?.min || '', maxArea: range?.max || '' };
}
