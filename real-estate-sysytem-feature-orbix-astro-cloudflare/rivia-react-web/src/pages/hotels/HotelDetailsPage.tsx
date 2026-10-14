import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createHotelBooking } from '../../services/bookingService';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TextArea } from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import {
  getHotelById,
  getHotelContact,
  getHotelImage,
  getHotelLocationLabel,
  getHotelPrice,
  getHotelTitle,
  listHotelRoomTypes,
} from '../../services/hotelService';
import { getReportReasons, reportHotel } from '../../services/reportService';
import {
  addHotelComment,
  getHotelRatingSummary,
  listHotelComments,
  listHotelRatings,
  upsertHotelRating,
} from '../../services/hotelFeedbackService';
import type { Hotel, HotelComment, HotelRating, HotelRoomType, ReportReason } from '../../types/models';
import { SEO } from '../../components/seo/SEO';
import { absoluteUrl, hotelPath, idFromSlug } from '../../lib/seo';

type BookingForm = {
  checkIn: string;
  checkOut: string;
  guests: string;
  customerName: string;
  customerPhone: string;
  note: string;
};

type RoomData = HotelRoomType & Record<string, unknown>;

const emptyBookingForm: BookingForm = {
  checkIn: '',
  checkOut: '',
  guests: '1',
  customerName: '',
  customerPhone: '',
  note: '',
};

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value: unknown): number | null {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(raw: unknown, currency?: unknown) {
  if (raw == null || raw === '') return 'السعر غير محدد';
  const value = toNumber(raw);
  const formatted = value == null ? String(raw) : new Intl.NumberFormat('ar').format(value);
  return `${formatted} ${String(currency || 'ليرة سورية')}`.trim();
}

function roomTitle(room: RoomData) {
  return String(firstValue(room.title, room.name, 'غرفة'));
}

function roomImage(room: RoomData) {
  return room.images?.find(Boolean) || room.imageUrl || room.mainImage || '';
}

function roomPanorama(room: RoomData) {
  const tour = firstValue(room.panorama_tour, room.panoramaTour, room.panorama, room.panorama_url, room.panoramaUrl);
  if (typeof tour === 'string') return tour;
  if (tour && typeof tour === 'object') {
    const data = tour as Record<string, unknown>;
    return String(firstValue(data.thumbnailUrl, data.imageUrl, data.url, data.previewUrl, '') || '');
  }
  return '';
}

function roomFeatures(room: RoomData) {
  const value = firstValue(room.features, room.amenities, room.facilities);
  if (Array.isArray(value)) {
    return value.map((feature) => typeof feature === 'string' ? feature : String((feature as Record<string, unknown>)?.name || '')).filter(Boolean);
  }
  return [];
}

function roomAvailability(room: RoomData) {
  const available = toNumber(firstValue(room.available_count, room.availableCount));
  const total = toNumber(firstValue(room.total_count, room.totalCount));
  return { available, total, isAvailable: available == null || available > 0 };
}

function roomRawPrice(room: RoomData): number | null {
  return toNumber(firstValue(room.nightly_price, room.nightlyPrice, room.pricePerNight, room.price_per_night, room.price));
}

function formatFeedbackDate(value: unknown) {
  if (!value) return '';
  let date: Date | null = null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'object' && value !== null && 'seconds' in value) {
    date = new Date(Number((value as { seconds: unknown }).seconds) * 1000);
  } else {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }
  return date ? new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(date) : '';
}

