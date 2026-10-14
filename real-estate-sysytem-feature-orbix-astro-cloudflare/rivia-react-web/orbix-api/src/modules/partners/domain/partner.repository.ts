import type { Partner, PartnerMember } from './partner';
import type { AuditEvent } from '../../audit/domain/audit-event';

export interface PartnerRepository {
  create(partner: Partner): Promise<Partner>;
  createWithOwnerAndAudit(partner: Partner, owner: PartnerMember, audit: AuditEvent): Promise<Partner>;
  findById(id: string): Promise<Partner | null>;
  listByOwnerOrMember(userId: string, memberPartnerIds: string[]): Promise<Partner[]>;
  save(partner: Partner): Promise<Partner>;
}

export interface PartnerMemberRepository {
  create(member: PartnerMember): Promise<PartnerMember>;
  findById(id: string): Promise<PartnerMember | null>;
  findActiveByPartnerAndUser(partnerId: string, userId: string): Promise<PartnerMember | null>;
  listByPartner(partnerId: string): Promise<PartnerMember[]>;
  listActiveByUser(userId: string): Promise<PartnerMember[]>;
  save(member: PartnerMember): Promise<PartnerMember>;
}

export const PARTNER_REPOSITORY = Symbol('PARTNER_REPOSITORY');
export const PARTNER_MEMBER_REPOSITORY = Symbol('PARTNER_MEMBER_REPOSITORY');
