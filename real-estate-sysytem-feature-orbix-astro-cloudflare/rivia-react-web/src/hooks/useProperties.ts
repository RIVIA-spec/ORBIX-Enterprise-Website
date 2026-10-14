import { useCallback, useEffect, useState } from 'react';
import { fetchPropertiesFlexible, getPropertyById, type PropertyFetchDiagnostics } from '../services/propertyService';
import type { Property } from '../types/models';

export function useProperties(max = 24) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [diagnostics, setDiagnostics] = useState<PropertyFetchDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPropertiesFlexible(max);
      setProperties(result.properties);
      setDiagnostics(result.diagnostics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل العقارات');
    } finally {
      setLoading(false);
    }
  }, [max]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { properties, diagnostics, loading, error, reload };
}

export function useProperty(id?: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    getPropertyById(id)
      .then((item) => {
        if (mounted) setProperty(item);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'تعذر تحميل العقار');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  return { property, loading, error };
}
