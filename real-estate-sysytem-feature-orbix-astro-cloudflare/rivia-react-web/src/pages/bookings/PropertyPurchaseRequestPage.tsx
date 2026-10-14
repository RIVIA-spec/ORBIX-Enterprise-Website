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
import { detectPropertyFlowKind } from '../../lib/propertyFlow';
import { getPropertyOwnerId } from '../../lib/propertyAccess';
import { getPropertyReference } from '../../lib/propertyReference';
import { formatNumber, getLocationLabel, getPropertyPrice } from '../../lib/formatters';
import { getContactMethodLabel, getPurchaseIntentLabel, getWorkflowStatusLabel, getWorkflowStatusTone } from '../../lib/statusLabels';
import { createPurchaseDeal } from '../../services/dealService';
import { createPurchaseFallbackBooking } from '../../services/bookingService';
import { queueAdminEmail } from '../../services/functionsService';

const contactMethodOptions = [
  { value: 'phone', label: 'هاتف' },
  { value: 'whatsapp', label: 'واتساب' },
  { value: 'email', label: 'بريد إلكتروني' },
];

const purchaseIntentOptions = [
  'شراء مباشر',
  'تفاوض على السعر',
  'طلب استشارة',
];

export function PropertyPurchaseRequestPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { property, loading, error } = useProperty(id);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('phone');
  const [purchaseIntent, setPurchaseIntent] = useState('شراء مباشر');
  const [proposedPrice, setProposedPrice] = useState('');
  const [note, setNote] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCustomerName((current) => current || profile?.displayName || profile?.username || user?.displayName || '');
    setCustomerEmail((current) => user?.email || current || profile?.email || '');
    setCustomerPhone((current) => current || profile?.phone || profile?.phoneNumber || String(profile?.contact_number || ''));
  }, [profile, user]);

  const flowKind = useMemo(() => (property ? detectPropertyFlowKind(property) : 'unknown'), [property]);
  const isSale = flowKind === 'sale' || flowKind === 'unknown';
  const cleanProposedPrice = useMemo(() => {
    const normalized = Number(String(proposedPrice ?? '').replace(/,/g, ''));
    return Number.isFinite(normalized) ? normalized : null;
  }, [proposedPrice]);

  if (loading) return <LoadingState label="جارٍ تحميل صفحة شراء العقار" />;
  if (error) return <EmptyState title="تعذر تحميل العقار" description={error} />;
  if (!property || !id) return <EmptyState title="العقار غير موجود" description="لم نتمكن من العثور على العقار المطلوب." />;

  const propertyReference = getPropertyReference(property);
  const propertyOwnerId = getPropertyOwnerId(property);

  const openConfirmation = (event: FormEvent) => {
    event.preventDefault();
    setActionError(null);
    if (!user) {
      setActionError('سجل الدخول لإرسال طلب الشراء.');
      return;
    }
    if (user.email && !user.emailVerified) {
      setActionError('يجب تأكيد البريد الإلكتروني قبل إرسال الطلب.');
      return;
    }
    if (profile && profile.isVerified === false) {
      setActionError('يجب توثيق الهوية قبل إرسال الطلب.');
      return;
    }
    setConfirmationOpen(true);
  };

  const submitPurchase = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setActionError('سجل الدخول لإرسال طلب الشراء.');
      return;
    }
    const effectiveEmail = user.email || customerEmail.trim();
    if (!effectiveEmail) {
      setActionError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setMessage(null);
    setWarning(null);

    try {
      const deal = await createPurchaseDeal({
        propertyId: property.id,
        propertyTitle: property.title || property.name || '',
        propertyReference,
        ownerUserId: propertyOwnerId,
        customerUserId: user.uid,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: effectiveEmail,
        preferredContactMethod,
        proposedPrice: cleanProposedPrice,
        purchaseIntent,
        note: note.trim(),
      });

      setConfirmationOpen(false);
      setMessage('تم إرسال طلب شراء العقار للإدارة. سيتم التواصل معك قريبا.');
      try {
        await queueAdminEmail({
          type: 'PROPERTY_PURCHASE_REQUEST',
          relatedId: deal.dealId || deal.id,
          event: 'property_purchase_request',
          summary: 'طلب شراء عقار جديد',
          metadata: {
            dealId: deal.dealId || deal.id,
            propertyId: property.id,
            propertyTitle: property.title || property.name || '',
            propertyReference,
            customerUserId: user.uid,
            customerName: customerName.trim(),
            customerEmail: effectiveEmail,
            customerPhone: customerPhone.trim() || undefined,
            ownerUserId: property.ownerId || property.ownerUserId || property.userId,
            proposedPrice: cleanProposedPrice ?? property.selling_price ?? property.sellingPrice ?? property.salePrice ?? property.price,
            listingType: 'sale',
            requestType: 'purchase',
            note: note.trim() || undefined,
            customerNote: note.trim() || undefined,
            createdAt: new Date().toISOString(),
          },
        });
      } catch (notificationError) {
        if (import.meta.env.DEV) console.warn('[Admin notification] purchase queue failed', notificationError);
        setWarning('تم إرسال الطلب لكن تعذر إرسال إشعار الإدارة.');
      }
    } catch (dealError) {
      try {
        const fallback = await createPurchaseFallbackBooking({
          propertyId: property.id,
          propertyTitle: property.title || property.name || '',
          propertyReference,
          ownerUserId: propertyOwnerId,
          customerUserId: user.uid,
          bookingType: 'purchase_request',
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: effectiveEmail,
          preferredContactMethod,
          customerNote: note.trim(),
          totalAmount: cleanProposedPrice,
        });

        setConfirmationOpen(false);
        setMessage('تم إرسال طلب شراء العقار للإدارة. سيتم التواصل معك قريبا.');
        setWarning('تم إرسال طلبك عبر المسار البديل المتاح.');
        try {
          await queueAdminEmail({
            type: 'PROPERTY_PURCHASE_REQUEST',
            relatedId: fallback.bookingId,
            event: 'property_purchase_request',
            summary: 'طلب شراء عقار جديد',
            metadata: {
              bookingId: fallback.bookingId,
              propertyId: property.id,
              propertyTitle: property.title || property.name || '',
              propertyReference,
              customerUserId: user.uid,
              customerName: customerName.trim(),
              customerEmail: effectiveEmail,
              customerPhone: customerPhone.trim() || undefined,
              ownerUserId: property.ownerId || property.ownerUserId || property.userId,
              proposedPrice: cleanProposedPrice ?? property.selling_price ?? property.sellingPrice ?? property.salePrice ?? property.price,
              listingType: 'sale',
              requestType: 'purchase',
              note: note.trim() || undefined,
              customerNote: note.trim() || undefined,
              createdAt: new Date().toISOString(),
            },
          });
        } catch (notificationError) {
          if (import.meta.env.DEV) console.warn('[Admin notification] purchase fallback queue failed', notificationError);
          setWarning((current) =>
          current ? `${current} تم إرسال الطلب لكن تعذر إرسال إشعار الإدارة.` : 'تم إرسال الطلب لكن تعذر إرسال إشعار الإدارة.',
          );
        }
      } catch (fallbackError) {
        setActionError(
          getFirebaseErrorMessage(
            fallbackError || dealError,
            'تعذر إرسال الطلب حاليًا. حاول مرة أخرى لاحقًا.',
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <div className="page-heading compact">
  <span className="eyebrow">الشراء</span>
  <h1>شراء عقار</h1>
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
              <span className="chip">{getWorkflowStatusLabel('pending')}</span>
              <span className="chip">{getContactMethodLabel(preferredContactMethod)}</span>
              <span className="chip">{getPurchaseIntentLabel(purchaseIntent)}</span>
              {!isSale && <span className="chip">طلب متابعة</span>}
            </div>

            {!user && <div className="modal-empty-state"><p>سجل الدخول لإرسال طلب الشراء.</p><Button as={Link} to="/login">تسجيل الدخول</Button></div>}
            {user?.email && !user.emailVerified && <div className="form-error">يجب تأكيد البريد الإلكتروني قبل إرسال الطلب.</div>}
            {profile && profile.isVerified === false && <div className="form-success">يجب توثيق الهوية قبل إتمام الطلب في هذا الحساب.</div>}

            <form className="form-stack" onSubmit={openConfirmation}>
              <div className="form-grid">
                <Select
                  label="طريقة التواصل"
                  value={preferredContactMethod}
                  onChange={(event) => setPreferredContactMethod(event.target.value)}
                  options={contactMethodOptions}
                />
                <Select
                  label="نوع الطلب"
                  value={purchaseIntent}
                  onChange={(event) => setPurchaseIntent(event.target.value)}
                  options={purchaseIntentOptions.map((item) => ({ value: item, label: item }))}
                />
                <Input label="السعر المقترح" value={proposedPrice} onChange={(event) => setProposedPrice(event.target.value)} />
              </div>

              <Card className="summary-card">
                <h3>ملخص الطلب</h3>
                <dl className="details-grid compact">
                  <div>
                    <dt>نوع الطلب</dt>
                    <dd>{getPurchaseIntentLabel(purchaseIntent)}</dd>
                  </div>
                  <div>
                    <dt>السعر المقترح</dt>
                    <dd>{cleanProposedPrice != null ? formatNumber(cleanProposedPrice) : 'غير محدد'}</dd>
                  </div>
                  <div>
                    <dt>طريقة التواصل</dt>
                    <dd>{getContactMethodLabel(preferredContactMethod)}</dd>
                  </div>
                  <div>
                    <dt>الحالة</dt>
                    <dd>
                      <span className={`badge badge-${getWorkflowStatusTone('pending')}`}>{getWorkflowStatusLabel('pending')}</span>
                    </dd>
                  </div>
                </dl>
              </Card>

              {actionError && <ErrorMessage message={actionError} />}
              {warning && <div className="form-success">{warning}</div>}
              {message && <div className="form-success">{message}</div>}

              <div className="inline-actions">
                <Button type="submit" disabled={!user || Boolean(user.email && !user.emailVerified) || (profile?.isVerified === false)}>
                  متابعة لتأكيد الطلب
                </Button>
                <Button as={Link} to={`/properties/${property.id}`} variant="outline">
                  العودة للعقار
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {confirmationOpen && (
        <div className="modal-backdrop" onClick={() => !submitting && setConfirmationOpen(false)}>
          <section className="modal-card" onClick={(event) => event.stopPropagation()} aria-label="تأكيد طلب الشراء">
            <button type="button" className="modal-close" onClick={() => setConfirmationOpen(false)} aria-label="إغلاق" disabled={submitting}>×</button>
            <span className="eyebrow">تأكيد الطلب</span>
            <h2>معلومات التواصل</h2>
            {!user ? (
              <div className="modal-empty-state"><p>سجل الدخول لإرسال طلب الشراء.</p><Button as={Link} to="/login">تسجيل الدخول</Button></div>
            ) : (
              <form className="form-stack" onSubmit={submitPurchase}>
                <Input label="الاسم الكامل" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  value={user.email || customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  readOnly={Boolean(user.email)}
                  required={!user.email}
                  helper="سيتم استخدام بريد حسابك للتواصل حول الطلب."
                />
                <Input
                  label="رقم الهاتف"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="أدخل رقم الهاتف إذا رغبت"
                />
                <TextArea label="ملاحظة" value={note} onChange={(event) => setNote(event.target.value)} />
                {actionError && <ErrorMessage message={actionError} />}
                <Button type="submit" loading={submitting}>تأكيد وإرسال الطلب</Button>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
