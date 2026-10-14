import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { fromPropertyDocData } from '../lib/propertySchema';
import type { Hotel, Property, ReportReason, TimestampLike, UserProfile } from '../types/models';

type RecordData = Record<string, unknown>;

export interface PendingAdminBooking extends RecordData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookingType: string;
  status: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyImage?: string;
  hotelId?: string;
  hotelTitle?: string;
  hotelImage?: string;
  roomTypeId?: string;
  roomTypeTitle?: string;
  checkIn?: TimestampLike;
  checkOut?: TimestampLike;
  guests?: number | string;
  totalAmount?: number | string;
  currency?: string;
}

export interface AdminListResult<T> {
  items: T[];
  warnings: string[];
}

export interface FeaturedAdminItem {
  id: string;
  source: 'properties' | 'hotels';
  title: string;
  image: string;
  type: string;
  price?: number | string;
  currency?: string;
  isDistinct: boolean;
}

export interface AdminContactSettings {
  countryCode: string;
  phone: string;
  email: string;
}

function firstString(...values: unknown[]): string {
  return values.find((value) => typeof value === 'string' && value.trim())?.toString().trim() || '';
}

function firstValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function imageFrom(data: RecordData): string {
  const images = Array.isArray(data.images) ? data.images.map(String) : [];
  return firstString(images[0], data.mainImage, data.imageUrl, data.image);
}

function isSaleBooking(data: RecordData): boolean {
  const value = firstString(data.booking_type, data.bookingType, data.listing_type, data.listingType, data.property_type).toLowerCase();
  return value.includes('sale') || value.includes('purchase') || value.includes('بيع') || value.includes('شراء');
}

function notificationPayload(title: string, message: string) {
  return { id: doc(collection(db, '_ids')).id, title, message, type: 'booking', read: false, created_at: serverTimestamp() };
}

async function enrichBooking(user: UserProfile, id: string, data: RecordData): Promise<PendingAdminBooking> {
  const propertyId = firstString(data.property_id, data.propertyId);
  const hotelId = firstString(data.hotel_id, data.hotelId);
  const roomTypeId = firstString(data.room_type_id, data.roomTypeId);
  let property: RecordData = {};
  let hotel: RecordData = {};

  if (propertyId) {
    const snap = await getDoc(doc(db, 'properties', propertyId));
    if (snap.exists()) property = fromPropertyDocData(snap.id, snap.data() as Record<string, unknown>);
  }
  if (hotelId) {
    const snap = await getDoc(doc(db, 'hotels', hotelId));
    if (snap.exists()) hotel = snap.data();
  }

  return {
    ...data,
    id,
    userId: user.uid,
    userName: firstString(data.customerName, data.customer_name, user.displayName, user.username, 'مستخدم'),
    userEmail: firstString(data.customerEmail, data.customer_email, user.email),
    userPhone: firstString(data.customerPhone, data.customer_phone, user.phone, user.phoneNumber, user.contact_number),
    bookingType: firstString(data.booking_type, data.bookingType, hotelId ? 'hotel' : isSaleBooking(data) ? 'sale' : 'rent'),
    status: firstString(data.status, 'pending'),
    propertyId: propertyId || undefined,
    propertyTitle: firstString(data.property_title, data.propertyTitle, property.title, property.name) || undefined,
    propertyImage: imageFrom(property) || undefined,
    hotelId: hotelId || undefined,
    hotelTitle: firstString(data.hotel_title, data.hotelTitle, hotel.hotel_name, hotel.title, hotel.name) || undefined,
    hotelImage: imageFrom(hotel) || undefined,
    roomTypeId: roomTypeId || undefined,
    roomTypeTitle: firstString(data.room_type_title, data.roomTypeTitle) || undefined,
    checkIn: firstValue(data.check_in, data.checkIn, data.startDate) as TimestampLike,
    checkOut: firstValue(data.check_out, data.checkOut, data.endDate) as TimestampLike,
    guests: firstValue(data.guests, data.guests_count) as number | string | undefined,
    totalAmount: firstValue(data.total_amount, data.totalAmount, data.price) as number | string | undefined,
    currency: firstString(data.currency, data.price_currency) || undefined,
  };
}

