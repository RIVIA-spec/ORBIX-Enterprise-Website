import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate } from '../../lib/formatters';
import { getBookingTitle, getBookingType, getMyBookings } from '../../services/bookingService';
import { getMyDeals } from '../../services/dealService';
import type { Deal, UserBooking } from '../../types/models';
import { getWorkflowStatusLabel, getWorkflowStatusTone } from '../../lib/statusLabels';

type SimpleRequest = {
  id: string;
  title: string;
  subtitle?: string;
  propertyId?: string;
  status?: string;
  createdAt?: unknown;
  kind: 'purchase' | 'visit' | 'stay';
  docPath?: string;
};

function normalizeBookingRequest(booking: UserBooking): SimpleRequest {
  const bookingType = String(booking.bookingType || getBookingType(booking)).toLowerCase();
  const isPurchase = bookingType === 'purchase_request';
  const isStay = Boolean(booking.hotel_id || booking.room_type_id || booking.bookingType === 'hotel' || booking.checkIn || booking.check_in || booking.checkOut || booking.check_out || booking.guests);
  return {
    id: booking.id,
    title: isPurchase ? 'طلب شراء عقار' : isStay ? 'حجز إقامة' : 'طلب معاينة عقار',
    subtitle: booking.propertyTitle || booking.property_title || getBookingTitle(booking),
    propertyId: booking.propertyId || booking.property_id || booking.hotel_id,
    status: booking.status,
    createdAt: booking.createdAt || booking.created_at,
    kind: isPurchase ? 'purchase' : isStay ? 'stay' : 'visit',
    docPath: booking.docPath,
  };
}

function normalizeDealRequest(deal: Deal): SimpleRequest {
  return {
    id: deal.dealId || deal.id,
    title: 'طلب شراء عقار',
    subtitle: deal.propertyTitle || deal.property_title || deal.propertyId || 'عقار',
    propertyId: deal.propertyId || deal.property_id,
    status: deal.status,
    createdAt: deal.createdAt || deal.created_at,
    kind: 'purchase',
    docPath: deal.docPath,
  };
}

export function MyRequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SimpleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError(null);
    setWarning(null);

    Promise.allSettled([getMyDeals(user.uid), getMyBookings(user.uid)]).then((results) => {
      if (!active) return;

      const nextItems: SimpleRequest[] = [];
      const [dealsResult, bookingsResult] = results;

      if (dealsResult.status === 'fulfilled') {
        nextItems.push(...dealsResult.value.map(normalizeDealRequest));
      } else {
        setWarning('بعض الطلبات قد لا تظهر بسبب صلاحيات قاعدة البيانات.');
      }

      if (bookingsResult.status === 'fulfilled') {
        nextItems.push(...bookingsResult.value.map(normalizeBookingRequest));
      } else if (dealsResult.status === 'fulfilled') {
        setWarning((current) => current || 'بعض الطلبات قد لا تظهر بسبب صلاحيات قاعدة البيانات.');
      }

      nextItems.sort((a, b) => {
        const aTime = new Date(String(a.createdAt ?? 0)).getTime();
        const bTime = new Date(String(b.createdAt ?? 0)).getTime();
        return bTime - aTime;
      });

      setItems(nextItems);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!needle) return true;
      return [item.title, item.subtitle, item.propertyId, item.status, item.id].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [items, search]);

  if (loading) return <LoadingState label="جارٍ تحميل الطلبات" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">طلباتي</span>
        <h1>طلباتي</h1>
        <p>تابع حالة طلبات الشراء والحجز التي قمت بإرسالها.</p>
      </div>

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {error && <ErrorMessage message={error} />}
      {warning && <div className="notice">{warning}</div>}

      <div className="stack-list">
        {filtered.map((item) => (
          <Card key={`${item.kind}-${item.id}`} className="list-card">
            <div>
              <h3>{item.title}</h3>
              <p>{item.subtitle || 'طلب'}</p>
              <p className="muted">{item.createdAt ? formatDate(item.createdAt) : 'بدون تاريخ'}</p>
            </div>
            <StatusBadge status={getWorkflowStatusLabel(item.status)} tone={getWorkflowStatusTone(item.status)} />
            <div className="inline-actions">
              {item.propertyId && (
                <Button as={Link} to={`/properties/${item.propertyId}`} variant="ghost">
                  العقار
                </Button>
              )}
              {item.kind === 'purchase' && (
                <Button as={Link} to="/my-bookings" variant="outline">
                  حجوزاتي
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filtered.length === 0 && !error && <EmptyState title="لا توجد طلبات" description="لم يتم العثور على طلبات مرتبطة بحسابك." />}
      </div>
    </div>
  );
}
