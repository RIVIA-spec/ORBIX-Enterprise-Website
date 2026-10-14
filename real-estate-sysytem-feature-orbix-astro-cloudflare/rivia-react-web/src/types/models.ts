export type TimestampLike =
  | Date
  | {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
    }
  | string
  | number
  | null
  | undefined;

export interface LocationLike {
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface UserProfile {
  uid: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  role?: 'owner' | 'admin' | 'user' | string;
  isActive?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  emailVerified?: boolean;
  created_at?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  deactivation_reason?: string;
  [key: string]: unknown;
}

export interface Property extends LocationLike {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  city?: string;
  country?: string;
  address?: string;
  type?: string;
  category?: string;
  property_type?: string;
  propertyType?: string;
  listing_type?: string;
  listingType?: string;
  property_category_id?: string;
  property_category_title?: string;
  price?: number | string;
  daily_price?: number | string;
  dailyPrice?: number | string;
  nightly_price?: number | string;
  nightlyPrice?: number | string;
  monthly_price?: number | string;
  weekly_price?: number | string;
  weeklyPrice?: number | string;
  yearly_price?: number | string;
  selling_price?: number | string;
  sellingPrice?: number | string;
  rentPrice?: number | string;
  salePrice?: number | string;
  currency?: string;
  daily_price_currency?: string;
  nightly_currency?: string;
  selling_price_currency?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  area?: number | string;
  features?: string[];
  images?: string[];
  imageUrl?: string;
  mainImage?: string;
  status?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  isDistinct?: boolean;
  featured?: boolean | string;
  featuredUntil?: TimestampLike;
  featuredStartedAt?: TimestampLike;
  featuredBy?: string;
  featuredPlan?: string;
  featuredNote?: string;
  featuredOrder?: number | string;
  promotionStatus?: 'active' | 'expired' | 'pending' | 'cancelled' | string;
  promotionType?: 'manual' | 'paid' | string;
  ownerId?: string;
  organizationId?: string;
  branchId?: string;
  assignedAgentId?: string;
  ownerUserId?: string;
  userId?: string;
  createdBy?: string;
  postedBy?: string;
  ownerUid?: string;
  created_by?: string;
  propertyCode?: string;
  referenceId?: string;
  listingId?: string;
  code?: string;
  ownerName?: string;
  ownerPhone?: string;
  contact_name?: string;
  contact_number?: string;
  contactPhone?: string;
  phone?: string;
  created_at?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  location?: LocationLike;
  panorama_tour?: PropertyPanorama;
  panoramaTour?: PropertyPanorama;
  panoramaTours?: PropertyPanorama;
  [key: string]: unknown;
}

export interface Hotel extends LocationLike {
  id: string;
  hotel_name?: string;
  name?: string;
  title?: string;
  description?: string;
  contact_name?: string;
  contactName?: string;
  contact_number?: string;
  phone?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  images?: string[];
  imageUrl?: string;
  mainImage?: string;
  created_at?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  status?: string;
  isVisible?: boolean;
  isApproved?: boolean;
  isFeatured?: boolean;
  featured?: boolean | string;
  isDistinct?: boolean;
  room_types?: HotelRoomType[];
  price?: number | string;
  pricePerNight?: number | string;
  nightlyPrice?: number | string;
  price_per_night?: number | string;
  currency?: string;
  stars?: number | string;
  rating?: number | string;
  availableRooms?: number | string;
  roomsCount?: number | string;
  ownerId?: string;
  contactPhone?: string;
  location?: LocationLike;
  [key: string]: unknown;
}

export interface HotelRoomType {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  price_per_night?: number | string;
  pricePerNight?: number | string;
  nightlyPrice?: number | string;
  currency?: string;
  total_count?: number | string;
  totalCount?: number | string;
  available_count?: number | string;
  availableCount?: number | string;
  capacity?: number | string;
  images?: string[];
  imageUrl?: string;
  mainImage?: string;
  isVisible?: boolean;
  status?: string;
  created_at?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Favorite {
  id: string;
  propertyId?: string;
  property_id?: string;
  added_at?: TimestampLike;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  [key: string]: unknown;
}

export interface PropertyRequest extends LocationLike {
  id: string;
  title?: string;
  description?: string;
  property_type?: string;
  city?: string;
  country?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  area?: number | string;
  bathrooms?: number | string;
  bedrooms?: number | string;
  features?: string[];
  images?: string[];
  mainImage?: string;
  property_category_id?: string;
  property_category_title?: string;
  contact_number?: string;
  contact_name?: string;
  ownerId?: string;
  organizationId?: string;
  branchId?: string;
  assignedAgentId?: string;
  status?: string;
  request_type?: 'publish' | 'edit' | string;
  originalPropertyId?: string;
  approvedAt?: TimestampLike;
  approvedBy?: string;
  rejectedAt?: TimestampLike;
  rejectedBy?: string;
  rejectionReason?: string;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  panorama_tour?: PropertyPanorama;
  [key: string]: unknown;
}

export interface Verification {
  id: string;
  userId?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  frontIdUrl?: string;
  backIdUrl?: string;
  rejectedReason?: string;
  rejectionReason?: string;
  submittedAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  created_at?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface UserBooking extends LocationLike {
  id: string;
  bookingId?: string;
  docPath?: string;
  userId?: string;
  propertyId?: string;
  property_id?: string;
  propertyTitle?: string;
  property_title?: string;
  propertyReference?: string;
  property_reference?: string;
  hotelId?: string;
  hotel_id?: string;
  hotelTitle?: string;
  hotel_title?: string;
  roomTypeId?: string;
  room_type_id?: string;
  roomTypeTitle?: string;
  room_type_title?: string;
  customerUserId?: string;
  ownerUserId?: string;
  status?: string;
  bookingType?: 'property' | 'hotel' | string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  preferredContactMethod?: string;
  preferred_contact_method?: string;
  appointmentDate?: string;
  appointment_date?: string;
  appointmentTime?: string;
  appointment_time?: string;
  alternativeDate?: string;
  alternative_date?: string;
  alternativeTime?: string;
  alternative_time?: string;
  visitType?: string;
  visit_type?: string;
  checkIn?: TimestampLike | string;
  check_in?: TimestampLike | string;
  checkOut?: TimestampLike | string;
  check_out?: TimestampLike | string;
  guests?: number | string;
  customerNote?: string;
  total_amount?: number | string;
  totalAmount?: number | string;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Deal {
  id: string;
  dealId?: string;
  docPath?: string;
  propertyId?: string;
  property_id?: string;
  propertyTitle?: string;
  property_title?: string;
  propertyReference?: string;
  property_reference?: string;
  listingType?: string;
  dealType?: string;
  customerUserId?: string;
  ownerUserId?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  customerEmail?: string;
  customer_email?: string;
  preferredContactMethod?: string;
  preferred_contact_method?: string;
  purchaseIntent?: string;
  purchase_intent?: string;
  proposedPrice?: number | string;
  proposed_price?: number | string;
  totalAmount?: number | string;
  total_amount?: number | string;
  commissionTypeTitle?: string;
  contractStatus?: string;
  paymentStatus?: string;
  status?: string;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Invoice {
  id: string;
  invoiceId?: string;
  docPath?: string;
  dealId?: string;
  deal_id?: string;
  customerUserId?: string;
  ownerUserId?: string;
  amount?: number | string;
  totalAmount?: number | string;
  status?: string;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Contract {
  id: string;
  contractId?: string;
  docPath?: string;
  dealId?: string;
  deal_id?: string;
  propertyId?: string;
  property_id?: string;
  customerUserId?: string;
  ownerUserId?: string;
  templateType?: string;
  status?: string;
  signingUrl?: string;
  signingUrls?: string[];
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface AdminStats {
  users: number;
  activeUsers: number;
  verifiedUsers: number;
  properties: number;
  visibleProperties: number;
  pendingPropertyRequests: number;
  approvedPropertyRequests: number;
  rejectedPropertyRequests: number;
  pendingVerifications?: number;
  pendingRoomBookings?: number;
  hotels: number;
  ads: number;
  propertyReports: number;
  hotelReports: number;
  bookings: number;
  deals?: number;
  invoices?: number;
  contracts?: number;
  recentPropertyRequests?: PropertyRequest[];
  recentReports?: Report[];
  recentUsers?: UserProfile[];
  warnings?: string[];
}

export interface Report {
  id: string;
  type?: string;
  targetId?: string;
  target_id?: string;
  propertyId?: string;
  property_id?: string;
  hotelId?: string;
  hotel_id?: string;
  reporterId?: string;
  reporter_id?: string;
  reason_text?: string;
  reason?: string;
  status?: string;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Ad {
  id: string;
  title?: string;
  imageUrl?: string;
  link?: string;
  order?: number | string;
  isActive?: boolean;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export type HeroSlide = {
  id: string;
  imageUrl: string;
  storagePath?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  linkLabel?: string;
  linkUrl?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  updatedBy?: string;
};

export interface Category {
  id: string;
  title?: string;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface Feature {
  id: string;
  list?: string[];
  title?: string;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface ReportReason {
  id: string;
  title?: string;
  label?: string;
  reason?: string;
  createdAt?: TimestampLike;
  [key: string]: unknown;
}

export interface PropertyComment {
  id: string;
  userId?: string;
  userName?: string;
  comment?: string;
  hasBooked?: boolean;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  [key: string]: unknown;
}

export interface PropertyRating {
  id: string;
  userId?: string;
  rating?: number | string;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  [key: string]: unknown;
}

export interface HotelComment extends PropertyComment {
  hotelId?: string;
  userPhotoURL?: string;
  status?: string;
  updatedAt?: TimestampLike;
}

export interface HotelRating extends PropertyRating {
  hotelId?: string;
  userName?: string;
  review?: string;
}

export interface TourHotspotTarget {
  label?: string;
  long?: number | string;
  lat?: number | string;
  sceneId?: string;
  targetSceneId?: string;
  target_scene_id?: string;
  targetScene?: string;
  target_scene?: string;
}

export interface TourHotspot {
  targetIndex?: string;
  targetSceneId?: string;
  target_scene_id?: string;
  targetScene?: string;
  target_scene?: string;
  label?: string;
  long?: number | string;
  lat?: number | string;
  yaw?: number | string;
  pitch?: number | string;
  x?: number | string;
  y?: number | string;
  sceneId?: string;
  scene_id?: string;
  target?: TourHotspotTarget;
  [key: string]: unknown;
}

export interface TourScene {
  id?: string;
  name?: string;
  title?: string;
  roomName?: string;
  roomLabel?: string;
  description?: string;
  order?: number;
  path?: string;
  url?: string;
  image?: string;
  imageUrl?: string;
  panoramaUrl?: string;
  isNetwork?: boolean;
  buttons?: Array<Record<string, TourHotspotTarget>>;
  hotspots?: TourHotspot[];
  nextSceneId?: string;
  targetSceneId?: string;
  [key: string]: unknown;
}

export interface PropertyPanorama {
  id?: string;
  title?: string;
  hasTour?: boolean;
  mainImage?: string;
  images?: Array<string | TourScene>;
  imageUrls?: string[];
  scenes?: TourScene[];
  panoramas?: TourScene[];
  panorama_tours?: TourScene[];
  rooms?: TourScene[];
  buttons?: Array<Record<string, TourHotspotTarget>>;
  hotspots?: TourHotspot[];
  panorama_tour?: PropertyPanorama;
  panoramaTour?: PropertyPanorama;
  panoramaTours?: PropertyPanorama;
  createdAt?: TimestampLike;
  created_at?: TimestampLike;
  updatedAt?: TimestampLike;
  updated_at?: TimestampLike;
  [key: string]: unknown;
}

export type PanoramaHotspot = TourHotspot;
export type PanoramaScene = TourScene;
export type PanoramaTour = PropertyPanorama;
