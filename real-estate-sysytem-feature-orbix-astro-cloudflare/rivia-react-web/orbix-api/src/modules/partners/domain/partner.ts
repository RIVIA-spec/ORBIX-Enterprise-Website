export type PartnerType = 'real_estate_office' | 'developer' | 'hotel' | 'host';
export type PartnerStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'rejected';
export type PartnerVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type PartnerMemberRole = 'owner' | 'manager' | 'agent' | 'content_editor' | 'viewer';
export type PartnerMemberStatus = 'active' | 'inactive';

export interface Partner {
  id: string;
  type: PartnerType;
  legalName: string;
  displayName: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  ownerUid: string;
  status: PartnerStatus;
  verificationStatus: PartnerVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerMember {
  id: string;
  partnerId: string;
  userId: string;
  role: PartnerMemberRole;
  status: PartnerMemberStatus;
  createdAt: Date;
  updatedAt: Date;
}
