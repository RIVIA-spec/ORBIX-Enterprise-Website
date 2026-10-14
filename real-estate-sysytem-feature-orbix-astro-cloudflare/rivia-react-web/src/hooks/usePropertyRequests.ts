import { useCallback, useEffect, useState } from 'react';
import { getPropertyRequests } from '../services/propertyRequestService';
import type { PropertyRequest } from '../types/models';

export function usePropertyRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await getPropertyRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل طلبات العقارات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { requests, loading, error, reload };
}
