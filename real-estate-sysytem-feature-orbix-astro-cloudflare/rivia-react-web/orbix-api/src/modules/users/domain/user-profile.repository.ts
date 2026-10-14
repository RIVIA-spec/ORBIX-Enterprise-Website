import type { UserProfile } from './user-profile';

export interface UserProfileRepository {
  findByUid(uid: string): Promise<UserProfile | null>;
  list(limit: number, cursor?: string): Promise<{ items: UserProfile[]; nextCursor?: string }>;
  save(profile: UserProfile): Promise<UserProfile>;
}

export const USER_PROFILE_REPOSITORY_V2 = Symbol('USER_PROFILE_REPOSITORY_V2');
