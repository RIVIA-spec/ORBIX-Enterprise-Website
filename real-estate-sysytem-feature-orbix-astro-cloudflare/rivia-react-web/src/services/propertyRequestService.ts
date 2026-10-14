import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { toCanonicalPropertyRequest, toCanonicalPropertyWrite } from '../lib/propertySchema';
import { getRequestTour, savePropertyTour } from './tourService';
import type { Category, LocationLike, PropertyRequest } from '../types/models';

export type PropertyApprovalOptions = {
  featured?: boolean;
  featuredDays?: string;
  featuredOrder?: string;
  featuredNote?: string;
};

function fromRequestDoc(id: string, data: Record<string, unknown>): PropertyRequest {
  return {
    id,
    ...(data as Omit<PropertyRequest, 'id'>),
    features: Array.isArray(data.features) ? data.features.map(String) : undefined,
    images: Array.isArray(data.images) ? data.images.map(String) : undefined,
  };
}

async function withRequestTour(request: PropertyRequest): Promise<PropertyRequest> {
  if (request.panorama_tour) return request;
  try {
    const tour = await getRequestTour(request.id);
    return tour ? { ...request, panorama_tour: tour } : request;
  } catch {
    return request;
  }
}

function getCoordinateAliases(request: PropertyRequest): Partial<PropertyRequest> {
  const location = (request.location || {}) as LocationLike;
  const latitude = request.latitude ?? request.lat ?? location.latitude ?? location.lat;
  const longitude = request.longitude ?? request.lng ?? location.longitude ?? location.lng;
  if (latitude == null || latitude === '' || longitude == null || longitude === '') return {};

  return {
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    location: {
      ...location,
      country: request.country ?? location.country,
      countryCode: request.countryCode ?? location.countryCode,
      city: request.city ?? location.city,
      address: request.address ?? location.address,
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
    },
  };
}

export async function createPropertyRequest(input: Omit<PropertyRequest, 'id' | 'created_at' | 'updatedAt'>) {
  return addDoc(collection(db, 'property_requests'), {
    ...toCanonicalPropertyRequest(input),
    status: 'pending',
    request_type: input.request_type || 'publish',
    created_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getMyPropertyRequests(uid: string): Promise<PropertyRequest[]> {
  const snap = await getDocs(query(collection(db, 'property_requests'), where('ownerId', '==', uid), limit(60)));
  return Promise.all(snap.docs.map((item) => withRequestTour(fromRequestDoc(item.id, item.data()))));
}

export async function getPendingPropertyRequests(max = 80): Promise<PropertyRequest[]> {
  const snap = await getDocs(query(collection(db, 'property_requests'), where('status', '==', 'pending'), limit(max)));
  return Promise.all(snap.docs.map((item) => withRequestTour(fromRequestDoc(item.id, item.data()))));
}

export async function getPropertyRequests(max = 120): Promise<PropertyRequest[]> {
  const snap = await getDocs(query(collection(db, 'property_requests'), limit(max)));
  return Promise.all(snap.docs.map((item) => withRequestTour(fromRequestDoc(item.id, item.data()))));
}

export async function approvePropertyRequest(request: PropertyRequest, adminUid: string, options: PropertyApprovalOptions = {}): Promise<void> {
  const requestRef = doc(db, 'property_requests', request.id);
  const propertyRef = request.request_type === 'edit' && request.originalPropertyId ? doc(db, 'properties', request.originalPropertyId) : doc(collection(db, 'properties'));
  const { id: _id, approvedAt: _approvedAt, approvedBy: _approvedBy, rejectedAt: _rejectedAt, rejectedBy: _rejectedBy, rejectionReason: _rejectionReason, ...propertyData } = request;
  const requestTour = request.panorama_tour || (await getRequestTour(request.id).catch(() => null));
  const coordinateAliases = getCoordinateAliases(request);
  const featuredDays = Number(options.featuredDays || '');
  const featuredUntil = Number.isFinite(featuredDays) && featuredDays > 0 ? new Date(Date.now() + featuredDays * 24 * 60 * 60 * 1000) : null;
  const featuredOrder = Number(options.featuredOrder || '');
  const featuredFields = options.featured
    ? {
        isFeatured: true,
        featured: true,
        featuredStartedAt: serverTimestamp(),
        featuredUntil,
        featuredBy: adminUid,
        featuredPlan: 'manual',
        featuredNote: options.featuredNote || '',
        featuredOrder: Number.isFinite(featuredOrder) ? featuredOrder : null,
        promotionStatus: 'active',
        promotionType: 'manual',
      }
    : {};

  await setDoc(propertyRef, {
    ...toCanonicalPropertyWrite({
      ...propertyData,
      ...coordinateAliases,
      ...(requestTour ? { panorama_tour: requestTour } : {}),
    }),
    ...featuredFields,
    status: 'approved',
    isVisible: true,
    updatedAt: serverTimestamp(),
  }, { merge: request.request_type === 'edit' });

  if (requestTour) {
    await savePropertyTour(propertyRef.id, requestTour).catch((error) => {
      if (import.meta.env.DEV) {
        console.warn('Unable to write panorama_tour/main. Inline panorama_tour was preserved on property document.', error);
      }
    });
  }

  await updateDoc(requestRef, {
    status: 'approved',
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectPropertyRequest(requestId: string, adminUid: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'property_requests', requestId), {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
    rejectedBy: adminUid,
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
}

export async function getPropertyCategories(): Promise<Category[]> {
  const snap = await getDocs(query(collection(db, 'property_category'), limit(100)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Category, 'id'>) }));
}

export async function getGlobalFeatures(): Promise<string[]> {
  const snap = await getDoc(doc(db, 'features', 'global'));
  if (!snap.exists()) return [];
  const data = snap.data();
  return [data.list, data.values, data.items, data.features]
    .find((items): items is string[] => Array.isArray(items))
    ?.map(String)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}
