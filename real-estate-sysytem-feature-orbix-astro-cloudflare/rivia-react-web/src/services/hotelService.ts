import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadFile } from './storageService';
import type { Hotel, HotelRoomType } from '../types/models';

const HOTEL_WRITE_ERROR = 'تعذر حفظ الفندق بسبب صلاحيات قاعدة البيانات.';
const HOTEL_UPLOAD_ERROR = 'تعذر رفع صور الفندق بسبب صلاحيات التخزين.';

function safeFileName(file: File) {
  const cleaned = file.name.replace(/[^\w.-]+/g, '-');
  return `${Date.now()}-${cleaned}`;
}

function fromHotelDoc(id: string, data: Record<string, unknown>): Hotel {
  return {
    id,
    ...(data as Omit<Hotel, 'id'>),
    images: Array.isArray(data.images) ? data.images.map(String).filter(Boolean) : [],
  };
}

function fromRoomTypeDoc(id: string, data: Record<string, unknown>): HotelRoomType {
  return {
    id,
    ...(data as Omit<HotelRoomType, 'id'>),
    images: Array.isArray(data.images) ? data.images.map(String).filter(Boolean) : [],
  };
}

function isDeletedStatus(status?: string) {
  return String(status || '').trim().toLowerCase() === 'deleted';
}

export function getHotelTitle(hotel: Partial<Hotel> | null | undefined) {
  return hotel?.hotel_name || hotel?.name || hotel?.title || 'فندق بدون اسم';
}

export function getHotelImage(hotel: Partial<Hotel> | null | undefined) {
  return hotel?.images?.find(Boolean) || hotel?.imageUrl || hotel?.mainImage || '';
}

export function getHotelContact(hotel: Partial<Hotel> | null | undefined) {
  return hotel?.contact_number || hotel?.phone || hotel?.contactPhone || '';
}

export function getHotelCountryLabel(value?: string) {
  const normalized = String(value || '').trim().toUpperCase();
  const countries: Record<string, string> = {
    SYRIA: 'سوريا',
    SY: 'سوريا',
    LEBANON: 'لبنان',
    LB: 'لبنان',
    TURKEY: 'تركيا',
    TR: 'تركيا',
    JORDAN: 'الأردن',
    JO: 'الأردن',
  };
  return countries[normalized] || value || '';
}

export function getHotelLocationLabel(hotel: Partial<Hotel>) {
  return [getHotelCountryLabel(hotel.country || hotel.countryCode), hotel.city, hotel.address].filter(Boolean).join('، ');
}

export function getHotelPrice(hotel: Partial<Hotel>, roomTypes: HotelRoomType[] = []) {
  const roomPrice = roomTypes
    .map((room) => room.price_per_night || room.pricePerNight || room.nightlyPrice || room.price)
    .find((value) => value !== undefined && value !== null && value !== '');
  const rawPrice = roomPrice || hotel.pricePerNight || hotel.nightlyPrice || hotel.price_per_night || hotel.price;
  if (!rawPrice) return '';
  const currency = hotel.currency || roomTypes.find((room) => room.currency)?.currency || '';
  return `${new Intl.NumberFormat('ar').format(Number(rawPrice) || 0)} ${currency}`.trim();
}

export function isHotelPubliclyVisible(hotel: Hotel) {
  if (isDeletedStatus(hotel.status)) return false;
  if (hotel.isVisible === false) return false;
  if (hotel.status === 'approved') return true;
  if (hotel.isApproved === true) return true;
  return Boolean(getHotelTitle(hotel));
}

async function uploadHotelImages(hotelId: string, imageFiles?: File[]) {
  if (!imageFiles?.length) return [];
  try {
    return await Promise.all(imageFiles.map((file) => uploadFile(`hotels/${hotelId}/images/${safeFileName(file)}`, file)));
  } catch {
    throw new Error(HOTEL_UPLOAD_ERROR);
  }
}

