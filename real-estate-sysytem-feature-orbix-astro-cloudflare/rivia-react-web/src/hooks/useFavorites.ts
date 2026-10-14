import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFirebaseErrorMessage } from '../lib/firebaseErrors';
import { addFavorite, getFavorites, removeFavorite } from '../services/favoriteService';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const favorites = await getFavorites(user.uid);
      setFavoriteIds(favorites.map((item) => item.propertyId).filter((item): item is string => Boolean(item)));
    } catch (err) {
      setFavoriteIds([]);
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل المفضلة'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggle = useCallback(
    async (propertyId: string) => {
      if (!user) return;
      const active = favoriteSet.has(propertyId);
      setError(null);
      try {
        if (active) {
          await removeFavorite(user.uid, propertyId);
          setFavoriteIds((current) => current.filter((id) => id !== propertyId));
        } else {
          await addFavorite(user.uid, propertyId);
          setFavoriteIds((current) => [...current, propertyId]);
        }
      } catch (err) {
        setError(getFirebaseErrorMessage(err, 'تعذر تحديث المفضلة'));
      }
    },
    [favoriteSet, user],
  );

  return {
    favoriteIds,
    favoriteSet,
    loading,
    error,
    isAuthenticated,
    reload,
    toggle,
  };
}
