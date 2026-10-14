import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { getGoogleMapsDiagnostics, loadGoogleMapsScript, type MapCoordinates } from '../../services/mapService';

type GoogleMapsWindow = Window & {
  google?: any;
  gm_authFailure?: () => void;
};

export type LocationPickerValue = {
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
};

export type LocationPickerChange = {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
};

type LocationPickerProps = {
  value?: LocationPickerValue;
  onChange: (location: LocationPickerChange) => void;
  readOnly?: boolean;
  height?: number;
  defaultCenter?: MapCoordinates;
};

const DEFAULT_CENTER: MapCoordinates = { lat: 34.7324, lng: 36.7137 };
const LOAD_TIMEOUT_MS = 15_000;

function parseCoordinate(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinate(value: number) {
  return value.toFixed(4);
}

export function LocationPicker({ value, onChange, readOnly = false, height = 390, defaultCenter = DEFAULT_CENTER }: LocationPickerProps) {
  const { t, language, direction } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const valueRef = useRef<LocationPickerValue | undefined>(value);
  const onChangeRef = useRef(onChange);
  const [loading, setLoading] = useState(Boolean(apiKey));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(apiKey ? null : t('locationPicker.mapMissingKey'));
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [geoMessageType, setGeoMessageType] = useState<'success' | 'error' | null>(null);
  const [selected, setSelected] = useState<MapCoordinates | null>(null);

  const pickerErrorMessage = useCallback(
    (errorValue: unknown) => {
      const message = errorValue instanceof Error ? errorValue.message : String(errorValue || '');
      if (import.meta.env.DEV) console.warn('[location picker] map loading failed', message);
      return t('locationPicker.mapLoadError');
    },
    [t],
  );

  const geolocationErrorMessage = useCallback(
    (errorValue: GeolocationPositionError) => {
      if (errorValue.code === errorValue.PERMISSION_DENIED) return t('locationPicker.permissionDenied');
      if (errorValue.code === errorValue.POSITION_UNAVAILABLE) return t('locationPicker.positionUnavailable');
      if (errorValue.code === errorValue.TIMEOUT) return t('locationPicker.timeout');
      return t('locationPicker.genericGeoError');
    },
    [t],
  );

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!apiKey && !loading) setError(t('locationPicker.mapMissingKey'));
  }, [apiKey, loading, t]);

  const valueCoordinates = useMemo(() => {
    const lat = parseCoordinate(value?.latitude) ?? parseCoordinate(value?.lat);
    const lng = parseCoordinate(value?.longitude) ?? parseCoordinate(value?.lng);
    if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
  }, [value?.latitude, value?.longitude, value?.lat, value?.lng]);

  const emitChange = useCallback((coordinates: MapCoordinates) => {
    const latestValue = valueRef.current;
    setSelected(coordinates);
    onChangeRef.current({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      lat: coordinates.lat,
      lng: coordinates.lng,
      address: latestValue?.address,
      city: latestValue?.city,
      country: latestValue?.country,
      countryCode: latestValue?.countryCode,
    });
  }, []);

  const placeMarker = useCallback(
    (coordinates: MapCoordinates, shouldEmit = false) => {
      const googleObject = (window as GoogleMapsWindow).google;
      const map = mapRef.current;
      if (!googleObject?.maps || !map) return;

      if (!markerRef.current) {
        markerRef.current = new googleObject.maps.Marker({
          map,
          position: coordinates,
          draggable: !readOnly,
          title: t('locationPicker.markerTitle'),
          animation: googleObject.maps.Animation?.DROP,
        });
        if (!readOnly) {
          markerRef.current.addListener('dragend', () => {
            const position = markerRef.current?.getPosition();
            if (!position) return;
            const nextCoordinates = { lat: position.lat(), lng: position.lng() };
            if (import.meta.env.DEV) console.info('[location-picker] selected', nextCoordinates);
            emitChange(nextCoordinates);
          });
        }
      } else {
        markerRef.current.setMap(map);
        markerRef.current.setPosition(coordinates);
        markerRef.current.setDraggable(!readOnly);
      }

      setSelected(coordinates);
      if (shouldEmit) {
        if (import.meta.env.DEV) console.info('[location-picker] selected', coordinates);
        emitChange(coordinates);
      }
    },
    [emitChange, readOnly, t],
  );

  useEffect(() => {
    setSelected(valueCoordinates);
    if (valueCoordinates) {
      placeMarker(valueCoordinates);
      mapRef.current?.panTo(valueCoordinates);
    }
  }, [placeMarker, valueCoordinates]);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    const win = window as GoogleMapsWindow;
    const previousAuthFailure = win.gm_authFailure;
    const initialCenter = valueCoordinates || defaultCenter;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setError(t('locationPicker.mapLoadError'));
        setLoading(false);
      }
    }, LOAD_TIMEOUT_MS);

    win.gm_authFailure = () => {
      previousAuthFailure?.();
      if (!cancelled) {
        setError(pickerErrorMessage(new Error('RefererNotAllowedMapError')));
        setLoading(false);
      }
    };

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapElementRef.current) return;
        const googleObject = win.google;
        if (!googleObject?.maps) throw new Error('Google Maps loaded without maps object');

        mapRef.current = new googleObject.maps.Map(mapElementRef.current, {
          center: initialCenter,
          zoom: valueCoordinates ? 15 : 11,
          clickableIcons: false,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        if (!readOnly) {
          mapRef.current.addListener('click', (event: any) => {
            if (!event.latLng) return;
            setGeoMessage(null);
            setGeoMessageType(null);
            placeMarker({ lat: event.latLng.lat(), lng: event.latLng.lng() }, true);
          });
        }

        if (valueCoordinates) placeMarker(valueCoordinates);
        setLoaded(true);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(pickerErrorMessage(err));
          setLoading(false);
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (import.meta.env.DEV) {
          console.info('[location-picker]', getGoogleMapsDiagnostics(apiKey));
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      win.gm_authFailure = previousAuthFailure;
    };
    // Initialize the Google Map once per mounted picker. Marker sync is handled by a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, readOnly]);

  const useCurrentLocation = () => {
    if (readOnly) return;
    setGeoMessage(null);
    setGeoMessageType(null);

    if (!navigator.geolocation) {
      setGeoMessage(t('locationPicker.unsupported'));
      setGeoMessageType('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current?.panTo(coordinates);
        mapRef.current?.setZoom(16);
        placeMarker(coordinates, true);
        setGeoMessage(t('locationPicker.currentSuccess'));
        setGeoMessageType('success');
      },
      (geoError) => {
        setGeoMessage(`${geolocationErrorMessage(geoError)} ${t('locationPicker.geoSuffix')}`);
        setGeoMessageType('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  };

  return (
    <div className="location-picker-card" dir={direction} lang={language}>
      {!readOnly && (
        <div className="location-picker-toolbar">
          <button type="button" className="button button-outline" onClick={useCurrentLocation} disabled={!loaded || Boolean(error)}>
            {t('locationPicker.useCurrent')}
          </button>
          {selected && (
            <span className="selected-coordinate-chip">
              {t('common.coordinates', { lat: formatCoordinate(selected.lat), lng: formatCoordinate(selected.lng) })}
            </span>
          )}
        </div>
      )}

      <div className="location-picker-map-shell" style={{ minHeight: height }}>
        {loading && <div className="location-picker-status">{t('locationPicker.loading')}</div>}
        {error && !loading && <div className="location-picker-status error">{error}</div>}
        <div ref={mapElementRef} className="location-picker-map" style={{ height }} aria-hidden={Boolean(error)} />
      </div>

      {selected ? (
        <div className="location-selected-panel">
          <strong>{t('locationPicker.selectedTitle')}</strong>
          <span>{t('common.coordinates', { lat: formatCoordinate(selected.lat), lng: formatCoordinate(selected.lng) })}</span>
        </div>
      ) : (
        !error && !readOnly && <p className="location-picker-help">{t('locationPicker.help')}</p>
      )}
      {geoMessage && <p className={`location-picker-help ${geoMessageType === 'success' ? 'success' : 'error'}`}>{geoMessage}</p>}
    </div>
  );
}
