export type OrbixRole = 'customer' | 'partner' | 'partner_staff' | 'moderator' | 'admin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  roles: OrbixRole[];
  claims: Record<string, unknown>;
}
