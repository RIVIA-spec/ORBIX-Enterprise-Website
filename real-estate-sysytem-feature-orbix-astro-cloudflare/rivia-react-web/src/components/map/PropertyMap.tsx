import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import type { Property } from '../../types/models';
import { extractPropertyCoordinates, getGoogleMapsDiagnostics, loadGoogleMapsScript } from '../../services/mapService';

type PropertyMapProps = {
  apiKey?: string;
  properties: Property[];
  selectedPropertyId?: string;
  onSelectProperty: (propertyId: string) => void;
};

const MAP_TIMEOUT_MS = 14_000;
const MIN_LOADING_MS = 450;
const MAP_ERROR = 'يرجى المحاولة لاحقًا أو فتح العقار من القائمة.';

function errorMessageForMapsError(message: string) {
  if (import.meta.env.DEV) console.warn('[map] map loading failed', message);
  return MAP_ERROR;
}

export function PropertyMap({ apiKey, properties, selectedPropertyId, onSelectProperty }: PropertyMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const loadedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const propertiesWithCoordinates = useMemo(
    () =>
      properties
        .map((property) => ({
          property,
          coordinates: extractPropertyCoordinates(property),
        }))
        .filter((item): item is { property: Property; coordinates: { lat: number; lng: number } } => Boolean(item.coordinates)),
    [properties],
  );

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    const previousAuthFailure = (window as Window & { gm_authFailure?: () => void }).gm_authFailure;

    const finishLoaded = () => {
      const remaining = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        if (!active) return;
        loadedRef.current = true;
        setError(null);
        setStatus('loaded');
      }, remaining);
    };

    const failMap = (rawError: string) => {
      if (!active || loadedRef.current) return;
      setError(errorMessageForMapsError(rawError));
      setStatus('error');
      logDiagnostics('failed', rawError);
    };

    const logDiagnostics = (message: string, latestError = '') => {
      if (!import.meta.env.DEV) return;
      const diagnostics = getGoogleMapsDiagnostics(apiKey);
      console.log('[map] ' + message, {
        hasGoogleMapsKey: diagnostics.hasGoogleMapsKey ? 'yes' : 'no',
        keyPrefix: diagnostics.keyPrefix,
        keySuffix: diagnostics.keySuffix,
        currentOrigin: diagnostics.currentOrigin,
        currentHref: diagnostics.currentHref,
        referrer: diagnostics.referrer,
        googleObjectExists: diagnostics.googleObjectExists,
        scriptTagExists: diagnostics.scriptTagExists,
        scriptSrcWithoutKey: diagnostics.scriptSrcWithoutKey,
        mapContainerReady: Boolean(mapElementRef.current),
        validMarkersCount: propertiesWithCoordinates.length,
        latestMapsError: latestError,
      });
    };

    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      previousAuthFailure?.();
      failMap('RefererNotAllowedMapError');
    };

    const timeoutId = window.setTimeout(() => failMap('timeout'), MAP_TIMEOUT_MS);

    const initializeMap = async () => {
      setStatus('loading');
      setError(null);
      logDiagnostics('initializing');

      if (propertiesWithCoordinates.length === 0) {
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        window.clearTimeout(timeoutId);
        finishLoaded();
        logDiagnostics('no valid markers');
        return;
      }

      if (!apiKey) {
        window.clearTimeout(timeoutId);
        setError(MAP_ERROR);
        setStatus('error');
        logDiagnostics('missing api key', 'missing-api-key');
        return;
      }

      try {
        await loadGoogleMapsScript(apiKey);
        if (!active) return;

        const google = (window as Window & { google?: any }).google;
        if (!google?.maps) throw new Error('google.maps is unavailable');
        if (!mapElementRef.current) throw new Error('map container is unavailable');

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapElementRef.current, {
            center: propertiesWithCoordinates[0].coordinates,
            zoom: 10,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: 'greedy',
          });
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        propertiesWithCoordinates.forEach(({ property, coordinates }) => {
          // TODO: Later migrate to google.maps.marker.AdvancedMarkerElement.
          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: coordinates,
            title: property.title || property.name || 'عقار',
          });
          marker.addListener('click', () => onSelectProperty(property.id));
          markersRef.current.push(marker);
          bounds.extend(coordinates);
        });

        mapInstanceRef.current.fitBounds(bounds);
        if (propertiesWithCoordinates.length === 1) {
          mapInstanceRef.current.setZoom(14);
        }

        window.clearTimeout(timeoutId);
        finishLoaded();
        logDiagnostics('initialized');
      } catch (err) {
        if (!active) return;
        window.clearTimeout(timeoutId);
        failMap(err instanceof Error ? err.message : 'unknown');
      }
    };

    void initializeMap();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      (window as Window & { gm_authFailure?: () => void }).gm_authFailure = previousAuthFailure;
    };
  }, [apiKey, onSelectProperty, propertiesWithCoordinates, reloadKey]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPropertyId) return;
    const selected = propertiesWithCoordinates.find((item) => item.property.id === selectedPropertyId);
    if (!selected) return;
    const google = (window as Window & { google?: any }).google;
    if (!google?.maps) return;
    mapInstanceRef.current.panTo(selected.coordinates);
    mapInstanceRef.current.setZoom(Math.max(mapInstanceRef.current.getZoom() || 10, 13));
  }, [propertiesWithCoordinates, selectedPropertyId]);

  if (propertiesWithCoordinates.length === 0 && status === 'loaded') {
    return <EmptyState title="لا توجد عقارات بإحداثيات صالحة لعرضها على الخريطة." />;
  }

  if (status === 'error' && error) {
    return (
      <EmptyState
        title="تعذر تحميل الخريطة حاليًا."
        description={error}
        actionLabel="إعادة المحاولة"
        onAction={() => {
          loadedRef.current = false;
          setError(null);
          setStatus('loading');
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  return (
    <div className="property-map-shell">
      <div ref={mapElementRef} className="property-map-canvas" aria-label="خريطة العقارات" />
      {status === 'loading' && (
        <div className="map-loading-overlay">
          <LoadingState label="جار تحميل الخريطة..." />
        </div>
      )}
    </div>
  );
}
