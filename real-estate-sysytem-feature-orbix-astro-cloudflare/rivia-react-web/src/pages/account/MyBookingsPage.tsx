import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, formatNumber } from '../../lib/formatters';
import { getBookingTitle, getBookingType, updateBookingStatus, updateBookingStatusByPath } from '../../services/bookingService';
import { getBookingTypeLabel, getContactMethodLabel, getWorkflowStatusLabel, getWorkflowStatusTone } from '../../lib/statusLabels';
import { useMyBookings } from '../../hooks/useMyBookings';
import type { UserBooking } from '../../types/models';

export function MyBookingsPage() {
  const { user } = useAuth();
  const { bookings, loading, error, reload } = useMyBookings();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserBooking | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const source = [
        booking.bookingId,
        booking.propertyId,
        booking.property_id,
        booking.propertyTitle,
        booking.property_title,
        booking.hotel_id,
        booking.room_type_id,
        booking.customerUserId,
        booking.ownerUserId,
        booking.status,
        booking.customerName,
        booking.customerPhone,
        booking.appointmentDate,
        booking.appointmentTime,
        booking.visitType,
        booking.preferredContactMethod,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !needle || source.includes(needle);
    });
  }, [bookings, search]);

  const cancelBooking = async (booking: UserBooking) => {
    if (!user) return;
    setActionError(null);
    setActionMessage(null);
    try {
      if (booking.docPath) {
        await updateBookingStatusByPath(booking.docPath, 'cancelled');
      } else {
        await updateBookingStatus(user.uid, booking.id, 'cancelled');
      }
      setActionMessage('تم إرسال طلب إلغاء الحجز.');
      await reload();
      setSelected(null);
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر إلغاء الحجز حاليًا. حاول مرة أخرى لاحقًا.'));
    }
  };

  if (loading) return <LoadingState label="جارٍ تحميل الحجوزات" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">حجوزاتي</span>
        <h1>الحجوزات</h1>
      </div>
      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {error && <ErrorMessage message={error} />}
      {actionError && <ErrorMessage message={actionError} />}
      {actionMessage && <div className="form-success">{actionMessage}</div>}

      <div className="stack-list">
        {filtered.map((booking) => {
          const bookingType = getBookingType(booking);
          const statusLabel = getWorkflowStatusLabel(booking.status);
          return (
            <Card key={booking.id} className="list-card">
              <div>
                <h3>{getBookingTitle(booking)}</h3>
                <p>{getBookingTypeLabel(booking.bookingType || bookingType)}</p>
                <p className="muted">
                  {booking.appointmentDate || booking.appointmentTime
                    ? `${booking.appointmentDate || 'بدون تاريخ'} · ${booking.appointmentTime || 'بدون وقت'}`
                    : `${formatDate(booking.checkIn || booking.check_in)} - ${formatDate(booking.checkOut || booking.check_out)}`}
                </p>
              </div>
              <StatusBadge status={statusLabel} tone={getWorkflowStatusTone(booking.status)} />
              <strong>{formatNumber(booking.total_amount || booking.totalAmount || 0)}</strong>
              <div className="inline-actions">
                {booking.propertyId && (
                  <Button as={Link} to={`/properties/${booking.propertyId}`} variant="ghost">
                    العقار
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelected(booking)}>
                  التفاصيل
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد حجوزات" description="لم يتم العثور على حجوزات مرتبطة بحسابك." />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الحجز" onClose={() => setSelected(null)}>
        {selected && (
          <div className="form-stack">
            <dl className="details-grid">
              <div>
                <dt>نوع الطلب</dt>
                <dd>{getBookingTypeLabel(selected.bookingType || getBookingType(selected))}</dd>
              </div>
              <div>
                <dt>الحالة</dt>
                <dd>{getWorkflowStatusLabel(selected.status)}</dd>
              </div>
              <div>
                <dt>تاريخ الموعد</dt>
                <dd>{selected.appointmentDate || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>وقت الموعد</dt>
                <dd>{selected.appointmentTime || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>نوع الزيارة</dt>
                <dd>{selected.visitType || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>طريقة التواصل</dt>
                <dd>{getContactMethodLabel(selected.preferredContactMethod)}</dd>
              </div>
              <div>
                <dt>ملاحظات العميل</dt>
                <dd>{selected.customerNote || 'لا توجد ملاحظات'}</dd>
              </div>
              <div>
                <dt>التاريخ البديل</dt>
                <dd>{selected.alternativeDate || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>الوقت البديل</dt>
                <dd>{selected.alternativeTime || 'غير محدد'}</dd>
              </div>
            </dl>
            <div className="inline-actions">
              <Button
                onClick={() => cancelBooking(selected)}
                disabled={!['pending', 'rescheduled'].includes((selected.status || '').toLowerCase())}
                variant="danger"
              >
                إلغاء الطلب
              </Button>
            </div>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
}
