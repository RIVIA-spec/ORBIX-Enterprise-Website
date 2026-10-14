import { Injectable } from '@nestjs/common';
import type { Partner, PartnerMember } from '../domain/partner';
import type { PartnerMemberRepository, PartnerRepository } from '../domain/partner.repository';

@Injectable()
export class InMemoryPartnerRepository implements PartnerRepository {
  private readonly partners = new Map<string, Partner>();

  create(partner: Partner): Promise<Partner> {
    this.partners.set(partner.id, partner);
    return Promise.resolve(partner);
  }

  createWithOwnerAndAudit(partner: Partner, owner: PartnerMember): Promise<Partner> {
    this.partners.set(partner.id, partner);
    InMemoryPartnerMemberRepository.sharedMembers.set(owner.id, owner);
    return this.create(partner);
  }

  findById(id: string): Promise<Partner | null> {
    return Promise.resolve(this.partners.get(id) ?? null);
  }

  listByOwnerOrMember(userId: string, memberPartnerIds: string[]): Promise<Partner[]> {
    const ids = new Set(memberPartnerIds);
    return Promise.resolve([...this.partners.values()].filter((partner) => partner.ownerUid === userId || ids.has(partner.id)));
  }

  save(partner: Partner): Promise<Partner> {
    this.partners.set(partner.id, partner);
    return Promise.resolve(partner);
  }
}

@Injectable()
export class InMemoryPartnerMemberRepository implements PartnerMemberRepository {
  static readonly sharedMembers = new Map<string, PartnerMember>();
  private readonly members = InMemoryPartnerMemberRepository.sharedMembers;

  create(member: PartnerMember): Promise<PartnerMember> {
    this.members.set(member.id, member);
    return Promise.resolve(member);
  }

  findById(id: string): Promise<PartnerMember | null> {
    return Promise.resolve(this.members.get(id) ?? null);
  }

  findActiveByPartnerAndUser(partnerId: string, userId: string): Promise<PartnerMember | null> {
    return Promise.resolve([...this.members.values()].find((member) => member.partnerId === partnerId && member.userId === userId && member.status === 'active') ?? null);
  }

  listByPartner(partnerId: string): Promise<PartnerMember[]> {
    return Promise.resolve([...this.members.values()].filter((member) => member.partnerId === partnerId));
  }

  listActiveByUser(userId: string): Promise<PartnerMember[]> {
    return Promise.resolve([...this.members.values()].filter((member) => member.userId === userId && member.status === 'active'));
  }

  save(member: PartnerMember): Promise<PartnerMember> {
    this.members.set(member.id, member);
    return Promise.resolve(member);
  }
}
