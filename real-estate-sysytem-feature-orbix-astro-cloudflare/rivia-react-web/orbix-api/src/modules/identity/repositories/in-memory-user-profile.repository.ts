import { Injectable } from '@nestjs/common';
import type { UserProfile } from '../domain/user-profile';
import type { UserProfileRepository } from './user-profile.repository';

@Injectable()
export class InMemoryUserProfileRepository implements UserProfileRepository {
  private readonly users = new Map<string, UserProfile>();

  findByFirebaseUid(uid: string): Promise<UserProfile | null> {
    return Promise.resolve(this.users.get(uid) ?? null);
  }

  setUser(user: UserProfile): void {
    this.users.set(user.uid, user);
  }
}
