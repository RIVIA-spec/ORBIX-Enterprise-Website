import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { useProperty } from '../../hooks/useProperties';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { detectPropertyFlowKind, isStayStyleProperty } from '../../lib/propertyFlow';
import { getPropertyOwnerId } from '../../lib/propertyAccess';
import { getPropertyReference } from '../../lib/propertyReference';
import { formatNumber, getLocationLabel, getPropertyPrice } from '../../lib/formatters';
import { getContactMethodLabel, getWorkflowStatusLabel } from '../../lib/statusLabels';
import { createPropertyBooking, normalizeBookingInput } from '../../services/bookingService';
import { queueAdminEmail } from '../../services/functionsService';

const visitTypeOptions = ['معاينة العقار', 'اتصال هاتفي', 'زيارة مكتبية', 'جولة افتراضية'];
const contactMethodOptions = [
  { value: 'phone', label: 'هاتف' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'email', label: 'بريد إلكتروني' },
];

function calculateTotal(
  property: { daily_price?: unknown; nightly_price?: unknown; rentPrice?: unknown; price?: unknown; selling_price?: unknown; salePrice?: unknown },
  checkIn: string,
  checkOut: string,
) {
  const base = Number(
    String(property.daily_price || property.nightly_price || property.rentPrice || property.price || property.selling_price || property.salePrice || '')
      .replace(/,/g, ''),
  );
  if (!Number.isFinite(base)) return null;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return base;
  const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  return base * nights;
}

