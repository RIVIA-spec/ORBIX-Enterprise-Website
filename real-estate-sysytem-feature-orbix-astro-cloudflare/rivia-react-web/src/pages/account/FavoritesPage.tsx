import { useEffect, useState } from 'react';
import { PropertyCard } from '../../components/cards/PropertyCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { useAuth } from '../../hooks/useAuth';
import { useFavorites } from '../../hooks/useFavorites';
import { getPropertiesByIds } from '../../services/propertyService';
import type { Property } from '../../types/models';

export function FavoritesPage() {
  const { user } = useAuth();
  const { favoriteIds, favoriteSet, loading: favoritesLoading, error: favoritesError, toggle } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!user || favoritesLoading) return;

    setLoading(true);
    setError(null);

    getPropertiesByIds(favoriteIds)
      .then((items) => {
        if (active) setProperties(items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'تعذر تحميل المفضلة');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [favoriteIds, favoritesLoading, user]);

  const handleToggle = async (propertyId: string) => {
    await toggle(propertyId);
    setProperties((current) => current.filter((item) => item.id !== propertyId));
  };

  return (
    <div className="favorites-page">
      <div className="page-heading compact">
        <span className="eyebrow">المفضلة</span>
        <h1>العقارات المحفوظة</h1>
        <p>العقارات التي حفظتها للرجوع إليها لاحقًا.</p>
      </div>

      {(loading || favoritesLoading) && <LoadingState label="جاري تحميل المفضلة" />}
      {(error || favoritesError) && <EmptyState title="تعذر تحميل المفضلة" description={error || favoritesError || undefined} />}
      {!loading && !favoritesLoading && !error && !favoritesError && properties.length === 0 && (
        <EmptyState title="لا توجد عقارات محفوظة" description="احفظ العقارات من القائمة أو صفحة التفاصيل." />
      )}

      <div className="cards-grid">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            isFavorite={favoriteSet.has(property.id)}
            onToggleFavorite={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
