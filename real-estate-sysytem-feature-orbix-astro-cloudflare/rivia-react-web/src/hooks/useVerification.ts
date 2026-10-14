import { useCallback, useEffect, useState } from 'react';
import { getVerification } from '../services/verificationService';
import type { Verification } from '../types/models';
import { useAuth } from './useAuth';

export function useVerification() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setVerification(await getVerification(user.uid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل حالة التحقق');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { verification, loading, error, reload };
}

