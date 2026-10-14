import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type CookieBannerPosition = 'bottom-right' | 'bottom-center';

export type CookieConsentSettings = {
  enabled: boolean;
  version: number;
  policyLastUpdated: string;
  titleAr: string;
  descriptionAr: string;
  acceptAllLabelAr: string;
  rejectOptionalLabelAr: string;
  policyLinkLabelAr: string;
  essentialEnabled: true;
  analyticsEnabled: boolean;
  marketingEnabled: boolean;
  analyticsProviderName: string;
  marketingProviderName: string;
  bannerPosition: CookieBannerPosition;
  requireRenewedConsent: boolean;
  updatedAt?: Timestamp;
  updatedBy: string;
};

export const HAS_ANALYTICS_PROVIDER = false;
export const HAS_MARKETING_PROVIDER = false;

const SETTINGS_COLLECTION = 'app_settings';
const SETTINGS_DOCUMENT = 'cookie_consent';
let cachedSettings: CookieConsentSettings | null = null;

export const defaultCookieConsentSettings: CookieConsentSettings = {
  enabled: true,
  version: 1,
  policyLastUpdated: '2026-07-21',
  titleAr: 'ملفات تعريف الارتباط (الكوكيز)',
  descriptionAr:
    'نستخدم ملفات تعريف الارتباط الضرورية لتشغيل Orbix. وبموافقتك، قد نستخدم ملفات تحليلية لتحسين أداء المنصة وتجربة الاستخدام. يمكنك قبول جميع الملفات أو رفض الملفات غير الضرورية.',
  acceptAllLabelAr: 'قبول الكل',
  rejectOptionalLabelAr: 'رفض غير الضروري',
  policyLinkLabelAr: 'قراءة سياسة الكوكيز',
  essentialEnabled: true,
  analyticsEnabled: false,
  marketingEnabled: false,
  analyticsProviderName: '',
  marketingProviderName: '',
  bannerPosition: 'bottom-right',
  requireRenewedConsent: false,
  updatedBy: '',
};

function booleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function positionValue(value: unknown): CookieBannerPosition {
  return value === 'bottom-center' ? 'bottom-center' : 'bottom-right';
}

function normalizeCookieConsentSettings(data: Record<string, unknown>): CookieConsentSettings {
  return {
    enabled: booleanValue(data.enabled, defaultCookieConsentSettings.enabled),
    version: numberValue(data.version, defaultCookieConsentSettings.version),
    policyLastUpdated: stringValue(data.policyLastUpdated, defaultCookieConsentSettings.policyLastUpdated),
    titleAr: stringValue(data.titleAr, defaultCookieConsentSettings.titleAr),
    descriptionAr: stringValue(data.descriptionAr, defaultCookieConsentSettings.descriptionAr),
    acceptAllLabelAr: stringValue(data.acceptAllLabelAr, defaultCookieConsentSettings.acceptAllLabelAr),
    rejectOptionalLabelAr: stringValue(data.rejectOptionalLabelAr, defaultCookieConsentSettings.rejectOptionalLabelAr),
    policyLinkLabelAr: stringValue(data.policyLinkLabelAr, defaultCookieConsentSettings.policyLinkLabelAr),
    essentialEnabled: true,
    analyticsEnabled: HAS_ANALYTICS_PROVIDER && booleanValue(data.analyticsEnabled, defaultCookieConsentSettings.analyticsEnabled),
    marketingEnabled: HAS_MARKETING_PROVIDER && booleanValue(data.marketingEnabled, defaultCookieConsentSettings.marketingEnabled),
    analyticsProviderName: stringValue(data.analyticsProviderName, defaultCookieConsentSettings.analyticsProviderName),
    marketingProviderName: stringValue(data.marketingProviderName, defaultCookieConsentSettings.marketingProviderName),
    bannerPosition: positionValue(data.bannerPosition),
    requireRenewedConsent: booleanValue(data.requireRenewedConsent, defaultCookieConsentSettings.requireRenewedConsent),
    updatedAt: data.updatedAt as Timestamp | undefined,
    updatedBy: stringValue(data.updatedBy, defaultCookieConsentSettings.updatedBy),
  };
}

export async function getCookieConsentSettings(): Promise<CookieConsentSettings> {
  if (cachedSettings) return cachedSettings;
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOCUMENT));
  cachedSettings = snap.exists() ? normalizeCookieConsentSettings(snap.data()) : defaultCookieConsentSettings;
  return cachedSettings;
}

export async function saveCookieConsentSettings(settings: CookieConsentSettings, updatedBy: string): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOCUMENT),
    {
      enabled: settings.enabled,
      version: settings.version,
      policyLastUpdated: settings.policyLastUpdated,
      titleAr: settings.titleAr,
      descriptionAr: settings.descriptionAr,
      acceptAllLabelAr: settings.acceptAllLabelAr,
      rejectOptionalLabelAr: settings.rejectOptionalLabelAr,
      policyLinkLabelAr: settings.policyLinkLabelAr,
      essentialEnabled: true,
      analyticsEnabled: HAS_ANALYTICS_PROVIDER && settings.analyticsEnabled,
      marketingEnabled: HAS_MARKETING_PROVIDER && settings.marketingEnabled,
      analyticsProviderName: settings.analyticsProviderName,
      marketingProviderName: settings.marketingProviderName,
      bannerPosition: settings.bannerPosition,
      requireRenewedConsent: settings.requireRenewedConsent,
      updatedAt: serverTimestamp(),
      updatedBy,
    },
    { merge: true },
  );
  cachedSettings = { ...settings, essentialEnabled: true, requireRenewedConsent: false, updatedBy };
}

export function clearCookieConsentSettingsCache() {
  cachedSettings = null;
}
