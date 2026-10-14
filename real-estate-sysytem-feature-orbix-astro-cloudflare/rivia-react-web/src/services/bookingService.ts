import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Property, UserBooking } from '../types/models';

function fromBookingDoc(id: string, data: Record<string, unknown>, docPath?: string, userId?: string): UserBooking {
  return {
    id,
    docPath,
    userId,
    ...(data as Omit<UserBooking, 'id'>),
  };
}

function bookingPayload(input: {
  bookingId: string;
  propertyId: string;
  propertyTitle?: string;
  propertyReference?: string;
  ownerUserId?: string;
  customerUserId: string;
  bookingType?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  preferredContactMethod?: string;
  checkIn?: unknown;
  checkOut?: unknown;
  guests?: number;
  customerNote?: string;
  totalAmount?: number | null;
  appointmentDate?: string;
  appointmentTime?: string;
  alternativeDate?: string;
  alternativeTime?: string;
  visitType?: string;
}) {
  return {
    bookingId: input.bookingId,
    bookingType: input.bookingType || 'property_booking',
    propertyId: input.propertyId,
    property_id: input.propertyId,
    propertyTitle: input.propertyTitle || '',
    property_title: input.propertyTitle || '',
    propertyReference: input.propertyReference || '',
    property_reference: input.propertyReference || '',
    ownerUserId: input.ownerUserId || '',
    customerUserId: input.customerUserId,
    customerName: input.customerName || '',
    customer_name: input.customerName || '',
    customerPhone: input.customerPhone || '',
    customer_phone: input.customerPhone || '',
    customerEmail: input.customerEmail || '',
    customer_email: input.customerEmail || '',
    preferredContactMethod: input.preferredContactMethod || 'phone',
    preferred_contact_method: input.preferredContactMethod || 'phone',
    checkIn: input.checkIn ?? '',
    check_in: input.checkIn ?? '',
    checkOut: input.checkOut ?? '',
    check_out: input.checkOut ?? '',
    guests: input.guests ?? 1,
    customerNote: input.customerNote || '',
    customer_note: input.customerNote || '',
    appointmentDate: input.appointmentDate || '',
    appointment_date: input.appointmentDate || '',
    appointmentTime: input.appointmentTime || '',
    appointment_time: input.appointmentTime || '',
    alternativeDate: input.alternativeDate || '',
    alternative_date: input.alternativeDate || '',
    alternativeTime: input.alternativeTime || '',
    alternative_time: input.alternativeTime || '',
    visitType: input.visitType || '',
    visit_type: input.visitType || '',
    status: 'pending',
    total_amount: input.totalAmount ?? '',
    totalAmount: input.totalAmount ?? '',
    created_at: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export type PropertyBookingInput = {
  propertyId: string;
  propertyTitle?: string;
  propertyReference?: string;
  ownerUserId?: string;
  customerUserId: string;
  bookingType?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  preferredContactMethod?: string;
  checkIn?: unknown;
  checkOut?: unknown;
  guests?: number;
  customerNote?: string;
  totalAmount?: number | null;
  appointmentDate?: string;
  appointmentTime?: string;
  alternativeDate?: string;
  alternativeTime?: string;
  visitType?: string;
};

export type HotelBookingInput = {
  hotelId: string;
  hotelTitle?: string;
  roomTypeId?: string;
  roomTypeTitle?: string;
  customerUserId: string;
  customerName?: string;
  customerPhone?: string;
  checkIn?: unknown;
  checkOut?: unknown;
  guests?: number;
  customerNote?: string;
  totalAmount?: number | null;
};

export type BookingCreationResult = {
  bookingId: string;
  userPath: string;
  propertyPath: string;
  userWriteSucceeded: boolean;
  propertyWriteSucceeded: boolean;
};

export async function getMyBookings(uid: string): Promise<UserBooking[]> {
  const snap = await getDocs(query(collection(db, 'users', uid, 'user_bookings'), limit(80)));
  return snap.docs.map((item) => fromBookingDoc(item.id, item.data(), item.ref.path, uid));
}

export async function getAllBookings(max = 120): Promise<UserBooking[]> {
  const snap = await getDocs(query(collectionGroup(db, 'user_bookings'), limit(max)));
  return snap.docs.map((item) => fromBookingDoc(item.id, item.data(), item.ref.path, item.ref.parent.parent?.id));
}

export async function createPropertyBooking(input: PropertyBookingInput): Promise<BookingCreationResult> {
  const bookingRef = doc(collection(db, 'users', input.customerUserId, 'user_bookings'));
  const payload = bookingPayload({
    bookingId: bookingRef.id,
    propertyId: input.propertyId,
    propertyTitle: input.propertyTitle,
    propertyReference: input.propertyReference,
    ownerUserId: input.ownerUserId,
    customerUserId: input.customerUserId,
    bookingType: input.bookingType,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    preferredContactMethod: input.preferredContactMethod,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    customerNote: input.customerNote,
    totalAmount: input.totalAmount,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    alternativeDate: input.alternativeDate,
    alternativeTime: input.alternativeTime,
    visitType: input.visitType,
  });

  await setDoc(bookingRef, payload);

  let propertyWriteSucceeded = false;
  try {
    await setDoc(doc(db, 'properties', input.propertyId, 'bookings', bookingRef.id), payload);
    propertyWriteSucceeded = true;
  } catch {
    propertyWriteSucceeded = false;
  }

  return {
    bookingId: bookingRef.id,
    userPath: bookingRef.path,
    propertyPath: `properties/${input.propertyId}/bookings/${bookingRef.id}`,
    userWriteSucceeded: true,
    propertyWriteSucceeded,
  };
}

export async function createHotelBooking(input: HotelBookingInput): Promise<BookingCreationResult> {
  const bookingRef = doc(collection(db, 'users', input.customerUserId, 'user_bookings'));
  const payload = {
    bookingId: bookingRef.id,
    bookingType: 'hotel',
    hotelId: input.hotelId,
    hotel_id: input.hotelId,
    hotelTitle: input.hotelTitle || '',
    hotel_title: input.hotelTitle || '',
    roomTypeId: input.roomTypeId || '',
    room_type_id: input.roomTypeId || '',
    roomTypeTitle: input.roomTypeTitle || '',
    room_type_title: input.roomTypeTitle || '',
    customerUserId: input.customerUserId,
    customerName: input.customerName || '',
    customer_name: input.customerName || '',
    customerPhone: input.customerPhone || '',
    customer_phone: input.customerPhone || '',
    checkIn: input.checkIn ?? '',
    check_in: input.checkIn ?? '',
    checkOut: input.checkOut ?? '',
    check_out: input.checkOut ?? '',
    guests: input.guests ?? 1,
    customerNote: input.customerNote || '',
    customer_note: input.customerNote || '',
    status: 'pending',
    total_amount: input.totalAmount ?? '',
    totalAmount: input.totalAmount ?? '',
    created_at: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(bookingRef, payload);

  return {
    bookingId: bookingRef.id,
    userPath: bookingRef.path,
    propertyPath: '',
    userWriteSucceeded: true,
    propertyWriteSucceeded: false,
  };
}

export async function createPurchaseFallbackBooking(input: PropertyBookingInput): Promise<BookingCreationResult> {
  const bookingRef = doc(collection(db, 'users', input.customerUserId, 'user_bookings'));
  const payload = bookingPayload({
    bookingId: bookingRef.id,
    propertyId: input.propertyId,
    propertyTitle: input.propertyTitle,
    propertyReference: input.propertyReference,
    ownerUserId: input.ownerUserId,
    customerUserId: input.customerUserId,
    bookingType: input.bookingType || 'purchase_request',
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    preferredContactMethod: input.preferredContactMethod,
    customerNote: input.customerNote,
    totalAmount: input.totalAmount,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    alternativeDate: input.alternativeDate,
    alternativeTime: input.alternativeTime,
    visitType: input.visitType,
  });

  await setDoc(bookingRef, payload);

  return {
    bookingId: bookingRef.id,
    userPath: bookingRef.path,
    propertyPath: `properties/${input.propertyId}/bookings/${bookingRef.id}`,
    userWriteSucceeded: true,
    propertyWriteSucceeded: false,
  };
}

export async function updateBookingFieldsByPath(path: string, fields: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, path), { ...fields, updatedAt: serverTimestamp() });
}

export async function updateBookingStatus(userId: string, bookingId: string, status: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'user_bookings', bookingId), { status, updatedAt: serverTimestamp() });
}

export async function updateBookingStatusByPath(path: string, status: string): Promise<void> {
  await updateDoc(doc(db, path), { status, updatedAt: serverTimestamp() });
}

export function getBookingType(booking: UserBooking): 'property' | 'hotel' {
  if (booking.bookingType === 'hotel' || booking.hotel_id || booking.room_type_id) return 'hotel';
  return 'property';
}

export function getBookingTitle(booking: UserBooking): string {
  return (
    booking.propertyTitle ||
    booking.property_title ||
    booking.hotelTitle ||
    booking.hotel_title ||
    booking.propertyId ||
    booking.property_id ||
    booking.hotel_id ||
    'حجز'
  );
}

export function normalizeBookingInput(property: Property | null, totalAmount?: number | null): number | null {
  if (totalAmount != null && Number.isFinite(totalAmount)) return totalAmount;
  const raw = property?.daily_price || property?.nightly_price || property?.rentPrice || property?.price || property?.selling_price || property?.salePrice;
  const parsed = Number(String(raw ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
