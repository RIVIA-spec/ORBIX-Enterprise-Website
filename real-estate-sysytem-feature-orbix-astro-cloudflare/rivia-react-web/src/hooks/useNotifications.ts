import { useCallback, useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '../lib/firebaseErrors';
import { getNotifications, markNotificationRead } from '../services/notificationService';
import type { AppNotification } from '../types/models';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setNotifications(await getNotifications(user.uid));
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل الإشعارات'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      setError(null);
      try {
        await markNotificationRead(user.uid, notificationId);
        setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, isRead: true, read: true } : item)));
      } catch (err) {
        setError(getFirebaseErrorMessage(err, 'تعذر تحديث حالة الإشعار حاليًا. حاول مرة أخرى لاحقًا.'));
      }
    },
    [user],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { notifications, loading, error, reload, markRead };
}
