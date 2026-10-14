import type { UserProfile } from '../domain/user-profile';

export interface UserProfileRepository {
  findByFirebaseUid(uid: string): Promise<UserProfile | null>;
}

export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY');
