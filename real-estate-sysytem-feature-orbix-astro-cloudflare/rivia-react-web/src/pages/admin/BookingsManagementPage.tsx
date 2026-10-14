import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, formatNumber } from '../../lib/formatters';
import { getAllBookings, getBookingTitle, getBookingType, updateBookingFieldsByPath } from '../../services/bookingService';
import { getBookingTypeLabel, getContactMethodLabel, getWorkflowStatusLabel, getWorkflowStatusTone } from '../../lib/statusLabels';
import type { UserBooking } from '../../types/models';

const statusOptions = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'rescheduled'];

export function BookingsManagementPage() {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [selected, setSelected] = useState<UserBooking | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [nextStatus, setNextStatus] = useState('pending');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await getAllBookings());
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحميل الحجوزات.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const bookingType = getBookingType(booking);
      const source = [
        booking.bookingId,
        booking.propertyTitle,
        booking.property_title,
        booking.propertyId,
        booking.property_id,
        booking.hotel_id,
            booking.room_type_id,
            booking.customerUserId,
            booking.ownerUserId,
            booking.bookingType,
            booking.appointmentDate,
            booking.appointmentTime,
            booking.visitType,
            booking.preferredContactMethod,
            booking.customerPhone,
            booking.customerName,
          ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (status === 'all' || booking.status === status) && (type === 'all' || bookingType === type) && (!needle || source.includes(needle));
    });
  }, [bookings, search, status, type]);

  const updateStatus = async (statusOverride?: string) => {
    if (!selected) return;
    setError(null);
    try {
      if (!selected.docPath) {
        throw new Error('missing-doc-path');
      }
      const targetStatus = statusOverride || nextStatus;
      if (targetStatus === 'rejected' && !rejectionReason.trim()) {
        setError('يرجى إدخال سبب الرفض أولاً.');
        return;
      }
      const fields: Record<string, unknown> = { status: nextStatus };
      fields.status = targetStatus;
      if (targetStatus === 'rescheduled') {
        fields.appointmentDate = rescheduleDate || selected.appointmentDate || '';
        fields.appointmentTime = rescheduleTime || selected.appointmentTime || '';
      }
      if (targetStatus === 'rejected' && rejectionReason.trim()) {
        fields.rejectionReason = rejectionReason.trim();
      }
      await updateBookingFieldsByPath(selected.docPath, fields);
      await reload();
      setSelected(null);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تحديث الحجز حاليًا. تحقق من صلاحيات حسابك وحاول مجددًا.'));
    }
  };

  if (loading) return <LoadingState label="جارٍ تحميل إدارة الحجوزات" />;

  return (
    <div>
      <div className="page-heading compact">
        <h1>إدارة الحجوزات</h1>
      </div>
      {error && <ErrorMessage message={error} />}
      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select
          label="الحالة"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'pending', label: 'قيد المراجعة' },
            { value: 'confirmed', label: 'مؤكد' },
            { value: 'rejected', label: 'مرفوض' },
            { value: 'cancelled', label: 'ملغى' },
          ]}
        />
        <Select
          label="النوع"
          value={type}
          onChange={(event) => setType(event.target.value)}
          options={[
            { value: 'all', label: 'الكل' },
            { value: 'property', label: 'عقار' },
            { value: 'hotel', label: 'فندق' },
          ]}
        />
      </div>

      <div className="stack-list">
        {filtered.map((booking) => (
          <Card key={booking.id} className="list-card">
            <div>
              <h3>{getBookingTitle(booking)}</h3>
              <p>{getBookingTypeLabel(booking.bookingType || getBookingType(booking))}</p>
              <p className="muted">
                {booking.appointmentDate || booking.appointmentTime
                  ? `${booking.appointmentDate || 'بدون تاريخ'} · ${booking.appointmentTime || 'بدون وقت'}`
                  : `${formatDate(booking.checkIn || booking.check_in)} - ${formatDate(booking.checkOut || booking.check_out)}`}
              </p>
            </div>
            <StatusBadge status={getWorkflowStatusLabel(booking.status)} tone={getWorkflowStatusTone(booking.status)} />
            <strong>{formatNumber(booking.total_amount || booking.totalAmount || 0)}</strong>
            <div className="inline-actions">
              <Button
                variant="outline"
                onClick={() => {
                  setSelected(booking);
                  setNextStatus(booking.status || 'pending');
                  setRescheduleDate(booking.appointmentDate || '');
                  setRescheduleTime(booking.appointmentTime || '');
                  setRejectionReason(String(booking.rejectionReason || ''));
                }}
              >
                التفاصيل
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد حجوزات مطابقة" />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل الحجز" onClose={() => setSelected(null)}>
        {selected && (
          <div className="form-stack">
            <dl className="details-grid">
              <div>
                <dt>العقار / الحجز</dt>
                <dd>{getBookingTitle(selected)}</dd>
              </div>
              <div>
                <dt>نوع الطلب</dt>
                <dd>{getBookingTypeLabel(selected.bookingType || getBookingType(selected))}</dd>
              </div>
              <div>
                <dt>اسم العميل</dt>
                <dd>{selected.customerName || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>رقم الهاتف</dt>
                <dd>{selected.customerPhone || 'غير محدد'}</dd>
              </div>
              <div>
                <dt>طريقة التواصل</dt>
                <dd>{getContactMethodLabel(selected.preferredContactMethod)}</dd>
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
                <dt>الملاحظات</dt>
                <dd>{selected.customerNote || 'لا توجد ملاحظات'}</dd>
              </div>
              <div>
                <dt>الحالة الحالية</dt>
                <dd>{getWorkflowStatusLabel(selected.status)}</dd>
              </div>
            </dl>
            <div className="form-grid">
              <Select
                label="تحديث الحالة"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
                options={statusOptions.map((item) => ({ value: item, label: getWorkflowStatusLabel(item) }))}
              />
              <Input type="date" label="تاريخ إعادة الجدولة" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
              <Input type="time" label="وقت إعادة الجدولة" value={rescheduleTime} onChange={(event) => setRescheduleTime(event.target.value)} />
            </div>
            <Input label="سبب الرفض" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
            <div className="inline-actions">
              <Button onClick={() => void updateStatus('confirmed')}>تأكيد</Button>
              <Button variant="outline" onClick={() => void updateStatus('rejected')}>رفض</Button>
              <Button variant="ghost" onClick={() => void updateStatus('cancelled')}>إلغاء</Button>
              <Button variant="secondary" onClick={() => void updateStatus('completed')}>إكمال</Button>
              <Button variant="outline" onClick={() => void updateStatus('rescheduled')}>إعادة جدولة</Button>
              <Button onClick={() => void updateStatus()}>حفظ الحالة</Button>
            </div>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
}
