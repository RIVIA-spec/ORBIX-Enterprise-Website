import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AdminContact {
  whatsapp: string;
  phone: string;
  countryCode: string;
  email: string;
}

const ADMIN_CONTACT_PATH = 'settings/whatsapp_contact';
let cachedContact: AdminContact | null = null;

function stringValue(...values: unknown[]): string {
  return values.find((value) => typeof value === 'string' && value.trim())?.toString().trim() || '';
}

function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^0-9]/g, '').replace(/^00/, '');
}

export async function getAdminContact(): Promise<AdminContact> {
  if (cachedContact) return cachedContact;
  try {
    const snap = await getDoc(doc(db, 'settings', 'whatsapp_contact'));
    const data = snap.exists() ? snap.data() : {};
    const countryCode = stringValue(data.country_code, data.countryCode, data.dialCode, '963');
    const phone = stringValue(data.phone, data.adminPhone, data.supportPhone);
    const combined = stringValue(data.whatsapp, data.whatsappNumber) || `${countryCode}${phone}`;
    cachedContact = {
      whatsapp: normalizeWhatsAppNumber(combined),
      phone,
      countryCode,
      email: stringValue(data.supportEmail, data.email),
    };
    return cachedContact;
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`[admin contact] failed to read ${ADMIN_CONTACT_PATH}`, error);
    throw new Error('تعذر تحميل بيانات التواصل مع الإدارة.');
  }
}

export async function buildAdminWhatsAppUrl(input: { propertyReference: string; propertyTitle: string }): Promise<string | null> {
  const contact = await getAdminContact();
  if (!contact.whatsapp) return null;
  const message = `مرحبا أريد الاستفسار عن العقار رقم: ${input.propertyReference} - ${input.propertyTitle}`;
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
