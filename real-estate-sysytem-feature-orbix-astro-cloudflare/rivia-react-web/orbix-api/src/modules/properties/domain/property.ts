export type ListingType = 'sale' | 'long_term_rent';
export type PropertyType = 'apartment' | 'villa' | 'house' | 'land' | 'office' | 'shop' | 'building' | 'project';
export type PropertyStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
export type PropertyVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Property {
  id: string;
  partnerId: string;
  ownerUid: string;
  listingType: ListingType;
  propertyType: PropertyType;
  title?: string;
  description?: string;
  city?: string;
  area?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSize?: number;
  areaUnit?: string;
  features: string[];
  mediaIds: string[];
  virtualTourId?: string;
  status: PropertyStatus;
  verificationStatus: PropertyVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}
