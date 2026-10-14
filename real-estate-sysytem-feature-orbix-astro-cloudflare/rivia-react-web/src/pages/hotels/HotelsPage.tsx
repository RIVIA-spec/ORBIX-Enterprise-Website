import { useEffect, useMemo, useState } from 'react';
import { HotelCard } from '../../components/cards/HotelCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { getHotelLocationLabel, getHotelTitle, listVisibleHotels } from '../../services/hotelService';
import type { Hotel } from '../../types/models';

function hotelSearchSource(hotel: Hotel) {
  return [
    getHotelTitle(hotel),
    hotel.description,
    hotel.city,
    hotel.country,
    hotel.countryCode,
    hotel.address,
    getHotelLocationLabel(hotel),
    hotel.contact_name,
    hotel.contact_number,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listVisibleHotels(80)
      .then((items) => {
        if (active) setHotels(items);
      })
      .catch(() => {
        if (active) setError('تعذر تحميل الفنادق.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredHotels = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return hotels;
    return hotels.filter((hotel) => hotelSearchSource(hotel).includes(needle));
  }, [hotels, search]);

  return (
    <section className="container section hotels-page">
      <div className="page-heading">
        <span className="eyebrow">الفنادق</span>
        <h1>الفنادق</h1>
        <p>استكشف الفنادق والغرف المتاحة</p>
      </div>

      <div className="listing-toolbar hotels-toolbar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن فندق أو مدينة" />
        <span className="results-count">{filteredHotels.length} فنادق</span>
      </div>

      {loading && <LoadingState label="جاري تحميل الفنادق" />}
      {error && <EmptyState title="تعذر تحميل الفنادق." description={error} />}
      {!loading && !error && filteredHotels.length === 0 && <EmptyState title="لا توجد فنادق متاحة حاليا." />}

      <div className="cards-grid hotel-grid hotels-list-grid">
        {filteredHotels.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </section>
  );
}
