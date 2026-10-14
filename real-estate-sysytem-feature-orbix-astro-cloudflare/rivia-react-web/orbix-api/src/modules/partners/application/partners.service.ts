import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AuditService } from '../../audit/audit.service';
import type { Partner, PartnerMember, PartnerMemberRole, PartnerVerificationStatus } from '../domain/partner';
import { PARTNER_MEMBER_REPOSITORY, PARTNER_REPOSITORY, type PartnerMemberRepository, type PartnerRepository } from '../domain/partner.repository';
import type { AddPartnerMemberDto, CreatePartnerDto, UpdatePartnerDto, UpdatePartnerMemberDto } from '../dto/partner.dto';

const editRoles: PartnerMemberRole[] = ['owner', 'manager'];

@Injectable()
export class PartnersService {
  constructor(
    @Inject(PARTNER_REPOSITORY) private readonly partners: PartnerRepository,
    @Inject(PARTNER_MEMBER_REPOSITORY) private readonly members: PartnerMemberRepository,
    private readonly audit: AuditService
  ) {}

  async create(user: AuthenticatedUser, dto: CreatePartnerDto): Promise<Partner> {
    const now = new Date();
    const partner: Partner = {
      id: randomUUID(),
      type: dto.type,
      legalName: dto.legalName,
      displayName: dto.displayName,
      description: dto.description,
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
      logoUrl: dto.logoUrl,
      ownerUid: user.uid,
      status: 'draft',
      verificationStatus: 'unverified',
      createdAt: now,
      updatedAt: now
    };
    const owner = { id: randomUUID(), partnerId: partner.id, userId: user.uid, role: 'owner' as const, status: 'active' as const, createdAt: now, updatedAt: now };
    await this.partners.createWithOwnerAndAudit(partner, owner, {
      actorUid: user.uid,
      action: 'partner.created',
      entityType: 'partner',
      entityId: partner.id,
      newState: { status: partner.status, ownerUid: partner.ownerUid },
      createdAt: now
    });
    return partner;
  }

  async my(user: AuthenticatedUser): Promise<Partner[]> {
    const memberships = await this.members.listActiveByUser(user.uid);
    return this.partners.listByOwnerOrMember(user.uid, memberships.map((member) => member.partnerId));
  }

  async get(id: string): Promise<Partner> {
    const partner = await this.partners.findById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async requireMembership(partnerId: string, user: AuthenticatedUser, roles?: PartnerMemberRole[]): Promise<PartnerMember> {
    const member = await this.members.findActiveByPartnerAndUser(partnerId, user.uid);
    if (!member || (roles && !roles.includes(member.role))) throw new ForbiddenException('Partner membership required');
    return member;
  }

  async canAccessPartner(partnerId: string, uid: string): Promise<boolean> {
    return Boolean(await this.members.findActiveByPartnerAndUser(partnerId, uid));
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePartnerDto): Promise<Partner> {
    await this.requireMembership(id, user, editRoles);
    const partner = await this.get(id);
    return this.partners.save({ ...partner, ...dto, updatedAt: new Date() });
  }

  async submit(user: AuthenticatedUser, id: string): Promise<Partner> {
    await this.requireMembership(id, user, editRoles);
    const partner = await this.get(id);
    if (partner.status !== 'draft') throw new ConflictException('Invalid partner status transition');
    return this.partners.save({ ...partner, status: 'pending_review', updatedAt: new Date() });
  }

  async addMember(user: AuthenticatedUser, partnerId: string, dto: AddPartnerMemberDto): Promise<PartnerMember> {
    await this.requireMembership(partnerId, user, ['owner', 'manager']);
    const now = new Date();
    return this.members.create({ id: randomUUID(), partnerId, userId: dto.userId, role: dto.role, status: 'active', createdAt: now, updatedAt: now });
  }

  async listMembers(user: AuthenticatedUser, partnerId: string): Promise<PartnerMember[]> {
    await this.requireMembership(partnerId, user);
    return this.members.listByPartner(partnerId);
  }

  async updateMember(user: AuthenticatedUser, partnerId: string, memberId: string, dto: UpdatePartnerMemberDto): Promise<PartnerMember> {
    await this.requireMembership(partnerId, user, ['owner', 'manager']);
    const member = await this.members.findById(memberId);
    if (!member || member.partnerId !== partnerId) throw new NotFoundException('Partner member not found');
    if (member.role === 'owner' && dto.role) throw new ForbiddenException('Owner role cannot be changed here');
    return this.members.save({ ...member, ...dto, updatedAt: new Date() });
  }

  async removeMember(user: AuthenticatedUser, partnerId: string, memberId: string): Promise<PartnerMember> {
    return this.updateMember(user, partnerId, memberId, { status: 'inactive' });
  }

  async updateVerification(user: AuthenticatedUser, id: string, verificationStatus: PartnerVerificationStatus): Promise<Partner> {
    if (!user.roles.includes('admin') && !user.roles.includes('moderator')) throw new ForbiddenException('Moderator role required');
    const partner = await this.get(id);
    if (
      (verificationStatus === 'verified' || verificationStatus === 'rejected') &&
      partner.status !== 'pending_review'
    ) {
      throw new ConflictException('Invalid partner status transition');
    }
    const updated = await this.partners.save({ ...partner, verificationStatus, status: verificationStatus === 'verified' ? 'active' : partner.status, updatedAt: new Date() });
    await this.audit.append({ actorUid: user.uid, action: 'partner.verification_updated', resourceType: 'partner', resourceId: id, metadata: { verificationStatus } });
    return updated;
  }
}
