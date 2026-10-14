import { Injectable } from '@nestjs/common';
import type { UserProfile } from '../domain/user-profile';
import type { UserProfileRepository } from '../domain/user-profile.repository';

@Injectable()
export class InMemoryUserProfileRepositoryV2 implements UserProfileRepository {
  private readonly profiles = new Map<string, UserProfile>();

  findByUid(uid: string): Promise<UserProfile | null> {
    return Promise.resolve(this.profiles.get(uid) ?? null);
  }

  list(limit: number, cursor?: string): Promise<{ items: UserProfile[]; nextCursor?: string }> {
    const sorted = [...this.profiles.values()].sort((left, right) => left.uid.localeCompare(right.uid));
    const start = cursor ? sorted.findIndex((profile) => profile.uid === cursor) + 1 : 0;
    const items = sorted.slice(Math.max(start, 0), Math.max(start, 0) + limit);
    const last = items.at(-1);
    const nextCursor = items.length === limit && last ? last.uid : undefined;
    return Promise.resolve({ items, nextCursor });
  }

  save(profile: UserProfile): Promise<UserProfile> {
    this.profiles.set(profile.uid, profile);
    return Promise.resolve(profile);
  }
}
