import { useCallback, useEffect, useState } from 'react';
import { getMyBookings } from '../services/bookingService';
import type { UserBooking } from '../types/models';
import { useAuth } from './useAuth';

export function useMyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setBookings(await getMyBookings(user.uid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { bookings, loading, error, reload };
}

