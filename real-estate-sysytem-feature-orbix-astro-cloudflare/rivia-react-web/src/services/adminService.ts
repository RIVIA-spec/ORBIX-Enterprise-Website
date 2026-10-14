import { collection, collectionGroup, doc, getDocs, limit, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AdminStats, Property, PropertyRequest, Report, UserProfile } from '../types/models';

type AdminRecord = Record<string, unknown> & { id: string };
type UserProfileUpdate = Partial<UserProfile> & Record<string, unknown>;

const restrictedUserFields = new Set([
  'role',
  'userRole',
  'user_role',
  'accountType',
  'isAdmin',
  'isOwner',
  'isAppOwner',
  'isStaff',
  'staff',
  'permissions',
]);

export const allowedOwnUserProfileFields = [
  'username',
  'displayName',
  'phone',
  'phoneNumber',
  'photoURL',
] as const;

export function sanitizeOwnUserProfileUpdate(fields: UserProfileUpdate): UserProfileUpdate {
  const allowed = new Set<string>(allowedOwnUserProfileFields);
  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => allowed.has(key) && !restrictedUserFields.has(key) && value !== undefined),
  ) as UserProfileUpdate;
}

async function loadCollection(name: string, max = 300): Promise<AdminRecord[]> {
  const snap = await getDocs(query(collection(db, name), limit(max)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function loadBookingRecords(max = 300): Promise<AdminRecord[]> {
  try {
    const snap = await getDocs(query(collectionGroup(db, 'user_bookings'), limit(max)));
    return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (groupError) {
    if (import.meta.env.DEV) console.warn('[admin dashboard] collectionGroup user_bookings denied; using Flutter user scan', groupError);
    const users = await getDocs(query(collection(db, 'users'), limit(250)));
    const settled = await Promise.allSettled(users.docs.map(async (user) => {
      const snap = await getDocs(query(collection(db, 'users', user.id, 'user_bookings'), limit(100)));
      return snap.docs.map((item) => ({ id: item.id, userId: user.id, ...item.data() }));
    }));
    return settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  }
}

function settledValue(result: PromiseSettledResult<AdminRecord[]>, warning: string, warnings: string[]): AdminRecord[] {
  if (result.status === 'fulfilled') return result.value;
  warnings.push(warning);
  if (import.meta.env.DEV) console.warn(`[admin dashboard] ${warning}`, result.reason);
  return [];
}

export async function getAdminStats(): Promise<AdminStats> {
  const warnings: string[] = [];
  const results = await Promise.allSettled([
    loadCollection('users'), loadCollection('properties'), loadCollection('property_requests'), loadBookingRecords(),
    loadCollection('property_reports'), loadCollection('hotel_reports'), loadCollection('hotels'), loadCollection('ads'), loadCollection('verifications'),
  ]);
  const userRecords = settledValue(results[0], 'تعذر تحميل إحصاءات المستخدمين.', warnings);
  const users: UserProfile[] = userRecords.map(({ id, ...data }) => ({ uid: id, ...(data as Omit<UserProfile, 'uid'>) }));
  const properties = settledValue(results[1], 'تعذر تحميل إحصاءات العقارات.', warnings) as unknown as Property[];
  const requests = settledValue(results[2], 'تعذر تحميل طلبات العقارات.', warnings) as unknown as PropertyRequest[];
  const bookings = settledValue(results[3], 'تعذر تحميل إحصاءات الحجوزات.', warnings);
  const propertyReports = settledValue(results[4], 'تعذر تحميل بلاغات العقارات.', warnings).map((item) => ({ ...item, type: 'property' })) as unknown as Report[];
  const hotelReports = settledValue(results[5], 'تعذر تحميل بلاغات الفنادق.', warnings).map((item) => ({ ...item, type: 'hotel' })) as unknown as Report[];
  const hotels = settledValue(results[6], 'تعذر تحميل إحصاءات الفنادق.', warnings);
  const ads = settledValue(results[7], 'تعذر تحميل إحصاءات الإعلانات.', warnings);
  const verifications = settledValue(results[8], 'تعذر تحميل طلبات تحقق الهوية.', warnings);
  const unresolvedReports = [...propertyReports, ...hotelReports].filter((item) => !item.status || ['pending', 'open'].includes(item.status));
  const pendingBookings = bookings.filter((item) => String(item.status || '').toLowerCase() === 'pending');
  return {
    users: users.length, activeUsers: users.filter((item) => item.isActive !== false).length, verifiedUsers: users.filter((item) => item.isVerified === true).length,
    properties: properties.length, visibleProperties: properties.filter((item) => item.isVisible === true).length,
    pendingPropertyRequests: requests.filter((item) => item.status === 'pending').length,
    approvedPropertyRequests: requests.filter((item) => item.status === 'approved').length,
    rejectedPropertyRequests: requests.filter((item) => item.status === 'rejected').length,
    pendingVerifications: verifications.filter((item) => !item.status || ['pending', 'open'].includes(String(item.status).toLowerCase())).length,
    pendingRoomBookings: pendingBookings.length, bookings: bookings.length,
    propertyReports: propertyReports.length, hotelReports: hotelReports.length, hotels: hotels.length, ads: ads.length,
    recentPropertyRequests: requests.slice(0, 5), recentReports: unresolvedReports.slice(0, 5), recentUsers: users.slice(0, 5), warnings,
  };
}

export async function getUsers(max = 120): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, 'users'), limit(max)));
  return snap.docs.map((item) => ({ uid: item.id, ...(item.data() as Omit<UserProfile, 'uid'>) }));
}

export async function updateOwnUserProfileFields(uid: string, fields: UserProfileUpdate): Promise<void> {
  const sanitizedFields = sanitizeOwnUserProfileUpdate(fields);
  if (Object.keys(sanitizedFields).length === 0) return;
  await updateDoc(doc(db, 'users', uid), sanitizedFields);
}

export async function updateUserRoleField(uid: string, role: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function getReports(collectionName: 'property_reports' | 'hotel_reports', max = 100): Promise<Report[]> {
  const snap = await getDocs(query(collection(db, collectionName), limit(max)));
  return snap.docs.map((item) => ({ id: item.id, type: collectionName === 'property_reports' ? 'property' : 'hotel', ...(item.data() as Omit<Report, 'id'>) }));
}

export async function updateReportStatus(collectionName: 'property_reports' | 'hotel_reports', reportId: string, status: string): Promise<void> {
  await updateDoc(doc(db, collectionName, reportId), { status });
}