export async function listPendingAdminBookings(maxUsers = 250): Promise<AdminListResult<PendingAdminBooking>> {
  const warnings: string[] = [];
  const usersSnap = await getDocs(query(collection(db, 'users'), limit(maxUsers)));
  const users: UserProfile[] = usersSnap.docs.map((item) => ({ uid: item.id, ...(item.data() as Omit<UserProfile, 'uid'>) }));
  const settled = await Promise.allSettled(users.map(async (user) => {
    const snap = await getDocs(query(collection(db, 'users', user.uid, 'user_bookings'), where('status', '==', 'pending'), limit(100)));
    return Promise.all(snap.docs.map((item) => enrichBooking(user, item.id, item.data())));
  }));

  const items: PendingAdminBooking[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') items.push(...result.value);
    else {
      warnings.push(`تعذر قراءة حجوزات المستخدم ${users[index]?.email || users[index]?.uid}.`);
      if (import.meta.env.DEV) console.warn('[admin bookings] denied user_bookings query', users[index]?.uid, result.reason);
    }
  });
  return { items, warnings };
}

export async function confirmPendingBooking(item: PendingAdminBooking): Promise<void> {
  const batch = writeBatch(db);
  const bookingRef = doc(db, 'users', item.userId, 'user_bookings', item.id);
  batch.update(bookingRef, { status: 'confirmed', confirmed_at: serverTimestamp(), updatedAt: serverTimestamp() });

  if (item.hotelId && item.roomTypeId) {
    batch.set(doc(db, 'hotels', item.hotelId, 'room_types', item.roomTypeId, 'bookings', item.id), {
      ...item,
      status: 'confirmed',
      booking_id: item.id,
      user_id: item.userId,
      confirmed_at: serverTimestamp(),
    });
  } else if (item.propertyId && isSaleBooking(item)) {
    batch.update(doc(db, 'properties', item.propertyId), {
      availability: 'sold',
      selled_to_user_id: item.userId,
      selled_booking_id: item.id,
      selled_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else if (item.propertyId) {
    batch.set(doc(db, 'properties', item.propertyId, 'bookings', item.id), {
      bookingId: item.id,
      userId: item.userId,
      from: item.checkIn || null,
      to: item.checkOut || null,
      status: 'confirmed',
      created_at: serverTimestamp(),
    });
  }

  const noticeRef = doc(collection(db, 'users', item.userId, 'notifications'));
  batch.set(noticeRef, { ...notificationPayload('تم تأكيد الحجز', 'تمت الموافقة على طلب الحجز الخاص بك.'), id: noticeRef.id });
  await batch.commit();
}

export async function rejectPendingBooking(item: PendingAdminBooking, reason = ''): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', item.userId, 'user_bookings', item.id), {
    status: 'rejected',
    reject_reason: reason,
    rejected_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (item.hotelId && item.roomTypeId) {
    batch.update(doc(db, 'hotels', item.hotelId, 'room_types', item.roomTypeId), { available_count: increment(1) });
  }
  const noticeRef = doc(collection(db, 'users', item.userId, 'notifications'));
  batch.set(noticeRef, { ...notificationPayload('تم رفض الحجز', reason || 'تعذر قبول طلب الحجز الحالي.'), id: noticeRef.id });
  await batch.commit();
}

export async function sendAdminNotifications(users: UserProfile[], title: string, message: string, createdBy: string, createdByRole: string): Promise<number> {
  if (!users.length) return 0;
  for (let index = 0; index < users.length; index += 350) {
    const batch = writeBatch(db);
    users.slice(index, index + 350).forEach((user) => {
      const ref = doc(collection(db, 'users', user.uid, 'notifications'));
      batch.set(ref, { id: ref.id, title, message, type: 'custom', read: false, created_at: serverTimestamp() });
    });
    await batch.commit();
  }

  const tokens = users.map((user) => firstString(user.fcm_token, user.fcmToken)).filter(Boolean);
  for (let index = 0; index < tokens.length; index += 500) {
    await addDoc(collection(db, 'fcm_notification_requests'), {
      tokens: tokens.slice(index, index + 500),
      title,
      body: message,
      type: 'custom',
      status: 'pending',
      created_at: serverTimestamp(),
      created_by: createdBy,
      created_by_role: createdByRole,
    });
  }
  return users.length;
}

export async function listFeaturedAdminItems(): Promise<AdminListResult<FeaturedAdminItem>> {
  const warnings: string[] = [];
  const [propertyResult, hotelResult] = await Promise.allSettled([
    getDocs(query(collection(db, 'properties'), limit(250))),
    getDocs(query(collection(db, 'hotels'), limit(250))),
  ]);
  const items: FeaturedAdminItem[] = [];
  if (propertyResult.status === 'fulfilled') {
    propertyResult.value.docs.forEach((item) => {
      const data = fromPropertyDocData(item.id, item.data() as Record<string, unknown>);
      items.push({ id: item.id, source: 'properties', title: data.title || data.name || item.id, image: imageFrom(data), type: data.listingType || data.propertyType || data.property_type || 'عقار', price: firstValue(data.salePrice, data.rentPrice, data.selling_price, data.daily_price, data.price) as number | string, currency: data.currency || data.selling_price_currency || data.daily_price_currency, isDistinct: data.isFeatured === true || data.featured === true || data.isDistinct === true });
    });
  } else warnings.push('تعذر تحميل العقارات.');
  if (hotelResult.status === 'fulfilled') {
    hotelResult.value.docs.forEach((item) => {
      const data = item.data() as Hotel;
      items.push({ id: item.id, source: 'hotels', title: data.hotel_name || data.title || data.name || item.id, image: imageFrom(data), type: 'فندق', price: firstValue(data.pricePerNight, data.nightlyPrice, data.price) as number | string, currency: data.currency, isDistinct: data.isDistinct === true });
    });
  } else warnings.push('تعذر تحميل الفنادق.');
  return { items, warnings };
}

export async function toggleDistinctItem(item: FeaturedAdminItem): Promise<void> {
  const enabled = !item.isDistinct;
  await updateDoc(
    doc(db, item.source, item.id),
    item.source === 'properties'
      ? { isFeatured: enabled, featured: enabled, updatedAt: serverTimestamp() }
      : { isDistinct: enabled, updatedAt: serverTimestamp() },
  );
}

export async function setUserAdminRole(user: UserProfile, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', user.uid), enabled ? { role: 'admin' } : { role: deleteField() });
}

export async function getAdminContactSettings(): Promise<AdminContactSettings> {
  const snap = await getDoc(doc(db, 'settings', 'whatsapp_contact'));
  if (!snap.exists()) return { countryCode: '+963', phone: '', email: '' };
  const data = snap.data();
  return {
    countryCode: firstString(data.country_code, data.countryCode, '+963'),
    phone: firstString(data.phone, data.whatsapp, data.whatsappNumber, data.adminPhone),
    email: firstString(data.email, data.supportEmail),
  };
}

export async function saveAdminContactSettings(settings: AdminContactSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'whatsapp_contact'), {
    phone: settings.phone,
    country_code: settings.countryCode,
    email: settings.email,
    whatsapp: `${settings.countryCode}${settings.phone}`,
    whatsappNumber: `${settings.countryCode}${settings.phone}`,
    adminPhone: settings.phone,
    supportEmail: settings.email,
    updated_at: serverTimestamp(),
  }, { merge: true });
}

export async function listReportReasons(): Promise<ReportReason[]> {
  const snap = await getDocs(query(collection(db, 'report_reasons'), limit(100)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ReportReason, 'id'>) }));
}

export async function addReportReason(reason: string): Promise<void> {
  await addDoc(collection(db, 'report_reasons'), { reason, created_at: serverTimestamp() });
}

export async function updateReportReason(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'report_reasons', id), { reason, updatedAt: serverTimestamp() });
}

export async function deleteReportReason(id: string): Promise<void> {
  await deleteDoc(doc(db, 'report_reasons', id));
}

export async function listPropertiesForVisibility(): Promise<Property[]> {
  const snap = await getDocs(query(collection(db, 'properties'), limit(250)));
  return snap.docs.map((item) => fromPropertyDocData(item.id, item.data() as Record<string, unknown>));
}

export async function togglePropertyVisibility(property: Property): Promise<void> {
  await updateDoc(doc(db, 'properties', property.id), { isVisible: property.isVisible === false, updatedAt: serverTimestamp() });
}
