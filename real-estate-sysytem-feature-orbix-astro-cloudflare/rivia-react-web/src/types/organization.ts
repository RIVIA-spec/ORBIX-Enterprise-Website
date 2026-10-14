import type { TimestampLike } from './models';
import type { OrganizationRole, Permission } from './permissions';

export type OrganizationType = 'real_estate_agency' | 'hotel' | 'restaurant';

export type OrganizationStatus =
  | 'pending_approval'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'archived';

export type OrganizationBillingStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'disabled';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  ownerUserId: string;
  countryCode?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  subscriptionPlan?: string;
  billingStatus?: OrganizationBillingStatus;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  approvedAt?: TimestampLike;
  createdBy: string;
  approvedBy?: string;
  suspendedBy?: string;
}

export type OrganizationMemberStatus =
  | 'invited'
  | 'active'
  | 'disabled'
  | 'removed';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  branchIds?: string[];
  permissionsOverride?: Partial<Record<Permission, boolean>>;
  invitedBy?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  disabledAt?: TimestampLike;
}

export type BranchStatus = 'active' | 'disabled' | 'archived';

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  status: BranchStatus;
  city?: string;
  address?: string;
  phone?: string;
  managerUserId?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}