export function HotelDetailsPage() {
  const { slugOrId } = useParams();
  // SEO slugs resolve to their trailing Firestore ID; legacy id-only URLs are
  // kept as a compatibility fallback.
  const id = idFromSlug(slugOrId);
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<HotelRoomType[]>([]);
  const [comments, setComments] = useState<HotelComment[]>([]);
  const [ratings, setRatings] = useState<HotelRating[]>([]);
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoomType | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>(emptyBookingForm);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReasonId, setReportReasonId] = useState('');
  const [reportText, setReportText] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [ratingValue, setRatingValue] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomTypesError, setRoomTypesError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [commentMessage, setCommentMessage] = useState<string | null>(null);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    setRoomTypesError(null);

    Promise.all([getHotelById(id), getReportReasons()])
      .then(async ([item, reasons]) => {
        if (!active) return;
        setHotel(item);
        setReportReasons(reasons);
        if (!item) return;
        try {
          const rooms = await listHotelRoomTypes(id);
          if (active) setRoomTypes(rooms.filter((room) => room.status !== 'deleted' && room.isVisible !== false));
        } catch {
          if (active) setRoomTypesError('تعذر تحميل أنواع الغرف بسبب صلاحيات قاعدة البيانات.');
        }
      })
      .catch(() => {
        if (active) setError('تعذر تحميل الفندق بسبب صلاحيات قاعدة البيانات.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setCommentsLoading(true);
    setCommentsError(null);
    listHotelComments(id)
      .then((items) => { if (active) setComments(items); })
      .catch(() => { if (active) setCommentsError('تعذر تحميل التعليقات.'); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setRatingsLoading(true);
    setRatingsError(null);
    listHotelRatings(id)
      .then((items) => { if (active) setRatings(items); })
      .catch(() => { if (active) setRatingsError('تعذر تحميل التقييمات.'); })
      .finally(() => { if (active) setRatingsLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const ownRating = ratings.find((item) => item.userId === user.uid || item.id === user.uid);
    if (ownRating) setRatingValue(Number(ownRating.rating) || 0);
  }, [ratings, user]);

  const title = getHotelTitle(hotel);
  const image = getHotelImage(hotel);
  const gallery = useMemo(() => {
    if (!hotel) return [];
    return [image, ...(hotel.images || [])].filter((item, index, list): item is string => Boolean(item) && list.indexOf(item) === index);
  }, [hotel, image]);

  const openBooking = (room: HotelRoomType) => {
    setSelectedRoom(room);
    setBookingMessage(null);
    setBookingError(null);
    setBookingForm({
      ...emptyBookingForm,
      customerName: profile?.displayName || profile?.username || user?.displayName || '',
      customerPhone: profile?.phone || profile?.phoneNumber || '',
    });
  };

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !hotel || !selectedRoom || !user) return;
    setSubmittingBooking(true);
    setBookingError(null);
    setBookingMessage(null);
    try {
      await createHotelBooking({
        hotelId: id,
        hotelTitle: title,
        roomTypeId: selectedRoom.id,
        roomTypeTitle: roomTitle(selectedRoom),
        customerUserId: user.uid,
        customerName: bookingForm.customerName,
        customerPhone: bookingForm.customerPhone,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: Number(bookingForm.guests) || 1,
        customerNote: bookingForm.note,
        totalAmount: roomRawPrice(selectedRoom),
      });
      setBookingMessage('تم إرسال طلب الحجز بنجاح.');
    } catch {
      setBookingError('تعذر إرسال طلب الحجز.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !user) return;
    setSubmittingReport(true);
    setReportError(null);
    setReportMessage(null);
    try {
      await reportHotel({ hotelId: id, reporterId: user.uid, reasonId: reportReasonId, reasonText: reportText });
      setReportMessage('تم إرسال البلاغ بنجاح.');
      setReportText('');
      setReportReasonId('');
    } catch {
      setReportError('تعذر إرسال البلاغ.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !user || !commentText.trim()) return;
    setSubmittingComment(true);
    setCommentsError(null);
    setCommentMessage(null);
    try {
      await addHotelComment(id, {
        userId: user.uid,
        userName: profile?.username || profile?.displayName || user.displayName || user.email?.split('@')[0] || 'مستخدم',
        userPhotoURL: profile?.photoURL || user.photoURL || '',
        comment: commentText.trim(),
      });
      setComments(await listHotelComments(id));
      setCommentText('');
      setCommentOpen(false);
      setCommentMessage('تم إرسال تعليقك بنجاح.');
    } catch {
      setCommentsError('تعذر إرسال التعليق.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const submitRating = async () => {
    if (!id || !user || ratingValue < 1 || ratingValue > 5) return;
    setSubmittingRating(true);
    setRatingsError(null);
    setRatingMessage(null);
    try {
      await upsertHotelRating(id, user.uid, {
        userName: profile?.username || profile?.displayName || user.displayName || user.email?.split('@')[0] || 'مستخدم',
        rating: ratingValue,
      });
      setRatings(await listHotelRatings(id));
      setRatingMessage('تم إرسال تقييمك بنجاح.');
    } catch {
      setRatingsError('تعذر إرسال التقييم.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return <LoadingState label="جاري تحميل الفندق" />;
  if (error) return <EmptyState title="تعذر تحميل الفندق" description={error} />;
  if (!hotel) return <EmptyState title="لم يتم العثور على الفندق." />;

  const contact = getHotelContact(hotel);
  const price = getHotelPrice(hotel, roomTypes);
  const location = getHotelLocationLabel(hotel);
  const rules = String(hotel.rules || hotel.policy || hotel.policies || '').trim();
  const ratingSummary = getHotelRatingSummary(ratings);
  const canonicalPath = hotelPath(hotel);
  const seoDescription = hotel.description || `تفاصيل ${title} في ${location || 'Orbix'}.`;
  const hotelSchema = [
    { '@context': 'https://schema.org', '@type': 'Hotel', name: title, description: seoDescription, url: absoluteUrl(canonicalPath), image, address: { '@type': 'PostalAddress', addressLocality: hotel.city, streetAddress: hotel.address, addressCountry: hotel.country || hotel.countryCode || 'SA' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'الرئيسية', item: absoluteUrl('/') }, { '@type': 'ListItem', position: 2, name: 'الفنادق', item: absoluteUrl('/hotels') }, { '@type': 'ListItem', position: 3, name: title, item: absoluteUrl(canonicalPath) }] },
  ];

  return (
    <section className="hotel-details-shell hotel-details-page">
      <SEO title={`${title} | Orbix`} description={seoDescription} path={canonicalPath} image={image} type="article" jsonLd={hotelSchema} />
      <header className="hotel-details-appbar">
        <button type="button" className="hotel-details-back" onClick={() => navigate(-1)} aria-label="العودة">←</button>
        <h1 className="hotel-details-title">تفاصيل الفندق</h1>
        <span className="hotel-details-appbar-spacer" aria-hidden="true" />
      </header>

      <div className="hotel-details-content">
        <section className="hotel-section-card hotel-overview-card">
          <div className="hotel-gallery-card">
            <div className="details-main-image">
              {image ? <img src={image} alt={title} /> : <div className="image-placeholder">لا توجد صورة</div>}
            </div>
            {gallery.length > 1 && (
              <div className="thumbnail-row">
                {gallery.slice(0, 5).map((item) => <button key={item} type="button" aria-label={title}><img src={item} alt={title} /></button>)}
              </div>
            )}
          </div>
          <div className="hotel-summary-panel">
            <span className="eyebrow">الفنادق</span>
            <h2>{title}</h2>
            <div className="details-badges">
              {hotel.status && <StatusBadge status={hotel.status} />}
              {(hotel.isFeatured || hotel.featured || hotel.isDistinct) && <StatusBadge status="مميز" tone="success" />}
              {hotel.stars && <span className="chip">{hotel.stars} نجوم</span>}
              {hotel.rating && <span className="chip">تقييم {hotel.rating}</span>}
            </div>
            {location && <p className="details-location">⌖ {location}</p>}
            <div className="property-price">{price || 'السعر غير محدد'}</div>
          </div>
        </section>

        {(hotel.description || contact || hotel.address || rules) && (
          <section className="hotel-section-card hotel-information-card">
            {hotel.description && <div className="details-block"><h2>الوصف</h2><p>{hotel.description}</p></div>}
            {(contact || hotel.contact_name || hotel.address) && (
              <div className="details-block">
                <h2>معلومات التواصل</h2>
                <dl className="details-grid">
                  {hotel.contact_name && <div><dt>جهة الاتصال</dt><dd>{hotel.contact_name}</dd></div>}
                  {contact && <div><dt>رقم التواصل</dt><dd>{contact}</dd></div>}
                  {hotel.address && <div><dt>العنوان</dt><dd>{hotel.address}</dd></div>}
                </dl>
              </div>
            )}
            {rules && <div className="details-block"><h2>قواعد الفندق</h2><p>{rules}</p></div>}
          </section>
        )}

        <section className="hotel-section-card hotel-room-section">
          <div className="section-header compact">
            <div><h2>الغرف المتاحة</h2><p>اختر الغرفة المناسبة وأرسل طلب الحجز.</p></div>
          </div>
          {roomTypesError && <p className="notice">{roomTypesError}</p>}
          {!roomTypesError && roomTypes.length === 0 && <EmptyState title="لا توجد غرف متاحة حاليا." />}
          <div className="room-type-grid">
            {roomTypes.map((roomValue) => {
              const room = roomValue as RoomData;
              const imageUrl = roomImage(room);
              const panorama = roomPanorama(room);
              const preview = panorama || imageUrl;
              const features = roomFeatures(room);
              const availability = roomAvailability(room);
              const area = firstValue(room.area, room.size, room.squareMeters, room.square_meters);
              const bedrooms = firstValue(room.bedrooms, room.bedroom_count, room.beds);
              const bathrooms = firstValue(room.bathrooms, room.bathroom_count);
              const dailyPrice = firstValue(room.daily_price, room.dailyPrice, room.pricePerDay);
              const nightlyPrice = firstValue(room.nightly_price, room.nightlyPrice, room.pricePerNight, room.price_per_night, room.price);
              const dailyCurrency = firstValue(room.daily_price_currency, room.currency, room.priceCurrency);
              const nightlyCurrency = firstValue(room.nightly_currency, room.currency, room.priceCurrency);

              return (
                <article key={room.id} className="hotel-room-card">
                  <div className="hotel-room-panorama">
                    <div className="hotel-room-panorama-heading"><strong>جولة بانوراما 360</strong><span className="hotel-room-360-badge">360°</span></div>
                    {preview ? (
                      <div className="hotel-room-panorama-thumb"><img src={preview} alt={`جولة ${roomTitle(room)}`} /><span>الغرفة</span></div>
                    ) : <div className="hotel-room-panorama-empty">لا توجد جولة بانورامية لهذه الغرفة</div>}
                  </div>

                  <div className="hotel-room-heading">
                    <div><span className={`hotel-room-availability-badge ${availability.isAvailable ? 'is-available' : 'is-unavailable'}`}>{availability.isAvailable ? 'متاح' : 'غير متاح'}</span><h3>{roomTitle(room)}</h3></div>
                    {room.description && <p>{room.description}</p>}
                  </div>

                  {(area != null || bedrooms != null || bathrooms != null) && (
                    <div className="hotel-room-specs">
                      {area != null && <span><i>↔</i>{String(area)} متر مربع</span>}
                      {bedrooms != null && <span><i>▰</i>{String(bedrooms)} غرفة</span>}
                      {bathrooms != null && <span><i>◉</i>{String(bathrooms)} حمام</span>}
                    </div>
                  )}

                  <div className="hotel-room-features-box">
                    <h4>ميزات الغرفة</h4>
                    {features.length > 0 ? <div className="hotel-room-features">{features.map((feature) => <span className="hotel-room-feature-chip" key={feature}>✓ {feature}</span>)}</div> : <p>لا توجد ميزات مضافة لهذه الغرفة.</p>}
                  </div>

                  <div className="hotel-room-price-row">
                    <div className="hotel-room-price-card daily"><span>يومي</span><strong>{formatMoney(dailyPrice, dailyCurrency)}</strong></div>
                    <div className="hotel-room-price-card nightly"><span>ليلي</span><strong>{formatMoney(nightlyPrice, nightlyCurrency)}</strong></div>
                  </div>

                  <div className="hotel-room-availability-box">
                    <strong>{availability.total != null && availability.available != null ? `متاح: ${availability.available} من ${availability.total}` : availability.available != null ? `الغرف المتاحة: ${availability.available}` : 'تواصل مع الفندق للتحقق من التوفر'}</strong>
                  </div>

                  <button type="button" className="hotel-room-book-button" onClick={() => openBooking(room)} disabled={!availability.isAvailable}><span aria-hidden="true">▰</span> احجز الآن</button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="hotel-section-card hotel-comments-card">
          <div className="hotel-card-section-heading"><h2>تعليقات الزوار</h2><button type="button" onClick={() => setCommentOpen(true)}>أضف تعليقك</button></div>
          {commentsLoading && <p className="hotel-empty-feedback">جاري تحميل التعليقات...</p>}
          {commentsError && <p className="form-error">{commentsError}</p>}
          {commentMessage && <p className="form-success">{commentMessage}</p>}
          {!commentsLoading && !commentsError && comments.length === 0 && <div className="hotel-empty-feedback">لا توجد تعليقات بعد، كن أول من يعلق!</div>}
          {comments.length > 0 && (
            <div className="hotel-comment-list">
              {comments.map((comment) => (
                <article className="hotel-comment-item" key={comment.id}>
                  <div className="hotel-comment-avatar">
                    {comment.userPhotoURL ? <img src={comment.userPhotoURL} alt="" /> : <span>{String(comment.userName || 'م').charAt(0)}</span>}
                  </div>
                  <div>
                    <header><strong>{comment.userName || 'مستخدم'}</strong><time>{formatFeedbackDate(comment.updatedAt || comment.createdAt || comment.created_at)}</time></header>
                    <p>{comment.comment}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="hotel-section-card hotel-ratings-card">
          <h2>التقييمات</h2>
          {ratingsLoading ? <p className="hotel-empty-feedback">جاري تحميل التقييمات...</p> : (
            <div className="hotel-rating-summary">
                <div className="hotel-rating-stars" aria-label={`${ratingSummary.average.toFixed(1)} من 5`}>
                {[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= Math.round(ratingSummary.average) ? 'is-selected' : ''}>★</span>)}
              </div>
              <strong>{ratingSummary.count > 0 ? `${ratingSummary.average.toFixed(1)} من 5` : 'لا تقييمات بعد'}</strong>
              <span>{ratingSummary.count > 0 ? `بناء على ${ratingSummary.count} تقييم` : 'كن أول من يقيّم الفندق'}</span>
            </div>
          )}
          {ratingsError && <p className="form-error">{ratingsError}</p>}
          {ratingMessage && <p className="form-success">{ratingMessage}</p>}
          <div className="hotel-rating-action">
            {!isAuthenticated ? (
              <div className="hotel-login-prompt"><p>سجل الدخول لإضافة تقييم.</p><Button as={Link} to="/login" variant="outline">تسجيل الدخول</Button></div>
            ) : (
              <>
                <div className="hotel-stars-input" role="radiogroup" aria-label="اختر تقييما من 5" onMouseLeave={() => setHoveredRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" role="radio" aria-checked={ratingValue === star} aria-label={`${star} من 5`} onClick={() => setRatingValue(star)} onMouseEnter={() => setHoveredRating(star)} onFocus={() => setHoveredRating(star)} onBlur={() => setHoveredRating(0)} className={star <= (hoveredRating || ratingValue) ? 'is-selected' : ''}>★</button>
                  ))}
                </div>
                <Button type="button" onClick={submitRating} loading={submittingRating} disabled={ratingValue === 0}>إرسال التقييم</Button>
              </>
            )}
          </div>
          {ratings.length > 0 && (
            <div className="hotel-rating-list">
              {ratings.map((rating) => <div key={rating.id}><span className="hotel-rating-list-stars" aria-label={`${rating.rating} من 5`}>{[1, 2, 3, 4, 5].map((star) => <i key={star} className={star <= Number(rating.rating) ? 'is-selected' : ''}>★</i>)}</span><strong>{rating.userName || 'مستخدم'}</strong></div>)}
            </div>
          )}
        </section>

        <section className="hotel-report-section">
          <button type="button" className="hotel-report-button" onClick={() => setReportOpen(true)}><span aria-hidden="true">⚑</span> الإبلاغ عن هذا الفندق</button>
        </section>
      </div>

      {selectedRoom && (
        <div className="modal-backdrop" onClick={() => setSelectedRoom(null)}>
          <section className="modal-card hotel-action-modal" onClick={(event) => event.stopPropagation()} aria-label="طلب حجز فندق">
            <button type="button" className="modal-close" onClick={() => setSelectedRoom(null)} aria-label="إغلاق">×</button>
            <span className="eyebrow">طلب حجز</span><h2>{roomTitle(selectedRoom)}</h2>
            {!isAuthenticated ? <div className="modal-empty-state"><p>سجل الدخول لإرسال طلب حجز.</p><Button as={Link} to="/login">تسجيل الدخول</Button></div> : (
              <form className="form-stack" onSubmit={submitBooking}>
                <div className="form-grid">
                  <Input label="تاريخ الوصول" type="date" value={bookingForm.checkIn} onChange={(event) => setBookingForm((current) => ({ ...current, checkIn: event.target.value }))} />
                  <Input label="تاريخ المغادرة" type="date" value={bookingForm.checkOut} onChange={(event) => setBookingForm((current) => ({ ...current, checkOut: event.target.value }))} />
                  <Input label="عدد الضيوف" type="number" min="1" value={bookingForm.guests} onChange={(event) => setBookingForm((current) => ({ ...current, guests: event.target.value }))} />
                  <Input label="الاسم" value={bookingForm.customerName} onChange={(event) => setBookingForm((current) => ({ ...current, customerName: event.target.value }))} />
                  <Input label="رقم الهاتف" value={bookingForm.customerPhone} onChange={(event) => setBookingForm((current) => ({ ...current, customerPhone: event.target.value }))} />
                  <TextArea label="ملاحظات إضافية" value={bookingForm.note} onChange={(event) => setBookingForm((current) => ({ ...current, note: event.target.value }))} />
                </div>
                {bookingMessage && <div className="form-success">{bookingMessage}</div>}{bookingError && <div className="form-error">{bookingError}</div>}
                <Button type="submit" loading={submittingBooking}>إرسال طلب الحجز</Button>
              </form>
            )}
          </section>
        </div>
      )}

      {commentOpen && (
        <div className="modal-backdrop" onClick={() => setCommentOpen(false)}>
          <section className="modal-card hotel-action-modal" onClick={(event) => event.stopPropagation()} aria-label="إضافة تعليق">
            <button type="button" className="modal-close" onClick={() => setCommentOpen(false)} aria-label="إغلاق">×</button>
            <span className="eyebrow">تعليقات الزوار</span><h2>أضف تعليقك</h2>
            {!isAuthenticated ? (
              <div className="modal-empty-state"><p>سجل الدخول لإضافة تعليق.</p><Button as={Link} to="/login">تسجيل الدخول</Button></div>
            ) : (
              <form className="form-stack hotel-comment-form" onSubmit={submitComment}>
                <TextArea label="تعليقك" value={commentText} onChange={(event) => setCommentText(event.target.value)} required />
                {commentsError && <div className="form-error">{commentsError}</div>}
                <Button type="submit" loading={submittingComment} disabled={!commentText.trim()}>إرسال التعليق</Button>
              </form>
            )}
          </section>
        </div>
      )}

      {reportOpen && (
        <div className="modal-backdrop" onClick={() => setReportOpen(false)}>
          <section className="modal-card hotel-action-modal" onClick={(event) => event.stopPropagation()} aria-label="الإبلاغ عن الفندق">
            <button type="button" className="modal-close" onClick={() => setReportOpen(false)} aria-label="إغلاق">×</button>
            <span className="eyebrow">بلاغ</span><h2>الإبلاغ عن الفندق</h2>
            {!isAuthenticated ? <div className="modal-empty-state"><p>سجل الدخول لإرسال بلاغ.</p><Button as={Link} to="/login">تسجيل الدخول</Button></div> : (
              <form className="form-stack" onSubmit={submitReport}>
                <Select label="سبب البلاغ" value={reportReasonId} onChange={(event) => setReportReasonId(event.target.value)} options={[{ value: '', label: 'اختر السبب' }, ...reportReasons.map((reason) => ({ value: reason.id, label: reason.title || reason.label || reason.reason || reason.id }))]} />
                <TextArea label="اشرح سبب البلاغ" value={reportText} onChange={(event) => setReportText(event.target.value)} required />
                {reportMessage && <div className="form-success">{reportMessage}</div>}{reportError && <div className="form-error">{reportError}</div>}
                <Button type="submit" loading={submittingReport}>إرسال البلاغ</Button>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