export function PropertyBookingPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { property, loading, error } = useProperty(id);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('phone');
  const [visitType, setVisitType] = useState('معاينة العقار');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [alternativeDate, setAlternativeDate] = useState('');
  const [alternativeTime, setAlternativeTime] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCustomerName((current) => current || profile?.displayName || profile?.username || user?.displayName || '');
    setCustomerPhone((current) => current || profile?.phone || profile?.phoneNumber || String(profile?.contact_number || ''));
  }, [profile, user]);

  const flowKind = useMemo(() => (property ? detectPropertyFlowKind(property) : 'unknown'), [property]);
  const isSale = flowKind === 'sale';
  const isStayStyle = useMemo(() => (property ? isStayStyleProperty(property) : false), [property]);

  const estimatedTotal = useMemo(() => {
    if (!property || !isStayStyle) return null;
    return calculateTotal(property, checkIn, checkOut);
  }, [checkIn, checkOut, isStayStyle, property]);

  if (loading) return <LoadingState label="جارٍ تحميل صفحة الحجز" />;
  if (error) return <EmptyState title="تعذر تحميل العقار" description={error} />;
  if (!property || !id) return <EmptyState title="العقار غير موجود" description="لم نتمكن من العثور على العقار المطلوب." />;

  const propertyReference = getPropertyReference(property);
  const propertyOwnerId = getPropertyOwnerId(property);

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!user.emailVerified) {
      setActionError('يجب تأكيد البريد الإلكتروني قبل إرسال الطلب.');
      return;
    }
    if (isStayStyle && (!checkIn || !checkOut || !guests)) {
      setActionError('يرجى إدخال تاريخ الوصول والمغادرة وعدد الضيوف.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setMessage(null);
    setWarning(null);
    try {
      const result = await createPropertyBooking({
        propertyId: property.id,
        propertyTitle: property.title || property.name || '',
        propertyReference,
        ownerUserId: propertyOwnerId,
        customerUserId: user.uid,
        bookingType: isSale ? 'property_visit' : 'property_booking',
        customerName,
        customerPhone,
        customerEmail: user.email || String(profile?.email || ''),
        preferredContactMethod,
        visitType,
        appointmentDate,
        appointmentTime,
        alternativeDate,
        alternativeTime,
        customerNote,
        checkIn: isStayStyle ? checkIn : '',
        checkOut: isStayStyle ? checkOut : '',
        guests: isStayStyle ? Math.max(1, Number(guests) || 1) : 1,
        totalAmount: normalizeBookingInput(property, isStayStyle ? estimatedTotal : null),
      });

      setMessage('تم إرسال الطلب بنجاح.');
      if (!result.propertyWriteSucceeded) {
      setWarning('تم حفظ الطلب في حسابك، لكن تعذر نسخه داخل سجل العقار بسبب صلاحيات قاعدة البيانات.');
      }

      try {
        await queueAdminEmail({
          type: 'PROPERTY_BOOKING_REQUEST',
          relatedId: result.bookingId,
          event: 'property_booking_request',
          summary: 'طلب حجز عقار جديد',
          metadata: {
            bookingId: result.bookingId,
            propertyId: property.id,
            propertyTitle: property.title || property.name || '',
            propertyReference,
            customerUserId: user.uid,
            customerName: customerName.trim(),
            customerEmail: user.email || undefined,
            customerPhone: customerPhone.trim() || undefined,
            ownerUserId: property.ownerId || property.ownerUserId || property.userId,
            checkIn: (isStayStyle ? checkIn : appointmentDate) || undefined,
            checkOut: (isStayStyle ? checkOut : alternativeDate) || undefined,
            guests: isStayStyle ? Math.max(1, Number(guests) || 1) : 1,
            preferredContactMethod,
            note: customerNote.trim() || undefined,
            customerNote: customerNote.trim() || undefined,
            listingType: 'rent',
            requestType: 'booking',
            createdAt: new Date().toISOString(),
          },
        });
      } catch (notificationError) {
        if (import.meta.env.DEV) console.warn('[Admin notification] booking queue failed', notificationError);
        setWarning((current) =>
          current ? `${current} تم إنشاء الطلب لكن تعذر إرسال إشعار الإدارة.` : 'تم إنشاء الطلب لكن تعذر إرسال إشعار الإدارة.',
        );
      }
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر إرسال الطلب حاليًا. حاول مرة أخرى لاحقًا.'));
    } finally {
      setSubmitting(false);
    }
  };

  const bookingDisabled = !user?.emailVerified;
  const bookingHeading = 'حجز موعد / إقامة';
  const bookingTypeLabel = isSale ? 'طلب معاينة' : isStayStyle ? 'حجز إقامة' : 'حجز معاينة';

  return (
    <section className="container section">
      <div className="page-heading compact">
        <span className="eyebrow">الحجوزات</span>
        <h1>{bookingHeading}</h1>
        <p>{property.title || property.name || 'عقار'}</p>
      </div>

      <div className="detail-layout">
        <Card className="detail-main-card">
          <div className="detail-stack">
            <div>
              <h2>{property.title || property.name || 'عقار بدون عنوان'}</h2>
              <p className="muted">{getLocationLabel(property)}</p>
              <p>{getPropertyPrice(property) || 'السعر غير متوفر'}</p>
            </div>

            <div className="details-badges">
              <span className="chip">{bookingTypeLabel}</span>
              <span className="chip">{getWorkflowStatusLabel('pending')}</span>
              <span className="chip">{getContactMethodLabel(preferredContactMethod)}</span>
              {isStayStyle && <span className="chip">حجز إقامة</span>}
            </div>

            {!user?.emailVerified && <div className="form-error">يجب تأكيد البريد الإلكتروني قبل إرسال الطلب.</div>}
            {profile && profile.isVerified === false && <div className="form-success">قد تحتاج إلى توثيق الهوية قبل إكمال بعض العمليات داخل الحساب.</div>}

            <form className="form-stack" onSubmit={submitBooking}>
              <div className="form-grid">
                <Input label="اسم العميل" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
                <Input label="رقم الهاتف" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} required />
                <Select
                  label="طريقة التواصل المفضلة"
                  value={preferredContactMethod}
                  onChange={(event) => setPreferredContactMethod(event.target.value)}
                  options={contactMethodOptions}
                />
                <Select
                  label="نوع الطلب"
                  value={visitType}
                  onChange={(event) => setVisitType(event.target.value)}
                  options={visitTypeOptions.map((item) => ({ value: item, label: item }))}
                />
                <Input type="date" label="التاريخ المفضل" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} required />
                <Input type="time" label="الوقت المفضل" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} required />
                <Input type="date" label="تاريخ بديل" value={alternativeDate} onChange={(event) => setAlternativeDate(event.target.value)} />
                <Input type="time" label="وقت بديل" value={alternativeTime} onChange={(event) => setAlternativeTime(event.target.value)} />
              </div>

              {isStayStyle && (
                <Card className="summary-card">
                  <h3>تفاصيل الإقامة</h3>
                  <div className="grid-two">
                    <Input type="date" label="تاريخ الوصول" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required={isStayStyle} />
                    <Input type="date" label="تاريخ المغادرة" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required={isStayStyle} />
                  </div>
                  <Input type="number" min={1} label="عدد الضيوف" value={guests} onChange={(event) => setGuests(event.target.value)} required={isStayStyle} />
                  <dl className="details-grid compact">
                    <div>
                      <dt>التكلفة التقديرية</dt>
                      <dd>{estimatedTotal != null ? `${formatNumber(estimatedTotal)}` : 'غير متوفر'}</dd>
                    </div>
                  </dl>
                </Card>
              )}

              <TextArea label="ملاحظات" value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} />

              {actionError && <ErrorMessage message={actionError} />}
              {warning && <div className="form-success">{warning}</div>}
              {message && <div className="form-success">{message}</div>}

              <div className="inline-actions">
                <Button type="submit" loading={submitting} disabled={bookingDisabled}>
                  إرسال الطلب
                </Button>
                <Button as={Link} to={`/properties/${property.id}`} variant="outline">
                  العودة للعقار
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </section>
  );
}
