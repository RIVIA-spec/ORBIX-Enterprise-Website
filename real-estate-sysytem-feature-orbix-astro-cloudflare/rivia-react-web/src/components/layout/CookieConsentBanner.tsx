import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  defaultCookieConsentSettings,
  getCookieConsentSettings,
  HAS_ANALYTICS_PROVIDER,
  HAS_MARKETING_PROVIDER,
  type CookieConsentSettings,
} from '../../services/cookieConsentSettingsService';

const COOKIE_CONSENT_KEY = 'orbix_cookie_consent';
type CookieConsentValue = 'accepted' | 'essential_only';
type StoredCookieConsent = {
  status: CookieConsentValue;
  version: number;
  decidedAt: string;
};

const OPEN_COOKIE_SETTINGS_EVENT = 'orbix-open-cookie-settings';

function isConsentValue(value: unknown): value is CookieConsentValue {
  return value === 'accepted' || value === 'essential_only';
}

function readConsent(): StoredCookieConsent | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    if (isConsentValue(raw)) return { status: raw, version: 0, decidedAt: '' };
    const parsed = JSON.parse(raw) as Partial<StoredCookieConsent>;
    if (!isConsentValue(parsed.status)) return null;
    return {
      status: parsed.status,
      version: Number.isFinite(Number(parsed.version)) ? Number(parsed.version) : 0,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : '',
    };
  } catch {
    return null;
  }
}

function saveConsent(value: CookieConsentValue, version: number) {
  try {
    const payload: StoredCookieConsent = { status: value, version, decidedAt: new Date().toISOString() };
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  } catch {
    // Keep the banner dismissed in memory even if localStorage is unavailable.
  }
}

function shouldShowBanner(settings: CookieConsentSettings) {
  if (!settings.enabled) return false;
  const consent = readConsent();
  if (!consent) return true;
  return settings.requireRenewedConsent || consent.version < settings.version;
}

type CookieConsentPanelProps = {
  settings: CookieConsentSettings;
  preview?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onDismiss?: () => void;
};

export function CookieConsentPanel({ settings, preview = false, onAccept, onReject, onDismiss }: CookieConsentPanelProps) {
  const showAnalyticsCategory = HAS_ANALYTICS_PROVIDER && settings.analyticsEnabled;
  const showMarketingCategory = HAS_MARKETING_PROVIDER && settings.marketingEnabled;

  return (
    <section
      className={`cookie-consent cookie-consent--${settings.bannerPosition} ${preview ? 'cookie-consent--preview' : ''}`}
      dir="rtl"
      role="dialog"
      aria-label="موافقة ملفات تعريف الارتباط"
      aria-live="polite"
    >
      {onDismiss && (
        <button type="button" className="cookie-consent__close" aria-label="إغلاق نافذة ملفات تعريف الارتباط" onClick={onDismiss}>
          ×
        </button>
      )}
      <div className="cookie-consent__content">
        <h2>{settings.titleAr}</h2>
        <p>{settings.descriptionAr}</p>
        {(showAnalyticsCategory || showMarketingCategory) && (
          <div className="cookie-consent__categories" aria-label="فئات ملفات تعريف الارتباط الاختيارية">
            {showAnalyticsCategory && <span>التحليلية</span>}
            {showMarketingCategory && <span>التسويقية</span>}
          </div>
        )}
      </div>
      <div className="cookie-consent__actions">
        <button type="button" className="cookie-consent__button cookie-consent__button--primary" onClick={onAccept}>
          {settings.acceptAllLabelAr}
        </button>
        <button type="button" className="cookie-consent__button" onClick={onReject}>
          {settings.rejectOptionalLabelAr}
        </button>
        <Link className="cookie-consent__link" to="/cookie-policy">
          {settings.policyLinkLabelAr}
        </Link>
      </div>
    </section>
  );
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState<CookieConsentSettings>(defaultCookieConsentSettings);

  useEffect(() => {
    let active = true;
    const loadSettings = () => getCookieConsentSettings()
      .catch((error) => {
        if (import.meta.env.DEV) console.warn('[cookie consent] using default settings', error);
        return defaultCookieConsentSettings;
      })
      .then((loadedSettings) => {
        if (!active) return;
        setSettings(loadedSettings);
        setVisible(shouldShowBanner(loadedSettings));
      });

    const openPreferences = async () => {
      const loadedSettings = await getCookieConsentSettings().catch((error) => {
        if (import.meta.env.DEV) console.warn('[cookie consent] using default settings', error);
        return defaultCookieConsentSettings;
      });
      if (!active) return;
      setSettings(loadedSettings);
      setVisible(loadedSettings.enabled);
    };

    void loadSettings();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openPreferences);
    return () => {
      active = false;
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openPreferences);
    };
  }, []);

  const handleChoice = (value: CookieConsentValue) => {
    saveConsent(value, settings.version);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <CookieConsentPanel
      settings={settings}
      onAccept={() => handleChoice('accepted')}
      onReject={() => handleChoice('essential_only')}
      onDismiss={() => setVisible(false)}
    />
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
