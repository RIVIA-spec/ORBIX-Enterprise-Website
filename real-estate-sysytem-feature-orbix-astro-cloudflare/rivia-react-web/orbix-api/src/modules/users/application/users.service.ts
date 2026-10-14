import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AuditService } from '../../audit/audit.service';
import type { UserProfile, UserRole, UserStatus } from '../domain/user-profile';
import { USER_PROFILE_REPOSITORY_V2, type UserProfileRepository } from '../domain/user-profile.repository';
import type { UpdateMeDto } from '../dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY_V2)
    private readonly profiles: UserProfileRepository,
    private readonly audit: AuditService
  ) {}

  async ensureCurrentUser(user: AuthenticatedUser): Promise<UserProfile> {
    const existing = await this.profiles.findByUid(user.uid);
    if (existing) return existing;

    const now = new Date();
    return this.profiles.save({
      uid: user.uid,
      email: user.email,
      role: 'customer',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateMeDto): Promise<UserProfile> {
    const profile = await this.ensureCurrentUser(user);
    return this.profiles.save({
      ...profile,
      displayName: dto.displayName ?? profile.displayName,
      phone: dto.phone ?? profile.phone,
      avatarUrl: dto.avatarUrl ?? profile.avatarUrl,
      locale: dto.locale ?? profile.locale,
      updatedAt: new Date()
    });
  }

  list(limit: number, cursor?: string): Promise<{ items: UserProfile[]; nextCursor?: string }> {
    return this.profiles.list(limit, cursor);
  }

  async get(uid: string): Promise<UserProfile> {
    const profile = await this.profiles.findByUid(uid);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  async updateRole(actor: AuthenticatedUser, uid: string, role: UserRole): Promise<UserProfile> {
    if (!actor.roles.includes('admin')) throw new ForbiddenException('Admin role required');
    const profile = await this.get(uid);
    const updated = await this.profiles.save({ ...profile, role, updatedAt: new Date() });
    await this.audit.append({ actorUid: actor.uid, action: 'user.role_updated', resourceType: 'user', resourceId: uid, metadata: { role } });
    return updated;
  }

  async updateStatus(actor: AuthenticatedUser, uid: string, status: UserStatus): Promise<UserProfile> {
    if (!actor.roles.includes('admin') && !actor.roles.includes('moderator')) throw new ForbiddenException('Moderator role required');
    const profile = await this.get(uid);
    const updated = await this.profiles.save({ ...profile, status, updatedAt: new Date() });
    await this.audit.append({ actorUid: actor.uid, action: 'user.status_updated', resourceType: 'user', resourceId: uid, metadata: { status } });
    return updated;
  }
}
