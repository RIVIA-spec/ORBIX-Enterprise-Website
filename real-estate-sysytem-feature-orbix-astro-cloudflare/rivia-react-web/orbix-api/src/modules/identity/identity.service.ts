import { Inject, Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AuthenticatedUser, OrbixRole } from '../../common/types/authenticated-user';
import { USER_PROFILE_REPOSITORY, type UserProfileRepository } from './repositories/user-profile.repository';

function normalizeRole(value: unknown): OrbixRole | null {
  if (value === 'customer' || value === 'partner' || value === 'partner_staff' || value === 'moderator' || value === 'admin') {
    return value;
  }
  return null;
}

function rolesFromClaims(claims: DecodedIdToken): OrbixRole[] {
  const rawRoles = claims.roles;
  const roles = Array.isArray(rawRoles) ? rawRoles.map(normalizeRole).filter((role): role is OrbixRole => Boolean(role)) : [];
  const singleRole = normalizeRole(claims.role);
  if (singleRole) roles.push(singleRole);
  return [...new Set(roles)];
}

@Injectable()
export class IdentityService {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profiles: UserProfileRepository
  ) {}

  async buildAuthenticatedUser(decodedToken: DecodedIdToken): Promise<AuthenticatedUser> {
    const profile = await this.profiles.findByFirebaseUid(decodedToken.uid);
    const claimRoles = rolesFromClaims(decodedToken);
    const roles = claimRoles.length > 0 ? claimRoles : (profile?.roles ?? ['customer']);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      roles,
      claims: decodedToken
    };
  }
}
