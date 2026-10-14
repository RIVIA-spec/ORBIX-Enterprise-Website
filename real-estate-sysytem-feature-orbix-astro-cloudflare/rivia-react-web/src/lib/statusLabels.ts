function normalizeStatus(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

const bookingStatusLabels: Record<string, string> = {
  pending: 'بانتظار المراجعة',
  confirmed: 'مؤكد',
  rejected: 'مرفوض',
  cancelled: 'ملغى',
  completed: 'مكتمل',
  rescheduled: 'تمت إعادة الجدولة',
};

const dealStatusLabels: Record<string, string> = {
  pending: 'بانتظار المراجعة',
  confirmed: 'مؤكد',
  approved: 'مؤكد',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  negotiating: 'قيد التفاوض',
  completed: 'مكتمل',
};

const bookingTypeLabels: Record<string, string> = {
  property_visit: 'طلب معاينة',
  property_booking: 'طلب حجز',
  purchase_request: 'طلب شراء',
  property: 'عقار',
  hotel: 'فندق',
};

const contactMethodLabels: Record<string, string> = {
  phone: 'هاتف',
  whatsapp: 'واتساب',
  email: 'بريد إلكتروني',
};

const purchaseIntentLabels: Record<string, string> = {
  direct_buy: 'شراء مباشر',
  direct_purchase: 'شراء مباشر',
  negotiate: 'تفاوض على السعر',
  negotiation: 'تفاوض على السعر',
  consultation: 'طلب استشارة',
  'شراء مباشر': 'شراء مباشر',
  'تفاوض على السعر': 'تفاوض على السعر',
  'طلب استشارة': 'طلب استشارة',
};

export function getWorkflowStatusLabel(status?: string): string {
  const key = normalizeStatus(status);
  return bookingStatusLabels[key] || dealStatusLabels[key] || status || 'غير محدد';
}

export function getWorkflowStatusTone(status?: string): 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'amber' {
  const key = normalizeStatus(status);
  if (['pending', 'waiting'].includes(key)) return 'amber';
  if (['confirmed', 'approved', 'completed', 'active', 'verified'].includes(key)) return 'green';
  if (['rejected', 'cancelled', 'inactive', 'blocked'].includes(key)) return 'red';
  if (['negotiating', 'rescheduled'].includes(key)) return 'purple';
  return 'blue';
}

export function getBookingTypeLabel(type?: string): string {
  const key = normalizeStatus(type);
  return bookingTypeLabels[key] || 'حجز';
}

export function getContactMethodLabel(method?: string): string {
  const key = normalizeStatus(method);
  return contactMethodLabels[key] || method || 'غير محدد';
}

export function getPurchaseIntentLabel(intent?: string): string {
  const key = normalizeStatus(intent);
  return purchaseIntentLabels[key] || intent || 'غير محدد';
}