function hotelPayload(data: Partial<Hotel>, imageUrls: string[] = []) {
  const title = data.hotel_name || data.name || data.title || '';
  const images = [...(Array.isArray(data.images) ? data.images.filter(Boolean) : []), ...imageUrls];
  return {
    ...data,
    hotel_name: title,
    name: data.name || title,
    title: data.title || title,
    contact_name: data.contact_name || data.contactName || '',
    contact_number: data.contact_number || data.phone || '',
    images,
    updatedAt: serverTimestamp(),
  };
}

export async function listVisibleHotels(max = 12): Promise<Hotel[]> {
  const snap = await getDocs(query(collection(db, 'hotels'), limit(max)));
  return snap.docs.map((item) => fromHotelDoc(item.id, item.data())).filter(isHotelPubliclyVisible);
}

export const getVisibleHotels = listVisibleHotels;

export async function listHotelsForAdmin(max = 120): Promise<Hotel[]> {
  const snap = await getDocs(query(collection(db, 'hotels'), limit(max)));
  return snap.docs.map((item) => fromHotelDoc(item.id, item.data()));
}

export const getHotels = listHotelsForAdmin;

export async function getHotelById(id: string): Promise<Hotel | null> {
  const snap = await getDoc(doc(db, 'hotels', id));
  if (!snap.exists()) return null;
  return fromHotelDoc(snap.id, snap.data());
}

export async function createHotel(data: Partial<Hotel>, imageFiles?: File[]): Promise<string> {
  const hotelRef = doc(collection(db, 'hotels'));
  const imageUrls = await uploadHotelImages(hotelRef.id, imageFiles);
  try {
    await setDoc(hotelRef, {
      ...hotelPayload(data, imageUrls),
      id: hotelRef.id,
      created_at: serverTimestamp(),
    });
    return hotelRef.id;
  } catch {
    throw new Error(HOTEL_WRITE_ERROR);
  }
}

export async function updateHotel(id: string, data: Partial<Hotel>, imageFiles?: File[]): Promise<void> {
  const imageUrls = await uploadHotelImages(id, imageFiles);
  try {
    await updateDoc(doc(db, 'hotels', id), hotelPayload(data, imageUrls));
  } catch {
    throw new Error(HOTEL_WRITE_ERROR);
  }
}

export async function updateHotelFields(id: string, fields: Partial<Hotel>): Promise<void> {
  await updateHotel(id, fields);
}

export async function hideHotel(id: string): Promise<void> {
  await updateHotel(id, { isVisible: false });
}

export async function showHotel(id: string): Promise<void> {
  await updateHotel(id, { isVisible: true, status: 'approved', isApproved: true });
}

export async function softDeleteHotel(id: string): Promise<void> {
  await updateHotel(id, { status: 'deleted', isVisible: false });
}

export async function toggleHotelFeatured(id: string, value: boolean): Promise<void> {
  await updateHotel(id, { isFeatured: value, featured: value, isDistinct: value });
}

export async function listHotelRoomTypes(hotelId: string): Promise<HotelRoomType[]> {
  const snap = await getDocs(query(collection(db, 'hotels', hotelId, 'room_types'), limit(80)));
  return snap.docs.map((item) => fromRoomTypeDoc(item.id, item.data()));
}

export async function createRoomType(hotelId: string, data: Partial<HotelRoomType>): Promise<string> {
  const roomRef = doc(collection(db, 'hotels', hotelId, 'room_types'));
  try {
    await setDoc(roomRef, { ...data, id: roomRef.id, created_at: serverTimestamp(), updatedAt: serverTimestamp() });
    return roomRef.id;
  } catch {
    throw new Error(HOTEL_WRITE_ERROR);
  }
}

export async function updateRoomType(hotelId: string, roomTypeId: string, data: Partial<HotelRoomType>): Promise<void> {
  try {
    await updateDoc(doc(db, 'hotels', hotelId, 'room_types', roomTypeId), { ...data, updatedAt: serverTimestamp() });
  } catch {
    throw new Error(HOTEL_WRITE_ERROR);
  }
}

export async function deleteRoomType(hotelId: string, roomTypeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'hotels', hotelId, 'room_types', roomTypeId));
  } catch {
    throw new Error(HOTEL_WRITE_ERROR);
  }
}
