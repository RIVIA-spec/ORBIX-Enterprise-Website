import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TextArea } from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { useFavorites } from '../../hooks/useFavorites';
import { useProperty } from '../../hooks/useProperties';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate, formatNumber, getLocationLabel } from '../../lib/formatters';
import { useTranslation } from '../../lib/i18n';
import { getOffPlanRows, getPricingDisplay, getProjectRows, getPublicContact, getSummaryStats, isProjectProperty } from '../../lib/propertyDetailsDisplay';
import { detectPropertyFlowKind } from '../../lib/propertyFlow';
import { canEditProperty, getPropertyOwnerId } from '../../lib/propertyAccess';
import { getFullPropertyId, getPropertyReference } from '../../lib/propertyReference';
import { absoluteUrl, buildPropertyJsonLd, firstImage, getPropertySeoMetadata, idFromSlug, isPropertyIndexable, propertyPath } from '../../lib/seo';
import { SEO } from '../../components/seo/SEO';
import { buildAdminWhatsAppUrl, getAdminContact, type AdminContact } from '../../services/adminContactService';
import { createPropertyBooking, createPurchaseFallbackBooking, normalizeBookingInput } from '../../services/bookingService';
import { createPropertyComment, deletePropertyComment, getPropertyComments } from '../../services/commentService';
import { createPurchaseDeal } from '../../services/dealService';
import { queueAdminEmail } from '../../services/functionsService';
import { createLeadWithConfiguredGateway, getLeadSubmissionErrorMessage, shouldBlockLeadSubmission } from '../../services/leadGateway';
import { extractTourImages, extractTourScenes, getPropertyPanorama } from '../../services/panoramaService';
import { extractPropertyCoordinates } from '../../services/mapService';
import { getPropertyRatings, getRatingSummary, setPropertyRating } from '../../services/ratingService';
import { getReportReasons, reportProperty } from '../../services/reportService';
import type { PropertyComment, PropertyPanorama, PropertyRating, ReportReason } from '../../types/models';

