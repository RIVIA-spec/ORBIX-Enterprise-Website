import type { Property } from '../types/models';

export type MapCoordinates = {
  lat: number;
  lng: number;
};

const GOOGLE_MAPS_SCRIPT_ID = 'rivia-google-maps-js';
let googleMapsLoadPromise: Promise<void> | null = null;

function parseCoordinate(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractPropertyCoordinates(property: Partial<Property>): MapCoordinates | null {
  const location = property.location && typeof property.location === 'object' ? (property.location as Record<string, unknown>) : null;

  const lat =
    parseCoordinate(property.latitude) ??
    parseCoordinate(property.lat) ??
    parseCoordinate(location?.latitude) ??
    parseCoordinate(location?.lat);
  const lng =
    parseCoordinate(property.longitude) ??
    parseCoordinate(property.lng) ??
    parseCoordinate(location?.longitude) ??
    parseCoordinate(location?.lng);

  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function getMapProperties(properties: Property[]): Property[] {
  return properties.filter((property) => extractPropertyCoordinates(property));
}

export function getMapCenter(properties: Property[]): MapCoordinates | null {
  const coordinates = properties.map(extractPropertyCoordinates).filter((item): item is MapCoordinates => Boolean(item));
  if (coordinates.length === 0) return null;
  return {
    lat: coordinates.reduce((sum, item) => sum + item.lat, 0) / coordinates.length,
    lng: coordinates.reduce((sum, item) => sum + item.lng, 0) / coordinates.length,
  };
}

function getExistingGoogleMapsScript() {
  return (
    document.getElementById(GOOGLE_MAPS_SCRIPT_ID) ||
    Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]')).find(Boolean) ||
    null
  );
}

function redactMapsScriptUrl(src?: string | null) {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.href);
    if (url.searchParams.has('key')) {
      url.searchParams.set('key', '[redacted]');
    }
    return url.toString();
  } catch {
    return src.replace(/([?&]key=)[^&]+/i, '$1[redacted]');
  }
}

function hasGoogleMapsObject() {
  return Boolean((window as Window & { google?: { maps?: unknown } }).google?.maps);
}

export function getGoogleMapsDiagnostics(apiKey?: string) {
  const script = getExistingGoogleMapsScript() as HTMLScriptElement | null;
  return {
    hasGoogleMapsKey: Boolean(apiKey),
    googleObjectExists: hasGoogleMapsObject(),
    scriptTagExists: Boolean(script),
    keyPrefix: apiKey ? apiKey.slice(0, 6) : '',
    keySuffix: apiKey ? apiKey.slice(-4) : '',
    currentOrigin: window.location.origin,
    currentHref: window.location.href,
    referrer: document.referrer || '',
    scriptSrcWithoutKey: redactMapsScriptUrl(script?.src),
  };
}

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is missing'));
  if (hasGoogleMapsObject()) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  const existingScript = getExistingGoogleMapsScript();
  if (existingScript) {
    const promise: Promise<void> = new Promise<void>((resolve, reject) => {
      if (hasGoogleMapsObject()) {
        resolve();
        return;
      }

      const timeoutId = window.setTimeout(() => {
        if (hasGoogleMapsObject()) resolve();
        else reject(new Error('Google Maps script timed out'));
      }, 12_000);

      existingScript.addEventListener(
        'load',
        () => {
          window.clearTimeout(timeoutId);
          if (hasGoogleMapsObject()) resolve();
          else reject(new Error('Google Maps loaded without maps object'));
        },
        { once: true },
      );
      existingScript.addEventListener(
        'error',
        () => {
          window.clearTimeout(timeoutId);
          reject(new Error('Google Maps failed to load'));
        },
        { once: true },
      );
    }).catch((error) => {
      googleMapsLoadPromise = null;
      throw error;
    });
    googleMapsLoadPromise = promise;
    return promise;
  }

  const promise: Promise<void> = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;

    const timeoutId = window.setTimeout(() => {
      reject(new Error('Google Maps script timed out'));
    }, 12_000);

    script.onload = () => {
      window.clearTimeout(timeoutId);
      if (hasGoogleMapsObject()) resolve();
      else reject(new Error('Google Maps loaded without maps object'));
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    googleMapsLoadPromise = null;
    throw error;
  });

  googleMapsLoadPromise = promise;
  return promise;
}
