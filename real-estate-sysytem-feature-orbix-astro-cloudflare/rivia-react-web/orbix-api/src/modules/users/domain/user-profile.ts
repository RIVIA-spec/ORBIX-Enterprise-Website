export type UserRole = 'customer' | 'partner' | 'partner_staff' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  locale?: string;
  createdAt: Date;
  updatedAt: Date;
}