export function PropertyDetailsPage() {
  const { slugOrId } = useParams();
  const { t, language, direction } = useTranslation();
  // idFromSlug reads only the valid trailing Firestore ID from an SEO slug.
  // For an id-only legacy URL it returns the route value unchanged.
  const id = idFromSlug(slugOrId);
  const { user, profile, isAdmin, isOwner } = useAuth();
  const { property, loading, error } = useProperty(id);
  const { favoriteSet, toggle, isAuthenticated } = useFavorites();
  const [comments, setComments] = useState<PropertyComment[]>([]);
  const [ratings, setRatings] = useState<PropertyRating[]>([]);
  const [panorama, setPanorama] = useState<PropertyPanorama | null>(null);
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [commentText, setCommentText] = useState('');
  const [ratingValue, setRatingValue] = useState('5');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReasonId, setReportReasonId] = useState('');
  const [reportText, setReportText] = useState('');
  const [requestModal, setRequestModal] = useState<'sale' | 'rent' | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [bookingGuests, setBookingGuests] = useState('1');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [adminContact, setAdminContact] = useState<AdminContact | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([
      getPropertyComments(id).catch(() => []),
      getPropertyRatings(id).catch(() => []),
      getPropertyPanorama(id).catch(() => null),
      getReportReasons().catch(() => []),
    ]).then(([commentItems, ratingItems, panoramaItem, reasons]) => {
      if (!active) return;
      setComments(commentItems);
      setRatings(ratingItems);
      setPanorama(panoramaItem);
      setReportReasons(reasons);
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    setCustomerName((current) => current || profile?.displayName || profile?.username || user?.displayName || '');
    setCustomerEmail((current) => user?.email || current || profile?.email || '');
    setCustomerPhone((current) => current || profile?.phone || profile?.phoneNumber || String(profile?.contact_number || ''));
  }, [profile, user]);

  useEffect(() => {
    if (!user) return;
    const ownRating = ratings.find((item) => item.userId === user.uid || item.id === user.uid);
    if (ownRating?.rating != null) setRatingValue(String(ownRating.rating));
  }, [ratings, user]);

  useEffect(() => {
    let active = true;
    getAdminContact().then((contact) => active && setAdminContact(contact)).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const images = useMemo(() => {
    if (!property) return [];
    return [property.mainImage, property.imageUrl, ...(property.images || [])].filter(Boolean) as string[];
  }, [property]);

  if (loading) return <LoadingState label={t('propertyDetails.loading')} />;
  if (error) return <EmptyState title={t('propertyDetails.loadError')} description={error} />;
  if (!property || !id) return <EmptyState title={t('propertyDetails.notFound.title')} description={t('propertyDetails.notFound.description')} />;

  const pricing = getPricingDisplay(property);
  const price = pricing?.value || '';
  const location = getLocationLabel(property);
  const ratingSummary = getRatingSummary(ratings);
  const canEdit = canEditProperty(user, profile, property);
  const flowKind = detectPropertyFlowKind(property);
  const isSale = flowKind === 'sale';
  const isRent = flowKind === 'rent';
  const isOffPlan = flowKind === 'offPlan';
  const isProject = isProjectProperty(property);
  const propertyReference = getPropertyReference(property);
  const fullPropertyId = getFullPropertyId(property);
  const propertyOwnerId = getPropertyOwnerId(property);
  const panoramaImages = extractTourImages(panorama);
  const panoramaScenes = extractTourScenes(panorama);
  const bookingLabel = isSale ? t('propertyDetails.action.buy') : isOffPlan ? t('propertyDetails.action.interest') : t('propertyDetails.action.book');
  const coordinates = extractPropertyCoordinates(property);
  const details = getSummaryStats(property);
  const offPlanRows = isOffPlan ? getOffPlanRows(property) : [];
  const projectRows = !isOffPlan && isProject ? getProjectRows(property) : [];
  const publicContact = isPropertyIndexable(property) ? getPublicContact(property) : null;
  const canonicalPath = propertyPath(property);
  const propertyTitle = property.title || property.name || t('propertyDetails.fallback.title');
  const seoMetadata = getPropertySeoMetadata(property);
  const seoDescription = property.description || seoMetadata.description;
  const propertyJsonLd = buildPropertyJsonLd(property);
  const noIndex = !isPropertyIndexable(property);
  const schema = [
    propertyJsonLd,
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t('propertyDetails.breadcrumb.home'), item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: t('propertyDetails.breadcrumb.properties'), item: absoluteUrl('/properties') }, { '@type': 'ListItem', position: 3, name: propertyTitle, item: absoluteUrl(canonicalPath) }] },
  ];
  const copyPropertyReference = async () => {
    try {
      await navigator.clipboard.writeText(propertyReference);
      setActionSuccess(t('propertyDetails.copyReferenceSuccess'));
    } catch {
      setActionError(t('propertyDetails.copyReferenceError'));
    }
  };

  const contactAdmin = async () => {
    setContactLoading(true);
    setActionError(null);
    try {
      const contact = adminContact || await getAdminContact();
      setAdminContact(contact);
      const whatsappUrl = await buildAdminWhatsAppUrl({ propertyReference, propertyTitle: property.title || property.name || 'عقار' });
      if (whatsappUrl) window.location.href = whatsappUrl;
      else if (contact.email) setContactOpen(true);
      else setActionError('بيانات التواصل مع الإدارة غير متاحة حاليا.');
    } catch {
      setActionError('تعذر تحميل بيانات التواصل مع الإدارة.');
    } finally {
      setContactLoading(false);
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setActionError(null);
    try {
      await createPropertyComment(id, {
        userId: user.uid,
        userName: profile?.username || user.displayName || user.email || 'مستخدم',
        comment: commentText,
        hasBooked: false,
      });
      setCommentText('');
      setComments(await getPropertyComments(id));
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر إضافة التعليق حاليًا. حاول مرة أخرى لاحقًا.'));
    }
  };

  const removeComment = async (comment: PropertyComment) => {
    setActionError(null);
    try {
      await deletePropertyComment(id, comment.id);
      setComments((current) => current.filter((item) => item.id !== comment.id));
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر حذف التعليق حاليًا. حاول مرة أخرى لاحقًا.'));
    }
  };

  const submitRating = async () => {
    if (!user) return;
    setActionError(null);
    try {
      await setPropertyRating(id, user.uid, Number(ratingValue));
      setRatings(await getPropertyRatings(id));
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر حفظ التقييم حاليًا. حاول مرة أخرى لاحقًا.'));
    }
  };

  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await reportProperty({ propertyId: id, reporterId: user.uid, reasonId: reportReasonId, reasonText: reportText });
      setReportOpen(false);
      setReportText('');
      setReportReasonId('');
      setActionSuccess('تم إرسال البلاغ للمراجعة.');
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر إرسال البلاغ حاليًا. حاول مرة أخرى لاحقًا.'));
    }
  };

  const openRequestModal = () => {
    setActionError(null);
    setActionSuccess(null);
    if (!user) {
      setRequestModal(isRent ? 'rent' : 'sale');
      return;
    }
    setRequestModal(isRent ? 'rent' : 'sale');
  };

  const submitSaleRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (shouldBlockLeadSubmission(requestSubmitting, Boolean(user))) {
      if (!user) setActionError('يجب تسجيل الدخول قبل إرسال الطلب.');
      return;
    }
    if (!user) {
      setActionError('يجب تسجيل الدخول قبل إرسال الطلب.');
      return;
    }
    const effectiveEmail = user.email || customerEmail.trim();
    if (!effectiveEmail) {
      setActionError('يرجى إدخال البريد الإلكتروني.');
      return;
    }
    if (user.email && !user.emailVerified) {
      setActionError('يجب تأكيد البريد الإلكتروني قبل إرسال الطلب.');
      return;
    }

    setRequestSubmitting(true);
    setActionError(null);
    try {
      await createLeadWithConfiguredGateway(
        {
          type: 'property_inquiry',
          propertyId: property.id,
          name: customerName.trim(),
          email: effectiveEmail,
          phone: customerPhone.trim(),
          message: customerNote.trim(),
          source: 'web',
        },
        async () => {
          let requestId = '';
          let dealId: string | undefined;
          let bookingId: string | undefined;
          try {
            const deal = await createPurchaseDeal({
              propertyId: property.id,
              propertyTitle: property.title || property.name || '',
              propertyReference,
              ownerUserId: propertyOwnerId,
              customerUserId: user.uid,
              customerName: customerName.trim(),
              customerEmail: effectiveEmail,
              customerPhone: customerPhone.trim(),
              note: customerNote.trim(),
              purchaseIntent: 'شراء مباشر',
            });
            requestId = deal.dealId || deal.id;
            dealId = requestId;
          } catch {
            const fallback = await createPurchaseFallbackBooking({
              propertyId: property.id,
              propertyTitle: property.title || property.name || '',
              propertyReference,
              ownerUserId: propertyOwnerId,
              customerUserId: user.uid,
              bookingType: 'purchase_request',
              customerName: customerName.trim(),
              customerEmail: effectiveEmail,
              customerPhone: customerPhone.trim(),
              customerNote: customerNote.trim(),
            });
            requestId = fallback.bookingId;
            bookingId = fallback.bookingId;
          }

          void queueAdminEmail({
            type: 'PROPERTY_PURCHASE_REQUEST',
            relatedId: requestId,
            event: 'property_purchase_request',
            summary: 'طلب شراء عقار جديد',
            metadata: {
              dealId,
              bookingId,
              propertyId: property.id,
              propertyTitle: property.title || property.name || '',
              propertyReference,
              customerUserId: user.uid,
              customerName: customerName.trim(),
              customerEmail: effectiveEmail,
              customerPhone: customerPhone.trim() || undefined,
              ownerUserId: property.ownerId || property.ownerUserId || property.userId,
              proposedPrice: property.selling_price || property.sellingPrice || property.salePrice || property.price,
              listingType: 'sale',
              requestType: 'purchase',
              note: customerNote.trim() || undefined,
              customerNote: customerNote.trim() || undefined,
              createdAt: new Date().toISOString(),
            },
          }).catch((notificationError) => {
            if (import.meta.env.DEV) console.warn('[Admin notification] purchase queue failed', notificationError);
          });

          return { id: requestId, backend: 'legacy' };
        },
      );
      setRequestModal(null);
      setActionSuccess('تم إرسال طلب الاهتمام بالعقار بنجاح.');
    } catch (err) {
      setActionError(getLeadSubmissionErrorMessage(err));
    } finally {
      setRequestSubmitting(false);
    }
  };
  const submitRentRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const effectiveEmail = user.email || customerEmail.trim();
    if (!effectiveEmail) {
      setActionError('يرجى إدخال البريد الإلكتروني.');
      return;
    }
    if (!bookingStart || !bookingEnd || Number(bookingGuests) < 1) {
      setActionError('يرجى إدخال تاريخ البدء والانتهاء وعدد الضيوف.');
      return;
    }
    if (new Date(bookingEnd) <= new Date(bookingStart)) {
      setActionError('يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.');
      return;
    }

    setRequestSubmitting(true);
    setActionError(null);
    try {
      const result = await createPropertyBooking({
        propertyId: property.id,
        propertyTitle: property.title || property.name || '',
        propertyReference,
        ownerUserId: propertyOwnerId,
        customerUserId: user.uid,
        bookingType: 'property_booking',
        customerName: customerName.trim(),
        customerEmail: effectiveEmail,
        customerPhone: customerPhone.trim(),
        preferredContactMethod: 'phone',
        checkIn: bookingStart,
        checkOut: bookingEnd,
        guests: Math.max(1, Number(bookingGuests) || 1),
        customerNote: customerNote.trim(),
        totalAmount: normalizeBookingInput(property),
      });
      setRequestModal(null);
      setActionSuccess('تم إرسال طلب الحجز بنجاح.');
      void queueAdminEmail({
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
          customerEmail: effectiveEmail,
          customerPhone: customerPhone.trim() || undefined,
          ownerUserId: property.ownerId || property.ownerUserId || property.userId,
          checkIn: bookingStart,
          checkOut: bookingEnd,
          guests: Math.max(1, Number(bookingGuests) || 1),
          preferredContactMethod: 'phone',
          note: customerNote.trim() || undefined,
          customerNote: customerNote.trim() || undefined,
          listingType: 'rent',
          requestType: 'booking',
          createdAt: new Date().toISOString(),
        },
      }).catch((notificationError) => {
        if (import.meta.env.DEV) console.warn('[Admin notification] booking queue failed', notificationError);
      });
    } catch (err) {
      setActionError(getFirebaseErrorMessage(err, 'تعذر إرسال طلب الحجز.'));
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <section className="container section property-detail-shell property-details-page" dir={direction} lang={language}>
      <SEO title={seoMetadata.title} description={seoDescription} path={canonicalPath} image={firstImage(property)} type="article" noIndex={noIndex} jsonLd={schema} />
      <ImageGallery images={images} title={property.title} />

      <article className="details-content property-detail-panel">
        <div className="details-title-row">
          <div>
            <span className="eyebrow">{property.category || property.property_category_title || property.propertyType || t('propertyDetails.fallback.property')}</span>
            <h1>{property.title || t('propertyDetails.fallback.title')}</h1>
          </div>
          <button type="button" className={`favorite-button detail-favorite ${favoriteSet.has(property.id) ? 'active' : ''}`} onClick={() => toggle(property.id)} aria-label="تبديل المفضلة">
            {favoriteSet.has(property.id) ? '♥' : '♡'}
          </button>
        </div>

        <div className="details-badges">
          {property.status && <StatusBadge status={property.status} />}
          {(property.isFeatured || property.isDistinct) && <StatusBadge status="مميز" tone="success" />}
          <StatusBadge status={`★ ${ratingSummary.average.toFixed(1)} (${ratingSummary.count})`} />
        </div>

        {pricing && (
          <div className="details-price price-box">
            <span>{t(pricing.labelKey)}</span>
            <strong>{pricing.value}</strong>
          </div>
        )}
        {location && <p className="details-location">{location}</p>}

        <div className="property-reference-card" title={fullPropertyId}>
          <div><span>{t('propertyDetails.reference')}</span><strong dir="ltr">{propertyReference}</strong></div>
          <button type="button" onClick={() => void copyPropertyReference()}>{t('propertyDetails.copyReference')}</button>
        </div>

        {details.length > 0 && <div className="details-stat-grid">{details.map((item) => <span key={String(item)}>{String(item)}</span>)}</div>}

        {actionError && <ErrorMessage message={actionError} />}
        {actionSuccess && <div className="form-success">{actionSuccess}</div>}

        {panoramaScenes.length > 0 && (
          <Card className="tour-callout tour-preview-card">
            <div>
              <span className="eyebrow">{t('propertyDetails.tour.eyebrow')}</span>
              <h2>{t('propertyDetails.tour.title')}</h2>
              <p className="muted">{t('propertyDetails.tour.scenes', { count: panoramaScenes.length })}</p>
            </div>
            <div className="tour-preview-thumbs">
              {panoramaScenes.slice(0, 2).map((scene, index) => (
                <span key={`${scene.id || scene.name || index}`} className="tour-preview-placeholder">360</span>
              ))}
              <span className="tour-preview-count">{t('propertyDetails.tour.scenes', { count: panoramaScenes.length })}</span>
            </div>
            <Button as={Link} to={`/properties/${property.id}/tour`}>
              {t('propertyDetails.tour.open')}
            </Button>
          </Card>
        )}

        <section className={`property-transaction-card ${isSale ? 'is-sale' : isOffPlan ? 'is-off-plan' : 'is-rent'}`}>
          <div>
            <span>{pricing ? t(pricing.labelKey) : isSale ? t('propertyDetails.pricing.sale') : isOffPlan ? t('propertyDetails.pricing.startingFrom') : t('propertyDetails.pricing.rent')}</span>
            <strong>{price || t('propertyDetails.pricing.unavailable')}</strong>
          </div>
          <div className="property-transaction-status">
            {property.status && <StatusBadge status={property.status} />}
            <span>{isSale ? t('propertyDetails.transaction.sale') : isOffPlan ? t('propertyDetails.transaction.offPlan') : t('propertyDetails.transaction.rent')}</span>
          </div>
          <Button type="button" onClick={openRequestModal} className="property-transaction-button">
            {bookingLabel}
          </Button>
        </section>

        <div className="details-actions">
          {canEdit && <Button as={Link} to={`/properties/${property.id}/edit`} variant="outline">{t('propertyDetails.action.edit')}</Button>}
          <Button type="button" variant="outline" loading={contactLoading} onClick={() => void contactAdmin()}>{t('propertyDetails.action.contactAdmin')}</Button>
          {coordinates && <Button as={Link} to={`/map?property=${property.id}`} variant="outline">{t('propertyDetails.action.map')}</Button>}
        </div>
      </article>

      <section className="details-content full-span">
        {offPlanRows.length > 0 && (
          <DetailBlock title={t('propertyDetails.offPlan.title')} className="property-off-plan-section">
            <dl className="property-location-grid property-off-plan-grid">
              {offPlanRows.map((row) => (
                <div key={row.key}>
                  <dt>{t(row.labelKey)}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </DetailBlock>
        )}

        {projectRows.length > 0 && (
          <DetailBlock title={t('propertyDetails.offPlan.title')} className="property-off-plan-section">
            <dl className="property-location-grid property-off-plan-grid">
              {projectRows.map((row) => (
                <div key={row.key}>
                  <dt>{t(row.labelKey)}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </DetailBlock>
        )}

        {property.description && <DetailBlock title={t('propertyDetails.section.description')}><p>{property.description}</p></DetailBlock>}

        {property.features && property.features.length > 0 && (
          <DetailBlock title={t('propertyDetails.section.features')}>
            <div className="features-list">{property.features.map((feature) => <span key={feature}>{feature}</span>)}</div>
          </DetailBlock>
        )}

        <DetailBlock title={t('propertyDetails.section.location')} className="property-location-section">
          <dl className="property-location-grid">
            <div><dt>{t('propertyDetails.location.country')}</dt><dd>{property.country || property.location?.country || t('propertyDetails.location.unknown')}</dd></div>
            <div><dt>{t('propertyDetails.location.city')}</dt><dd>{property.city || property.location?.city || t('propertyDetails.location.unknown')}</dd></div>
            <div><dt>{t('propertyDetails.location.address')}</dt><dd>{property.address || property.location?.address || t('propertyDetails.location.unknown')}</dd></div>
          </dl>
          {coordinates && (
            <Link className="property-location-link" to={`/map?property=${property.id}`}>
              <span>⌖</span>
              <span><strong>{t('propertyDetails.location.mapTitle')}</strong><small>{t('propertyDetails.location.mapHint')}</small></span>
            </Link>
          )}
        </DetailBlock>

        <DetailBlock title={t('propertyDetails.section.contact')}>
          {publicContact ? (
            <dl className="property-location-grid property-contact-grid">
              {publicContact.name && <div><dt>{t('propertyDetails.contact.name')}</dt><dd>{publicContact.name}</dd></div>}
              {publicContact.phone && <div><dt>{t('propertyDetails.contact.phone')}</dt><dd dir="ltr">{publicContact.phone}</dd></div>}
            </dl>
          ) : (
            <p>{t('propertyDetails.contact.adminFallback')}</p>
          )}
        </DetailBlock>

        {panoramaImages.length > 0 && (
          <DetailBlock title={t('propertyDetails.tour.eyebrow')}>
            <p className="muted">{t('propertyDetails.tour.scenes', { count: panoramaImages.length })}</p>
            <Button as={Link} to={`/properties/${property.id}/tour`} variant="outline">{t('propertyDetails.tour.open')}</Button>
          </DetailBlock>
        )}

        <DetailBlock title="تعليقات الزوار" className="property-comments-section">
          {isAuthenticated && (
            <form className="form-stack" onSubmit={submitComment}>
              <TextArea label="أضف تعليقا" value={commentText} onChange={(event) => setCommentText(event.target.value)} required />
              <Button type="submit">إرسال التعليق</Button>
            </form>
          )}
          {!isAuthenticated && <p className="property-login-hint">سجل الدخول لإضافة تعليق.</p>}
          <div className="stack-list">
            {comments.map((comment) => {
              const canDelete = user && (comment.userId === user.uid || isAdmin || isOwner);
              return (
                <div key={comment.id} className="comment-card">
                  <div>
                    <strong>{comment.userName || 'مستخدم'}</strong>
                    <p>{comment.comment || ''}</p>
                    <span className="muted">{formatDate(comment.createdAt || comment.created_at)}</span>
                  </div>
                  {canDelete && <Button variant="ghost" onClick={() => removeComment(comment)}>حذف</Button>}
                </div>
              );
            })}
            {comments.length === 0 && <p className="property-empty-feedback">لا توجد تعليقات بعد. كن أول من يعلق!</p>}
          </div>
        </DetailBlock>

        <DetailBlock title="التقييمات" className="property-rating-section">
          <div className="property-rating-summary">
            <strong>{ratingSummary.count > 0 ? ratingSummary.average.toFixed(1) : 'لا تقييمات بعد'}</strong>
            <span className="property-rating-stars" aria-label={`${ratingSummary.average.toFixed(1)} من 5`}>{[1, 2, 3, 4, 5].map((item) => <span key={item} className={item <= Math.round(ratingSummary.average) ? 'is-selected' : ''}>★</span>)}</span>
            <small>{ratingSummary.count > 0 ? `بناء على ${formatNumber(ratingSummary.count)} تقييم` : 'كن أول من يقيّم هذا العقار'}</small>
          </div>
          {isAuthenticated && (
            <div className="property-rating-action">
              <span>أضف تقييمك</span>
              <div className="property-stars-input" role="radiogroup" aria-label="تقييم العقار" onMouseLeave={() => setHoveredRating(0)}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <button key={item} type="button" role="radio" aria-checked={Number(ratingValue) === item} className={(hoveredRating || Number(ratingValue)) >= item ? 'is-active' : ''} onClick={() => setRatingValue(String(item))} onMouseEnter={() => setHoveredRating(item)} onFocus={() => setHoveredRating(item)} onBlur={() => setHoveredRating(0)} aria-label={`${item} نجوم`}>★</button>
                ))}
              </div>
              <Button type="button" onClick={submitRating}>إرسال التقييم</Button>
            </div>
          )}
          {!isAuthenticated && <p className="property-login-hint">سجل الدخول لإضافة تقييم.</p>}
        </DetailBlock>

        <section className="property-report-section">
          <button type="button" className="property-report-button" onClick={() => setReportOpen(true)}>الإبلاغ عن هذا العقار</button>
        </section>
      </section>

      <DetailsDrawer open={contactOpen} title="تواصل مع الإدارة" onClose={() => setContactOpen(false)}>
        <div className="property-admin-contact">
          {adminContact?.email ? <><p>يمكنك التواصل مع الإدارة عبر البريد الإلكتروني:</p><a href={`mailto:${adminContact.email}?subject=${encodeURIComponent(`استفسار عن العقار ${propertyReference}`)}`}>{adminContact.email}</a></> : <p>بيانات التواصل مع الإدارة غير متاحة حاليا.</p>}
        </div>
      </DetailsDrawer>

      <DetailsDrawer open={reportOpen} title="إبلاغ عن العقار" onClose={() => setReportOpen(false)}>
        {!user ? (
          <div className="property-login-prompt"><p>سجل الدخول لإرسال البلاغ.</p><Button as={Link} to="/login">تسجيل الدخول</Button></div>
        ) : (
          <form className="form-stack" onSubmit={submitReport}>
            {reportReasons.length > 0 && (
              <Select
                label="سبب البلاغ"
                value={reportReasonId}
                onChange={(event) => setReportReasonId(event.target.value)}
                options={[{ value: '', label: 'اختر سببا' }, ...reportReasons.map((reason) => ({ value: reason.id, label: reason.title || reason.label || reason.reason || reason.id }))]}
              />
            )}
            <TextArea label="تفاصيل إضافية (اختياري)" value={reportText} onChange={(event) => setReportText(event.target.value)} />
            <Button type="submit">إرسال البلاغ</Button>
          </form>
        )}
      </DetailsDrawer>

      {requestModal && (
        <div className="modal-backdrop property-request-modal-backdrop" onClick={() => !requestSubmitting && setRequestModal(null)}>
          <section className="modal-card property-request-modal" onClick={(event) => event.stopPropagation()} aria-label={requestModal === 'sale' ? 'شراء العقار' : 'حجز العقار'}>
            <button type="button" className="modal-close" onClick={() => setRequestModal(null)} aria-label="إغلاق" disabled={requestSubmitting}>×</button>
            <span className="eyebrow">{requestModal === 'sale' ? 'طلب شراء' : 'طلب حجز'}</span>
            <h2>{requestModal === 'sale' ? 'تأكيد شراء العقار' : 'تأكيد معلومات الحجز'}</h2>
            {!user ? (
              <div className="property-login-prompt">
                <p>{requestModal === 'sale' ? 'سجل الدخول لإرسال طلب الشراء.' : 'سجل الدخول لإرسال طلب الحجز.'}</p>
                <Button as={Link} to="/login">تسجيل الدخول</Button>
              </div>
            ) : (
              <form className="form-stack" onSubmit={requestModal === 'sale' ? submitSaleRequest : submitRentRequest}>
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
                <Input label="رقم الهاتف" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="أدخل رقم الهاتف إذا رغبت" />
                {requestModal === 'rent' && (
                  <div className="property-booking-fields">
                    <Input type="number" min={1} label="عدد الضيوف" value={bookingGuests} onChange={(event) => setBookingGuests(event.target.value)} required />
                    <Input type="date" label="تاريخ البدء" value={bookingStart} onChange={(event) => setBookingStart(event.target.value)} required />
                    <Input type="date" label="تاريخ الانتهاء" value={bookingEnd} onChange={(event) => setBookingEnd(event.target.value)} required />
                  </div>
                )}
                <TextArea label="ملاحظة" value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} />
                {actionError && <ErrorMessage message={actionError} />}
                <Button type="submit" loading={requestSubmitting}>{requestModal === 'sale' ? 'تأكيد وإرسال الطلب' : 'تأكيد معلومات الحجز'}</Button>
                <Button as={Link} to={requestModal === 'sale' ? `/properties/${property.id}/purchase` : `/properties/${property.id}/book`} variant="ghost">فتح النموذج الكامل</Button>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function DetailBlock({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`details-block ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
