import type { OrbixRole } from '../../../common/types/authenticated-user';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  isActive: boolean;
  roles: OrbixRole[];
}
