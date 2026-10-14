import { useEffect, useState } from 'react';
import { AdminAppHeader } from '../../components/admin/AdminAppHeader';
import { formatDate, formatNumber } from '../../lib/formatters';
import { confirmPendingBooking, listPendingAdminBookings, rejectPendingBooking, type PendingAdminBooking } from '../../services/adminWorkflowService';

export function PendingBookingsPage() {
  const [items, setItems] = useState<PendingAdminBooking[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await listPendingAdminBookings();
      setItems(result.items);
      setWarnings(result.warnings);
    } catch (error) {
      setMessage('تعذر تحميل الحجوزات المعلقة. تأكد من صلاحيات حساب الإدارة ثم حاول مجددًا.');
      if (import.meta.env.DEV) console.warn('[admin bookings] load failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const run = async (item: PendingAdminBooking, action: 'confirm' | 'reject') => {
    setBusyId(item.id);
    setMessage('');
    try {
      if (action === 'confirm') await confirmPendingBooking(item);
      else {
        const reason = window.prompt('سبب الرفض (اختياري)') || '';
        await rejectPendingBooking(item, reason);
      }
      setItems((current) => current.filter((booking) => !(booking.id === item.id && booking.userId === item.userId)));
      setMessage(action === 'confirm' ? 'تم تأكيد الحجز.' : 'تم رفض الحجز.');
    } catch (error) {
      setMessage('تعذر تحديث الحجز بسبب صلاحيات قاعدة البيانات.');
      if (import.meta.env.DEV) console.warn('[admin bookings] update failed', error);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="admin-app-page">
      <AdminAppHeader title="الحجوزات المعلقة" />
      <div className="admin-mobile-content">
        {message && <p className="admin-inline-message" role="status">{message}</p>}
        {warnings.length > 0 && <p className="admin-inline-warning">تعذر الوصول إلى بعض سجلات الحجوزات ({warnings.length}).</p>}
        {loading ? <div className="admin-app-loading">جاري تحميل الحجوزات...</div> : (
          <div className="admin-booking-list">
            {items.map((item) => {
              const title = item.hotelTitle || item.propertyTitle || 'طلب حجز';
              const image = item.hotelImage || item.propertyImage;
              const isHotel = Boolean(item.hotelId);
              return (
                <article className="admin-booking-card" key={`${item.userId}-${item.id}`}>
                  <div className="admin-booking-summary">
                    {image ? <img src={image} alt="" /> : <div className="admin-image-fallback">لا توجد صورة</div>}
                    <div><span>{isHotel ? 'فندق - غرفة' : item.bookingType.includes('sale') ? 'بيع' : 'إيجار'}</span><h2>{title}</h2>{item.roomTypeTitle && <p>{item.roomTypeTitle}</p>}</div>
                  </div>
                  <dl className="admin-booking-meta">
                    <div><dt>العميل</dt><dd>{item.userName}</dd></div>
                    <div><dt>البريد</dt><dd>{item.userEmail || 'غير مضاف'}</dd></div>
                    <div><dt>الفترة</dt><dd>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</dd></div>
                    <div><dt>الضيوف</dt><dd>{item.guests || 'غير محدد'}</dd></div>
                    {item.totalAmount && <div><dt>الإجمالي</dt><dd>{formatNumber(item.totalAmount)} {item.currency}</dd></div>}
                  </dl>
                  <div className="admin-card-actions">
                    <button className="admin-approve-button" disabled={busyId === item.id} onClick={() => void run(item, 'confirm')}>تأكيد</button>
                    <button className="admin-reject-button" disabled={busyId === item.id} onClick={() => void run(item, 'reject')}>رفض</button>
                  </div>
                </article>
              );
            })}
            {!items.length && <div className="admin-app-empty">لا توجد حجوزات معلقة حاليا.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
